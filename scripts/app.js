/* ===== app.js — Main Cyberpunk Lottery ===== */
(function() {
  'use strict';

  var S = {
    participants: [],
    prizes: [],
    winners: [],
    wonIds: {},
    displayMode: 'sphere',
    spinning: false,
    decel: false,
    speed: 0.003,
    target: 0.003,
    maxSpd: 0.06,
    hlTimer: 0,
    prizeIdx: 0,
    renderer: null,
    raf: null,
  };
  var D = {};

  function init() {
    loadData();
    document.getElementById('app').innerHTML = buildUI();
    cacheDom();
    buildRenderer();
    bindEvents();
    renderPrizeBtns();
    updateStats();
    drawGridBg();
    tick();
  }

  function loadData() {
    var sp = DataStore.getParticipants();
    S.participants = sp ? sp.slice() : JSON.parse(JSON.stringify(DEFAULT_PARTICIPANTS));
    ensureAvatars(S.participants);
    var spr = DataStore.getPrizes();
    S.prizes = spr ? spr.slice() : JSON.parse(JSON.stringify(DEFAULT_PRIZES));
    var sd = DataStore.getDisplay();
    S.displayMode = sd ? sd.mode : 'sphere';
    S.winners = DataStore.getWinners();
    S.wonIds = {};
    for (var i = 0; i < S.winners.length; i++) S.wonIds[S.winners[i].participant.id] = true;
  }

  function esc(s) { return !s ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function buildUI() {
    return '' +
    '<div class="cyber-bg" id="cyber-bg"></div>' +
    '<div class="scanlines"></div>' +
    '<header class="header">' +
      '<div class="hdr-left">' +
        '<div class="hdr-title"><span class="glitch" data-text="顺心捷达河北省区抽奖系统">顺心捷达河北省区抽奖系统</span></div>' +
      '</div>' +
      '<div class="hdr-right">' +
        '<div class="hdr-stats" id="stats"></div>' +
        '<button class="admin-btn" id="btn-admin">⚙ 管理后台</button>' +
      '</div>' +
    '</header>' +
    '<div class="main-stage"><div class="render-container" id="render-ct"></div></div>' +
    '<div class="side-panel">' +
      '<div class="sp-hd"><span class="sp-dot"></span> WINNERS_LOG</div>' +
      '<div class="sp-list" id="hist-list"></div>' +
    '</div>' +
    '<div class="controls">' +
      '<div class="prize-sel" id="prize-sel"></div>' +
      '<div class="btn-row">' +
        '<button class="act-btn btn-start" id="btn-start"><span>▶ 开始抽奖</span></button>' +
        '<button class="act-btn btn-stop" id="btn-stop" style="display:none"><span>■ 停 止</span></button>' +
      '</div>' +
    '</div>' +
    '<div class="win-overlay" id="win-ov"><div class="win-card" id="win-card"></div></div>' +
    '<div class="confetti-ct" id="confetti-ct"></div>';
  }

  function cacheDom() {
    D.renderCt = document.getElementById('render-ct');
    D.startBtn = document.getElementById('btn-start');
    D.stopBtn = document.getElementById('btn-stop');
    D.winOv = document.getElementById('win-ov');
    D.winCard = document.getElementById('win-card');
    D.stats = document.getElementById('stats');
    D.histList = document.getElementById('hist-list');
  }

  function buildRenderer() {
    S.renderer = Renderer.create(S.displayMode, D.renderCt, S.participants, S.wonIds);
    S.renderer.build();
    rebuildHistPanel();
  }

  /* ===== Build grouped history panel ===== */
  function rebuildHistPanel() {
    D.histList.innerHTML = '';
    if (S.winners.length === 0) {
      D.histList.innerHTML = '<div class="sp-empty">暂无中奖记录</div>';
      return;
    }
    // Group winners by prize label
    var groups = {};
    var order = [];
    for (var i = 0; i < S.winners.length; i++) {
      var w = S.winners[i];
      var label = w.prize;
      if (!groups[label]) {
        groups[label] = { label: label, image: w.prizeImage || '', items: [] };
        order.push(label);
      }
      groups[label].items.push(w.participant);
      // Keep the latest image
      if (w.prizeImage) groups[label].image = w.prizeImage;
    }
    for (var g = 0; g < order.length; g++) {
      var grp = groups[order[g]];
      var card = document.createElement('div');
      card.className = 'sp-group';

      var hdr = document.createElement('div');
      hdr.className = 'sp-group-hdr';
      hdr.innerHTML = '<span class="sp-group-tag">◆</span><span class="sp-group-label">' + esc(grp.label) + '</span><span class="sp-group-cnt">' + grp.items.length + '人</span>';
      card.appendChild(hdr);

      // Show prize image thumbnail if exists
      if (grp.image) {
        var imgWrap = document.createElement('div');
        imgWrap.className = 'sp-group-img';
        imgWrap.innerHTML = '<img src="' + grp.image + '" alt="奖品"/>';
        card.appendChild(imgWrap);
      }

      var list = document.createElement('div');
      list.className = 'sp-group-list';
      for (var k = 0; k < grp.items.length; k++) {
        var p = grp.items[k];
        var item = document.createElement('div');
        item.className = 'sp-item';
        item.innerHTML = '<div class="sp-ava"><img src="' + p.avatar + '"/></div><div class="sp-nm">' + esc(p.name) + '</div>';
        list.appendChild(item);
      }
      card.appendChild(list);
      D.histList.appendChild(card);
    }
  }

  function tick() {
    if (S.spinning && !S.decel) {
      S.speed += (S.maxSpd - S.speed) * 0.025;
    } else if (S.decel) {
      S.speed *= 0.985;
      if (S.speed < 0.002) {
        S.speed = 0.003; S.decel = false; S.spinning = false;
        onStopDone();
      }
    } else {
      S.speed += (S.target - S.speed) * 0.05;
    }

    if (S.spinning || S.decel) {
      S.hlTimer++;
      var iv = Math.max(2, Math.floor(6 - S.speed * 80));
      if (S.hlTimer % iv === 0) {
        var items = S.renderer.nodes || S.renderer.cards || [];
        var avail = [];
        for (var i = 0; i < items.length; i++) {
          if (!S.wonIds[items[i]._p.id]) avail.push(i);
        }
        if (avail.length > 0) S.renderer.highlightedIndex = avail[Math.floor(Math.random() * avail.length)];
      }
    }

    if (S.renderer) S.renderer.update(S.speed);
    S.raf = requestAnimationFrame(tick);
  }

  function bindEvents() {
    D.startBtn.addEventListener('click', onStart);
    D.stopBtn.addEventListener('click', onStop);
    document.getElementById('btn-admin').addEventListener('click', function() {
      AdminPanel.show(function() {
        if (S.raf) cancelAnimationFrame(S.raf);
        loadData();
        document.getElementById('app').innerHTML = buildUI();
        cacheDom();
        buildRenderer();
        bindEvents();
        renderPrizeBtns();
        updateStats();
        drawGridBg();
        tick();
      });
    });
    D.winOv.addEventListener('click', function(e) {
      if (e.target === e.currentTarget) closeWin();
    });
  }

  function onStart() {
    var avail = S.participants.filter(function(p) { return !S.wonIds[p.id]; });
    if (avail.length === 0) { notify('所有参与者都已中奖！'); return; }
    if (S.prizes.length === 0) { notify('请先在管理面板设置奖项！'); return; }
    S.spinning = true; S.decel = false; S.speed = 0.01; S.hlTimer = 0;
    S.renderer.highlightedIndex = -1;
    D.startBtn.style.display = 'none';
    D.stopBtn.style.display = 'inline-flex';
    document.querySelectorAll('.prize-btn').forEach(function(b) { b.style.pointerEvents = 'none'; b.style.opacity = '0.4'; });
  }

  function onStop() {
    S.decel = true;
    D.stopBtn.style.display = 'none';
    D.startBtn.style.display = 'inline-flex';
    D.startBtn.disabled = true;
  }

  function onStopDone() {
    var prize = S.prizes[S.prizeIdx];
    if (!prize) return;
    var avail = S.participants.filter(function(p) { return !S.wonIds[p.id]; });
    var cnt = Math.min(prize.count, avail.length);
    var shuffled = avail.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
    }
    var ws = [];
    for (var k = 0; k < cnt; k++) {
      S.wonIds[shuffled[k].id] = true;
      var wr = {
        participant: shuffled[k],
        prize: prize.label,
        prizeImage: prize.image || '',
        prizeDesc: prize.desc || ''
      };
      ws.push(wr);
      S.winners.push(wr);
    }
    DataStore.saveWinners(S.winners);
    S.renderer.highlightedIndex = -1;
    S.renderer.markWon();
    showWin(ws, prize);
    rebuildHistPanel();
    updateStats();
    confetti();
    D.startBtn.disabled = false;
    document.querySelectorAll('.prize-btn').forEach(function(b) { b.style.pointerEvents = ''; b.style.opacity = ''; });
  }

  function renderPrizeBtns() {
    var ct = document.getElementById('prize-sel');
    if (!ct) return;
    var h = '';
    for (var i = 0; i < S.prizes.length; i++) {
      h += '<button class="prize-btn' + (i === S.prizeIdx ? ' active' : '') + '" data-i="' + i + '">' + esc(S.prizes[i].label) + '</button>';
    }
    ct.innerHTML = h;
    ct.addEventListener('click', function(e) {
      var b = e.target.closest('.prize-btn');
      if (!b || S.spinning) return;
      ct.querySelectorAll('.prize-btn').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active');
      S.prizeIdx = parseInt(b.getAttribute('data-i'));
    });
  }

  function showWin(ws, prize) {
    var h = '<div class="wm-line"></div>';
    h += '<div class="wm-label">◆ ' + esc(ws[0].prize) + ' ◆</div>';

    // Show prize photo if uploaded
    if (prize.image) {
      h += '<div class="wm-photo"><img src="' + prize.image + '" alt="奖品图片"/></div>';
    }

    if (ws.length === 1) {
      h += '<div class="wm-ava"><img src="' + ws[0].participant.avatar + '"/></div>';
      h += '<div class="wm-name">' + esc(ws[0].participant.name) + '</div>';
    } else {
      h += '<div class="wm-multi">';
      for (var i = 0; i < ws.length; i++) {
        h += '<div class="wm-mi"><div class="wm-ma"><img src="' + ws[i].participant.avatar + '"/></div><div class="wm-mn">' + esc(ws[i].participant.name) + '</div></div>';
      }
      h += '</div>';
    }

    if (prize.desc) {
      h += '<div class="wm-desc">' + esc(prize.desc) + '</div>';
    }

    h += '<div class="wm-cg">WINNER CONFIRMED</div>';
    h += '<button class="wm-btn" id="win-close">确 定</button>';

    D.winCard.innerHTML = h;
    D.winOv.classList.add('show');
    document.getElementById('win-close').addEventListener('click', closeWin);
  }

  function closeWin() { D.winOv.classList.remove('show'); }

  function updateStats() {
    var t = S.participants.length, w = Object.keys(S.wonIds).length;
    D.stats.innerHTML =
      '<span class="st">参与:<b class="sv">' + t + '</b></span>' +
      '<span class="ss">│</span>' +
      '<span class="st">已中:<b class="sv sc">' + w + '</b></span>' +
      '<span class="ss">│</span>' +
      '<span class="st">剩余:<b class="sv sg">' + (t - w) + '</b></span>';
  }

  function notify(msg) {
    var n = document.createElement('div');
    n.className = 'cyber-notify';
    n.textContent = '⚠ ' + msg;
    document.body.appendChild(n);
    setTimeout(function() { n.classList.add('show'); }, 10);
    setTimeout(function() { n.classList.remove('show'); setTimeout(function() { n.remove(); }, 400); }, 2500);
  }

  function confetti() {
    var ct = document.getElementById('confetti-ct');
    var colors = ['#ff2d6b','#00f0ff','#b537f2','#39ff14','#ffdd00','#ff6e27'];
    for (var i = 0; i < 70; i++) {
      var pc = document.createElement('div');
      pc.className = 'confetti-p';
      pc.style.left = Math.random() * 100 + '%';
      pc.style.background = colors[Math.floor(Math.random() * colors.length)];
      pc.style.width = (3 + Math.random() * 7) + 'px';
      pc.style.height = (5 + Math.random() * 10) + 'px';
      pc.style.borderRadius = Math.random() > 0.5 ? '50%' : '1px';
      pc.style.animationDuration = (2 + Math.random() * 3) + 's';
      pc.style.animationDelay = Math.random() * 0.6 + 's';
      ct.appendChild(pc);
      (function(e) { setTimeout(function() { e.remove(); }, 5500); })(pc);
    }
  }

  function drawGridBg() {
    var bg = document.getElementById('cyber-bg');
    if (!bg) return;
    var cv = document.createElement('canvas');
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    cv.className = 'grid-cv';
    bg.appendChild(cv);
    var ctx = cv.getContext('2d');
    _drawGrid(ctx, cv.width, cv.height);
    window.addEventListener('resize', function() {
      cv.width = window.innerWidth; cv.height = window.innerHeight;
      _drawGrid(ctx, cv.width, cv.height);
    });
  }
  function _drawGrid(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,240,255,0.04)'; ctx.lineWidth = 1;
    for (var x = 0; x < w; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (var y = 0; y < h; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
