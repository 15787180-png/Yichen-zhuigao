/* 首页：今日任务 */
window.VHOME = (function () {
  const { esc, ic } = UI;
  let date = null;

  function cur() { return date || S.today(); }

  function title() {
    const d = cur();
    const c = S.cal(d);
    return { t: '追高计划', sub: S.cnw(d) + ' · ' + c.name };
  }

  function pct(d) {
    const ts = S.tasks(d);
    const dn = ts.filter((x) => x.done).length;
    return { done: dn, total: ts.length };
  }

  function render() {
    const d = cur();
    const st = S.stats();
    const c = S.cal(d);
    const ts = S.tasks(d);
    const p = S.state.profile;
    const hs = S.heights();
    const isToday = d === S.today();

    // hero
    const lastH = st.last ? st.last.height : (p.baselineHeight || '—');
    const lastW = st.last ? (st.last.weight != null ? st.last.weight : '') : (p.baselineWeight || '');
    let deltaTxt = '还没有身高记录，先量一次';
    if (st.last) {
      const prev = hs.length >= 2 ? hs[hs.length - 2] : null;
      if (prev) deltaTxt = '比上次（' + S.cn(prev.date) + '）+ ' + (st.last.height - prev.height).toFixed(1) + 'cm';
      else deltaTxt = '首次记录于 ' + S.cn(st.last.date);
    }

    const hero =
      '<div class="hero">' +
        '<span class="tag">' + ic(c.school ? 'home' : 'moon') + (c.school ? '上学日' : c.name) + ' · ' + S.ageText() + '</span>' +
        '<div class="bignum"><b>' + (st.last ? st.last.height.toFixed(1) : (p.baselineHeight || '—')) + '</b><span>cm</span></div>' +
        '<div class="sub">' + esc(deltaTxt) + (lastW ? ' · ' + lastW + 'kg' : '') + '</div>' +
        '<div class="hstats">' +
          '<div class="hs"><i>本月运动</i><b>' + st.exDays + '<span style="font-size:11px;opacity:.8"> 天</span></b></div>' +
          '<div class="hs"><i>本月跳绳</i><b>' + st.jump + '<span style="font-size:11px;opacity:.8"> 个</span></b></div>' +
          '<div class="hs"><i>连续运动</i><b>' + st.streak + '<span style="font-size:11px;opacity:.8"> 天</span></b></div>' +
        '</div>' +
      '</div>';

    // 本周日期条
    const ws = S.weekStart(d);
    let strip = '<div class="card" style="margin:12px 16px 0"><div class="row" style="padding:10px 6px;justify-content:space-between">';
    for (let i = 0; i < 7; i++) {
      const dd = S.addDays(ws, i);
      const pc = pct(dd);
      const all = pc.total && pc.done === pc.total;
      const some = pc.done > 0;
      const sel = dd === d;
      strip += '<button data-act="day" data-d="' + dd + '" style="flex:1;text-align:center;padding:4px 0">' +
        '<div style="font-size:10.5px;color:' + (sel ? 'var(--pri)' : 'var(--ink3)') + '">' + S.WD[S.dow(dd)].slice(1) + '</div>' +
        '<div style="width:30px;height:30px;margin:4px auto 0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;' +
        (sel ? 'background:var(--pri);color:#fff' : all ? 'background:var(--ok-l);color:#1F9C6E' : 'color:var(--ink)') + '">' + S.parse(dd).getDate() + '</div>' +
        '<div style="width:5px;height:5px;border-radius:50%;margin:3px auto 0;background:' + (all ? 'var(--ok)' : some ? 'var(--pri)' : '#DDE7EF') + '"></div>' +
      '</button>';
    }
    strip += '</div></div>';

    // 任务
    const dn = ts.filter((x) => x.done).length;
    let list = '<div class="card" style="margin:12px 16px 0"><div style="padding:12px 14px 6px;display:flex;align-items:center;justify-content:space-between">' +
      '<div style="font-size:14px;font-weight:640">' + (isToday ? '今日任务' : S.cn(d) + ' 的任务') + '</div>' +
      '<div class="mini">' + dn + '/' + ts.length + '</div></div>';
    ts.forEach((t) => {
      const right = t.extra ? '<span class="arr">' + ic('right') + '</span>' : '';
      list += '<div class="task' + (t.done ? ' done' : '') + '" data-act="' + t.act + '"' +
        (t.key ? ' data-key="' + t.key + '"' : '') + ' data-id="' + t.id + '">' +
        '<div class="time num">' + t.time + '</div>' +
        '<div class="ic ' + (t.iconCls || '') + '">' + (t.emoji ? '<span style="font-size:17px;line-height:1">' + t.emoji + '</span>' : ic(t.icon)) + '</div>' +
        '<div class="grow"><div class="tt">' + esc(t.title) + '</div><div class="st">' + esc(t.sub) + '</div></div>' +
        (t.extra ? right : '<div class="tick">' + ic('check') + '</div>') +
      '</div>';
    });
    list += '</div>';

    // 贴士
    const tip = D.TIPS[S.dayOfYear(d) % D.TIPS.length].replace('{bed}', (p.sleep && p.sleep.bedTime) || '21:30');
    const tips = '<div class="note" style="margin:12px 16px 0">' + ic('star') + '<div>' + esc(tip) + '</div></div>';

    // 快捷
    const quick = '<div class="grid2" style="margin:12px 16px 0">' +
      '<button class="btn btn-line" data-act="measure" style="height:46px">' + ic('ruler') + '记录身高体重</button>' +
      '<button class="btn btn-line" data-act="report" style="height:46px">' + ic('chart') + '看本周报告</button>' +
      '</div>';

    return hero + strip + list + quick + tips;
  }

  function act(name, el) {
    const d = el.dataset.d || cur();
    if (name === 'day') { date = el.dataset.d; App.render(); return true; }
    if (name === 'toggle') {
      const k = el.dataset.key;
      const now = S.toggleChk(d, k);
      const tick = el.querySelector('.tick');
      if (tick) { tick.classList.add('pop'); setTimeout(() => tick.classList.remove('pop'), 180); }
      el.classList.toggle('done', now);
      // 局部更新当前任务行文字
      if (el.dataset.id === 'exercise' || el.dataset.id === 'sleep') return true;
      return true;
    }
    if (name === 'exercise') { SHEETS.exercise(d); return true; }
    if (name === 'sleep') { SHEETS.sleep(d); return true; }
    if (name === 'measure') { SHEETS.measure(d); return true; }
    if (name === 'report') { App.go('growth'); return true; }
    return false;
  }

  return {
    title, render, act,
    reset() { date = null; },
    get date() { return cur(); }
  };
})();
