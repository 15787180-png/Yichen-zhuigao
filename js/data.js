/* 常量与内置内容：运动方案、校历、餐次定义、默认档案 */
window.D = (function () {
  const EX_MAIN = [
    { id: 1, name: '跳绳', amount: '200 个（第 1 组）', tip: '膝盖微屈，前脚掌落地，手腕发力甩绳，呼吸均匀。', rest: true },
    { id: 2, name: '弹簧跳', amount: '50 个', tip: '双脚并拢连续小弹跳，脚踝发力，落地要轻，声音越小越好。', rest: true },
    { id: 3, name: '跳绳', amount: '200 个（第 2 组）', tip: '身体直立不晃，眼睛看前方 2-3 米处，保持节奏。', rest: true },
    { id: 4, name: '伸展跳', amount: '50 个', tip: '每跳尽量往上伸展，手臂同时上举，落地屈膝缓冲。', rest: true },
    { id: 5, name: '跳绳', amount: '200 个（第 3 组）', tip: '保持匀速，别越跳越快，中途断了立刻接着跳。', rest: true },
    { id: 6, name: '开合跳', amount: '50 个', tip: '双脚同时开合，手臂举过头顶，核心收紧，落地轻柔。', rest: true },
    { id: 7, name: '跳绳', amount: '200 个（第 4 组）', tip: '这组最容易散架，嘴里数着节奏跳。', rest: true },
    { id: 8, name: '高抬腿', amount: '50 个', tip: '大腿抬到与地面平行，上身挺直，摆臂配合。', rest: true },
    { id: 9, name: '跳绳', amount: '200 个（第 5 组）', tip: '最后一组跳绳，稳住呼吸，跳完再收尾。', rest: true },
    { id: 10, name: '勾脚跳', amount: '50 个', tip: '跳起时脚跟往臀部方向勾，落地轻，上身别弓。' },
    { id: 11, name: '放松拉伸', amount: '2 分钟', tip: '小腿后侧、大腿前侧、肩部各拉伸 30 秒，配合深呼吸。' }
  ];
  const EX_ALT = [
    { name: '摸高跳', amount: '50 次', tip: '双脚原地起跳，双手尽力向上够，建议分 2 组完成。' },
    { name: '单杠悬垂', amount: '20-30 秒 × 3 组', tip: '正握单杠，身体自然下垂，感受脊柱拉伸，呼吸放松。' },
    { name: '睡前拉伸', amount: '5 分钟', tip: '猫牛式、婴儿式、腿部拉伸各 1 分钟，帮助放松助眠。' }
  ];
  const SAFETY = [
    '饭后 1 小时再运动',
    '穿运动鞋，在平坦地面',
    '强度以微微出汗、还能正常说话为度',
    '运动中出现胸闷、头晕、心悸立即停止',
    '定期心脏随访，运动强度遵医嘱'
  ];

  const MEAL_SCHOOL = [
    { key: 'breakfast', label: '早餐', time: '07:30', emoji: '🌅' },
    { key: 'lunch', label: '午餐', time: '12:00', emoji: '🍚', school: true },
    { key: 'afterSchoolSnack', label: '放学后加餐', time: '16:30', emoji: '🥕', chk: 'afternoonSnack' },
    { key: 'dinner', label: '晚餐', time: '18:30', emoji: '🍲' },
    { key: 'bedtimeSnack', label: '睡前奶', time: '21:00', emoji: '🥛', chk: 'bedtimeSnack' }
  ];
  const MEAL_FREE = [
    { key: 'breakfast', label: '早餐', time: '08:00', emoji: '🌅' },
    { key: 'lunch', label: '午餐', time: '12:00', emoji: '🍚' },
    { key: 'afterSchoolSnack', label: '下午加餐', time: '15:30', emoji: '🍊', chk: 'afternoonSnack' },
    { key: 'dinner', label: '晚餐', time: '18:30', emoji: '🍲' },
    { key: 'bedtimeSnack', label: '睡前奶', time: '21:00', emoji: '🥛', chk: 'bedtimeSnack' }
  ];

  const DISH_IMG = [
    { kw: ['牛奶', '水煮蛋', '鸡蛋', '蛋羹'], url: 'assets/cartoon/dish-egg-milk.svg' },
    { kw: ['番茄', '牛肉', '牛腩', '牛排'], url: 'assets/cartoon/dish-beef-tomato.svg' },
    { kw: ['鱼'], url: 'assets/cartoon/dish-fish.svg' },
    { kw: ['酸奶', '坚果', '奶酪'], url: 'assets/cartoon/dish-yogurt-nuts.svg' },
    { kw: ['米饭', '蔬菜', '青菜', '西兰花', '菠菜', '白菜', '生菜'], url: 'assets/cartoon/dish-vegetables.svg' },
    { kw: ['面', '鸡肉', '鸡汤', '鸡腿', '鸡胸'], url: 'assets/cartoon/dish-noodle-chicken.svg' },
    { kw: ['包子', '饺子', '蒸饺', '馄饨', '小笼'], url: 'assets/cartoon/dish-dumplings.svg' }
  ];

  const GROCERY_CATS = [
    { key: '水产', label: '水产' },
    { key: '肉蛋奶', label: '肉蛋奶' },
    { key: '蔬菜', label: '蔬菜' },
    { key: '水果', label: '水果' },
    { key: '豆制品', label: '豆制品' },
    { key: '主食杂粮', label: '主食杂粮' },
    { key: '坚果', label: '坚果' },
    { key: '调味', label: '调味' },
    { key: '其他', label: '其他' }
  ];

  /* 校历：学期 + 假期 + 法定节假日 + 调休上课日 */
  const CAL = {
    semesters: [
      { start: '2026-09-01', end: '2027-01-29' },
      { start: '2027-02-22', end: '2027-06-30' },
      { start: '2027-09-01', end: '2028-01-28' },
      { start: '2028-02-21', end: '2028-06-30' }
    ],
    vacations: [
      { start: '2027-01-30', end: '2027-02-21', type: 'winter', name: '寒假' },
      { start: '2027-07-01', end: '2027-08-31', type: 'summer', name: '暑假' },
      { start: '2028-01-29', end: '2028-02-20', type: 'winter', name: '寒假' },
      { start: '2028-07-01', end: '2028-08-31', type: 'summer', name: '暑假' }
    ],
    holidays: [
      ['2026-10-01', '国庆节'], ['2026-10-02', '国庆节'], ['2026-10-03', '国庆节'], ['2026-10-04', '国庆节'],
      ['2026-10-05', '国庆节'], ['2026-10-06', '国庆节'], ['2026-10-07', '国庆节'],
      ['2027-01-01', '元旦'],
      ['2027-04-04', '清明节'], ['2027-04-05', '清明节'], ['2027-04-06', '清明节'],
      ['2027-05-01', '劳动节'], ['2027-05-02', '劳动节'], ['2027-05-03', '劳动节'], ['2027-05-04', '劳动节'], ['2027-05-05', '劳动节'],
      ['2027-06-12', '端午节'], ['2027-06-13', '端午节'], ['2027-06-14', '端午节'],
      ['2027-09-24', '中秋节'], ['2027-09-25', '中秋节'], ['2027-09-26', '中秋节'],
      ['2027-10-01', '国庆节'], ['2027-10-02', '国庆节'], ['2027-10-03', '国庆节'], ['2027-10-04', '国庆节'],
      ['2027-10-05', '国庆节'], ['2027-10-06', '国庆节'], ['2027-10-07', '国庆节'],
      ['2028-01-01', '元旦']
    ],
    makeup: [
      ['2026-10-10', '国庆调休'], ['2027-04-24', '劳动节调休'], ['2027-05-07', '劳动节调休'],
      ['2027-09-18', '中秋调休'], ['2027-10-09', '国庆调休']
    ]
  };

  /* 公开版：这里是示例档案，具体信息在「我的」里自己改 */
  const PROFILE = {
    name: '小朋友', nickname: '小朋友', gender: 'boy', birthDate: '2017-01-01',
    baselineHeight: 110, baselineWeight: 20, boneAgeOffset: 0,
    diseaseBackground: '',
    hospital: '',
    treatmentInfo: '',
    allergies: { on: false, seaFish: false, shrimpCrab: false, shellfish: false, algae: false, other: '' },
    dietInfo: '',
    exerciseInfo: '每天：跳绳 5 组 × 200 个 + 弹簧跳 / 伸展跳 / 开合跳 / 高抬腿 / 勾脚跳 各 50 个',
    sleep: { bedTime: '21:30', wakeTime: '06:50', actualBedtime: '22:00', schoolOutTime: '17:30', exerciseTime: '21:00' },
    targetHeight: '',
    ghDay: 'wednesday', ghTime: '18:00',
    allergyOn: false
  };

  const SCHOOL_LUNCH_TIPS = [
    '优先选鸡蛋、牛奶、瘦肉、鸡腿、豆腐、绿叶菜',
    '荤素搭配，别只吃一样',
    '少选油炸、糖醋、含糖饮料和甜点',
    '午餐尽量吃光，别剩'
  ];

  const TIPS = [
    '充足的睡眠是长高的关键。生长激素在深睡眠时分泌最旺盛，尽量在 {bed} 前上床，保证 9-12 小时睡眠。',
    '跳绳要落地轻、膝盖微屈，每组之间歇 30 秒。空腹和刚吃完饭都别跳。',
    '每天 400-500ml 奶、1-2 个鸡蛋，蛋白质分到三餐里比一顿猛吃更有效。',
    '每天户外待够 1 小时，晒太阳能帮身体自己合成维生素D。',
    '量身高固定在早晨、同一面墙、光脚，早晨比晚上普遍高 0.5-1cm，混着测会看不出趋势。',
    '注射日尽量固定在同一时间段，前后别剧烈运动，注射后观察半小时。',
    '睡前 1 小时不看屏幕，房间调暗，入睡会快很多。'
  ];

  return { EX_MAIN, EX_ALT, SAFETY, MEAL_SCHOOL, MEAL_FREE, DISH_IMG, GROCERY_CATS, CAL, PROFILE, SCHOOL_LUNCH_TIPS, TIPS };
})();
