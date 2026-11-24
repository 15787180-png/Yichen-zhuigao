/* 云端：登录、备份、病历识别（懒加载 SDK，失败不影响本机使用） */
window.Cloud = (function () {
  /* 想用云端备份 / 病历识别，把这三项换成你自己的（见 README）。留空则这些功能自动隐藏。 */
  const CFG = {
    endpoint: '',
    oauthRelayBaseUrl: '',
    publishableKey: ''
  };
  const SDK_URL = 'https://cdn.jsdelivr.net/npm/@tencent-ai/workbuddy-cloud-sdk@dev/lib/index.global.js';

  let client = null, loading = null;
  function ready() {
    if (!CFG.endpoint || !CFG.publishableKey) {
      return Promise.reject(new Error('这个版本没有接云端：备份和病历识别用不了，本机记录不受影响'));
    }
    if (client) return Promise.resolve(client);
    if (loading) return loading;
    loading = new Promise((res, rej) => {
      let done = false;
      const timer = setTimeout(() => {
        if (done) return;
        done = true; loading = null;
        rej(new Error('连不上云端（8 秒超时），检查一下网络再试'));
      }, 8000);
      function init() {
        if (done) return;
        done = true; clearTimeout(timer);
        try {
          client = WorkBuddyCloud.createWorkBuddyCloud({
            endpoint: CFG.endpoint,
            oauthRelayBaseUrl: CFG.oauthRelayBaseUrl,
            publishableKey: CFG.publishableKey
          });
          res(client);
        } catch (e) { loading = null; rej(e); }
      }
      if (window.WorkBuddyCloud) return init();
      const s = document.createElement('script');
      s.src = SDK_URL;
      s.onload = init;
      s.onerror = () => {
        if (done) return;
        done = true; clearTimeout(timer); loading = null;
        rej(new Error('云端组件没加载出来，检查一下网络再试'));
      };
      document.head.appendChild(s);
    });
    return loading;
  }

  async function session() {
    try {
      const c = await ready();
      const { data } = await c.auth.getSession();
      return data || null;
    } catch (e) { return null; }
  }

  async function sendCode(email) {
    const c = await ready();
    const r = await c.auth.sendOtp({ email });
    if (r.error) throw new Error(r.error.message || '验证码发送失败');
    return r.data;
  }

  async function verifyCode(email, d, code) {
    const c = await ready();
    const r = await c.auth.verifyOtp({ email, verificationId: d.verificationId, isExistingUser: d.isExistingUser, token: code });
    if (r.error) throw new Error(r.error.message || '验证码不对');
    return r.data;
  }

  async function signOut() {
    try { const c = await ready(); await c.auth.signOut(); } catch (e) {}
  }

  function deviceName() {
    const ua = navigator.userAgent;
    let n = '浏览器';
    if (/iPhone/.test(ua)) n = 'iPhone';
    else if (/iPad/.test(ua)) n = 'iPad';
    else if (/Android/.test(ua)) n = '安卓手机';
    else if (/Macintosh/.test(ua)) n = 'Mac';
    else if (/Windows/.test(ua)) n = 'Windows';
    let nm = localStorage.getItem('zhui_device');
    if (!nm) { nm = n; localStorage.setItem('zhui_device', nm); }
    return nm;
  }

  async function push() {
    const c = await ready();
    const sess = await session();
    if (!sess) throw new Error('先登录才能备份');
    const payload = S.exportObj();
    const dev = deviceName();
    const db = c.database;
    const del = await db.from('backups').delete().eq('device', dev).select();
    if (del.error) throw new Error(del.error.message || '备份失败');
    const ins = await db.from('backups').insert({ device: dev, owner_name: (sess.user && sess.user.name) || dev, payload }).select();
    if (ins.error) throw new Error(ins.error.message || '备份失败');
    if (!ins.data || !ins.data.length) throw new Error('备份被拒绝，请重新登录');
    S.state.settings.lastBackupAt = new Date().toISOString();
    S.save();
    return true;
  }

  async function list() {
    const c = await ready();
    const r = await c.database.from('backups').select('id,device,created_at').order('created_at', { ascending: false }).limit(6);
    if (r.error) throw new Error(r.error.message || '读取云端备份失败');
    return r.data || [];
  }

  async function pull(id) {
    const c = await ready();
    const r = await c.database.from('backups').select('payload,created_at,device').eq('id', id).single();
    if (r.error) throw new Error(r.error.message || '读取失败');
    return r.data;
  }

  let autoTimer = null;
  function autoBackup() {
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = setTimeout(async () => {
      try {
        if (!S.state.settings.cloudOn) return;
        const sess = await session();
        if (!sess) return;
        await push();
      } catch (e) { /* 静默，界面上有手动备份入口 */ }
    }, 1500);
  }

  /* ---------- 病历拍照识别 ---------- */
  function compress(file, maxSide, quality) {
    return new Promise((res, rej) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const sc = Math.min(1, (maxSide || 1400) / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * sc);
        cv.height = Math.round(img.height * sc);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        res(cv.toDataURL('image/jpeg', quality || 0.72));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('图片读不出来')); };
      img.src = url;
    });
  }

  let visionModel = null;
  async function pickModel(c) {
    if (visionModel) return visionModel;
    const models = await c.llm.models.list();
    const list = Array.isArray(models) ? models : (models && models.data) || [];
    if (!list.length) throw new Error('当前没有可用的模型');
    const m = list.find((x) => x.supportsImages === true && x.disabled !== true && x.enabled !== false)
      || list.find((x) => x.disabled !== true && x.enabled !== false);
    if (!m) throw new Error('当前没有可用的模型');
    visionModel = m;
    return m;
  }

  const SYS = '你是一名严谨的医疗报告信息提取助手。你只从图片中抄录真实存在的数值，绝不推测、绝不补全。没找到的字段返回空字符串。只输出 JSON，不要任何解释文字。';

  async function extractReport(file) {
    const c = await ready();
    const model = await pickModel(c);
    const dataUrl = await compress(file, 1600, 0.75);
    const prompt = '请从这张医疗报告/化验单/骨龄片照片中提取以下字段，输出 JSON：\n' +
      '{"height":"身高cm","weight":"体重kg","bone_age":"骨龄岁","igf1":"IGF-1数值含单位",' +
      '"thyroid":"甲功相关指标及结果","glucose":"血糖含单位","echo":"心脏超声结论","other":"其他重要异常","report_date":"报告日期YYYY-MM-DD","hospital":"医院名称"}\n' +
      '规则：只抄图片上印的内容；数值保留原单位；看不清的填空字符串。';

    let text = '';
    const stream = c.llm.chat.completions.create({
      model: model.id,
      messages: [
        { role: 'system', content: SYS },
        { role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: dataUrl } }
        ] }
      ],
      stream: true
    });
    for await (const chunk of stream) {
      const d = chunk.choices && chunk.choices[0] && chunk.choices[0].delta;
      if (d && d.content) text += d.content;
    }
    if (!text.trim()) throw new Error('没能识别出内容，换张清楚点的照片试试');
    const m = text.match(/\{[\s\S]*\}/);
    let obj = {};
    if (m) { try { obj = JSON.parse(m[0]); } catch (e) { obj = {}; } }
    return { raw: text, data: obj, image: dataUrl };
  }

  return {
    ready, session, sendCode, verifyCode, signOut, push, list, pull, autoBackup, extractReport, deviceName,
    get enabled() { return !!(CFG.endpoint && CFG.publishableKey); },
    get previewKey() { return CFG.publishableKey.slice(0, 12); }
  };
})();
