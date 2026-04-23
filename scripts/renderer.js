/* ===== renderer.js — Display mode renderers ===== */

var Renderer = (function() {
  'use strict';

  /* ---- Fibonacci sphere points ---- */
  function fibSphere(n) {
    var pts = [];
    if (n === 0) return pts;
    if (n === 1) return [{x:0,y:0,z:1}];
    var ga = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < n; i++) {
      var y = 1 - (i / (n - 1)) * 2;
      var r = Math.sqrt(1 - y * y);
      var t = ga * i;
      pts.push({ x: Math.cos(t) * r, y: y, z: Math.sin(t) * r });
    }
    return pts;
  }

  /* ==== SPHERE ==== */
  function SphereR(ct, ps, w) {
    this.ct = ct; this.ps = ps; this.w = w;
    this.nodes = [];
    this.radius = Math.min(220, Math.min(window.innerWidth, window.innerHeight) * 0.25);
    this.ry = 0; this.rx = 0.35; this.hi = -1;
  }
  SphereR.prototype.build = function() {
    this.ct.innerHTML = '';
    this.ct.className = 'render-area render-sphere';
    this.nodes = [];
    var pts = fibSphere(this.ps.length);
    for (var i = 0; i < this.ps.length; i++) {
      var p = this.ps[i], pt = pts[i];
      var el = document.createElement('div');
      el.className = 'avatar-node sphere-node' + (this.w[p.id] ? ' won' : '');
      var img = document.createElement('img');
      img.src = p.avatar; img.alt = p.name;
      el.appendChild(img);
      var lb = document.createElement('span');
      lb.className = 'node-label'; lb.textContent = p.name;
      el.appendChild(lb);
      el._bx = pt.x * this.radius; el._by = pt.y * this.radius; el._bz = pt.z * this.radius;
      el._p = p;
      this.ct.appendChild(el);
      this.nodes.push(el);
    }
  };
  SphereR.prototype.update = function(spd) {
    this.ry += spd;
    var cy = Math.cos(this.ry), sy = Math.sin(this.ry);
    var cx = Math.cos(this.rx), sx = Math.sin(this.rx);
    for (var i = 0; i < this.nodes.length; i++) {
      var el = this.nodes[i];
      var x = el._bx * cy + el._bz * sy;
      var z = -el._bx * sy + el._bz * cy;
      var y2 = el._by * cx - z * sx;
      var z2 = el._by * sx + z * cx;
      var sc = Math.max(0.4, (z2 + 400) / 620);
      var op = Math.max(0.15, Math.min(1, (z2 + this.radius + 80) / (this.radius * 2 + 80)));
      el.style.transform = 'translate3d(' + x + 'px,' + y2 + 'px,' + z2 + 'px) scale(' + sc + ')';
      el.style.opacity = this.w[el._p.id] ? 0.15 : op;
      el.style.zIndex = Math.floor(z2 + 300);
      el.classList.toggle('highlighted', i === this.hi && !this.w[el._p.id]);
    }
  };
  SphereR.prototype.markWon = function() {
    for (var i = 0; i < this.nodes.length; i++) {
      if (this.w[this.nodes[i]._p.id]) this.nodes[i].classList.add('won');
    }
  };

  /* ==== CARDS ==== */
  function CardsR(ct, ps, w) {
    this.ct = ct; this.ps = ps; this.w = w;
    this.cards = []; this.scroll = 0; this.hi = -1;
  }
  CardsR.prototype.build = function() {
    this.ct.innerHTML = '';
    this.ct.className = 'render-area render-cards';
    this.cards = [];
    var wr = document.createElement('div');
    wr.className = 'cards-scroll-wrap';
    for (var i = 0; i < this.ps.length; i++) {
      var p = this.ps[i];
      var cd = document.createElement('div');
      cd.className = 'card-item' + (this.w[p.id] ? ' won' : '');
      cd.innerHTML = '<div class="card-avatar"><img src="' + p.avatar + '"/></div><div class="card-name">' + p.name + '</div>';
      cd._p = p;
      wr.appendChild(cd);
      this.cards.push(cd);
    }
    this.ct.appendChild(wr);
    this._wrap = wr;
  };
  CardsR.prototype.update = function(spd) {
    this.scroll += spd * 800;
    var tw = this.cards.length * 94;
    if (tw > 0) this.scroll = this.scroll % tw;
    this._wrap.style.transform = 'translateX(' + (-this.scroll) + 'px)';
    for (var i = 0; i < this.cards.length; i++) {
      this.cards[i].classList.toggle('highlighted', i === this.hi && !this.w[this.cards[i]._p.id]);
    }
  };
  CardsR.prototype.markWon = function() {
    for (var i = 0; i < this.cards.length; i++) {
      if (this.w[this.cards[i]._p.id]) this.cards[i].classList.add('won');
    }
  };

  /* ==== MATRIX ==== */
  function MatrixR(ct, ps, w) {
    this.ct = ct; this.ps = ps; this.w = w;
    this.nodes = []; this.hi = -1; this.t = 0;
  }
  MatrixR.prototype.build = function() {
    this.ct.innerHTML = '';
    this.ct.className = 'render-area render-matrix';
    this.nodes = [];
    var cols = Math.ceil(Math.sqrt(this.ps.length * 1.5));
    for (var i = 0; i < this.ps.length; i++) {
      var p = this.ps[i];
      var el = document.createElement('div');
      el.className = 'matrix-cell' + (this.w[p.id] ? ' won' : '');
      el.innerHTML = '<img src="' + p.avatar + '"/><span class="matrix-name">' + p.name + '</span>';
      el._p = p; el._phase = Math.random() * Math.PI * 2;
      this.ct.appendChild(el);
      this.nodes.push(el);
    }
    this.ct.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
  };
  MatrixR.prototype.update = function(spd) {
    this.t += spd;
    for (var i = 0; i < this.nodes.length; i++) {
      var el = this.nodes[i];
      el.classList.toggle('highlighted', i === this.hi && !this.w[el._p.id]);
      if (spd > 0.008) {
        el.style.opacity = this.w[el._p.id] ? 0.15 : (0.85 + 0.15 * Math.sin(this.t * 6 + el._phase));
      }
    }
  };
  MatrixR.prototype.markWon = function() {
    for (var i = 0; i < this.nodes.length; i++) {
      if (this.w[this.nodes[i]._p.id]) this.nodes[i].classList.add('won');
    }
  };

  /* ==== HELIX ==== */
  function HelixR(ct, ps, w) {
    this.ct = ct; this.ps = ps; this.w = w;
    this.nodes = []; this.rot = 0; this.hi = -1;
  }
  HelixR.prototype.build = function() {
    this.ct.innerHTML = '';
    this.ct.className = 'render-area render-helix';
    this.nodes = [];
    for (var i = 0; i < this.ps.length; i++) {
      var p = this.ps[i];
      var el = document.createElement('div');
      el.className = 'avatar-node helix-node' + (this.w[p.id] ? ' won' : '');
      var img = document.createElement('img');
      img.src = p.avatar; el.appendChild(img);
      var lb = document.createElement('span');
      lb.className = 'node-label'; lb.textContent = p.name;
      el.appendChild(lb);
      el._p = p; el._i = i;
      this.ct.appendChild(el);
      this.nodes.push(el);
    }
  };
  HelixR.prototype.update = function(spd) {
    this.rot += spd;
    var n = this.nodes.length, hR = Math.min(180, window.innerWidth * 0.18);
    var sp = 22, offY = -n * sp / 2;
    for (var i = 0; i < n; i++) {
      var el = this.nodes[i];
      var a = this.rot + (i / n) * Math.PI * 6;
      var x = Math.cos(a) * hR, z = Math.sin(a) * hR, y = offY + i * sp;
      var sc = Math.max(0.45, (z + 300) / 480);
      var op = Math.max(0.2, (z + hR + 50) / (hR * 2 + 50));
      el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,' + z + 'px) scale(' + sc + ')';
      el.style.opacity = this.w[el._p.id] ? 0.15 : op;
      el.style.zIndex = Math.floor(z + 300);
      el.classList.toggle('highlighted', i === this.hi && !this.w[el._p.id]);
    }
  };
  HelixR.prototype.markWon = function() {
    for (var i = 0; i < this.nodes.length; i++) {
      if (this.w[this.nodes[i]._p.id]) this.nodes[i].classList.add('won');
    }
  };

  /* ==== FACTORY ==== */
  function create(mode, ct, ps, w) {
    var r;
    switch (mode) {
      case 'cards':  r = new CardsR(ct, ps, w); break;
      case 'matrix': r = new MatrixR(ct, ps, w); break;
      case 'helix':  r = new HelixR(ct, ps, w); break;
      default:       r = new SphereR(ct, ps, w); break;
    }
    // unify highlighted property
    Object.defineProperty(r, 'highlightedIndex', {
      get: function() { return r.hi; },
      set: function(v) { r.hi = v; }
    });
    return r;
  }

  return { create: create };
})();
