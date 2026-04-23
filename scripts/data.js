/* ===== data.js — Data & persistence ===== */

var AVATAR_COLORS = [
  '#ff2d6b', '#00f0ff', '#b537f2', '#39ff14', '#ff6e27',
  '#ffdd00', '#00ff87', '#ff4081', '#00bcd4', '#e040fb',
  '#ff9100', '#76ff03', '#18ffff', '#f50057', '#651fff',
  '#ff3d00', '#1de9b6', '#d500f9', '#ffea00', '#00e5ff',
];

var DB_KEYS = {
  participants: 'cyber_lottery_participants',
  prizes: 'cyber_lottery_prizes',
  winners: 'cyber_lottery_winners',
  display: 'cyber_lottery_display'
};

var DEFAULT_PARTICIPANTS = [];
(function() {
  var names = [
    '小明','晓风残月','阳光灿烂','张三丰','梦回唐朝',
    '一叶知秋','星辰大海','风华正茂','静水流深','云淡风轻',
    '月下独酌','花开半夏','逆风飞翔','天涯行者','悠然见山',
    '清风徐来','落叶归根','雨后初晴','笑看风云','心如止水',
    '剑指苍穹','诗与远方','岁月如歌','浮生若梦','海阔天空',
    '青山绿水','春暖花开','风轻云淡','日月星辰','碧海蓝天',
    '雪中送炭','山高水长','桃之夭夭','风起云涌','烟雨江南',
    '大漠孤烟','月明星稀','竹林听风','沧海一粟','逍遥游子'
  ];
  for (var i = 0; i < names.length; i++) {
    DEFAULT_PARTICIPANTS.push({ id: i + 1, name: names[i] });
  }
})();

var DEFAULT_PRIZES = [
  { id: 'p1', label: '特等奖', count: 1, desc: '神秘大奖', image: '' },
  { id: 'p2', label: '一等奖', count: 1, desc: '高级奖品', image: '' },
  { id: 'p3', label: '二等奖', count: 2, desc: '精美礼品', image: '' },
  { id: 'p4', label: '三等奖', count: 3, desc: '实用好物', image: '' },
  { id: 'p5', label: '幸运奖', count: 5, desc: '参与奖品', image: '' },
];

/* ===== Storage ===== */
var DataStore = {
  _get: function(key) {
    try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : null; }
    catch(e) { return null; }
  },
  _set: function(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
  },
  getParticipants: function() { return this._get(DB_KEYS.participants); },
  saveParticipants: function(v) { this._set(DB_KEYS.participants, v); },
  getPrizes: function() { return this._get(DB_KEYS.prizes); },
  savePrizes: function(v) { this._set(DB_KEYS.prizes, v); },
  getWinners: function() { return this._get(DB_KEYS.winners) || []; },
  saveWinners: function(v) { this._set(DB_KEYS.winners, v); },
  clearWinners: function() { localStorage.removeItem(DB_KEYS.winners); },
  getDisplay: function() { return this._get(DB_KEYS.display); },
  saveDisplay: function(v) { this._set(DB_KEYS.display, v); }
};

/* ===== Avatar generation ===== */
function generateAvatar(name, id) {
  var c = document.createElement('canvas');
  c.width = 96; c.height = 96;
  var ctx = c.getContext('2d');
  var color = AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length];

  ctx.fillStyle = '#0d0d1a';
  ctx.beginPath(); ctx.arc(48, 48, 48, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(48, 48, 44, 0, Math.PI * 2); ctx.stroke();

  var grad = ctx.createRadialGradient(48, 48, 20, 48, 48, 46);
  grad.addColorStop(0, color + '33'); grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(48, 48, 44, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = color;
  ctx.font = 'bold 34px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = color; ctx.shadowBlur = 10;
  ctx.fillText(name.charAt(0), 48, 50);
  ctx.shadowBlur = 0;

  return c.toDataURL('image/png');
}

function ensureAvatars(list) {
  for (var i = 0; i < list.length; i++) {
    if (!list[i].avatar || list[i].avatar.indexOf('data:') !== 0) {
      list[i].avatar = generateAvatar(list[i].name, list[i].id);
    }
  }
  return list;
}
