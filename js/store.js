/* 数据层：本地状态、校历、菜单、统计、周报 */
window.S = (function () {
  const KEY = 'zhui_v1';
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function blank() {
    return {
      v: 1,
      profile: clone(D.PROFILE),
      checkins: {},
      heights: [],
      supplements: {
        vd: { on: false, dose: '', time: '08:00' },
        ca: { on: false, dose: '', time: '20:00' }
      },
      reminders: {
        wake: '06:50', breakfast: '07:30', grocery: '08:00', move: '18:00',
        sleepPrep: '21:00', sleep: '21:30', measure: '08:00', gh: '18:00', notify: false
      },
      medical: { reports: [], visits: [] },
      swaps: {},
      groceryChecked: {},
      reports: {},
      cal: { addHolidays: [], addMakeup: [], addVacations: [] },
      settings: { cloudOn: false, lastBackup: null, lastBackupAt: '', device: '' },
      meta: { createdAt: Date.now() }
    };
  }

  let state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : blank();
  } catch (e) { state = blank(); }
  if (!state || !state.v) state = blank();
  // 兼容补齐（老版本导出的 JSON 可能缺嵌套 key，缺了就地补，不然后面会崩）
  const b = blank();
  for (const k in b) if (!(k in state)) state[k] = b[k];
  if (!state.profile || typeof state.profile !== 'object') state.profile = b.profile;
  for (const k in b.profile) if (!(k in state.profile)) state.profile[k] = b.profile[k];
  if (!state.profile.allergies || typeof state.profile.allergies !== 'object') state.profile.allergies = b.profile.allergies;
  for (const obj of ['supplements', 'reminders', 'medical', 'cal', 'settings']) {
    if (!state[obj] || typeof state[obj] !== 'object') state[obj] = b[obj];
    else for (const j in b[obj]) if (!(j in state[obj])) state[obj][j] = b[obj][j];
  }
  for (const obj of ['checkins', 'swaps', 'groceryChecked', 'reports']) if (!state[obj] || typeof state[obj] !== 'object') state[obj] = {};
  if (!Array.isArray(state.heights)) state.heights = [];
  if (!Array.isArray(state.medical.reports)) state.medical.reports = [];
  if (!Array.isArray(state.medical.visits)) state.medical.visits = [];

  let timer = null, dirty = 0;
  function save() {
    dirty++;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { UI.toast('本地存储写满，请导出备份后清理'); }
    if (state.settings.cloudOn) {
      clearTimeout(timer);
      timer = setTimeout(() => Cloud.autoBackup(), 6000);
    }
  }

  /* ---------------- 日期 ---------------- */
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  function fmt(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { const a = s.split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); }
  function today() { return fmt(new Date()); }
  function addDays(s, n) { const d = parse(s); d.setDate(d.getDate() + n); return fmt(d); }
  function weekStart(s) { const d = parse(s); const w = d.getDay(); d.setDate(d.getDate() + (w === 0 ? -6 : 1 - w)); return fmt(d); }
  function dow(s) { return parse(s).getDay(); }
  const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  function cn(s) { const d = parse(s); return (d.getMonth() + 1) + '月' + d.getDate() + '日'; }
  function cnw(s) { const d = parse(s); return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + WD[d.getDay()]; }
  function dayOfYear(s) {
    const d = parse(s);
    const start = Date.UTC(d.getFullYear(), 0, 1);
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 86400000) + 1;
  }
  function ageText() {
    const b = parse(state.profile.birthDate || '2017-01-01');
    const n = new Date();
    let y = n.getFullYear() - b.getFullYear();
    const m = n.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && n.getDate() < b.getDate())) y--;
    return y + '岁';
  }
  function minutesOf(t) { if (!t) return null; const a = t.split(':').map(Number); return a[0] * 60 + a[1]; }
  function minToTime(m) { m = Math.round(m); return pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60); }

  /* ---------------- 校历 ---------------- */
  function inRange(s, a, b) { return s >= a && s <= b; }
  function cal(s) {
    const c = state.cal || {};
    const vacs = (D.CAL.vacations || []).concat(c.addVacations || []);
    for (const v of vacs) if (inRange(s, v.start, v.end)) return { school: false, name: v.name || '假期', kind: 'vacation' };
    const mk = (D.CAL.makeup || []).concat((c.addMakeup || []).map((x) => [x.date, x.name]));
    for (const m of mk) if (m[0] === s) return { school: true, name: m[1] || '调休上课', kind: 'makeup' };
    const hd = (D.CAL.holidays || []).concat((c.addHolidays || []).map((x) => [x.date, x.name]));
    for (const h of hd) if (h[0] === s) return { school: false, name: h[1] || '假期', kind: 'holiday' };
    const w = dow(s);
    const inSem = (D.CAL.semesters || []).some((x) => inRange(s, x.start, x.end));
    if (inSem && w >= 1 && w <= 5) return { school: true, name: '上学日', kind: 'school' };
    if (w === 0 || w === 6) return { school: false, name: '周末', kind: 'weekend' };
    return { school: false, name: '假期', kind: 'vacation' };
  }

  /* ---------------- 菜单 ---------------- */
  /* ---------------- 过敏设置 ---------------- */
  // 老数据只有 seafood/seaFish/shellfish，这里补齐并兼容
  function allergy() {
    const a = (state.profile && state.profile.allergies) || {};
    return {
      on: a.on !== false,
      seaFish: !!a.seaFish,
      shrimpCrab: a.shrimpCrab != null ? !!a.shrimpCrab : !!a.seafood,
      shellfish: !!a.shellfish,
      algae: !!a.algae,
      other: a.other || ''
    };
  }

  // 这道菜沾了哪几类过敏原
  function dishCats(dish) {
    const s = (dish.ingredients || []).map((x) => x.name).join(' ');
    const out = [];
    for (const k in SEA.RULES) if (SEA.RULES[k].test(s)) out.push(k);
    // 「海鱼」规则里没有裸「鱼」，但淡水鱼名要排除掉，避免 鲈鱼/鳜鱼 误判
    return out;
  }
  function catBlocked(al, cats) {
    if (!al.on) return false;
    return cats.some((c) => al[c]);
  }
  function catAllowed(al, tag) {
    if (!tag || tag === 'none') return true;
    if (!al.on) return true;
    return !al[tag];
  }

  // 藻类过敏时，把菜里作为配料的藻类剔掉（比如饭团里的海苔）
  function stripAlgae(dish) {
    const ings = (dish.ingredients || []).filter((x) => !SEA.RULES.algae.test(x.name));
    if (ings.length === (dish.ingredients || []).length) return dish;
    return Object.assign({}, dish, { ingredients: ings });
  }

  /* 过敏决定这一天这一餐吃哪一道：
     有海产替代位 → 该类不过敏就吃海产版，过敏就退回菜单原版（淡水鱼）
     有藻类替代位 → 藻类过敏就换掉
     其余 → 藻类过敏时剔除藻类配料 */
  function pickDish(dish, n, mealKey, i) {
    const al = allergy();
    const k = n + '|' + mealKey + '|' + i;
    const sea = SEA.SWAP[k];
    if (sea) return catAllowed(al, sea.tag) ? sea : dish;
    const alg = SEA.ALGAE[k];
    if (alg) return catAllowed(al, 'algae') ? dish : alg;
    if (al.on && al.algae) return stripAlgae(dish);
    return dish;
  }

  function plan(s) {
    const n = ((dayOfYear(s) - 1) % 28) + 1;
    const p = MENU28.find((x) => x.dayNumber === n) || MENU28[0];
    return p;
  }
  function dishes(s, mealKey) {
    const p = plan(s);
    const k = s + '.' + mealKey;
    const sw = state.swaps[k];
    let list = (p[mealKey] || []).slice();

    // 1) 先按过敏设置定这一餐吃哪几道
    list = list.map((dish, i) => pickDish(dish, p.dayNumber, mealKey, i));

    // 2) 用户手动「换一道」
    if (sw != null) {
      const pool = allDishes(mealKey);
      const pick = pool[sw % pool.length];
      if (pick) { if (list.length) list[0] = pick; else list = [pick]; }
    }

    // 3) 兜底：带被禁过敏原的一律不端上桌（防手动换到不该吃的）
    const al = allergy();
    return list.filter((dish) => !catBlocked(al, dishCats(dish)));
  }
  function allDishes(mealKey) {
    const map = new Map();
    for (const p of MENU28) for (const d of (p[mealKey] || [])) if (!map.has(d.name)) map.set(d.name, d);
    // 不受限的类别，把海产菜也放进候选池，「换一道」才换得出来
    const al = allergy();
    for (const k in SEA.SWAP) {
      const dd = SEA.SWAP[k];
      if (k.split('|')[1] !== mealKey) continue;
      if (catAllowed(al, dd.tag) && !map.has(dd.name)) map.set(dd.name, dd);
    }
    for (const k in SEA.ALGAE) {
      const dd = SEA.ALGAE[k];
      if (k.split('|')[1] !== mealKey) continue;
      if (!catAllowed(al, 'algae') && !map.has(dd.name)) map.set(dd.name, dd);
    }
    return Array.from(map.values()).filter((d) => !catBlocked(al, dishCats(d)));
  }
  // 菜名/配料里命中了档案「其它过敏」自由文本的，返回命中的词
  function allergyMarks(dish) {
    const al = allergy();
    if (!al.other) return [];
    const txt = (dish.name + ' ' + (dish.ingredients || []).map((x) => x.name).join(' '));
    return al.other.split(/[、,，;；\s]+/).filter((w) => w && w.length >= 1 && txt.indexOf(w) >= 0);
  }
  function swap(s, mealKey) {
    const pool = allDishes(mealKey);
    const k = s + '.' + mealKey;
    const cur = state.swaps[k] == null ? 0 : state.swaps[k] + 1;
    state.swaps[k] = cur % pool.length;
    save();
  }
  function meals(s) { return cal(s).school ? D.MEAL_SCHOOL : D.MEAL_FREE; }
  function mealDef(s, key) { return meals(s).find((m) => m.key === key); }

  /* ---------------- 打卡 ---------------- */
  const CHK_KEYS = ['breakfast', 'lunch', 'afternoonSnack', 'dinner', 'bedtimeSnack', 'exercise', 'jumpRope', 'exerciseNote', 'sleepTime', 'vd', 'ca', 'gh', 'measure', 'note'];
  function blankChk() {
    const o = {};
    CHK_KEYS.forEach((k) => { o[k] = (k === 'jumpRope' ? 0 : (k === 'exerciseNote' || k === 'sleepTime' || k === 'note') ? '' : false); });
    return o;
  }
  function chk(s) { return state.checkins[s] || blankChk(); }
  function wchk(s) { if (!state.checkins[s]) state.checkins[s] = blankChk(); return state.checkins[s]; }
  function setChk(s, k, v) { wchk(s)[k] = v; save(); }
  function toggleChk(s, k) { const c = wchk(s); c[k] = !c[k]; save(); return c[k]; }
  function activeDays() {
    return Object.keys(state.checkins).filter((k) => {
      const c = state.checkins[k];
      return c.breakfast || c.lunch || c.dinner || c.afternoonSnack || c.bedtimeSnack || c.exercise || c.sleepTime || c.vd || c.ca || c.gh || c.measure;
    }).length;
  }

  /* ---------------- 今日任务 ---------------- */
  function tasks(s) {
    const c = chk(s);
    const p = state.profile;
    const w = dow(s);
    const t = [];
    const ms = meals(s);
    for (const m of ms) {
      const key = m.chk || m.key;
      t.push({
        id: 'meal-' + key, type: 'meal', time: m.time, icon: 'food', iconCls: '', emoji: m.emoji,
        title: m.label, sub: m.school ? '学校食堂就餐' : '按今日菜单吃',
        done: !!c[key], act: 'toggle', key
      });
    }
    const mvTime = p.sleep && p.sleep.exerciseTime ? p.sleep.exerciseTime : '18:00';
    t.push({
      id: 'exercise', type: 'exercise', time: mvTime, icon: 'move', iconCls: 'acc',
      title: '运动打卡', sub: c.jumpRope ? '已跳绳 ' + c.jumpRope + ' 个' : '跳绳 5×200 + 弹跳 5 项',
      done: !!c.exercise, act: 'exercise', extra: true
    });
    if (state.supplements.vd.on) t.push({ id: 'vd', type: 'supplement', time: state.supplements.vd.time, icon: 'pill', iconCls: 'ok', emoji: '💊', title: '维生素D', sub: state.supplements.vd.dose || '按剂量服用', done: !!c.vd, act: 'toggle', key: 'vd' });
    if (state.supplements.ca.on) t.push({ id: 'ca', type: 'supplement', time: state.supplements.ca.time, icon: 'pill', iconCls: 'ok', emoji: '💊', title: '钙', sub: state.supplements.ca.dose || '按剂量服用', done: !!c.ca, act: 'toggle', key: 'ca' });
    const ghDay = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }[p.ghDay || 'wednesday'];
    if (ghDay === w) t.push({ id: 'gh', type: 'gh', time: p.ghTime || '18:00', icon: 'syringe', iconCls: 'warn', emoji: '💉', title: '生长激素注射', sub: '按医嘱注射，前后避免剧烈运动', done: !!c.gh, act: 'toggle', key: 'gh' });
    if (w === 0) t.push({ id: 'measure', type: 'measure', time: '08:00', icon: 'ruler', iconCls: 'acc', emoji: '📏', title: '量身高体重', sub: '周日早晨空腹、光脚、同一面墙', done: !!c.measure, act: 'measure' });
    t.push({
      id: 'sleep', type: 'sleep', time: (p.sleep && p.sleep.bedTime) || '21:30', icon: 'moon', iconCls: '', emoji: '🌙',
      title: '睡觉', sub: c.sleepTime ? '实际入睡 ' + c.sleepTime : '目标 ' + ((p.sleep && p.sleep.bedTime) || '21:30') + ' 前',
      done: !!c.sleepTime, act: 'sleep'
    });
    t.sort((a, b) => a.time.localeCompare(b.time));
    return t;
  }

  /* ---------------- 身高 ---------------- */
  function heights() { return state.heights.slice().sort((a, b) => a.date.localeCompare(b.date)); }
  function addHeight(o) {
    state.heights = state.heights.filter((x) => x.date !== o.date);
    state.heights.push(o);
    save();
  }
  function delHeight(date) { state.heights = state.heights.filter((x) => x.date !== date); save(); }
  /* 改一条记录：origDate 是改之前的日期，日期改了要把旧的那条挪走 */
  function updateHeight(origDate, o) {
    state.heights = state.heights.filter((x) => x.date !== o.date && (!origDate || x.date !== origDate));
    state.heights.push(o);
    save();
  }

  function stats() {
    const h = heights();
    const last = h.length ? h[h.length - 1] : null;
    const bmi = last && last.height && last.weight ? +(last.weight / Math.pow(last.height / 100, 2)).toFixed(1) : null;
    // 近30天增长
    const t = today(), from = addDays(t, -30);
    const rec = h.filter((x) => x.date >= from);
    let gain30 = null;
    if (rec.length >= 2) gain30 = +(rec[rec.length - 1].height - rec[0].height).toFixed(2);
    else if (rec.length === 1 && h.length >= 2) gain30 = +(last.height - h[h.length - 2].height).toFixed(2);
    // 本月
    const monthPrefix = t.slice(0, 7);
    const mc = Object.keys(state.checkins).filter((k) => k.startsWith(monthPrefix)).map((k) => state.checkins[k]);
    const exDays = mc.filter((c) => c.exercise).length;
    const jump = mc.reduce((a, c) => a + (Number(c.jumpRope) || 0), 0);
    const slept = mc.filter((c) => c.sleepTime);
    const avgSleep = slept.length ? minToTime(slept.reduce((a, c) => a + minutesOf(c.sleepTime), 0) / slept.length) : null;
    // 连续运动天数：从「最近一次运动的那天」往回数。今天还没打卡不算断，
    // 这样隔天早上打开也是 99 天，不会一夜清零。
    let streak = 0, streakEnd = null;
    const exDates = Object.keys(state.checkins)
      .filter((k) => k <= t && state.checkins[k] && state.checkins[k].exercise).sort();
    if (exDates.length) {
      streakEnd = exDates[exDates.length - 1];
      let cur = streakEnd;
      for (let i = 0; i < 400; i++) {
        const c = state.checkins[cur];
        if (c && c.exercise) { streak++; cur = addDays(cur, -1); } else break;
      }
    }
    return { last, bmi, gain30, exDays, jump, avgSleep, sleepDays: slept.length, streak, streakEnd, count: h.length };
  }

  /* ---------------- 周报 ---------------- */
  function weekReport(ws) {
    const t = today();
    const wsCur = weekStart(t);
    const elapsed = ws === wsCur ? Math.min(7, Math.round((parse(t) - parse(ws)) / 86400000) + 1) : (ws > wsCur ? 0 : 7);
    const key = ws + '_' + elapsed;
    if (state.reports[key]) return state.reports[key];
    const days = [];
    for (let i = 0; i < 7; i++) days.push(addDays(ws, i));
    const cs = days.map((d) => state.checkins[d]).filter(Boolean);
    const n = Math.max(1, elapsed);
    const ex = cs.filter((c) => c.exercise).length;
    const slept = cs.filter((c) => c.sleepTime);
    const avgSleep = slept.length ? minToTime(slept.reduce((a, c) => a + minutesOf(c.sleepTime), 0) / slept.length) : null;
    const jump = cs.reduce((a, c) => a + (Number(c.jumpRope) || 0), 0);
    const mealSlots = ['breakfast', 'lunch', 'afternoonSnack', 'dinner', 'bedtimeSnack'];
    let mealDone = 0;
    cs.forEach((c) => mealSlots.forEach((k) => { if (c[k]) mealDone++; }));
    const mealRate = Math.round((mealDone / (n * 5)) * 100);
    let supDone = 0, supTotal = 0;
    if (state.supplements.vd.on) { supTotal += n; cs.forEach((c) => { if (c.vd) supDone++; }); }
    if (state.supplements.ca.on) { supTotal += n; cs.forEach((c) => { if (c.ca) supDone++; }); }
    const supRate = supTotal ? Math.round((supDone / supTotal) * 100) : null;
    const gh = cs.filter((c) => c.gh).length;
    const hs = heights().filter((x) => x.date >= ws && x.date <= addDays(ws, 6));
    const hGain = hs.length >= 2 ? +(hs[hs.length - 1].height - hs[0].height).toFixed(2) : null;
    const wGain = hs.length >= 2 && hs[hs.length - 1].weight != null && hs[0].weight != null ? +(hs[hs.length - 1].weight - hs[0].weight).toFixed(2) : null;

    // 文字评估
    const good = [], bad = [];
    const ratio = ex / n;
    if (n >= 2 && ratio >= 0.85) good.push('运动坚持了 ' + ex + ' 天，' + (n >= 7 ? '几乎没断' : '一天没落下'));
    else if (ratio >= 0.6) good.push('运动 ' + ex + '/' + n + ' 天，节奏稳住了');
    else if (ratio < 0.5) bad.push('运动只做了 ' + ex + '/' + n + ' 天，' + (n >= 7 ? '本周最少要摸到 5 天' : '今天还来得及补一次'));
    if (avgSleep && minutesOf(avgSleep) <= minutesOf('21:40')) good.push('平均 ' + avgSleep + ' 入睡，很到位');
    else if (avgSleep) bad.push('平均 ' + avgSleep + ' 才睡，比目标晚了 ' + Math.round((minutesOf(avgSleep) - minutesOf('21:30'))) + ' 分钟');
    else bad.push('这几天没记入睡时间，睡眠这条就算不了');
    if (mealRate >= 85) good.push('吃饭完成 ' + mealRate + '%，很稳');
    else if (mealDone) bad.push('吃饭完成 ' + mealRate + '%，有几餐漏了');
    if (supRate != null && supRate < 80) bad.push('补剂只完成 ' + supRate + '%，容易漏');
    if (hGain != null && hGain > 0) good.push('这' + (n >= 7 ? '周' : '几天') + '身高 +' + hGain + 'cm');

    const next = [];
    if (ratio < 0.7) next.push(n >= 7 ? '运动补到 5 天，优先挑作业少的那天多跳 200 个' : '今天补一次运动，哪怕只做两组跳绳');
    if (avgSleep && minutesOf(avgSleep) > minutesOf('21:30')) next.push('入睡整体往前挪 ' + (minutesOf(avgSleep) - minutesOf('21:30')) + ' 分钟，先挪 15 分钟也行');
    else if (!avgSleep) next.push('每天记一下实际入睡时间，才知道该调哪');
    if (mealRate < 85) next.push('把漏掉的餐在放学加餐这一顿补上，别让晚饭顶全天');
    if (!hs.length && n >= 7) next.push('周日早上量一次身高体重，曲线才有得看');
    if (!next.length) next.push('保持现在的节奏就行，别加量');

    const r = {
      ws, we: addDays(ws, 6), n, days: n, ex, avgSleep, jump, mealRate, supRate, gh,
      hGain, wGain, good, bad, next, at: Date.now()
    };
    state.reports[key] = r;
    save();
    return r;
  }

  /* ---------------- 买菜清单 ---------------- */
  // 买菜清单分类。原内置表把水果、调味全归到「其他」，这里先纠正，
  // 再补海产菜（后加的，原表里没有）。
  const RE_FRUIT = /(苹果|香蕉|雪梨|香梨|梨|蓝莓|草莓|樱桃|葡萄|橙子|橙|橘子|橘|柑|柚子|猕猴桃|火龙果|芒果|水蜜桃|桃子|李子|西瓜|菠萝|木瓜|哈密瓜|香瓜|牛油果|石榴|荔枝|龙眼|杨梅|枇杷|桑葚|无花果|柿子)/;
  const RE_SEASON = /(盐|白糖|冰糖|红糖|生抽|老抽|酱油|香醋|醋|料酒|淀粉|胡椒粉|黑胡椒|花椒|八角|姜|葱|蒜|香菜|孜然|咖喱|番茄酱|芝麻酱|豆瓣酱|蜂蜜|柠檬|枸杞|红枣|桂圆|酵母|茶叶|干辣椒|香油|蚝油|蒸鱼豉油|温水|清水)/;
  const RE_NUT = /(核桃|杏仁|腰果|开心果|榛子|松子|巴旦木|南瓜子|葵花籽|花生|黑芝麻|白芝麻|坚果)/;
  const RE_SKIP = /^(温水|清水|开水|水|适量)$/;

  function catOf(n) {
    const s = String(n);
    if (SEA.RULES.seaFish.test(s) || SEA.RULES.shrimpCrab.test(s) || SEA.RULES.shellfish.test(s)) return '水产';
    if (RE_FRUIT.test(s)) return '水果';
    if (RE_NUT.test(s)) return '坚果';
    // 洋葱里有「葱」，得先拦一下，否则会被当成调味
    if (/洋葱/.test(s)) return '蔬菜';
    if (RE_SEASON.test(s)) return '调味';
    if (ING_CAT[n]) return ING_CAT[n];
    if (/(冬瓜|萝卜|洋葱|菠菜|番茄|香菇|金针菇|口蘑|豌豆|胡萝卜|娃娃菜|木耳|银耳|黄瓜|生菜|青菜|芥蓝|西葫芦|茄子|芹菜|金针|油麦菜)/.test(s)) return '蔬菜';
    if (/(意面|粉丝|米饭|大米|面粉|馒头|吐司|面包|玉米|红薯|山药|土豆|紫薯|燕麦)/.test(s)) return '主食杂粮';
    if (/(豆腐|香干|豆干|腐竹|豆浆)/.test(s)) return '豆制品';
    if (/(蛋|奶|肉|排骨|鸡|牛|猪|羊|鱼)/.test(s)) return '肉蛋奶';
    return '其他';
  }

  function grocery(ws) {
    const incSchoolLunch = false;
    const map = new Map();
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i);
      const school = cal(d).school;
      for (const m of D.MEAL_SCHOOL) {
        if (school && m.school && !incSchoolLunch) continue;
        for (const dish of dishes(d, m.key)) {
          for (const ing of dish.ingredients || []) {
            const k = ing.name;
            if (RE_SKIP.test(k)) continue;   // 水不用买
            if (!map.has(k)) map.set(k, { name: k, cat: catOf(k), amounts: [] });
            map.get(k).amounts.push(ing.amount);
          }
        }
      }
    }
    const checked = state.groceryChecked[ws] || {};
    const out = [];
    for (const [, v] of map) {
      // 按单位分组累加（半个 = 0.5 个；单位不同的并列）
      const byUnit = new Map();
      let unknown = [];
      for (const a of v.amounts) {
        const m = String(a).trim().match(/^(半|[\d.]+)\s*(.+)$/);
        if (m) {
          const num = m[1] === '半' ? 0.5 : parseFloat(m[1]);
          const u = m[2].trim();
          byUnit.set(u, (byUnit.get(u) || 0) + num);
        } else unknown.push(a);
      }
      let total;
      if (byUnit.size) {
        const parts = Array.from(byUnit.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([u, n]) => (Math.round(n * 100) / 100) + u);
        total = parts.concat(unknown).join(' + ');
      } else {
        total = v.amounts.join(' + ');
      }
      out.push({ name: v.name, cat: v.cat, amount: total, checked: !!checked[v.name] });
    }
    out.sort((a, b) => {
      const ia = D.GROCERY_CATS.findIndex((c) => c.key === a.cat), ib = D.GROCERY_CATS.findIndex((c) => c.key === b.cat);
      return ia - ib || a.name.localeCompare(b.name);
    });
    return out;
  }
  function checkGrocery(ws, name) {
    state.groceryChecked[ws] = state.groceryChecked[ws] || {};
    state.groceryChecked[ws][name] = !state.groceryChecked[ws][name];
    save();
  }

  /* ---------------- 导入导出 ---------------- */
  function exportObj() {
    return { app: 'zhui', v: 1, exportedAt: new Date().toISOString(), data: state };
  }
  function importObj(obj) {
    const d = obj && obj.data ? obj.data : obj;
    if (!d || !d.profile) throw new Error('文件格式不对');
    state = Object.assign(blank(), d);
    save();
  }
  function reset() { state = blank(); save(); }

  return {
    get state() { return state; },
    save, blank, clone,
    today, fmt, parse, addDays, weekStart, dow, WD, cn, cnw, dayOfYear, ageText, minutesOf, minToTime,
    cal, plan, dishes, allDishes, swap, meals, mealDef,
    allergy, dishCats, allergyMarks,
    chk, wchk, setChk, toggleChk, tasks, activeDays,
    heights, addHeight, updateHeight, delHeight, stats, weekReport,
    grocery, checkGrocery, exportObj, importObj, reset,
    get dirty() { return dirty; }
  };
})();
