/* ===== admin.js — Full Admin Panel (Fixed) ===== */

var AdminPanel = (function() {
  'use strict';

  var _cb = null;
  var _people = [];
  var _prizes = [];
  var _mode = 'sphere';
  var _batchVisible = false;

  function show(onSave) {
    _cb = onSave;
    _batchVisible = false;
    _loadData();

    var modal = document.getElementById('admin-modal');
    modal.style.display = 'flex';
    modal.innerHTML = _buildHTML();

    // Wait a frame to ensure DOM is ready, then bindAll
    setTimeout(function() {
      _bindAll();
      _switchTab('t-people');
    }, 30);
  }

  function hide() {
    var modal = document.getElementById('admin-modal');
    modal.style.display = 'none';
    modal.innerHTML = '';
  }

  function _loadData() {
    var sp = DataStore.getParticipants();
    _people = sp ? JSON.parse(JSON.stringify(sp)) : JSON.parse(JSON.stringify(DEFAULT_PARTICIPANTS));
    var spr = DataStore.getPrizes();
    _prizes = spr ? JSON.parse(JSON.stringify(spr)) : JSON.parse(JSON.stringify(DEFAULT_PRIZES));
    var sd = DataStore.getDisplay();
    _mode = sd ? sd.mode : 'sphere';
  }

  function _esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _buildHTML() {
    return '' +
    '<div class="adm-overlay" id="adm-overlay">' +
      '<div class="adm-panel" id="adm-panel">' +
        '<div class="adm-top-bar"></div>' +

        '<div class="adm-head">' +
          '<div class="adm-title">⚙ 管理后台</div>' +
          '<button class="adm-x" id="adm-close" type="button">✕</button>' +
        '</div>' +

        '<div class="adm-tabs" id="adm-tabs">' +
          '<button class="adm-tab active" data-tab="t-people" type="button">人员名单</button>' +
          '<button class="adm-tab" data-tab="t-prizes" type="button">奖项设置</button>' +
          '<button class="adm-tab" data-tab="t-display" type="button">展示方式</button>' +
        '</div>' +

        '<div class="adm-body" id="adm-body">' +
          '<div class="adm-page" id="t-people"></div>' +
          '<div class="adm-page" id="t-prizes"></div>' +
          '<div class="adm-page" id="t-display"></div>' +
        '</div>' +

        '<div class="adm-foot">' +
          '<button class="adm-save" id="adm-save" type="button">保存并应用</button>' +
        '</div>' +

      '</div>' +
    '</div>';
  }

  /* ===== Tab switching ===== */
  function _switchTab(tabId) {
    // update tab buttons
    var tabs = document.querySelectorAll('#adm-tabs .adm-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('active', tabs[i].getAttribute('data-tab') === tabId);
    }
    // update pages
    var pages = document.querySelectorAll('#adm-body .adm-page');
    for (var j = 0; j < pages.length; j++) {
      pages[j].classList.toggle('active', pages[j].id === tabId);
    }

    // render content for active tab
    if (tabId === 't-people') _renderPeople();
    else if (tabId === 't-prizes') _renderPrizes();
    else if (tabId === 't-display') _renderDisplay();
  }

  /* ===== Render People ===== */
  function _renderPeople() {
    var page = document.getElementById('t-people');
    if (!page) return;

    var batchStyle = _batchVisible ? '' : 'display:none;';

    var h = '' +
      '<div class="adm-toolbar">' +
        '<button class="adm-btn adm-btn-cy" id="btn-add1" type="button">＋ 添加人员</button>' +
        '<button class="adm-btn" id="btn-batch" type="button">批量添加</button>' +
        '<button class="adm-btn adm-btn-red" id="btn-clear-ppl" type="button">清空全部</button>' +
        '<span class="adm-info" id="ppl-count">共 ' + _people.length + ' 人</span>' +
      '</div>' +
      '<div class="adm-batch" id="batch-box" style="' + batchStyle + '">' +
        '<textarea id="batch-txt" placeholder="每行输入一个名字，例如：&#10;张三&#10;李四&#10;王五" rows="5"></textarea>' +
        '<div class="adm-batch-btns">' +
          '<button class="adm-btn adm-btn-cy" id="batch-ok" type="button">确认添加</button>' +
          '<button class="adm-btn" id="batch-no" type="button">取消</button>' +
        '</div>' +
      '</div>' +
      '<div class="adm-list" id="ppl-list">';

    if (_people.length === 0) {
      h += '<div class="adm-empty">暂无人员，请点击上方按钮添加</div>';
    } else {
      for (var i = 0; i < _people.length; i++) {
        var p = _people[i];
        var clr = AVATAR_COLORS[(p.id - 1) % AVATAR_COLORS.length];
        h += '<div class="ppl-row" data-idx="' + i + '">' +
          '<div class="ppl-idx">' + (i + 1) + '</div>' +
          '<div class="ppl-dot" style="background:' + clr + '">' + _esc(p.name.charAt(0)) + '</div>' +
          '<input class="ppl-inp" value="' + _esc(p.name) + '" data-i="' + i + '" />' +
          '<button class="ppl-del" data-i="' + i + '" type="button" title="删除">✕</button>' +
        '</div>';
      }
    }
    h += '</div>';

    page.innerHTML = h;

    // --- Bind people events ---
    // Add single
    document.getElementById('btn-add1').onclick = function() {
      var maxId = 0;
      for (var i = 0; i < _people.length; i++) { if (_people[i].id > maxId) maxId = _people[i].id; }
      _people.push({ id: maxId + 1, name: '新成员' + (maxId + 1) });
      _renderPeople();
      // Scroll to bottom
      var list = document.getElementById('ppl-list');
      if (list) list.scrollTop = list.scrollHeight;
    };

    // Batch toggle
    document.getElementById('btn-batch').onclick = function() {
      _batchVisible = !_batchVisible;
      var box = document.getElementById('batch-box');
      if (box) box.style.display = _batchVisible ? 'block' : 'none';
    };

    // Batch confirm
    document.getElementById('batch-ok').onclick = function() {
      var txt = document.getElementById('batch-txt').value.trim();
      if (!txt) return;
      var maxId = 0;
      for (var i = 0; i < _people.length; i++) { if (_people[i].id > maxId) maxId = _people[i].id; }
      var lines = txt.split('\n');
      for (var j = 0; j < lines.length; j++) {
        var nm = lines[j].trim();
        if (nm) { maxId++; _people.push({ id: maxId, name: nm }); }
      }
      _batchVisible = false;
      _renderPeople();
    };

    // Batch cancel
    document.getElementById('batch-no').onclick = function() {
      _batchVisible = false;
      var box = document.getElementById('batch-box');
      if (box) box.style.display = 'none';
    };

    // Clear all
    document.getElementById('btn-clear-ppl').onclick = function() {
      if (confirm('确定清空所有人员吗？此操作不可撤销。')) {
        _people = [];
        _renderPeople();
      }
    };

    // Edit name (delegate)
    var pplList = document.getElementById('ppl-list');
    pplList.addEventListener('change', function(e) {
      if (e.target.classList.contains('ppl-inp')) {
        var idx = parseInt(e.target.getAttribute('data-i'));
        var val = e.target.value.trim();
        if (val && _people[idx]) _people[idx].name = val;
      }
    });

    // Delete person (delegate)
    pplList.addEventListener('click', function(e) {
      var btn = e.target.closest('.ppl-del');
      if (!btn) return;
      var idx = parseInt(btn.getAttribute('data-i'));
      _people.splice(idx, 1);
      _renderPeople();
    });
  }

  /* ===== Render Prizes ===== */
  function _renderPrizes() {
    var page = document.getElementById('t-prizes');
    if (!page) return;

    var h = '' +
      '<div class="adm-toolbar">' +
        '<button class="adm-btn adm-btn-cy" id="btn-add-prize" type="button">＋ 添加奖项</button>' +
        '<button class="adm-btn adm-btn-red" id="btn-clear-winners" type="button">清空中奖记录</button>' +
        '<span class="adm-info">共 ' + _prizes.length + ' 个奖项</span>' +
      '</div>' +
      '<div class="adm-list" id="prize-list">';

    if (_prizes.length === 0) {
      h += '<div class="adm-empty">暂无奖项，请点击上方按钮添加</div>';
    } else {
      for (var i = 0; i < _prizes.length; i++) {
        var pr = _prizes[i];
        var imgHtml = pr.image
          ? '<img class="prz-img" src="' + pr.image + '" />'
          : '<div class="prz-noimg">暂无图片</div>';

        h += '<div class="prz-card" data-pi="' + i + '">' +
          '<div class="prz-head">' +
            '<div class="prz-num">#' + (i + 1) + '</div>' +
            '<input class="prz-inp prz-label" value="' + _esc(pr.label) + '" placeholder="奖项名称" data-i="' + i + '" data-f="label" />' +
            '<div class="prz-ct-wrap">' +
              '<span class="prz-ct-label">数量</span>' +
              '<input type="number" class="prz-inp prz-count" value="' + pr.count + '" min="1" max="99" data-i="' + i + '" data-f="count" />' +
            '</div>' +
            '<button class="prz-del" data-pi="' + i + '" type="button" title="删除此奖项">✕</button>' +
          '</div>' +
          '<div class="prz-mid">' +
            '<input class="prz-inp prz-desc" value="' + _esc(pr.desc || '') + '" placeholder="奖品描述（选填）" data-i="' + i + '" data-f="desc" />' +
          '</div>' +
          '<div class="prz-bot">' +
            '<div class="prz-img-box" id="prz-img-box-' + i + '">' + imgHtml + '</div>' +
            '<div class="prz-img-acts">' +
              '<label class="adm-btn adm-btn-sm adm-btn-cy">📷 上传图片<input type="file" accept="image/*" class="prz-file" data-i="' + i + '" style="display:none"/></label>' +
              (pr.image ? '<button class="adm-btn adm-btn-sm adm-btn-red prz-rmimg" data-i="' + i + '" type="button">移除图片</button>' : '') +
            '</div>' +
          '</div>' +
        '</div>';
      }
    }
    h += '</div>';

    page.innerHTML = h;

    // --- Bind prize events ---
    // Add prize
    document.getElementById('btn-add-prize').onclick = function() {
      var maxN = 0;
      for (var i = 0; i < _prizes.length; i++) {
        var n = parseInt(_prizes[i].id.replace('p', ''));
        if (n > maxN) maxN = n;
      }
      _prizes.push({ id: 'p' + (maxN + 1), label: '新奖项', count: 1, desc: '', image: '' });
      _renderPrizes();
      var list = document.getElementById('prize-list');
      if (list) list.scrollTop = list.scrollHeight;
    };

    // Clear winners
    document.getElementById('btn-clear-winners').onclick = function() {
      if (confirm('确定清空所有中奖记录？将重置抽奖状态。')) {
        DataStore.clearWinners();
        alert('✓ 中奖记录已清空');
      }
    };

    // Delegate: prize input changes
    var prizeList = document.getElementById('prize-list');

    prizeList.addEventListener('change', function(e) {
      if (e.target.classList.contains('prz-inp')) {
        var idx = parseInt(e.target.getAttribute('data-i'));
        var f = e.target.getAttribute('data-f');
        if (f === 'count') {
          _prizes[idx].count = Math.max(1, parseInt(e.target.value) || 1);
        } else if (_prizes[idx]) {
          _prizes[idx][f] = e.target.value.trim();
        }
      }

      // File upload
      if (e.target.classList.contains('prz-file')) {
        var fileIdx = parseInt(e.target.getAttribute('data-i'));
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
          _prizes[fileIdx].image = ev.target.result;
          _renderPrizes();
        };
        reader.readAsDataURL(file);
      }
    });

    // Delegate: delete prize & remove image
    prizeList.addEventListener('click', function(e) {
      var delBtn = e.target.closest('.prz-del');
      if (delBtn) {
        var idx = parseInt(delBtn.getAttribute('data-pi'));
        _prizes.splice(idx, 1);
        _renderPrizes();
        return;
      }
      var rmImg = e.target.closest('.prz-rmimg');
      if (rmImg) {
        var imgIdx = parseInt(rmImg.getAttribute('data-i'));
        _prizes[imgIdx].image = '';
        _renderPrizes();
      }
    });
  }

  /* ===== Render Display ===== */
  function _renderDisplay() {
    var page = document.getElementById('t-display');
    if (!page) return;

    var modes = [
      { val: 'sphere', icon: '🌐', title: '球形旋转', desc: '头像分布在3D球体上缓慢旋转' },
      { val: 'cards',  icon: '🃏', title: '卡片滚动', desc: '卡片横向循环滚动展示' },
      { val: 'matrix', icon: '▦',  title: '矩阵闪烁', desc: '网格排列随机闪烁效果' },
      { val: 'helix',  icon: '🧬', title: '螺旋DNA', desc: '双螺旋3D旋转动画' },
    ];

    var h = '<div class="adm-display-title">选择抽奖展示方式</div><div class="adm-display-grid" id="disp-grid">';
    for (var i = 0; i < modes.length; i++) {
      var m = modes[i];
      var sel = _mode === m.val ? ' disp-sel' : '';
      h += '<div class="disp-card' + sel + '" data-val="' + m.val + '">' +
        '<div class="disp-icon">' + m.icon + '</div>' +
        '<div class="disp-name">' + m.title + '</div>' +
        '<div class="disp-desc">' + m.desc + '</div>' +
        '<div class="disp-check">' + (_mode === m.val ? '● 已选择' : '○ 点击选择') + '</div>' +
      '</div>';
    }
    h += '</div>';

    page.innerHTML = h;

    // Bind display selection
    document.getElementById('disp-grid').addEventListener('click', function(e) {
      var card = e.target.closest('.disp-card');
      if (!card) return;
      _mode = card.getAttribute('data-val');
      _renderDisplay();
    });
  }

  /* ===== Bind global events ===== */
  function _bindAll() {
    // Close button
    var closeBtn = document.getElementById('adm-close');
    if (closeBtn) closeBtn.onclick = hide;

    // Click overlay to close
    var overlay = document.getElementById('adm-overlay');
    if (overlay) {
      overlay.onclick = function(e) {
        if (e.target === overlay) hide();
      };
    }

    // Stop click propagation on the panel itself
    var panel = document.getElementById('adm-panel');
    if (panel) {
      panel.onclick = function(e) { e.stopPropagation(); };
    }

    // Tab switching
    var tabsContainer = document.getElementById('adm-tabs');
    if (tabsContainer) {
      tabsContainer.onclick = function(e) {
        var tab = e.target.closest('.adm-tab');
        if (!tab) return;
        var tabId = tab.getAttribute('data-tab');
        _switchTab(tabId);
      };
    }

    // Save button
    var saveBtn = document.getElementById('adm-save');
    if (saveBtn) {
      saveBtn.onclick = function() {
        // regenerate avatars
        for (var i = 0; i < _people.length; i++) { delete _people[i].avatar; }
        ensureAvatars(_people);
        DataStore.saveParticipants(_people);
        DataStore.savePrizes(_prizes);
        DataStore.saveDisplay({ mode: _mode });
        hide();
        if (_cb) _cb();
      };
    }
  }

  return { show: show, hide: hide };
})();
