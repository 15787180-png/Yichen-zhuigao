/* 我的：档案、补剂、时间表、医疗、校历、数据备份 */
window.VME = (function () {
  const { esc, ic } = UI;
  const p = () => S.state.profile;

  // 一句话概括过敏设置，给档案页用
  function alSummary() {
    const a = S.allergy();
    if (!a.on) return '不避让';
    const on = ['seaFish', 'shrimpCrab', 'shellfish', 'algae'].filter((k) => a[k]).map((k) => SEA.LABEL[k]);
    const extra = a.other ? '，' + a.other : '';
    return on.length ? '避让 ' + on.join('、') + extra : '已启用，未勾选' + extra;
  }

  function title() { return { t: '我的', sub: p().name + ' · ' + S.ageText() }; }

  function row(icon, t, sub, act, right, cls) {
    return '<div class="task" data-act="' + act + '" style="padding:12px 14px">' +
      '<div class="ic ' + (cls || '') + '">' + ic(icon) + '</div>' +
      '<div class="grow"><div class="tt">' + esc(t) + '</div>' + (sub ? '<div class="st">' + esc(sub) + '</div>' : '') + '</div>' +
      (right != null ? right : '<span class="arr">' + ic('right') + '</span>') +
      '</div>';
  }

  function render() {
    const pr = p();
    const sup = S.state.supplements;
    const med = S.state.medical;
    const st = S.stats();
    let h = '';

    // 档案
    h += '<div class="card" style="margin:10px 16px 0"><div class="pad-c row" style="gap:14px">' +
      '<div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#39B4ED,#1E9BE0);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700">' + esc(pr.name.slice(-1)) + '</div>' +
      '<div class="grow"><div style="font-size:16px;font-weight:650">' + esc(pr.nickname || pr.name) + '</div>' +
      '<div class="mini" style="margin-top:2px">' + S.ageText() + ' · ' + pr.birthDate + ' · ' + (pr.gender === 'boy' ? '男孩' : '女孩') + '</div></div>' +
      '<button class="btn btn-sm btn-line" data-act="profile">编辑</button></div></div>';

    h += '<div class="grid2" style="margin:12px 16px 0">' +
      '<div class="stat"><i>身高记录</i><b>' + st.count + '</b><u>次</u></div>' +
      '<div class="stat"><i>打卡天数</i><b>' + S.activeDays() + '</b><u>天</u></div></div>';

    // 补剂
    h += '<div class="sect"><h2>补剂</h2></div><div class="card" style="margin:0 16px">';
    h += '<div class="task" data-act="sup" data-k="vd" style="padding:12px 14px"><div class="ic ok">' + ic('pill') + '</div>' +
      '<div class="grow"><div class="tt">维生素 D</div><div class="st">' + (sup.vd.on ? (sup.vd.dose || '已开启') + ' · ' + sup.vd.time : '未开启') + '</div></div>' +
      '<span class="switch ' + (sup.vd.on ? 'on' : '') + '" data-x="1"></span></div>';
    h += '<div class="task" data-act="sup" data-k="ca" style="padding:12px 14px"><div class="ic ok">' + ic('pill') + '</div>' +
      '<div class="grow"><div class="tt">钙</div><div class="st">' + (sup.ca.on ? (sup.ca.dose || '已开启') + ' · ' + sup.ca.time : '未开启') + '</div></div>' +
      '<span class="switch ' + (sup.ca.on ? 'on' : '') + '" data-x="1"></span></div>';
    h += '</div>';

    // 饮食与过敏
    const al = S.allergy();
    const onList = ['seaFish', 'shrimpCrab', 'shellfish', 'algae'].filter((k) => al[k]).map((k) => SEA.LABEL[k]);
    h += '<div class="sect"><h2>饮食与过敏</h2></div><div class="card" style="margin:0 16px">';
    h += row('bowl', '过敏原设置', al.on ? (onList.length ? '菜单避让：' + onList.join('、') : '已启用，但没勾任何一项') : '不避让 · 海鱼、虾蟹、贝类都会进菜单', 'allergy', null, al.on ? 'acc' : 'ok');
    h += '</div>';

    // 医疗
    h += '<div class="sect"><h2>医疗档案</h2><span class="mini">' + med.reports.length + ' 份报告 · ' + med.visits.filter((v) => !v.done).length + ' 次待复诊</span></div><div class="card" style="margin:0 16px">';
    h += row('camera', '拍病历 / 化验单', '拍照自动识别身高、骨龄、IGF-1 等', 'report-new', null, 'acc');
    h += row('cal', '复诊日程', med.visits.filter((v) => !v.done).length ? '下次 ' + S.cn((med.visits.filter((v) => !v.done).sort((a, b) => a.date.localeCompare(b.date))[0]).date) : '还没有安排', 'visits');
    if (med.reports.length) h += row('file', '报告档案', med.reports.length + ' 份，最近 ' + S.cn(med.reports[0].date || S.today()), 'reports');
    h += '</div>';

    // 时间表
    h += '<div class="sect"><h2>作息与时间表</h2></div><div class="card" style="margin:0 16px">';
    h += row('moon', '作息时间', '起床 ' + ((pr.sleep && pr.sleep.wakeTime) || '06:50') + ' · 上床 ' + ((pr.sleep && pr.sleep.bedTime) || '21:30') + ' · 运动 ' + ((pr.sleep && pr.sleep.exerciseTime) || '18:00'), 'time');
    h += row('syringe', '注射安排', '每周' + ({ sunday: '日', monday: '一', tuesday: '二', wednesday: '三', thursday: '四', friday: '五', saturday: '六' }[pr.ghDay] || '三') + ' ' + (pr.ghTime || '18:00'), 'gh');
    h += '</div>';

    // 校历
    h += '<div class="sect"><h2>校历</h2><span class="mini">今天是' + S.cal(S.today()).name + '</span></div><div class="card" style="margin:0 16px">';
    h += row('cal', '自定义假期 / 调休', '学校临时放假、调休上课，加在这里', 'cal');
    h += '</div>';

    // 数据
    const net = S.state.settings;
    h += '<div class="sect"><h2>数据</h2></div><div class="card" style="margin:0 16px">';
    h += row('cloud', '云端备份', net.cloudOn ? '已开启' + (net.lastBackupAt ? ' · 上次 ' + new Date(net.lastBackupAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '') : '关着，数据只在这台设备上', 'backup', null, net.cloudOn ? 'ok' : '');
    h += row('download', '导出数据', '存成 JSON 文件，换手机或留个底', 'export');
    h += row('upload', '导入数据', '从 JSON 文件恢复', 'import');
    h += '</div>';

    h += '<div class="note warn" style="margin:12px 16px 0">' + ic('alert') + '<div><b>免责声明</b><br>这个应用只是帮你记录和算账，不是医疗器械，也不能代替医生。任何调整（补剂、运动量、用药）都先问主治医生。</div></div>';
    h += '<div class="mini" style="text-align:center;margin:16px 0 4px">本机优先存储 · 数据不经过任何第三方 · 版本 1118e</div>';
    return h;
  }

  /* ---------------- 弹层 ---------------- */

  function profileSheet() {
    const pr = p();
    const sl = pr.sleep || {};
    UI.sheet(
      '<div class="sheet-t">孩子档案</div>' +
      '<div class="f2"><div class="field"><label>姓名</label><input class="inp" id="p-name" value="' + esc(pr.name) + '"></div>' +
      '<div class="field"><label>小名</label><input class="inp" id="p-nick" value="' + esc(pr.nickname || '') + '"></div></div>' +
      '<div class="f2"><div class="field"><label>出生日期</label><input class="inp" id="p-birth" type="date" value="' + esc(pr.birthDate) + '"></div>' +
      '<div class="field"><label>性别</label><select class="inp" id="p-sex"><option value="boy"' + (pr.gender === 'boy' ? ' selected' : '') + '>男孩</option><option value="girl"' + (pr.gender === 'girl' ? ' selected' : '') + '>女孩</option></select></div></div>' +
      '<div class="f2"><div class="field"><label>基线身高 (cm)</label><input class="inp num" id="p-bh" type="number" step="0.1" value="' + (pr.baselineHeight || '') + '"></div>' +
      '<div class="field"><label>基线体重 (kg)</label><input class="inp num" id="p-bw" type="number" step="0.1" value="' + (pr.baselineWeight || '') + '"></div></div>' +
      '<div class="field"><label>骨龄偏移（年，偏小填负数）</label><input class="inp num" id="p-bone" type="number" step="0.1" value="' + (pr.boneAgeOffset == null ? '' : pr.boneAgeOffset) + '"></div>' +
      '<div class="field"><label>疾病背景</label><input class="inp" id="p-disease" value="' + esc(pr.diseaseBackground || '') + '"></div>' +
      '<div class="field"><label>就诊医院</label><input class="inp" id="p-hos" value="' + esc(pr.hospital || '') + '"></div>' +
      '<div class="field"><label>治疗情况</label><textarea class="inp" id="p-treat">' + esc(pr.treatmentInfo || '') + '</textarea></div>' +
      '<div class="field"><label>饮食情况</label><input class="inp" id="p-diet" value="' + esc(pr.dietInfo || '') + '"></div>' +
      '<div class="field"><label>运动情况</label><input class="inp" id="p-ex" value="' + esc(pr.exerciseInfo || '') + '"></div>' +
      '<div class="field"><label>过敏</label><div class="inp" style="background:#F7FAFD;color:var(--ink2);display:flex;align-items:center;justify-content:space-between;min-height:38px"><span>' + esc(alSummary()) + '</span><span class="mini" style="color:var(--pri)">在「过敏原设置」改</span></div></div>' +
      '<div class="actions"><button class="btn btn-line" data-x="cancel">取消</button><button class="btn btn-pri" data-x="save">保存</button></div>',
      {
        onAct: (b) => {
          if (b.dataset.x === 'cancel') return UI.closeSheet();
          const q = (id) => document.querySelector(id).value.trim();
          const pr2 = S.state.profile;
          pr2.name = q('#p-name') || pr2.name;
          pr2.nickname = q('#p-nick');
          pr2.birthDate = q('#p-birth') || pr2.birthDate;
          pr2.gender = q('#p-sex');
          pr2.baselineHeight = parseFloat(q('#p-bh')) || pr2.baselineHeight;
          pr2.baselineWeight = parseFloat(q('#p-bw')) || pr2.baselineWeight;
          const bo = parseFloat(q('#p-bone'));
          pr2.boneAgeOffset = isNaN(bo) ? pr2.boneAgeOffset : bo;
          pr2.diseaseBackground = q('#p-disease');
          pr2.hospital = q('#p-hos');
          pr2.treatmentInfo = q('#p-treat');
          pr2.dietInfo = q('#p-diet');
          pr2.exerciseInfo = q('#p-ex');
          S.save(); UI.closeSheet(); UI.toast('档案已保存'); App.render();
        }
      }
    );
  }

  function supSheet(k) {
    const s = S.state.supplements[k];
    const label = k === 'vd' ? '维生素 D' : '钙';
    UI.sheet(
      '<div class="sheet-t">' + label + '</div>' +
      '<div class="task" style="padding:0 0 14px"><div class="grow"><div class="tt">是否服用</div></div><span class="switch ' + (s.on ? 'on' : '') + '" id="s-on"></span></div>' +
      '<div class="f2"><div class="field"><label>剂量</label><input class="inp" id="s-dose" value="' + esc(s.dose || '') + '" placeholder="比如 800IU / 300mg"></div>' +
      '<div class="field"><label>服用时间</label><input class="inp" id="s-time" type="time" value="' + esc(s.time) + '"></div></div>' +
      '<div class="actions"><button class="btn btn-line" data-x="cancel">取消</button><button class="btn btn-pri" data-x="save">保存</button></div>',
      {
        onAct: (b) => {
          if (b.dataset.x === 'cancel') return UI.closeSheet();
          const on = document.querySelector('#s-on').classList.contains('on');
          S.state.supplements[k] = { on: on, dose: document.querySelector('#s-dose').value.trim(), time: document.querySelector('#s-time').value || s.time };
          S.save(); UI.closeSheet(); App.render();
        }
      }
    );
    document.querySelector('#s-on').addEventListener('click', function () { this.classList.toggle('on'); });
  }

  function timeSheet() {
    const sl = p().sleep || {};
    UI.sheet(
      '<div class="sheet-t">作息时间</div>' +
      '<div class="f2"><div class="field"><label>起床</label><input class="inp" id="t-wake" type="time" value="' + esc(sl.wakeTime || '06:50') + '"></div>' +
      '<div class="field"><label>目标上床</label><input class="inp" id="t-bed" type="time" value="' + esc(sl.bedTime || '21:30') + '"></div></div>' +
      '<div class="f2"><div class="field"><label>实际通常入睡</label><input class="inp" id="t-act" type="time" value="' + esc(sl.actualBedtime || '22:00') + '"></div>' +
      '<div class="field"><label>运动时间</label><input class="inp" id="t-ex" type="time" value="' + esc(sl.exerciseTime || '18:00') + '"></div></div>' +
      '<div class="field"><label>放学时间</label><input class="inp" id="t-out" type="time" value="' + esc(sl.schoolOutTime || '17:30') + '"></div>' +
      '<div class="actions"><button class="btn btn-line" data-x="cancel">取消</button><button class="btn btn-pri" data-x="save">保存</button></div>',
      {
        onAct: (b) => {
          if (b.dataset.x === 'cancel') return UI.closeSheet();
          const q = (id) => document.querySelector(id).value;
          S.state.profile.sleep = { wakeTime: q('#t-wake'), bedTime: q('#t-bed'), actualBedtime: q('#t-act'), exerciseTime: q('#t-ex'), schoolOutTime: q('#t-out') };
          S.save(); UI.closeSheet(); App.render();
        }
      }
    );
  }

  function ghSheet() {
    const pr = p();
    const days = [['monday', '周一'], ['tuesday', '周二'], ['wednesday', '周三'], ['thursday', '周四'], ['friday', '周五'], ['saturday', '周六'], ['sunday', '周日']];
    let opts = days.map((d) => '<option value="' + d[0] + '"' + (pr.ghDay === d[0] ? ' selected' : '') + '>' + d[1] + '</option>').join('');
    UI.sheet(
      '<div class="sheet-t">注射安排</div>' +
      '<div class="f2"><div class="field"><label>每周</label><select class="inp" id="g-day">' + opts + '</select></div>' +
      '<div class="field"><label>时间</label><input class="inp" id="g-time" type="time" value="' + esc(pr.ghTime || '18:00') + '"></div></div>' +
      '<div class="note" style="margin-bottom:6px">' + ic('info') + '<div>只影响任务提醒和记录，剂量和部位一律按医生说的来。</div></div>' +
      '<div class="actions"><button class="btn btn-line" data-x="cancel">取消</button><button class="btn btn-pri" data-x="save">保存</button></div>',
      {
        onAct: (b) => {
          if (b.dataset.x === 'cancel') return UI.closeSheet();
          S.state.profile.ghDay = document.querySelector('#g-day').value;
          S.state.profile.ghTime = document.querySelector('#g-time').value;
          S.save(); UI.closeSheet(); App.render();
        }
      }
    );
  }

  /* ---------- 医疗 ---------- */
  function visitsSheet() {
    const vs = S.state.medical.visits.slice().sort((a, b) => a.date.localeCompare(b.date));
    let list = '';
    if (!vs.length) list = '<div class="empty" style="padding:20px">还没有复诊安排</div>';
    vs.forEach((v) => {
      list += '<div class="task" style="padding:11px 0">' +
        '<div class="grow"><div class="tt" style="font-size:14px;' + (v.done ? 'color:var(--ink3);text-decoration:line-through' : '') + '">' + S.cn(v.date) + ' ' + esc(v.type || '复诊') + '</div>' +
        '<div class="st">' + esc(v.hospital || '') + (v.note ? ' · ' + esc(v.note) : '') + '</div></div>' +
        '<button class="btn btn-sm btn-line" data-x="done" data-id="' + v.id + '">' + (v.done ? '恢复' : '完成') + '</button>' +
        '<button style="color:var(--ink3);padding:4px" data-x="del" data-id="' + v.id + '">' + ic('trash') + '</button></div>';
    });
    UI.sheet(
      '<div class="sheet-t">复诊日程</div>' + list +
      '<div class="hr"></div>' +
      '<div class="f2"><div class="field"><label>日期</label><input class="inp" id="v-date" type="date" value="' + S.addDays(S.today(), 90) + '"></div>' +
      '<div class="field"><label>类型</label><input class="inp" id="v-type" value="常规复诊" placeholder="常规复诊 / 骨龄复查 / 抽血"></div></div>' +
      '<div class="field"><label>医院</label><input class="inp" id="v-hos" value="' + esc(p().hospital || '') + '"></div>' +
      '<div class="field"><label>要问医生的问题</label><input class="inp" id="v-note" placeholder="比如：这次能不能减量 / 下次骨龄什么时候查"></div>' +
      '<div class="actions"><button class="btn btn-line" data-x="close">关闭</button><button class="btn btn-pri" data-x="add">添加</button></div>',
      {
        onAct: (b) => {
          const x = b.dataset.x;
          if (x === 'close') return UI.closeSheet();
          if (x === 'add') {
            const date = document.querySelector('#v-date').value;
            if (!date) return UI.toast('选个日期');
            S.state.medical.visits.push({
              id: Date.now() + '', date: date,
              type: document.querySelector('#v-type').value.trim() || '复诊',
              hospital: document.querySelector('#v-hos').value.trim(),
              note: document.querySelector('#v-note').value.trim(), done: false
            });
            S.save(); visitsSheet(); App.render(); return;
          }
          const id = b.dataset.id;
          if (x === 'del') S.state.medical.visits = S.state.medical.visits.filter((v) => v.id !== id);
          if (x === 'done') S.state.medical.visits.forEach((v) => { if (v.id === id) v.done = !v.done; });
          S.save(); visitsSheet(); App.render();
        }
      }
    );
  }

  function reportSheet(r) {
    const isNew = !r;
    r = r || { id: Date.now() + '', date: S.today(), type: '化验单', title: '', ex: {}, note: '', thumb: '' };
    const ex = r.ex || {};
    const fld = (id, label, val, ph) => '<div class="field"><label>' + label + '</label><input class="inp" id="' + id + '" value="' + esc(val || '') + '" placeholder="' + (ph || '') + '"></div>';
    UI.sheet(
      '<div class="sheet-t">' + (isNew ? '拍病历' : '报告详情') + '</div>' +
      (isNew ? '<label class="btn btn-ghost btn-block" style="height:44px;margin-bottom:10px">' + ic('camera') + ' 拍照 或 从相册选<input type="file" id="r-file" accept="image/*" style="display:none"></label>' +
        '<div id="r-prev" class="mini" style="text-align:center;margin-bottom:8px">支持化验单、骨龄报告、心超单</div>' : '') +
      '<div class="f2"><div class="field"><label>日期</label><input class="inp" id="r-date" type="date" value="' + esc(r.date) + '"></div>' +
      '<div class="field"><label>类型</label><input class="inp" id="r-type" value="' + esc(r.type) + '" placeholder="化验单 / 骨龄 / 心超"></div></div>' +
      '<div class="field"><label>标题</label><input class="inp" id="r-title" value="' + esc(r.title) + '" placeholder="比如：10月复查"></div>' +
      '<div class="f2">' + fld('r-h', '身高 cm', ex.height) + fld('r-w', '体重 kg', ex.weight) + '</div>' +
      '<div class="f2">' + fld('r-bone', '骨龄 岁', ex.bone_age) + fld('r-igf', 'IGF-1', ex.igf1) + '</div>' +
      fld('r-thy', '甲功', ex.thyroid) +
      fld('r-glu', '血糖', ex.glucose) +
      fld('r-echo', '心超结论', ex.echo) +
      '<div class="field"><label>备注</label><input class="inp" id="r-note" value="' + esc(r.note) + '"></div>' +
      '<div class="actions">' +
        (isNew ? (window.Cloud && Cloud.enabled ? '<button class="btn btn-line" data-x="ai">' + ic('star') + '自动识别</button>' : '') : '<button class="btn btn-danger" data-x="del">删除</button>') +
        '<button class="btn btn-pri" data-x="save">保存</button></div>',
      {
        onAct: async (b) => {
          const x = b.dataset.x;
          if (x === 'del') {
            UI.closeSheet();
            const ok = await UI.confirm('删掉这份报告？', '识别出来的数据也会一起删掉。', '删除');
            if (ok) { S.state.medical.reports = S.state.medical.reports.filter((z) => z.id !== r.id); S.save(); App.render(); }
            return;
          }
          if (x === 'ai') {
            if (!picked) return UI.toast('先拍一张或选一张图');
            b.innerHTML = '识别中…'; b.setAttribute('disabled', '1');
            try {
              const res = await Cloud.extractReport(picked);
              const d = res.data || {};
              const set = (id, v) => { if (v) document.querySelector(id).value = v; };
              set('#r-h', d.height); set('#r-w', d.weight); set('#r-bone', d.bone_age); set('#r-igf', d.igf1);
              set('#r-thy', d.thyroid); set('#r-glu', d.glucose); set('#r-echo', d.echo);
              if (d.report_date) document.querySelector('#r-date').value = d.report_date;
              if (d.hospital && !document.querySelector('#r-note').value) document.querySelector('#r-note').value = d.hospital;
              if (!document.querySelector('#r-title').value) document.querySelector('#r-title').value = ((d.hospital || '') + ' ' + (document.querySelector('#r-type').value || '')).trim();
              thumb = await makeThumb(res.image);
              UI.toast('识别完了，核对一下再保存');
            } catch (err) {
              UI.toast(err.message || '识别失败，手动填吧');
            } finally {
              b.innerHTML = '重新识别'; b.removeAttribute('disabled');
            }
            return;
          }
          if (x === 'save') {
            const q = (id) => document.querySelector(id).value.trim();
            const obj = {
              id: r.id, date: q('#r-date') || S.today(), type: q('#r-type'), title: q('#r-title'),
              ex: { height: q('#r-h'), weight: q('#r-w'), bone_age: q('#r-bone'), igf1: q('#r-igf'), thyroid: q('#r-thy'), glucose: q('#r-glu'), echo: q('#r-echo') },
              note: q('#r-note'), thumb: thumb || r.thumb || ''
            };
            const i = S.state.medical.reports.findIndex((z) => z.id === obj.id);
            if (i >= 0) S.state.medical.reports[i] = obj; else S.state.medical.reports.unshift(obj);
            S.state.medical.reports.sort((a, b2) => b2.date.localeCompare(a.date));
            S.save(); UI.closeSheet(); UI.toast('报告已存'); App.render();
          }
        }
      }
    );
    let picked = null, thumb = '';
    const fileEl = document.querySelector('#r-file');
    if (fileEl) fileEl.addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      picked = f;
      document.querySelector('#r-prev').innerHTML = '<img src="' + URL.createObjectURL(f) + '" style="max-width:100%;border-radius:12px;max-height:180px">';
    });
  }

  function makeThumb(dataUrl) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, 380 / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        res(cv.toDataURL('image/jpeg', 0.55));
      };
      img.onerror = () => res('');
      img.src = dataUrl;
    });
  }

  function reportsSheet() {
    const rs = S.state.medical.reports;
    let h = '<div class="sheet-t">报告档案</div>';
    if (!rs.length) h += '<div class="empty" style="padding:20px">还没有报告</div>';
    rs.forEach((r) => {
      h += '<div class="task" data-x="open" data-id="' + r.id + '" style="padding:11px 0">' +
        (r.thumb ? '<img src="' + r.thumb + '" style="width:40px;height:40px;border-radius:9px;object-fit:cover">' : '<div class="ic">' + ic('file') + '</div>') +
        '<div class="grow"><div class="tt" style="font-size:14px">' + esc(r.title || r.type) + '</div>' +
        '<div class="st">' + S.cn(r.date) + (r.ex && r.ex.height ? ' · ' + r.ex.height + 'cm' : '') + (r.ex && r.ex.bone_age ? ' · 骨龄' + r.ex.bone_age : '') + '</div></div>' +
        '<span class="arr">' + ic('right') + '</span></div>';
    });
    h += '<div class="actions"><button class="btn btn-line" data-x="close">关闭</button></div>';
    UI.sheet(h, {
      onAct: (b) => {
        if (b.dataset.x === 'close') return UI.closeSheet();
        if (b.dataset.x === 'open') {
          const r = S.state.medical.reports.find((z) => z.id === b.dataset.id);
          if (r) reportSheet(r);
        }
      }
    });
  }

  /* ---------- 校历 ---------- */
  function calSheet() {
    const c = S.state.cal;
    let h = '<div class="sheet-t">校历自定义</div><div class="mini" style="margin:-8px 0 12px">学校的临时放假、调休上课日，加进来任务和菜单就会跟着变。</div>';
    const all = []
      .concat(c.addVacations.map((v) => ({ k: 'v', id: v.start, txt: v.start + ' ~ ' + v.end + ' ' + (v.name || '假期') })))
      .concat(c.addHolidays.map((v) => ({ k: 'h', id: v.date, txt: v.date + ' ' + (v.name || '放假') })))
      .concat(c.addMakeup.map((v) => ({ k: 'm', id: v.date, txt: v.date + ' ' + (v.name || '调休上课') })));
    if (!all.length) h += '<div class="empty" style="padding:16px">还没有自定义</div>';
    all.forEach((x) => {
      h += '<div class="task" style="padding:10px 0"><div class="grow"><div class="tt" style="font-size:13.5px">' + esc(x.txt) + '</div></div>' +
        '<button style="color:var(--ink3)" data-x="del" data-k="' + x.k + '" data-id="' + x.id + '">' + ic('trash') + '</button></div>';
    });
    h += '<div class="hr"></div>' +
      '<div class="field"><label>类型</label><select class="inp" id="c-kind"><option value="h">放假（一天）</option><option value="m">调休上课（周末要上学）</option><option value="v">连续假期</option></select></div>' +
      '<div class="f2"><div class="field"><label>开始</label><input class="inp" id="c-d1" type="date" value="' + S.today() + '"></div>' +
      '<div class="field"><label>结束（单日不用填）</label><input class="inp" id="c-d2" type="date"></div></div>' +
      '<div class="field"><label>名称</label><input class="inp" id="c-name" placeholder="比如：运动会放假 / 秋假"></div>' +
      '<div class="actions"><button class="btn btn-line" data-x="close">关闭</button><button class="btn btn-pri" data-x="add">添加</button></div>';
    UI.sheet(h, {
      onAct: (b) => {
        const x = b.dataset.x;
        if (x === 'close') return UI.closeSheet();
        if (x === 'del') {
          const k = b.dataset.k, id = b.dataset.id;
          if (k === 'v') c.addVacations = c.addVacations.filter((v) => v.start !== id);
          if (k === 'h') c.addHolidays = c.addHolidays.filter((v) => v.date !== id);
          if (k === 'm') c.addMakeup = c.addMakeup.filter((v) => v.date !== id);
          S.save(); calSheet(); return;
        }
        if (x === 'add') {
          const kind = document.querySelector('#c-kind').value;
          const d1 = document.querySelector('#c-d1').value;
          const d2 = document.querySelector('#c-d2').value || d1;
          const name = document.querySelector('#c-name').value.trim();
          if (!d1) return UI.toast('选个日期');
          if (kind === 'h') c.addHolidays.push({ date: d1, name: name || '放假' });
          if (kind === 'm') c.addMakeup.push({ date: d1, name: name || '调休上课' });
          if (kind === 'v') c.addVacations.push({ start: d1, end: d2, name: name || '假期' });
          S.save(); calSheet(); App.render();
        }
      }
    });
  }

  /* ---------- 数据 / 备份 ---------- */
  function exportFile() {
    const obj = S.exportObj();
    const blob = new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '追高计划-' + S.today() + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    UI.toast('已导出，在手机的文件里找');
  }

  function importFile() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const fr = new FileReader();
      fr.onload = async () => {
        try {
          const obj = JSON.parse(fr.result);
          const ok = await UI.confirm('导入会覆盖本机数据', '现在这台设备上的记录会被文件里的替换掉。建议先导出一次备份。', '继续导入');
          if (!ok) return;
          S.importObj(obj);
          UI.toast('导入完成'); App.render();
        } catch (e) { UI.toast('文件读不出来，确认是导出的 JSON'); }
      };
      fr.readAsText(f);
    };
    inp.click();
  }

  async function backupSheet() {
    const st = S.state.settings;
    let sess = null;
    if (!window.WorkBuddyCloud) UI.toast('正在连接云端…', 4000);
    try { sess = await Cloud.session(); } catch (e) {}
    const email = sess && sess.user ? (sess.user.email || sess.user.name || '已登录') : '';

    if (!sess) {
      UI.sheet(
        '<div class="sheet-t">开启云端备份</div>' +
        '<div class="mini" style="margin:-8px 0 14px;line-height:1.7">数据一直存在这台手机上，这里只是多存一份到云上。换手机、清了浏览器都能恢复。用邮箱收个验证码就行，不用密码。</div>' +
        '<div class="field"><label>邮箱</label><input class="inp" id="b-mail" type="email" inputmode="email" placeholder="you@example.com"></div>' +
        '<div class="f2"><div class="field"><label>验证码</label><input class="inp" id="b-code" inputmode="numeric" placeholder="6 位"></div>' +
        '<div class="field" style="flex:0 0 108px"><label>&nbsp;</label><button class="btn btn-line btn-block" id="b-send" style="height:42px">发验证码</button></div></div>' +
        '<div class="actions"><button class="btn btn-line" data-x="close">关闭</button><button class="btn btn-pri" data-x="login">登录并开启</button></div>',
        {
          onAct: async (b) => {
            if (b.dataset.x === 'close') return UI.closeSheet();
            if (b.dataset.x === 'login') {
              const mail = document.querySelector('#b-mail').value.trim();
              const code = document.querySelector('#b-code').value.trim();
              const pending = S._otp;
              if (!pending || pending.email !== mail) return UI.toast('先点「发验证码」');
              if (!code) return UI.toast('填验证码');
              b.textContent = '登录中…';
              try {
                await Cloud.verifyCode(mail, pending, code);
                S.state.settings.cloudOn = true;
                S._otp = null;
                await Cloud.push();
                S.save(); UI.closeSheet(); UI.toast('已开启，数据已备份'); App.render();
              } catch (e) { b.textContent = '登录并开启'; UI.toast(e.message || '登录失败'); }
            }
          }
        }
      );
      const send = document.querySelector('#b-send');
      send.addEventListener('click', async () => {
        const mail = document.querySelector('#b-mail').value.trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return UI.toast('邮箱格式不对');
        send.textContent = '发送中…'; send.setAttribute('disabled', '1');
        try {
          const d = await Cloud.sendCode(mail);
          S._otp = { email: mail, verificationId: d.verificationId, isExistingUser: d.isExistingUser };
          UI.toast('验证码已发到邮箱');
        } catch (e) { UI.toast(e.message || '发送失败'); }
        send.textContent = '重新发送'; send.removeAttribute('disabled');
      });
      return;
    }

    // 已登录
    let rows = '';
    try {
      const list = await Cloud.list();
      rows = list.map((x) => '<div class="task" style="padding:10px 0"><div class="grow"><div class="tt" style="font-size:13.5px">' + esc(x.device || '设备') + '</div>' +
        '<div class="st">' + new Date(x.created_at).toLocaleString('zh-CN') + '</div></div>' +
        '<button class="btn btn-sm btn-line" data-x="pull" data-id="' + x.id + '">恢复</button></div>').join('');
      if (!rows) rows = '<div class="empty" style="padding:14px">云端还没有备份</div>';
    } catch (e) { rows = '<div class="mini">' + esc(e.message || '读取失败') + '</div>'; }

    UI.sheet(
      '<div class="sheet-t">云端备份</div>' +
      '<div class="note ok" style="margin-bottom:12px">' + ic('cloud') + '<div>已登录：' + esc(email) + '<br>数据改动后会自动备份（约 6 秒后）</div></div>' +
      '<div class="task" style="padding:0 0 12px"><div class="grow"><div class="tt">自动备份</div><div class="st">关掉后只能手动备份</div></div>' +
      '<span class="switch ' + (st.cloudOn ? 'on' : '') + '" id="b-auto"></span></div>' +
      '<div class="hr"></div>' +
      '<div class="mini" style="margin-bottom:6px">云端记录</div>' + rows +
      '<div class="actions"><button class="btn btn-line" data-x="out">退出登录</button><button class="btn btn-pri" data-x="push">立即备份</button></div>',
      {
        onAct: async (b) => {
          const x = b.dataset.x;
          if (x === 'push') {
            b.textContent = '备份中…';
            try { await Cloud.push(); S.state.settings.cloudOn = true; S.save(); UI.toast('已备份'); backupSheet(); }
            catch (e) { b.textContent = '立即备份'; UI.toast(e.message || '备份失败'); }
            return;
          }
          if (x === 'out') {
            await Cloud.signOut();
            S.state.settings.cloudOn = false; S.save();
            UI.closeSheet(); UI.toast('已退出，数据还在本机'); App.render(); return;
          }
          if (x === 'pull') {
            const ok = await UI.confirm('用云端这份覆盖本机？', '本机现在的记录会被替换。不确定就先导出一次。', '覆盖');
            if (!ok) { backupSheet(); return; }
            try {
              const row = await Cloud.pull(b.dataset.id);
              S.importObj(row.payload);
              UI.closeSheet(); UI.toast('已恢复'); App.render();
            } catch (e) { UI.toast(e.message || '恢复失败'); }
          }
        }
      }
    );
    const auto = document.querySelector('#b-auto');
    if (auto) auto.addEventListener('click', () => {
      auto.classList.toggle('on');
      S.state.settings.cloudOn = auto.classList.contains('on');
      S.save();
      UI.toast(S.state.settings.cloudOn ? '自动备份已开' : '自动备份已关');
    });
  }

  /* ---------------- 过敏原设置 ---------------- */
  const AL_ITEMS = [
    ['seaFish', '海鱼', '带鱼、黄鱼、鲳鱼、三文鱼、鳕鱼、鲅鱼'],
    ['shrimpCrab', '虾蟹', '虾仁、虾滑、虾皮、螃蟹、蟹粉'],
    ['shellfish', '贝类', '蛤蜊、扇贝、花蛤、牡蛎、蚝油'],
    ['algae', '藻类', '海带、紫菜、裙带菜、海苔']
  ];

  function allergySheet() {
    const al = S.allergy();
    let draft = { on: al.on, seaFish: al.seaFish, shrimpCrab: al.shrimpCrab, shellfish: al.shellfish, algae: al.algae };
    let draftOther = al.other || '';
    const sw = (k, on) => '<span class="switch ' + (on ? 'on' : '') + '" data-x="t" data-k="' + k + '"></span>';
    const body = () =>
      '<div class="sheet-t">过敏原设置</div>' +
      '<div class="note" style="margin:-4px 0 14px">' + ic('info') + '<div>勾上的类别，菜单会自动避开、换成别的菜。<b>全都不勾，海鱼、虾蟹、贝类就会排进 28 天菜单</b>——正常孩子每周 2 次海鱼是更好的选择。</div></div>' +
      '<div class="task" style="padding:2px 0 12px"><div class="grow"><div class="tt">启用过敏避让</div>' +
      '<div class="st">关掉就不做任何避让，所有菜都可能出现</div></div>' + sw('on', draft.on) + '</div>' +
      AL_ITEMS.map((it) =>
        '<div class="task" style="padding:11px 0;' + (draft.on ? '' : 'opacity:.45') + '"><div class="grow">' +
        '<div class="tt" style="font-size:14px">' + esc(it[1]) + '</div>' +
        '<div class="st">' + esc(it[2]) + '</div></div>' + sw(it[0], draft[it[0]] && draft.on) + '</div>'
      ).join('') +
      '<div class="field" style="margin-top:6px"><label>其它过敏（顿号分隔，命中会在菜上标出来）</label>' +
      '<input class="inp" id="al-other" value="' + esc(draftOther) + '" placeholder="比如 芒果、花生"></div>' +
      '<div class="actions"><button class="btn btn-line" data-x="cancel">取消</button>' +
      '<button class="btn btn-pri" data-x="save">保存</button></div>';

    UI.sheet(body(), {
      onAct: (b) => {
        const x = b.dataset.x;
        if (x === 't') {
          const k = b.dataset.k;
          const inp = UI.$('#al-other');
          if (inp) draftOther = inp.value;          // 重绘前先记下输入框
          if (k === 'on') draft.on = !draft.on;
          else if (draft.on) draft[k] = !draft[k];
          if (!draft.on) { draft.seaFish = draft.shrimpCrab = draft.shellfish = draft.algae = false; }
          // 就地刷新，不重开弹层
          UI.$('#sheet-body').innerHTML = body();
          return;
        }
        if (x === 'cancel') return UI.closeSheet();
        const pr = S.state.profile;
        const inp = UI.$('#al-other');
        pr.allergies = Object.assign({}, pr.allergies || {}, draft, {
          other: ((inp ? inp.value : draftOther) || '').trim()
        });
        S.save(); UI.closeSheet(); UI.toast('过敏设置已保存'); App.render();
      }
    });
  }

  function act(name, el) {
    if (name === 'profile') { profileSheet(); return true; }
    if (name === 'allergy') { allergySheet(); return true; }
    if (name === 'sup') { supSheet(el.dataset.k); return true; }
    if (name === 'time') { timeSheet(); return true; }
    if (name === 'gh') { ghSheet(); return true; }
    if (name === 'visits') { visitsSheet(); return true; }
    if (name === 'reports') { reportsSheet(); return true; }
    if (name === 'report-new') { reportSheet(); return true; }
    if (name === 'cal') { calSheet(); return true; }
    if (name === 'export') { exportFile(); return true; }
    if (name === 'import') { importFile(); return true; }
    if (name === 'backup') { backupSheet(); return true; }
    return false;
  }

  return { title, render, act };
})();
