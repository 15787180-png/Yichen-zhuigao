/* 配餐知识库：该追还是该保 · 分阶段吃多少 · 怎么配 · 现有菜单体检
   数据来源全部标注在「依据」一节，不凭印象写。 */
window.VKB = (function () {
  const { esc, ic } = UI;
  let sec = 'judge';
  let stageIdx = null;

  /* ================= 一、学龄儿童平衡膳食宝塔（2022）================= */
  const STAGE = [
    {
      name: '6~10 岁', who: '小学低中年级', kcal: '1400~1600 kcal/天',
      lead: '这一档的目标是「吃对」，不是「吃多」。奶要够 300ml 给骨量攒底子，深色蔬菜要占一半——别只吃白菜土豆。',
      rows: [
        ['谷类', '150~200g', '其中全谷物和杂豆 30~70g'],
        ['薯类', '25~50g', '土豆、红薯、山药都算'],
        ['蔬菜', '≥300g', '深色蔬菜占一半'],
        ['水果', '150~200g', '果汁不能代替鲜果'],
        ['畜禽肉', '40g', '大约一个鸡蛋大小'],
        ['水产品', '40g', '每周至少 2 次'],
        ['蛋类', '25~40g', '大约 1 个鸡蛋'],
        ['奶及奶制品', '≥300g', '约 300ml 纯牛奶'],
        ['大豆', '105g/周', '约每天 15g 干豆，折成豆腐一小块'],
        ['坚果', '50g/周', '约每天 7g，一小把'],
        ['食盐', '<4g', '比成人更严'],
        ['烹调油', '20~25g', '约 2 瓷勺']
      ],
      water: '7~10 岁每天至少喝 1000ml 白水（6 岁 800ml），不含汤、粥、奶里的水',
      move: '每天累计 60 分钟中高强度活动，每周 3 天高强度，每周 3 天做增强肌肉和骨骼的运动'
    },
    {
      name: '11~13 岁', who: '初中低年级 / 发育启动前后', kcal: '1800~2000 kcal/天',
      lead: '能量跳一档，谷类涨 50g、蔬菜涨 100g。这一档最容易出的问题是：早饭不吃、午饭在学校凑合、晚上补一顿——结果蛋白质够了，奶和蔬果全缺。',
      rows: [
        ['谷类', '225~250g', '其中全谷物和杂豆 30~70g'],
        ['薯类', '25~50g', '别用薯条薯片顶'],
        ['蔬菜', '400~450g', '深色蔬菜占一半'],
        ['水果', '200~300g', ''],
        ['畜禽肉', '50g', ''],
        ['水产品', '50g', '每周至少 2 次'],
        ['蛋类', '40~50g', '约 1 个鸡蛋'],
        ['奶及奶制品', '≥300g', ''],
        ['大豆', '105g/周', '约每天 15g 干豆'],
        ['坚果', '50~70g/周', '约每天 7~10g'],
        ['食盐', '<5g', ''],
        ['烹调油', '25~30g', '']
      ],
      water: '男孩每天至少 1300ml，女孩 1100ml',
      move: '每天 60 分钟中高强度活动，每周 3 天高强度、3 天力量/骨健康运动'
    },
    {
      name: '14~17 岁', who: '青春期突增期', kcal: '2000~2400 kcal/天',
      lead: '青春期突增，主食是主角。谷类涨到 250~300g 不是让你吃胖，是骨头在拉长需要能量；水果也要到 300~350g。这一档最忌「为了瘦少吃主食」。',
      rows: [
        ['谷类', '250~300g', '其中全谷物和杂豆 50~100g'],
        ['薯类', '50~100g', ''],
        ['蔬菜', '450~500g', '深色蔬菜占一半'],
        ['水果', '300~350g', ''],
        ['畜禽肉', '50~75g', ''],
        ['水产品', '50~75g', '每周至少 2 次'],
        ['蛋类', '50g', '约 1 个鸡蛋'],
        ['奶及奶制品', '≥300g', ''],
        ['大豆', '105~175g/周', ''],
        ['坚果', '50~70g/周', ''],
        ['食盐', '<5g', ''],
        ['烹调油', '25~30g', '']
      ],
      water: '男孩每天至少 1400ml，女孩 1200ml',
      move: '每天 60 分钟中高强度活动，每周 3 天高强度、3 天力量/骨健康运动；这一档坐得久，每小时起来动一动'
    }
  ];

  /* ================= 二、身高等级界值（WS/T 612-2018）=================
     年龄, -2SD, -1SD, 中位数, +1SD, +2SD（单位 cm）*/
  const HS = {
    boy: [
      [7, 113.51, 119.49, 125.48, 131.47, 137.46], [8, 118.35, 124.53, 130.72, 136.90, 143.08],
      [9, 122.74, 129.27, 135.81, 142.35, 148.88], [10, 126.79, 133.77, 140.76, 147.75, 154.74],
      [11, 130.39, 138.20, 146.01, 153.82, 161.64], [12, 134.48, 143.33, 152.18, 161.03, 169.89],
      [13, 143.01, 151.60, 160.19, 168.78, 177.38], [14, 150.22, 157.93, 165.63, 173.34, 181.05],
      [15, 155.25, 162.14, 169.02, 175.91, 182.79], [16, 157.72, 164.15, 170.58, 177.01, 183.44],
      [17, 158.76, 165.07, 171.39, 177.70, 184.01], [18, 158.81, 165.12, 171.42, 177.73, 184.03]
    ],
    girl: [
      [7, 112.29, 118.21, 124.13, 130.05, 135.97], [8, 116.83, 123.09, 129.34, 135.59, 141.84],
      [9, 121.31, 128.11, 134.91, 141.71, 148.51], [10, 126.38, 133.78, 141.18, 148.57, 155.97],
      [11, 132.09, 139.72, 147.36, 154.99, 162.63], [12, 138.11, 145.26, 152.41, 159.56, 166.71],
      [13, 143.75, 149.91, 156.07, 162.23, 168.39], [14, 146.18, 151.98, 157.78, 163.58, 169.38],
      [15, 147.02, 152.74, 158.47, 164.19, 169.91], [16, 147.59, 153.26, 158.93, 164.60, 170.27],
      [17, 147.82, 153.50, 159.18, 164.86, 170.54], [18, 148.54, 154.28, 160.01, 165.74, 171.48]
    ]
  };

  /* ================= 三、年生长速度参考 ================= */
  const SPEED = [
    ['出生第 1 年', '20~25cm', '一生最快的一段'],
    ['第 2 年', '10~12cm', ''],
    ['3~4 岁', '7~8cm', ''],
    ['4 岁到青春期前', '5~7cm', '这一档最稳定，低于 5cm 要查'],
    ['青春期（女孩）', '6~8cm', '多在青春早期，年增可达 8cm'],
    ['青春期（男孩）', '7~10cm', '多在青春中期，年增可达 10cm'],
    ['青春后期', '<3.5cm', '骨骺接近闭合，剩下的空间不多了']
  ];

  /* ================= 四、判定矩阵 ================= */
  const MATRIX = [
    ['下等（< -2SD）', '任何', '就医档', '低于同龄同性别第 3 百分位，先看内分泌科'],
    ['中下等（-2~-1SD）', '< 5cm', '追高档 · 先查原因', '长得比该长的慢，别只靠加餐'],
    ['中下等', '≥ 5cm', '追高档 · 营养能帮上', '位置偏低但速度正常，把吃睡动补齐'],
    ['中等（-1~+1SD）', '< 5cm', '先连测 3 个月', '可能是测量误差或生长减速，确认了再说'],
    ['中等', '5~7cm', '保持档', '结构维持住，不用加补剂'],
    ['中上等 / 上等（> +1SD）', '任何', '保持档 · 防肥胖防早发育', '不需要「追」，重点在别吃成小胖']
  ];

  /* ================= 五、配餐法 ================= */
  // 一天五格：把宝塔翻成「份」，家长才好执行
  const GRID = [
    ['谷薯', '3 份主食，其中 1 份是粗粮或薯', '1 份 = 一小碗饭 / 1 个馒头 / 1 根玉米 / 1 个红薯', 'ok'],
    ['蔬菜', '2~3 份，深色占一半', '1 份 = 一小盘（约 100g 生重）', 'ok'],
    ['水果', '2 份', '1 份 = 1 个苹果 / 1 根香蕉 / 半碗莓果', 'acc'],
    ['肉蛋鱼', '2 份', '1 份 = 40g 肉 / 40g 鱼 / 1 个蛋', 'ok'],
    ['奶和豆', '奶 300ml + 豆 1 份', '1 份豆 = 豆腐一小块 / 豆浆 200ml', 'ok'],
    ['坚果', '1 小把（约 10g）', '核桃 2 个 / 南瓜子一小把 / 黑芝麻一勺', 'acc']
  ];

  // 同类轮换组：变花样的正确做法是「同组里换」，不是每天想新菜
  // 水产那组跟着过敏设置变
  function swapGroups() {
    const al = S.allergy();
    const ban = al.on && (al.seaFish || al.shrimpCrab || al.shellfish);
    const water = ban
      ? ['淡水鱼（这个档案只能吃这些）', '鲈鱼 / 鳜鱼 / 鲫鱼 / 草鱼 / 黑鱼 / 昂刺鱼 / 龙利鱼 / 巴沙鱼']
      : ['鱼虾贝', '鲳鱼 / 带鱼 / 小黄鱼 / 三文鱼 / 鳕鱼 / 虾仁 / 蛤蜊 / 扇贝 / 草鱼 / 鲫鱼'];
    return [
      ['主食（12 样轮）', '米饭 / 二米饭 / 糙米饭 / 杂粮饭 / 小米粥 / 燕麦 / 面条 / 馒头 / 全麦面包 / 玉米 / 红薯 / 山药'],
      ['深色菜', '西兰花 / 菠菜 / 油菜 / 胡萝卜 / 南瓜 / 紫甘蓝 / 番茄 / 苋菜 / 青椒 / 茼蒿'],
      ['浅色菜', '白菜 / 冬瓜 / 黄瓜 / 白萝卜 / 莲藕 / 茭白 / 西葫芦 / 娃娃菜'],
      ['菌藻', '香菇 / 金针菇 / 木耳 / 平菇 / 口蘑 / 紫菜 / 海带'],
      ['红肉', '猪里脊 / 牛腩 / 牛腱 / 羊腿 / 猪肝（每周一次）'],
      ['白肉', '鸡胸 / 鸡腿 / 鸡翅 / 鸭'],
      water,
      ['蛋', '鸡蛋 / 鹌鹑蛋 / 鸭蛋'],
      ['奶', '纯牛奶 / 酸奶 / 奶酪 / 奶粉'],
      ['豆制品', '豆腐 / 豆干 / 香干 / 腐竹 / 豆浆 / 毛豆'],
      ['坚果', '核桃 / 杏仁 / 腰果 / 南瓜子 / 黑芝麻 / 花生']
    ];
  }

  function week3() {
    const al = S.allergy();
    const ban = al.on && (al.seaFish || al.shrimpCrab || al.shellfish);
    return [
      ban
        ? ['淡水鱼', '一周至少 2 次', '这个档案海鱼虾蟹贝全避让，水产只能走淡水鱼，这条要盯住']
        : ['鱼虾', '一周至少 2 次', '海鱼优先：DHA 和碘都比淡水鱼高，一周 2 次就够'],
      ['深色蔬菜', '一周至少 5 天', '深色菜是维生素 A、叶酸、钾的主要来源，浅色菜顶不上'],
      ['粗粮或薯', '一周至少 5 天', '全谷物和杂豆每天吃一次，这是膳食指南的原话']
    ];
  }

  const BREAKFAST = [
    ['谷薯类', '粥、馒头、面包、玉米、红薯、面条'],
    ['蔬菜水果', '青菜、番茄、黄瓜、苹果、香蕉、橙子'],
    ['动物性食物', '鸡蛋、瘦肉、鱼'],
    ['奶豆坚果', '牛奶、酸奶、豆浆、豆腐、核桃']
  ];

  const FRUIT_HACK = [
    ['切成小块插牙签', '整颗不碰的，切小块摆出来，玩着就被拿走了。不逼他吃完一整盘。'],
    ['换温度', '冻蓝莓、冻葡萄当冰球吃；蒸苹果、烤香蕉、热橙子水。很多孩子不吃常温水果，吃冰的。'],
    ['拌进酸奶', '水果切丁拌原味酸奶，比单吃水果接受度高得多。酸奶别买带糖的果粒款。'],
    ['进菜里', '菠萝咕噜肉、苹果炖排骨、橙汁鸡、番茄牛腩。番茄算蔬菜，但也能拉一部分水果的量。'],
    ['只提供，不劝说', '放在他玩的地方，不说「你必须吃」。一劝就变成对抗，能吃进去的量反而少。'],
    ['起点是半个', '不要一上来就要 200g。从每天半个苹果开始，连着吃两周再往上加。']
  ];

  /* ================= 六、28 天菜单体检结果 =================
     由菜单原始数据按宝塔 6~10 岁档逐日累计后得出，不是估的 */
  function auditOk() {
    const al = S.allergy();
    const ban = al.on && (al.seaFish || al.shrimpCrab || al.shellfish);
    return [
      ['每天食物种类', '16.3 种', '≥12 种'],
      ['全谷物和杂豆', '66g', '30~70g'],
      ['薯类', '52g', '25~50g'],
      ['深色蔬菜', '184g', '≥150g（占一半）'],
      ['水产品', '68g，22/28 天有鱼', '40g'],
      ['鸡蛋', '1.0 个，24/28 天', '1 个'],
      ['奶', '28/28 天都有', '每天要有'],
      ['豆制品', '20/28 天', '每天一份'],
      ban
        ? ['过敏安全', '全部淡水鱼，零虾蟹贝', '这个档案海鱼虾蟹贝全避']
        : ['过敏避让', '已关闭，海鱼虾蟹贝都在菜单里', '不限']
    ];
  }
  const AUDIT_GAP = [
    { t: '水果只有 77g，目标 150~200g', d: '7 天完全没有水果（第 4、9、15、16、20、22、24 天）', fix: '每天固定一格水果。档案里写着「不爱吃水果」，所以不要求 200g，先从「每天半个」开始，按下面的换形态法试。', lvl: 'high' },
    { t: '坚果只有 3g，目标 7g 以上', d: '28 天里 21 天没有坚果', fix: '把「一小把坚果」写进下午加餐的固定项，不用每天想。核桃 2 个，或者南瓜子一小把，或者粥里撒一勺黑芝麻。', lvl: 'high' },
    { t: '奶 266ml，目标 300ml 以上', d: '中位数只有 200ml，有一半的日子偏少', fix: '睡前奶从 200ml 提到 250ml，早上再加一杯，全天到 450ml 左右。或者下午加一片奶酪（1 片约 20g）。', lvl: 'mid' },
    { t: '蔬菜 294g，目标 300g 以上', d: '差得很少，但第 7 天（汉堡+薯条那天）只有 76g', fix: '第 7 天加一份蔬菜，或者把炒饭换成有菜的版本。其余日子不用动。', lvl: 'low' }
  ];
  const AUDIT_OVER = '动物性食物 232g/天（畜禽肉 112g + 水产品 68g + 蛋 50g），宝塔这一档是 105~120g，差不多两倍。谷类 231g 也略高于 150~200g。不用刻意减——他在追高，蛋白别抠——但也别再加了，把省下来的胃容量给水果和奶。';

  /* ================= 计算 ================= */
  function ageOf() {
    const b = S.state.profile.birthDate || '2017-01-01';
    const a = new Date(b + 'T00:00:00');
    const t = new Date(S.today() + 'T00:00:00');
    return (t - a) / (365.2425 * 864e5);
  }

  // 按实际年龄在界值表里线性插值，取 5 个界值
  function bounds(sex, age) {
    const t = HS[sex === 'girl' ? 'girl' : 'boy'];
    const a = Math.min(18, Math.max(7, age));
    let i = Math.floor(a) - 7;
    i = Math.min(t.length - 2, Math.max(0, i));
    const r0 = t[i], r1 = t[i + 1], f = a - r0[0];
    return [0, 1, 2, 3, 4].map((k) => r0[k + 1] + (r1[k + 1] - r0[k + 1]) * f);
  }

  function judge() {
    const p = S.state.profile;
    const st = S.stats();
    const h = st.last ? st.last.height : (Number(p.baselineHeight) || 0);
    const age = ageOf();
    const b = bounds(p.gender, age);
    const m2 = b[0], m1 = b[1], med = b[2], p1 = b[3];
    const sd = p1 - med;
    const sds = h ? (h - med) / sd : null;
    let lvl, flag;
    if (h > b[4]) { lvl = '上等'; flag = 'hi'; }
    else if (h > p1) { lvl = '中上等'; flag = 'hi'; }
    else if (h > m1) { lvl = '中等'; flag = 'mid'; }
    else if (h > m2) { lvl = '中下等'; flag = 'lo'; }
    else { lvl = '下等'; flag = 'low'; }
    return { h, age, med, m2, m1, p1, p2: b[4], sds, lvl, flag, hasRec: !!st.last };
  }

  function speed() {
    const hs = S.heights();
    if (hs.length < 2) return null;
    const a = hs[0], z = hs[hs.length - 1];
    const days = (new Date(z.date + 'T00:00:00') - new Date(a.date + 'T00:00:00')) / 864e5;
    if (days < 45) return null;
    return { v: (z.height - a.height) / days * 365, span: days, gain: +(z.height - a.height).toFixed(1), from: a.date, to: z.date };
  }

  // 这个年龄该有的年增长速度区间
  function expectRange(sex, age) {
    const startPuberty = sex === 'girl' ? 9.5 : 11;
    if (age < startPuberty) return [5, 7];
    return sex === 'girl' ? [6, 8] : [7, 10];
  }

  function verdict() {
    const j = judge(), sp = speed();
    const p = S.state.profile;
    const ba = Number(p.boneAgeOffset) || 0;
    const treating = !!(p.treatmentInfo || p.ghDay);
    let key, title, hint;
    if (j.flag === 'low') {
      key = 'medical'; title = '就医档';
      hint = '身高低于同龄同性别第 3 百分位。这个位置靠配餐追不回来，得让内分泌科看。';
    } else if (j.flag === 'lo') {
      key = 'push'; title = '追高档';
      hint = (sp && sp.v < 5) ? '长得比这个年龄该长的慢（不到 5cm/年），先查原因，别只想着加餐。'
        : '位置偏低还有空间，吃、睡、动三件事一起上。';
    } else if (sp && sp.v < 5) {
      key = 'push'; title = '追高档（速度偏慢）';
      hint = '身高位置还行，但最近长慢了。先连测 3 个月，确认不是测量误差。';
    } else if (j.flag === 'hi') {
      key = 'keep'; title = '保持档';
      hint = '位置在中上以上，不需要「追」，重点是别吃成小胖、别提前发育。';
    } else {
      key = 'keep'; title = '保持档';
      hint = '位置正常、速度也正常。维持现在的结构就行，不用加补剂。';
    }
    // 已在治疗中的，判定口径要改成「配合」
    let sub = '';
    if (key === 'medical' && treating) {
      sub = '他已经在内分泌科治疗中（' + (p.treatmentInfo ? '长效生长激素' : '按医嘱') + '）。所以这一档的正确说法是：治疗是主线，配餐是配合项。';
    }
    // 速度解读：这是唯一能说明「有没有在起作用」的指标
    let spNote = null;
    if (sp) {
      const r = expectRange(p.gender, j.age);
      const v = sp.v;
      if (v < 3) spNote = { tone: 'danger', t: '明显偏慢', d: v.toFixed(1) + 'cm/年，远低于这个年龄该有的 ' + r[0] + '~' + r[1] + 'cm。复诊时一定要把这个数给医生看。' };
      else if (v < 5) spNote = { tone: 'warn', t: '偏慢', d: v.toFixed(1) + 'cm/年，低于 5cm 这条「要评估」的线，这个年龄该有 ' + r[0] + '~' + r[1] + 'cm。' };
      else if (v <= r[1]) spNote = { tone: 'ok', t: '达标', d: v.toFixed(1) + 'cm/年，落在这个年龄该有的 ' + r[0] + '~' + r[1] + 'cm 里。' };
      else spNote = { tone: 'warn', t: '偏快', d: v.toFixed(1) + 'cm/年，超过这个年龄该有的 ' + r[0] + '~' + r[1] + 'cm。长得快不一定是好事，要留意是不是发育提前。' };
    }
    return { j, sp, ba, key, title, hint, sub, treating, spNote };
  }

  /* ================= 渲染工具 ================= */
  function kv(k, v, cls) {
    return '<div class="kbkv"><u>' + esc(k) + '</u><b class="' + (cls || '') + '">' + v + '</b></div>';
  }
  function secCard(title, body, opt) {
    opt = opt || {};
    return '<div class="card" style="margin:12px 16px 0"><div class="pad-c">' +
      (title ? '<div class="kbh">' + esc(title) + '</div>' : '') + body + '</div></div>' + (opt.after || '');
  }

  /* ================= 各节渲染 ================= */
  function renderJudge() {
    const v = verdict(), j = v.j;
    const tone = v.key === 'medical' ? 'danger' : v.key === 'push' ? 'warn' : 'ok';
    const toneBg = v.key === 'medical' ? 'var(--danger-l)' : v.key === 'push' ? 'var(--warn-l)' : 'var(--ok-l)';
    const toneFg = v.key === 'medical' ? '#B33A2E' : v.key === 'push' ? '#A96C13' : '#1B7F5B';

    let h = '<div class="kbtop" style="background:linear-gradient(135deg,' + toneBg + ',#fff)">' +
      '<div class="mini" style="color:' + toneFg + '">按他自己的数据算出来的</div>' +
      '<div class="kbverdict" style="color:' + toneFg + '">' + esc(v.title) + '</div>' +
      '<div style="font-size:13.5px;line-height:1.72;color:var(--ink2)">' + esc(v.hint) + '</div>' +
      (v.sub ? '<div style="font-size:13px;line-height:1.72;color:' + toneFg + ';margin-top:8px;background:rgba(255,255,255,.7);padding:9px 11px;border-radius:10px">' + esc(v.sub) + '</div>' : '') +
      (v.spNote ? (function () {
        const c = v.spNote.tone === 'ok' ? '#1B7F5B' : v.spNote.tone === 'danger' ? '#B33A2E' : '#A96C13';
        const bg = v.spNote.tone === 'ok' ? 'var(--ok-l)' : v.spNote.tone === 'danger' ? 'var(--danger-l)' : 'var(--warn-l)';
        return '<div style="margin-top:8px;background:' + bg + ';border-radius:10px;padding:9px 11px">' +
          '<span style="font-size:12px;font-weight:700;color:' + c + '">速度' + esc(v.spNote.t) + '</span>' +
          '<span style="font-size:12.5px;line-height:1.65;color:var(--ink2);margin-left:6px">' + esc(v.spNote.d) + '</span></div>';
      })() : '') +
      '</div>';

    h += secCard('算这个结论用了三样东西', 
      kv('月龄', (Math.floor(j.age) + ' 岁 ' + Math.round((j.age % 1) * 12) + ' 个月')) +
      kv('现在身高', (j.h ? j.h + ' cm' : '—') + (j.hasRec ? '' : ' <span class="mini">（档案基线）</span>')) +
      kv('身高等级', '<span style="color:' + toneFg + '">' + esc(j.lvl) + '</span>' + (j.sds != null ? ' · 约 ' + j.sds.toFixed(1) + ' SD' : '')) +
      kv('同龄中位数', j.med.toFixed(1) + ' cm（' + (j.h ? (j.h - j.med > 0 ? '高 ' : '低 ') + Math.abs(j.h - j.med).toFixed(1) + ' cm' : '—') + '）') +
      kv('年增长速度', v.sp ? (v.sp.v.toFixed(1) + ' cm/年 <span class="mini">（' + v.sp.from + ' 到 ' + v.sp.to + '，' + v.sp.gain + 'cm）</span>') : '<span class="mini">至少要两条相隔 45 天以上的身高记录才能算</span>') +
      kv('骨龄差', (v.ba === 0 ? '与生活年龄一致' : (v.ba > 0 ? '提前 ' : '落后 ') + Math.abs(v.ba) + ' 岁') + ' <span class="mini">（档案里填的）</span>')
    );

    // 三件具体事
    let todo;
    if (v.key === 'medical') {
      todo = [
        ['治疗这条线不动', '每周固定那天打，剂量听医生的，别自己加减。这是主线，配餐改不了它。'],
        ['配餐只做「别拖后腿」', '每天奶 450ml、一份水果、一小把坚果。这三样补上，剩下的照现在吃已经够了。'],
        ['每 3 个月同一天早晨量一次', v.sp
          ? '上面那个速度已经算出来了，接着往下测。单看一段不够，连着 4 段才能看出趋势。'
          : '记录攒够两条，上面那个「年增长速度」才有数。速度出来了才知道治疗有没有效。']
      ];
    } else if (v.key === 'push') {
      todo = [
        ['先把奶和蛋白吃够', '奶 400~500ml、每天 1 个蛋、一顿有鱼或肉。缺原料的时候，别的都白搭。'],
        ['九点半上床', '生长激素在深睡眠分泌最旺。睡不够，吃再好也接不住。'],
        ['纵向运动每天 20 分钟', '跳绳、摸高、悬垂。要他愿意做，不愿意就换成他喜欢的跑跳。']
      ];
    } else {
      todo = [
        ['别加补剂', '钙、蛋白吃够了再补没有额外收益。钱花在食材上更值。'],
        ['管住甜饮料和油炸', '这一档真正的风险是吃成小胖、提前发育，不是不够高。'],
        ['继续量', '保持档也要每 3 个月量一次，速度掉下来要能第一时间发现。']
      ];
    }
    h += secCard('接下来就做这三件', todo.map((t, i) =>
      '<div class="kbli"><span class="n">' + (i + 1) + '</span><div><b>' + esc(t[0]) + '</b><div class="mini" style="margin-top:2px;line-height:1.65">' + esc(t[1]) + '</div></div></div>'
    ).join(''));

    // 判定矩阵
    h += '<div class="sect"><h2>判定是怎么来的</h2></div>' +
      '<div class="card" style="margin:0 16px"><div class="pad-c" style="padding-bottom:8px"><div class="mini">先算身高等级，再看年增长速度，两样一起定。只看身高会误判——有的孩子位置低但长得不慢，有的位置正常却已经在减速。</div></div>' +
      '<div class="kbmtx">' +
      '<div class="kbmtx-r hd"><div>身高位置</div><div>年速度</div><div>结论</div><div>怎么看</div></div>' +
      MATRIX.map((r) =>
        '<div class="kbmtx-r">' +
        '<div>' + esc(r[0]) + '</div><div>' + esc(r[1]) + '</div>' +
        '<div class="' + (r[2].indexOf('就医') === 0 ? 'c-danger' : r[2].indexOf('追高') === 0 ? 'c-warn' : 'c-ok') + '">' + esc(r[2]) + '</div>' +
        '<div class="mini">' + esc(r[3]) + '</div></div>'
      ).join('') + '</div></div>';

    // 营养的边界
    h += secCard('营养能做什么、做不到什么', 
      '<div class="kbli"><span class="n" style="background:var(--ok-l);color:#1B7F5B">✓</span><div><b>能做到：</b>保证骨头的原料——蛋白质搭骨胶原，钙磷负责矿化，锌和维生素 D 管吸收。吃够了，身高能长到基因允许的那个位置。</div></div>' +
      '<div class="kbli"><span class="n" style="background:var(--danger-l);color:#B33A2E">✕</span><div><b>做不到：</b>突破遗传，也不能让骨龄加速。没有哪种食物吃了就多长两厘米。钙和蛋白补过头不会额外长高，只会多长肉。</div></div>' +
      '<div class="note" style="margin-top:10px">' + ic('info') + '<div>有研究显示，钙摄入低于 500mg/天 的孩子，身高别年龄的 Z 评分平均低 0.32。也就是说<b>补够有用，补过量没用</b>——这条线就在 1000mg 左右，一天 300~500ml 奶加上正常吃饭就到了。</div></div>'
    );

    // 完整界值表
    const sexName = S.state.profile.gender === 'girl' ? '女孩' : '男孩';
    const rows = HS[S.state.profile.gender === 'girl' ? 'girl' : 'boy'];
    h += '<div class="sect"><h2>完整界值表（' + sexName + ' 7~18 岁）</h2></div>' +
      '<div class="card" style="margin:0 16px"><div class="kbmtx tbl">' +
      '<div class="kbmtx-r hd"><div>岁</div><div>-2SD</div><div>-1SD</div><div>中位</div><div>+1SD</div><div>+2SD</div></div>' +
      rows.map((r) => {
        const near = Math.floor(j.age) === r[0];
        return '<div class="kbmtx-r' + (near ? ' on' : '') + '"><div>' + r[0] + '</div>' +
          r.slice(1).map((x) => '<div>' + x.toFixed(1) + '</div>').join('') + '</div>';
      }).join('') + '</div>' +
      '<div class="pad-c mini" style="padding-top:4px;line-height:1.7">单位 cm。低于 -2SD 就是医学上的矮小；-2SD 到 -1SD 是中下等。他这一行高亮了。</div></div>';

    // 生长速度参考
    h += '<div class="sect"><h2>每年该长多少</h2></div>' +
      '<div class="card" style="margin:0 16px"><div class="kbkvlist">' +
      SPEED.map((r) => '<div class="kbkv"><u>' + esc(r[0]) + '</u><b>' + esc(r[1]) + '</b><i>' + esc(r[2]) + '</i></div>').join('') +
      '</div><div class="pad-c mini" style="padding-top:2px;line-height:1.7">连续两次测量要相隔 3 个月以上才算得准。同一天、早晨、光脚、同一面墙——晚上比早晨普遍矮 0.5~1cm，混着测看不出趋势。</div></div>';

    return h;
  }

  function renderStage() {
    const age = ageOf();
    const auto = age < 11 ? 0 : age < 14 ? 1 : 2;
    const i = stageIdx == null ? auto : stageIdx;
    const s = STAGE[i];

    let h = '<div class="seg" style="margin:12px 16px 0">' +
      STAGE.map((x, n) => '<button class="' + (n === i ? 'on' : '') + '" data-act="stage" data-v="' + n + '">' + esc(x.name) + '</button>').join('') + '</div>';

    if (i === auto) {
      h += '<div class="note" style="margin:10px 16px 0">' + ic('info') + '<div>按他的月龄，现在应该看 <b>' + esc(STAGE[auto].name) + '</b> 这一档。往上翻能看下一阶段。</div></div>';
    }

    h += '<div class="card" style="margin:12px 16px 0"><div class="pad-c">' +
      '<div class="row between"><div><div style="font-size:17px;font-weight:650">' + esc(s.name) + '</div>' +
      '<div class="mini" style="margin-top:2px">' + esc(s.who) + '</div></div>' +
      '<span class="pill acc">' + esc(s.kcal) + '</span></div>' +
      '<div style="font-size:13.5px;line-height:1.75;color:var(--ink2);margin-top:10px">' + esc(s.lead) + '</div></div></div>';

    h += '<div class="card" style="margin:12px 16px 0"><div class="pad-c" style="padding-bottom:6px"><div class="kbh" style="margin:0">每天吃多少</div></div>' +
      '<div class="kbkvlist">' + s.rows.map((r) =>
        '<div class="kbkv"><u>' + esc(r[0]) + '</u><b>' + esc(r[1]) + '</b><i>' + esc(r[2]) + '</i></div>'
      ).join('') + '</div></div>';

    h += '<div class="card" style="margin:12px 16px 0"><div class="pad-c">' +
      '<div class="kbli"><span class="n" style="background:var(--pri-l);color:#1682C4">水</span><div>' + esc(s.water) + '</div></div>' +
      '<div class="kbli"><span class="n" style="background:var(--ok-l);color:#1B7F5B">动</span><div>' + esc(s.move) + '</div></div>' +
      '</div></div>';

    h += '<div class="note warn" style="margin:12px 16px 0">' + ic('alert') + '<div><b>这六个数才是重点：</b>奶 300ml、蛋 1 个、蔬菜深色占一半、水产品每周 2 次、全谷物每天一次、水果每天两次。宝塔里别的数字不用天天称，这六个守住，结构就对了。</div></div>';
    return h;
  }

  function renderMethod() {
    let h = '';

    h += secCard('第一件事：一天填满五格',
      '<div class="mini" style="margin-bottom:10px">宝塔讲的是克数，做饭的时候没法称。把它翻成「份」就好使了——一餐里有主食、有蛋白、有蔬菜，一餐就自动是 3 样。</div>' +
      GRID.map((g) => '<div class="kbgrid"><div class="g"><span class="pill ' + (g[3] === 'acc' ? 'acc' : 'ok') + '">' + esc(g[0]) + '</span></div>' +
        '<div><b>' + esc(g[1]) + '</b><div class="mini" style="margin-top:2px;line-height:1.6">' + esc(g[2]) + '</div></div></div>').join('')
    );

    h += secCard('第二件事：12 种不用数，自然就够了',
      '<div class="note" style="margin:0 0 10px">' + ic('info') + '<div>膳食指南的原话是：平均每天摄入 12 种以上食物，每周 25 种以上。这个数是「主食 + 蛋白 + 蔬菜」三样结构带来的副产品，不用刻意凑。</div></div>' +
      '<div class="kbeq">早餐 3 种 ＋ 午餐 4 种 ＋ 晚餐 4 种 ＋ 加餐 2 种 = <b>13 种</b></div>' +
      '<div class="mini" style="margin-top:8px;line-height:1.72">· 早餐 = 主食 + 蛋或奶 + 一份果或菜<br>· 午餐和晚餐 = 主食 + 肉或鱼 + 两个菜<br>· 加餐 = 一份水果 + 一小把坚果<br>真正容易踩的坑不是「种数不够」，是<b>一餐只上一个菜</b>。</div>'
    );

    h += secCard('第三件事：变花样＝同组里换，不是每天想新菜',
      '<div class="mini" style="margin-bottom:10px">下面每一组里的东西营养上可以互换。同一组一周换够 3 样，一周自然就超过 25 种了，也不用每天费脑子。</div>' +
      swapGroups().map((g) => '<div class="kbswap"><b>' + esc(g[0]) + '</b><div>' + esc(g[1]) + '</div></div>').join('') +
      '<div class="note ok" style="margin-top:10px">' + ic('star') + '<div>照着这 11 组换，一周能凑到 30 种以上，而且不用做计划表。</div></div>'
    );

    h += secCard('第四件事：一周盯三条就够',
      week3().map((w) => '<div class="kbli"><span class="n" style="background:var(--ok-l);color:#1B7F5B">✓</span><div><b>' + esc(w[0]) + ' · ' + esc(w[1]) + '</b><div class="mini" style="margin-top:2px;line-height:1.65">' + esc(w[2]) + '</div></div></div>').join('')
    );

    h += secCard('第五件事：早餐四选三',
      '<div class="mini" style="margin-bottom:10px">膳食指南给的标准很具体：早餐要有下面四类里的<b>三类以上</b>。这个比「要吃好」好判断。</div>' +
      BREAKFAST.map((b, i) => '<div class="kbswap"><b>' + esc(b[0]) + '</b><div>' + esc(b[1]) + '</div></div>').join('') +
      '<div class="kbeq" style="margin-top:10px">粥 + 鸡蛋 + 牛奶 = 谷薯 ＋ 动物 ＋ 奶豆 = <b>3 类 ✅</b></div>' +
      '<div class="kbeq" style="margin-top:6px;background:var(--danger-l);color:#B33A2E">包子 + 豆浆 = 谷薯 ＋ 奶豆 = <b>2 类 ❌</b> 缺蛋白</div>'
    );

    h += secCard('他这关：不爱吃水果怎么办',
      '<div class="note warn" style="margin:0 0 10px">' + ic('alert') + '<div>档案里写着「不爱吃水果」，这也是现在菜单最大的缺口（只有 77g，目标 150~200g）。硬劝没用，换做法。</div></div>' +
      FRUIT_HACK.map((f) => '<div class="kbli"><span class="n" style="background:var(--acc-l);color:#D96C1C">·</span><div><b>' + esc(f[0]) + '</b><div class="mini" style="margin-top:2px;line-height:1.65">' + esc(f[1]) + '</div></div></div>').join('') +
      '<div class="note" style="margin-top:10px">' + ic('info') + '<div>水果主要给的是维生素 C、钾和膳食纤维。深色蔬菜能顶掉一部分，但顶不全，也别用果汁代替——榨汁把纤维滤掉了，膳食指南写得很明确：<b>果汁不能代替鲜果</b>。</div></div>'
    );

    return h;
  }

  function renderAudit() {
    let h = '<div class="kbtop" style="background:linear-gradient(135deg,var(--ok-l),#fff)">' +
      '<div class="mini" style="color:#1B7F5B">现有 28 天菜单 · 按 6~10 岁档逐日累计</div>' +
      '<div class="kbverdict" style="color:#1B7F5B">8 分，骨架是对的</div>' +
      '<div style="font-size:13.5px;line-height:1.72;color:var(--ink2)">261 道菜、175 个不重复菜名、127 种食材，肉菜不重样，主食该重复的地方重复。真正要改的只有三样东西：水果、坚果、奶。改动很小。</div>' +
      '</div>';

    h += '<div class="sect"><h2>已经达标的部分</h2></div>' +
      '<div class="card" style="margin:0 16px"><div class="kbtbl">' +
      auditOk().map((r) => '<div class="kbtbl-r"><div><span class="ok">✓</span>' + esc(r[0]) + '</div><div><b>' + esc(r[1]) + '</b></div><div class="mini">' + esc(r[2]) + '</div></div>').join('') +
      '</div></div>';

    h += '<div class="sect"><h2>四个缺口，都有具体改法</h2></div>';
    AUDIT_GAP.forEach((g) => {
      const c = g.lvl === 'high' ? 'danger' : g.lvl === 'mid' ? 'warn' : 'gray';
      const bg = g.lvl === 'high' ? 'var(--danger-l)' : g.lvl === 'mid' ? 'var(--warn-l)' : '#EEF3F7';
      h += '<div class="card" style="margin:12px 16px 0"><div class="pad-c">' +
        '<div class="row between" style="align-items:flex-start"><div style="font-size:14.5px;font-weight:640;line-height:1.5">' + esc(g.t) + '</div>' +
        '<span class="pill ' + (g.lvl === 'high' ? 'warn' : 'gray') + '" style="background:' + bg + ';flex:0 0 auto">' + (g.lvl === 'high' ? '要改' : g.lvl === 'mid' ? '建议改' : '小事') + '</span></div>' +
        '<div class="mini" style="margin-top:5px;line-height:1.65">' + esc(g.d) + '</div>' +
        '<div class="kbfix"><b>改法</b><div>' + esc(g.fix) + '</div></div>' +
        '</div></div>';
    });

    h += '<div class="sect"><h2>一个偏多的项</h2></div>' +
      '<div class="card" style="margin:0 16px"><div class="pad-c">' +
      '<div style="font-size:14.5px;font-weight:640">肉和鱼偏多，约两倍</div>' +
      '<div style="font-size:13.5px;line-height:1.78;color:var(--ink2);margin-top:6px">' + esc(AUDIT_OVER) + '</div>' +
      '<div class="note" style="margin-top:10px">' + ic('info') + '<div>宝塔这一档给的是「畜禽肉 40g + 水产品 40g + 蛋 1 个」，另有 300ml 奶和一份豆制品。<b>蛋白质早就够了</b>，再加肉不会让孩子多长一厘米，只会挤掉水果和菜的位置。</div></div>' +
      '</div></div>';

    h += '<div class="note ok" style="margin:12px 16px 0">' + ic('star') + '<div><b>一句话结论：</b>这套菜单不用重做。每天加一份水果、一小把坚果，睡前奶从 200ml 加到 250ml，肉别再往上加——就齐了。</div></div>';
    h += '<div class="note" style="margin:10px 16px 0">' + ic('info') + '<div>这张表算的是<b>水产避让打开时</b>的版本。把「我的 → 过敏原设置」里那几项关掉，鱼会换成海鱼虾蟹贝——<b>其余各项几乎不变</b>（实测只差豆制品十几克、深色菜八克），所以上面这些结论两种设置下都成立。</div></div>';
    return h;
  }

  function renderNutri() {
    const al = S.allergy();
    const seaBan = al.on && (al.seaFish || al.shrimpCrab || al.shellfish);
    const T = [
      ['钙', '800mg', '1000mg', '1200mg', '1000mg', '奶制品最好吸收，300ml 牛奶约 310mg'],
      ['蛋白质', '30g', '40g', '男 60 / 女 55g', '男 75 / 女 60g', '优质蛋白占三分之一以上'],
      ['维生素 D', '10µg', '10µg', '10µg', '10µg', '＝400IU，主要靠晒太阳'],
      ['膳食纤维', '10~15g', '15~20g', '20~25g', '25~30g', '全谷、豆类、蔬果、坚果']
    ];
    let h = '<div class="card" style="margin:12px 16px 0"><div class="pad-c" style="padding-bottom:8px">' +
      '<div class="kbh" style="margin:0 0 4px">关键营养素</div>' +
      '<div class="mini">单位：钙 mg / 蛋白质 g / 维生素 D µg / 膳食纤维 g，都是每天。</div></div>' +
      '<div class="kbmtx tbl n4">' +
      '<div class="kbmtx-r hd"><div>营养素</div><div>4~6岁</div><div>7~10岁</div><div>11~13岁</div><div>14~17岁</div></div>' +
      T.map((r) => '<div class="kbmtx-r"><div>' + esc(r[0]) + '</div>' + r.slice(1, 5).map((x) => '<div>' + esc(x) + '</div>').join('') + '</div>').join('') +
      '</div><div class="kbtbl" style="border-top:1px solid var(--line)">' +
      T.map((r) => '<div class="kbtbl-r"><div style="width:64px;flex:0 0 64px"><b>' + esc(r[0]) + '</b></div><div class="mini">' + esc(r[5]) + '</div></div>').join('') +
      '</div></div>';

    h += secCard('不用刻意补的两样，和一个容易漏的',
      '<div class="kbli"><span class="n" style="background:var(--ok-l);color:#1B7F5B">✓</span><div><b>铁：</b>青春期男生需求上升，红肉每周两三次、动物肝脏每周一次就够。植物里的铁吸收差，配点维生素 C（番茄、青椒）能拉上来。</div></div>' +
      '<div class="kbli"><span class="n" style="background:var(--ok-l);color:#1B7F5B">✓</span><div><b>锌：</b>' +
      (seaBan
        ? '贝壳类是最好的来源，但这个档案避让贝类，所以走牛肉、南瓜子、坚果这条路。缺锌确实会拖慢生长，但不是靠补剂解决的。'
        : '贝壳类（蛤蜊、扇贝）是最好的来源，每周一次就够；其次是牛肉、南瓜子、坚果。缺锌确实会拖慢生长，但不是靠补剂解决的。') +
      '</div></div>' +
      '<div class="kbli"><span class="n" style="background:var(--warn-l);color:#A96C13">!</span><div><b>维生素 D 最容易漏：</b>食物里几乎没有。每天户外 15~30 分钟（避开正午）能让皮肤自己合成，冬天或者晒不到就得补。这一项和长高的关系比钙更直接。</div></div>'
    );

    h += '<div class="note warn" style="margin:12px 16px 0">' + ic('alert') + '<div><b>过量没有额外收益。</b>钙补到 1000mg 以上、蛋白超到需求的两倍，都不会让孩子多长。判断要不要补，看的是「饭有没有吃够」，不是「有没有吃补剂」。</div></div>';
    return h;
  }

  function renderSrc() {
    const SRC = [
      ['中国学龄儿童平衡膳食宝塔（2022）', '中国营养学会 · 中国居民膳食指南官网', '三个年龄段全部食物克数、饮水量、运动量'],
      ['《中国居民膳食指南（2022）》准则一', '中国营养学会', '食物多样：每天 12 种以上、每周 25 种以上'],
      ['《中国居民膳食指南（2022）》准则三、四', '中国营养学会', '蔬果奶豆、鱼禽蛋肉的量；果汁不能代替鲜果'],
      ['WS/T 612-2018《7岁~18岁儿童青少年身高发育等级评价》', '国家卫生健康委员会', '身高五档界值表（-2SD ~ +2SD）'],
      ['《中国居民膳食营养素参考摄入量（2023版）》', '中国营养学会', '钙、蛋白质、维生素 D、膳食纤维'],
      ['儿童年生长速度参考', '科普中国 / 人民网科普', '各年龄段每年该长多少；低于 5cm/年要评估'],
      ['矮小症判定标准', '医学通行标准（低于同龄同性别第 3 百分位或 2 个标准差）', '「就医档」的界线']
    ];
    let h = '<div class="card" style="margin:12px 16px 0"><div class="pad-c" style="padding-bottom:6px"><div class="kbh" style="margin:0">这页的数字从哪来</div>' +
      '<div class="mini">配餐这部分不凭感觉写，全部对着下面这几份东西核过。</div></div>' +
      '<div class="kbtbl">' + SRC.map((s) => '<div class="kbtbl-r col"><div><b>' + esc(s[0]) + '</b></div><div class="mini">' + esc(s[1]) + '</div><div class="mini" style="color:var(--ink2);margin-top:2px">用于：' + esc(s[2]) + '</div></div>').join('') + '</div></div>';

    h += secCard('两句要说在前面的话',
      '<div class="kbli"><span class="n" style="background:var(--pri-l);color:#1682C4">1</span><div><b>这是通用标准，不是处方。</b>如果孩子有基础疾病或正在治疗，具体吃多少、要不要额外补，以主治医生的意见为准。这份知识库的作用是让你看懂医生说的是什么、日常怎么落地。</div></div>' +
      '<div class="kbli"><span class="n" style="background:var(--pri-l);color:#1682C4">2</span><div><b>别把标准当考核。</b>一天两天没吃够不影响，看的是两周的平均。真正要看的是三个月的身高速度，不是今天那顿饭。</div></div>'
    );
    return h;
  }

  /* ================= 主渲染 ================= */
  const SECS = [
    ['judge', '该追还是该保', renderJudge],
    ['stage', '各阶段吃多少', renderStage],
    ['method', '怎么配', renderMethod],
    ['audit', '菜单体检', renderAudit],
    ['nutri', '营养素', renderNutri],
    ['src', '依据', renderSrc]
  ];

  function title() { return { t: '配餐知识库', sub: '科学配餐 · 分阶段 · 含菜单体检' }; }

  function render() {
    const nav = '<div class="kbnav">' + SECS.map((s) =>
      '<button class="' + (sec === s[0] ? 'on' : '') + '" data-act="sec" data-v="' + s[0] + '">' + esc(s[1]) + '</button>'
    ).join('') + '</div>';
    const f = SECS.filter((s) => s[0] === sec)[0] || SECS[0];
    return nav + f[2]() + '<div style="height:8px"></div>';
  }

  function act(name, el) {
    if (name === 'sec') { sec = el.dataset.v; App.render(); window.scrollTo(0, 0); return true; }
    if (name === 'stage') { stageIdx = parseInt(el.dataset.v, 10); App.render(); return true; }
    if (name === 'back') { App.go('food'); return true; }
    return false;
  }

  return { title, render, act };
})();
