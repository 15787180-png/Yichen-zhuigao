/* 吃：今日菜单 + 本周买菜清单 */
window.VFOOD = (function () {
  const { esc, ic } = UI;
  let tab = 'menu';
  let date = null;
  let ws = null;
  const open = {};

  function cur() { return date || S.today(); }
  function weekCur() { return ws || S.weekStart(S.today()); }

  function title() {
    return { t: '吃', sub: tab === 'menu' ? S.cnw(cur()) : '本周买菜清单' };
  }

  function dishImg(name) {
    for (const r of D.DISH_IMG) if (r.kw.some((k) => name.indexOf(k) >= 0)) return r.url;
    return 'assets/cartoon/dish-vegetables.svg';
  }

  // 食堂指南跟着过敏设置走：不限就鼓励吃海鱼，受限就点名避开
  function lunchTips() {
    const al = S.allergy();
    const sea = al.on && (al.seaFish || al.shrimpCrab || al.shellfish);
    if (!sea) {
      return [
        '优先选鱼虾、鸡蛋、牛奶、瘦肉、豆腐、绿叶菜',
        '每周至少挑 2 次海鱼，DHA 和碘比淡水鱼高',
        '少选油炸、糖醋、含糖饮料和甜点',
        '午餐尽量吃光、荤素搭配'
      ];
    }
    return [
      '优先选鸡蛋、牛奶、瘦肉、鸡腿、淡水鱼、豆腐、绿叶菜',
      '不选海鱼、虾、蟹、贝类及蚝油/海鲜类菜肴',
      '少选油炸、糖醋、含糖饮料和甜点',
      '午餐尽量吃光、荤素搭配'
    ];
  }

  function render() {
    const seg = '<div class="seg" style="margin:10px 16px 0">' +
      '<button class="' + (tab === 'menu' ? 'on' : '') + '" data-act="tab" data-v="menu">今日菜单</button>' +
      '<button class="' + (tab === 'grocery' ? 'on' : '') + '" data-act="tab" data-v="grocery">买菜清单</button></div>';
    return seg + kbEntry() + (tab === 'menu' ? renderMenu() : renderGrocery());
  }

  function kbEntry() {
    return '<div class="kbentry" data-act="kb">' +
      '<span class="em">' + ic('chart') + '</span>' +
      '<div class="tx"><b>配餐知识库</b>' +
      '<span>该追还是该保 · 分阶段吃多少 · 现有菜单体检</span></div>' +
      '<span class="go">' + ic('right') + '</span></div>';
  }

  function renderMenu() {
    const d = cur();
    const c = S.cal(d);
    const ms = S.meals(d);
    const chkd = S.chk(d);
    let h = '<div class="card" style="margin:12px 16px 0"><div class="row between" style="padding:10px 12px">' +
      '<button class="btn btn-sm btn-line" data-act="day" data-d="-1">' + ic('left') + '</button>' +
      '<div style="text-align:center"><div style="font-size:14.5px;font-weight:620">' + S.cnw(d) + '</div>' +
      '<div class="mini" style="margin-top:1px">第 ' + (((S.dayOfYear(d) - 1) % 28) + 1) + ' 天 / 28 天循环 · ' + c.name + '</div></div>' +
      '<button class="btn btn-sm btn-line" data-act="day" data-d="1">' + ic('right') + '</button></div></div>';

    if (c.school) {
      h += '<div class="note" style="margin:12px 16px 0">' + ic('info') + '<div><b>午餐在学校食堂</b>，今天这顿不计入买菜清单。</div></div>';
    }

    ms.forEach((m) => {
      const key = m.chk || m.key;
      const done = !!chkd[key];
      const schoolLunch = c.school && m.school;
      h += '<div class="card" style="margin:12px 16px 0;overflow:hidden">' +
        '<div class="mealhd"><span style="font-size:15px">' + m.emoji + '</span><b>' + m.label + '</b>' +
        '<span class="t">' + m.time + '</span>' +
        '<button data-act="meal" data-key="' + key + '" style="display:flex;align-items:center;margin-left:6px">' +
        '<span class="tick" style="' + (done ? 'background:var(--ok);border-color:var(--ok);color:#fff' : '') + '">' + ic('check') + '</span></button></div>';

      if (schoolLunch) {
        let tips = '<div class="pad-c"><div class="mini" style="margin-bottom:6px">学校食堂就餐指南</div>';
        lunchTips().forEach((t) => { tips += '<div style="font-size:13px;color:var(--ink2);line-height:1.85">· ' + esc(t) + '</div>'; });
        tips += '</div>';
        h += tips;
      } else {
        const list = S.dishes(d, m.key);
        if (!list.length) h += '<div class="pad-c mini">暂无菜品</div>';
        list.forEach((dish, i) => {
          const k = d + '|' + m.key + '|' + i;
          const ings = (dish.ingredients || []).map((x) => x.name + ' ' + x.amount).join(' · ');
          const mk = S.allergyMarks(dish);
          h += '<div class="dish' + (open[k] ? ' open' : '') + '" data-act="expand" data-k="' + k + '">' +
            '<img src="' + dishImg(dish.name) + '" alt="" loading="lazy">' +
            '<div class="grow"><div class="nm">' + esc(dish.name) + (mk.length ? ' <span class="alflag">⚠ 含' + esc(mk.join('、')) + '</span>' : '') + '</div><div class="ing">' + esc(ings) + '</div>' +
            '<div class="steps">' + (dish.steps || []).map((s, n) => '<div>' + (n + 1) + '. ' + esc(s) + '</div>').join('') + '</div></div>' +
            '<div style="align-self:flex-start;display:flex;flex-direction:column;align-items:flex-end;gap:6px">' +
            (i === 0 ? '<button class="pill" data-act="swap" data-k="' + m.key + '">换一道</button>' : '') +
            '<span class="mini" style="font-size:11px">' + (open[k] ? '收起' : '做法') + '</span></div></div>';
        });
      }
      h += '</div>';
    });

    const al = S.allergy();
    const seaBan = al.on && (al.seaFish || al.shrimpCrab || al.shellfish);
    h += '<div class="note ok" style="margin:12px 16px 0">' + ic('star') + '<div><b>今日营养目标</b><br>12 种食物 · 400ml 奶 · 1-2 个鸡蛋。' +
      (seaBan ? '海鲜避让中，水产只走淡水鱼。' : '一周安排 2 次海鱼，DHA 和碘比淡水鱼高。') +
      '记得户外晒太阳，帮身体自己合成维生素 D。</div></div>';
    return h;
  }

  function renderGrocery() {
    const w = weekCur();
    const items = S.grocery(w);
    const school = S.cal(S.today()).school;
    let h = '<div class="card" style="margin:12px 16px 0"><div class="row between" style="padding:10px 12px">' +
      '<button class="btn btn-sm btn-line" data-act="week" data-d="-7">' + ic('left') + '</button>' +
      '<div style="text-align:center"><div style="font-size:14px;font-weight:620">' + S.cn(w) + ' - ' + S.cn(S.addDays(w, 6)) + '</div>' +
      '<div class="mini" style="margin-top:1px">' + (school ? '上学日午餐不计入' : '含全部餐次') + '</div></div>' +
      '<button class="btn btn-sm btn-line" data-act="week" data-d="7">' + ic('right') + '</button></div></div>';

    if (!items.length) {
      h += '<div class="empty"><div class="em">🛒</div>这周清单是空的</div>';
      return h;
    }
    const dn = items.filter((x) => x.checked).length;
    h += '<div class="pad" style="margin-top:12px"><div class="row between"><div class="mini">共 ' + items.length + ' 项，已买 ' + dn + ' 项</div>' +
      '<button class="mini" style="color:var(--pri)" data-act="gall">全部清除勾选</button></div>' +
      '<div style="height:6px;background:#E7EFF6;border-radius:6px;margin-top:8px;overflow:hidden">' +
      '<div style="height:100%;width:' + Math.round((dn / items.length) * 100) + '%;background:var(--ok);border-radius:6px;transition:width .2s"></div></div></div>';

    let lastCat = '';
    h += '<div class="card" style="margin:12px 16px 0">';
    items.forEach((it, i) => {
      if (it.cat !== lastCat) {
        h += '<div style="padding:10px 14px 6px;background:#FAFCFE;border-top:' + (i ? '1px solid var(--line)' : '0') + '">' +
          '<span class="pill ' + (it.cat === '水产' ? '' : 'gray') + '">' + esc((D.GROCERY_CATS.find((c) => c.key === it.cat) || {}).label || it.cat) + '</span></div>';
        lastCat = it.cat;
      }
      h += '<div class="task" data-act="gitem" data-name="' + esc(it.name) + '" style="padding:11px 14px">' +
        '<div style="flex:0 0 auto;max-width:44%"><div class="tt" style="font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' + (it.checked ? 'color:var(--ink3);text-decoration:line-through' : '') + '">' + esc(it.name) + '</div></div>' +
        '<div class="num" style="flex:1 1 auto;font-size:12.5px;color:var(--ink2);text-align:right;line-height:1.45">' + esc(it.amount) + '</div>' +
        '<span class="tick" style="' + (it.checked ? 'background:var(--ok);border-color:var(--ok);color:#fff' : '') + '">' + ic('check') + '</span>' +
      '</div>';
    });
    h += '</div>';
    return h;
  }

  function act(name, el, ev) {
    if (name === 'kb') { App.go('kb'); return true; }
    if (name === 'tab') { tab = el.dataset.v; App.render(); return true; }
    if (name === 'day') {
      const base = cur();
      date = S.addDays(base, parseInt(el.dataset.d, 10));
      App.render(); return true;
    }
    if (name === 'expand') {
      const k = el.dataset.k;
      if (ev && ev.target.closest('[data-act="swap"]')) return true;
      open[k] = !open[k];
      el.classList.toggle('open', open[k]);
      return true;
    }
    if (name === 'swap') {
      S.swap(cur(), el.dataset.k);
      UI.toast('换了一道');
      App.render(); return true;
    }
    if (name === 'meal') {
      S.toggleChk(cur(), el.dataset.key);
      App.render(); return true;
    }
    if (name === 'week') {
      ws = S.addDays(weekCur(), parseInt(el.dataset.d, 10));
      App.render(); return true;
    }
    if (name === 'gitem') {
      S.checkGrocery(weekCur(), el.dataset.name);
      App.render(); return true;
    }
    if (name === 'gall') {
      const w = weekCur();
      const items = S.grocery(w);
      items.forEach((it) => { if (it.checked) S.checkGrocery(w, it.name); });
      App.render(); return true;
    }
    return false;
  }

  return { title, render, act };
})();
