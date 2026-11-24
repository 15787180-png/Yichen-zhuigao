/* 通用弹层：量身高、运动打卡、入睡记录 */
window.SHEETS = (function () {
  const { esc, ic } = UI;

  /* 记录 / 修改身高。opts.rec 传了就进编辑模式，日期、身高、体重、备注都能改 */
  function measure(date, opts) {
    opts = opts || {};
    const rec = opts.rec || null;
    const last = S.stats().last;
    const d0 = rec ? rec.date : (date || S.today());
    const h0 = rec ? rec.height : (last ? last.height : '');
    const w0 = rec ? (rec.weight != null ? rec.weight : '') : (last && last.weight != null ? last.weight : '');
    const n0 = rec ? (rec.note || '') : '';

    UI.sheet(
      '<div class="sheet-t">' + (rec ? '修改身高记录' : '记录身高体重') + '</div>' +
      '<div class="mini" style="margin:-8px 0 14px">' + (rec ? '日期、身高、体重、备注都能改' : '建议早晨、光脚、同一面墙') + '</div>' +
      '<div class="field"><label>日期</label><input class="inp" id="m-d" type="date" value="' + esc(d0) + '" max="' + esc(S.today()) + '"></div>' +
      '<div class="f2">' +
        '<div class="field"><label>身高 (cm)</label><input class="inp num" id="m-h" type="number" step="0.1" inputmode="decimal" value="' + esc(h0) + '" placeholder="' + (last ? last.height : '118') + '"></div>' +
        '<div class="field"><label>体重 (kg)</label><input class="inp num" id="m-w" type="number" step="0.1" inputmode="decimal" value="' + esc(w0) + '" placeholder="可不填"></div>' +
      '</div>' +
      '<div class="field"><label>备注（可选）</label><input class="inp" id="m-n" value="' + esc(n0) + '" placeholder="比如：早晨量的 / 换了个身高仪"></div>' +
      '<div class="actions"><button class="btn btn-line" data-x="cancel">取消</button><button class="btn btn-pri" data-x="save">' + (rec ? '保存修改' : '保存') + '</button></div>',
      {
        onAct: (b) => {
          if (b.dataset.x === 'cancel') return UI.closeSheet();
          const d = (document.querySelector('#m-d').value || '').trim();
          if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return UI.toast('先把日期选上');
          if (d > S.today()) return UI.toast('日期不能晚于今天');
          const h = parseFloat(document.querySelector('#m-h').value);
          if (!h || h < 60 || h > 200) return UI.toast('身高填 60-200 之间的数字');
          const wRaw = (document.querySelector('#m-w').value || '').trim();
          let w = null;
          if (wRaw) {
            w = parseFloat(wRaw);
            if (!(w >= 10 && w <= 100)) return UI.toast('体重填 10-100，不称就留空');
          }
          const note = document.querySelector('#m-n').value.trim();
          // 换日期时，同一天只留一条：那天原有记录会被这条替换
          const clash = S.state.heights.some((x) => x.date === d && !(rec && x.date === rec.date));
          S.updateHeight(rec ? rec.date : null, { date: d, height: h, weight: w, note: note });
          S.setChk(d, 'measure', true);
          if (rec && rec.date !== d) S.setChk(rec.date, 'measure', false);
          UI.closeSheet();
          UI.toast(rec ? '已更新 ' + S.cn(d) : '已记录 ' + h + 'cm' + (w != null ? ' / ' + w + 'kg' : ''));
          if (clash) setTimeout(() => UI.toast(S.cn(d) + ' 那天原来那条已被覆盖', 2400), 1400);
          App.render();
        }
      }
    );
  }

  function exercise(date) {
    const c = S.chk(date);
    UI.sheet(
      '<div class="sheet-t">运动打卡</div>' +
      '<div class="mini" style="margin:-8px 0 14px">今天跳绳多少个？主方案 5 组 × 200 个</div>' +
      '<div class="field"><label>跳绳个数</label><input class="inp num" id="e-j" type="number" inputmode="numeric" value="' + (c.jumpRope || 1000) + '"></div>' +
      '<div class="field"><label>备注（可选）</label><input class="inp" id="e-n" value="' + esc(c.exerciseNote || '') + '" placeholder="比如：今天只做了两组 / 加了摸高"></div>' +
      '<div class="actions"><button class="btn btn-line" data-x="undo">取消打卡</button><button class="btn btn-pri" data-x="save">完成打卡</button></div>',
      {
        onAct: (b) => {
          if (b.dataset.x === 'undo') {
            S.setChk(date, 'exercise', false);
            UI.closeSheet(); UI.toast('已取消今天的运动打卡'); App.render(); return;
          }
          const j = parseInt(document.querySelector('#e-j').value, 10);
          if (!(j >= 0)) return UI.toast('填个数字');
          S.setChk(date, 'exercise', true);
          S.setChk(date, 'jumpRope', j);
          S.setChk(date, 'exerciseNote', document.querySelector('#e-n').value.trim());
          UI.closeSheet(); UI.toast('打卡完成，' + j + ' 个');
          App.render();
        }
      }
    );
  }

  function sleep(date) {
    const bed = (S.state.profile.sleep && S.state.profile.sleep.bedTime) || '21:30';
    UI.sheet(
      '<div class="sheet-t">实际几点睡的</div>' +
      '<div class="mini" style="margin:-8px 0 14px">目标 ' + esc(bed) + ' 前入睡。记下真实的时间，别记计划的。</div>' +
      '<div class="field"><label>入睡时间</label><input class="inp" id="s-t" type="time" value="' + esc(S.chk(date).sleepTime || bed) + '"></div>' +
      '<div class="actions"><button class="btn btn-line" data-x="cancel">取消</button><button class="btn btn-pri" data-x="save">保存</button></div>',
      {
        onAct: (b) => {
          if (b.dataset.x === 'cancel') return UI.closeSheet();
          const t = document.querySelector('#s-t').value;
          if (!t) return UI.toast('选个时间');
          S.setChk(date, 'sleepTime', t);
          UI.closeSheet();
          const late = S.minutesOf(t) - S.minutesOf(bed);
          UI.toast(late > 0 ? '记下了，比目标晚 ' + late + ' 分钟' : '记下了，比目标早 ' + Math.abs(late) + ' 分钟');
          App.render();
        }
      }
    );
  }

  return { measure, exercise, sleep };
})();
