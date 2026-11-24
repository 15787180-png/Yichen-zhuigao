/* 成长：身高曲线、周报、记录 */
window.VGROWTH = (function () {
  const { esc, ic } = UI;
  let weekSel = null;

  function title() { return { t: '成长', sub: '身高曲线与周报' }; }

  function chart() {
    const hs = S.heights();
    if (hs.length < 2) {
      return '<div class="empty"><div class="em">📈</div>' + (hs.length ? '再量一次就能连成曲线了' : '还没有身高记录') +
        '<div style="margin-top:12px"><button class="btn btn-pri btn-sm" data-act="measure">记录身高</button></div></div>';
    }
    const W = 340, H = 176, pl = 32, pr = 14, pt = 16, pb = 26;
    const vals = hs.map((x) => x.height);
    let mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
    if (mx - mn < 0.8) { mn -= 0.4; mx += 0.4; }
    const pad = (mx - mn) * 0.18; mn -= pad; mx += pad;
    const t0 = S.parse(hs[0].date).getTime(), t1 = S.parse(hs[hs.length - 1].date).getTime();
    const span = Math.max(1, t1 - t0);
    const X = (t) => pl + ((t - t0) / span) * (W - pl - pr);
    const Y = (v) => pt + ((mx - v) / (mx - mn)) * (H - pt - pb);

    let g = '';
    for (let i = 0; i <= 3; i++) {
      const v = mn + ((mx - mn) * i) / 3;
      const y = Y(v);
      g += '<line x1="' + pl + '" y1="' + y.toFixed(1) + '" x2="' + (W - pr) + '" y2="' + y.toFixed(1) + '" stroke="#EEF3F8" stroke-width="1"/>' +
        '<text x="' + (pl - 6) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end" font-size="9" fill="#9AACBA">' + v.toFixed(1) + '</text>';
    }
    const pts = hs.map((x) => [X(S.parse(x.date).getTime()), Y(x.height)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - pb) + ' L' + pts[0][0].toFixed(1) + ' ' + (H - pb) + ' Z';
    let dots = '';
    pts.forEach((p, i) => {
      const last = i === pts.length - 1;
      dots += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (last ? 4 : 2.6) + '" fill="#fff" stroke="' + (last ? '#1E9BE0' : '#7FC7EA') + '" stroke-width="' + (last ? 2.6 : 1.8) + '"/>';
    });
    const lastPt = pts[pts.length - 1];
    const lbl = '<text x="' + lastPt[0].toFixed(1) + '" y="' + (lastPt[1] - 10).toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#1682C4">' + hs[hs.length - 1].height.toFixed(1) + '</text>';
    const xl = '<text x="' + pl + '" y="' + (H - 8) + '" font-size="9" fill="#9AACBA">' + S.cn(hs[0].date) + '</text>' +
      '<text x="' + (W - pr) + '" y="' + (H - 8) + '" text-anchor="end" font-size="9" fill="#9AACBA">' + S.cn(hs[hs.length - 1].date) + '</text>';

    return '<div class="chartbox" style="margin:0 16px"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#1E9BE0" stop-opacity=".18"/><stop offset="100%" stop-color="#1E9BE0" stop-opacity="0"/></linearGradient></defs>' +
      g + '<path d="' + area + '" fill="url(#g1)"/>' +
      '<path d="' + line + '" fill="none" stroke="#1E9BE0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      dots + lbl + xl + '</svg></div>';
  }

  function render() {
    const st = S.stats();
    const p = S.state.profile;
    const t = S.today();
    const ws = weekSel || S.weekStart(t);
    const r = S.weekReport(ws);
    const isThis = ws === S.weekStart(t);

    let h = '';
    h += '<div class="grid2" style="margin:10px 16px 0">' +
      '<div class="stat"><i>当前身高</i><b>' + (st.last ? st.last.height.toFixed(1) : (p.baselineHeight || '—')) + '</b><u>cm</u></div>' +
      '<div class="stat"><i>当前体重</i><b>' + (st.last && st.last.weight != null ? st.last.weight.toFixed(1) : '—') + '</b><u>kg</u></div>' +
      '<div class="stat"><i>BMI</i><b>' + (st.bmi || '—') + '</b></div>' +
      '<div class="stat"><i>近 30 天</i><b>' + (st.gain30 == null ? '—' : (st.gain30 > 0 ? '+' : '') + st.gain30) + '</b><u>cm</u></div>' +
      '</div>';

    h += '<div class="sect"><h2>身高曲线</h2><button class="link" data-act="measure">+ 记录</button></div>';
    h += chart();

    // 周报
    h += '<div class="sect"><h2>追高周报</h2><div class="row" style="gap:6px">' +
      '<button class="btn btn-sm btn-line" data-act="wk" data-d="-7" style="width:30px;padding:0">' + ic('left') + '</button>' +
      '<span class="mini">' + S.cn(ws) + ' - ' + S.cn(S.addDays(ws, 6)) + '</span>' +
      '<button class="btn btn-sm btn-line" data-act="wk" data-d="7" style="width:30px;padding:0"' + (isThis ? ' disabled' : '') + '>' + ic('right') + '</button>' +
      '</div></div>';

    h += '<div class="card" style="margin:0 16px"><div class="pad-c">';
    h += '<div class="row" style="gap:8px;margin-bottom:10px">' +
      '<span class="pill">运动 ' + r.ex + '/' + r.days + ' 天</span>' +
      '<span class="pill ' + (r.mealRate >= 85 ? 'ok' : 'warn') + '">吃饭 ' + r.mealRate + '%</span>' +
      (r.avgSleep ? '<span class="pill gray">入睡 ' + r.avgSleep + '</span>' : '<span class="pill gray">没记录入睡</span>') +
      '</div>';
    h += '<div class="kv"><span class="k">本周跳绳</span><span class="v">' + r.jump + ' 个</span></div>';
    if (r.hGain != null) h += '<div class="kv"><span class="k">身高变化</span><span class="v">' + (r.hGain > 0 ? '+' : '') + r.hGain + ' cm</span></div>';
    if (r.supRate != null) h += '<div class="kv"><span class="k">补剂完成</span><span class="v">' + r.supRate + '%</span></div>';
    if (r.gh) h += '<div class="kv"><span class="k">生长激素</span><span class="v">本周注射 ' + r.gh + ' 次</span></div>';
    h += '</div>';

    if (r.good.length) {
      h += '<div style="border-top:1px solid var(--line);padding:12px 14px">';
      h += '<div style="font-size:12.5px;font-weight:640;color:#1F9C6E;margin-bottom:5px">做得好的</div>';
      r.good.forEach((x) => { h += '<div style="font-size:13px;color:var(--ink2);line-height:1.85">· ' + esc(x) + '</div>'; });
      h += '</div>';
    }
    if (r.bad.length) {
      h += '<div style="border-top:1px solid var(--line);padding:12px 14px">';
      h += '<div style="font-size:12.5px;font-weight:640;color:#C9821D;margin-bottom:5px">要补的</div>';
      r.bad.forEach((x) => { h += '<div style="font-size:13px;color:var(--ink2);line-height:1.85">· ' + esc(x) + '</div>'; });
      h += '</div>';
    }
    h += '<div style="border-top:1px solid var(--line);padding:12px 14px;background:#FAFCFE">';
    h += '<div style="font-size:12.5px;font-weight:640;color:var(--pri-d);margin-bottom:5px">下周就做这几件</div>';
    r.next.forEach((x) => { h += '<div style="font-size:13px;color:var(--ink);line-height:1.85">· ' + esc(x) + '</div>'; });
    h += '</div></div>';

    h += '<div class="note" style="margin:12px 16px 0">' + ic('info') + '<div>周报是按你的打卡记录算出来的，只做参考，最终以主治医生意见为准。</div></div>';

    // 记录
    const hs = S.heights().reverse().slice(0, 10);
    h += '<div class="sect"><h2>身高记录</h2><span class="mini">共 ' + S.heights().length + ' 次 · 点一条改</span></div>';
    if (!hs.length) h += '<div class="empty">还没有记录</div>';
    else {
      h += '<div class="card" style="margin:0 16px">';
      hs.forEach((x, i) => {
        h += '<div class="task" data-act="edit" data-d="' + x.date + '" style="padding:11px 14px;cursor:pointer">' +
          '<div class="grow"><div class="tt" style="font-size:14px">' + S.cn(x.date) + '</div>' +
          '<div class="st">' + (x.note ? esc(x.note) : (i === 0 ? '最近一次' : '点一下可以改')) + '</div></div>' +
          '<div class="num" style="font-size:14px;font-weight:600">' + x.height.toFixed(1) + '<span class="mini">cm</span></div>' +
          '<div class="num" style="font-size:13px;color:var(--ink2);width:56px;text-align:right">' + (x.weight != null ? x.weight.toFixed(1) + '<span class="mini">kg</span>' : '<span class="mini">—</span>') + '</div>' +
          '<button data-act="edit" data-d="' + x.date + '" style="color:var(--ink3);padding:2px" aria-label="修改">' + ic('edit') + '</button>' +
          '<button data-act="del" data-d="' + x.date + '" style="color:var(--ink3);padding:2px" aria-label="删除">' + ic('trash') + '</button></div>';
      });
      h += '</div>';
    }
    return h;
  }

  function act(name, el) {
    if (name === 'measure') { SHEETS.measure(S.today()); return true; }
    if (name === 'edit') {
      const d = el.dataset.d;
      const rec = S.heights().find((x) => x.date === d);
      if (!rec) { UI.toast('这条记录找不到了'); App.render(); return true; }
      SHEETS.measure(d, { rec: rec });
      return true;
    }
    if (name === 'wk') {
      const base = weekSel || S.weekStart(S.today());
      const next = S.addDays(base, parseInt(el.dataset.d, 10));
      if (next > S.weekStart(S.today())) return true;
      weekSel = next; App.render(); return true;
    }
    if (name === 'del') {
      const d = el.dataset.d;
      UI.confirm('删掉这条记录？', d + ' 的身高体重会被删除，曲线也会跟着变。', '删除').then((ok) => {
        if (!ok) return;
        S.delHeight(d); App.render(); UI.toast('已删除');
      });
      return true;
    }
    return false;
  }

  return { title, render, act };
})();
