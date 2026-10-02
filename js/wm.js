/* =============================================================================
 *  wm.js — a very small Windows XP window manager.
 *  Pointer-event based so dragging works with a mouse, a trackpad or a finger.
 * ========================================================================== */

(function () {
  'use strict';

  var layer, taskbarStrip, desktopEl;
  var wins = [];
  var zTop = 100;
  var cascade = 0;
  var seq = 0;
  var listeners = {};
  var ghost;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
  function emit(evt, payload) {
    (listeners[evt] || []).forEach(function (fn) { fn(payload); });
  }

  function layerSize() {
    return {
      w: layer.clientWidth,
      h: layer.clientHeight
    };
  }

  /* ----------------------------- title bar -------------------------------- */
  function titlebarHtml(win) {
    var glyph = win.spec.iconHtml || '';
    return '' +
      '<div class="tb-icon">' + glyph + '</div>' +
      '<div class="tb-title">' + escapeHtml(win.spec.title || 'Window') + '</div>' +
      '<div class="tb-buttons">' +
        (win.spec.minimizable === false ? '' :
          '<button class="tb-btn tb-min" type="button" title="Minimize" aria-label="Minimize">' +
            '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="6" width="8" height="2.5" fill="#fff"/></svg>' +
          '</button>') +
        (win.spec.maximizable === false ? '' :
          '<button class="tb-btn tb-max" type="button" title="Maximize" aria-label="Maximize">' +
            '<svg viewBox="0 0 10 10" aria-hidden="true">' +
              '<rect x="1" y="1" width="8" height="8" fill="none" stroke="#fff" stroke-width="1.6"/>' +
              '<rect x="1" y="1" width="8" height="2.4" fill="#fff"/></svg>' +
          '</button>') +
        (win.spec.closable === false ? '' :
          '<button class="tb-btn tb-close" type="button" title="Close" aria-label="Close">' +
            '<svg viewBox="0 0 10 10" aria-hidden="true">' +
              '<path d="M1.4 1.4L8.6 8.6M8.6 1.4L1.4 8.6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>' +
          '</button>') +
      '</div>';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ------------------------------ open ------------------------------------ */
  function open(spec) {
    spec = spec || {};

    if (spec.singleton) {
      var existing = wins.filter(function (w) { return w.spec.appId === spec.appId; })[0];
      if (existing) {
        if (existing.minimized) restore(existing);
        focus(existing);
        if (spec.onReuse) spec.onReuse(existing);
        return existing;
      }
    }

    var size = layerSize();
    var w = Math.min(spec.width || 560, Math.max(280, size.w - 16));
    var h = Math.min(spec.height || 380, Math.max(180, size.h - 16));
    var x, y;

    if (spec.centered) {
      x = Math.max(0, Math.round((size.w - w) / 2));
      y = Math.max(0, Math.round((size.h - h) / 2.6));
    } else if (typeof spec.x === 'number') {
      x = spec.x; y = spec.y;
    } else {
      var step = 24;
      var slot = cascade % 6;
      x = 30 + slot * step;
      y = 24 + slot * step;
      if (x + w > size.w - 10) { x = Math.max(6, size.w - w - 10); }
      if (y + h > size.h - 10) { y = Math.max(6, size.h - h - 10); }
      cascade++;
    }

    var node = el('div', 'xp-window' + (spec.resizable === false ? ' no-resize' : ''));
    node.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;z-index:' + (++zTop);
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-label', spec.title || 'Window');

    if (spec.minWidth) node.style.minWidth = spec.minWidth + 'px';
    if (spec.minHeight) node.style.minHeight = spec.minHeight + 'px';

    var bar = spec.frame === false ? null : el('div', 'xp-titlebar');
    var body = el('div', 'xp-window-body' + (spec.bodyClass ? ' ' + spec.bodyClass : ''));

    if (bar) node.appendChild(bar);
    node.appendChild(body);

    if (spec.resizable !== false) {
      ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'].forEach(function (dir) {
        var g = el('div', 'xp-grip grip-' + dir);
        g.dataset.dir = dir;
        node.appendChild(g);
      });
    }

    layer.appendChild(node);

    var win = {
      id: 'win' + (++seq),
      spec: spec,
      el: node,
      body: body,
      titlebar: bar,
      minimized: false,
      maximized: false,
      restoreRect: null,
      active: false
    };

    if (bar) {
      bar.innerHTML = titlebarHtml(win);
      wireTitlebar(win, bar);
    }

    wins.push(win);
    focus(win);

    if (typeof spec.build === 'function') {
      try {
        spec.build(body, win);
      } catch (err) {
        body.innerHTML = '<pre style="padding:10px;color:#900;font:12px monospace;white-space:pre-wrap">' +
          escapeHtml('This app failed to start:\n' + (err && err.stack || err)) + '</pre>';
        if (window.console) console.error('[xp] app "' + spec.appId + '" threw:', err);
      }
    }

    addTaskButton(win);
    emit('open', win);
    applyFocusVisuals();
    return win;
  }

  /* ---------------------------- titlebar wiring --------------------------- */
  function wireTitlebar(win, bar) {
    var titleEl = bar.querySelector('.tb-title');
    var minBtn = bar.querySelector('.tb-min');
    var maxBtn = bar.querySelector('.tb-max');
    var closeBtn = bar.querySelector('.tb-close');

    if (minBtn) minBtn.addEventListener('click', function (e) { e.stopPropagation(); minimize(win); });
    if (maxBtn) maxBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMaximize(win); });
    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.stopPropagation(); win.close(); });

    bar.addEventListener('dblclick', function (e) {
      if (e.target.closest('.tb-btn')) return;
      if (win.spec.maximizable === false) return;
      toggleMaximize(win);
    });

    bar.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      if (e.target.closest('.tb-btn')) return;
      focus(win);
      startDrag(win, e);
    });

    win.setTitle = function (t) {
      win.spec.title = t;
      if (titleEl) titleEl.textContent = t;
      win.el.setAttribute('aria-label', t);
      var tb = taskbarStrip && taskbarStrip.querySelector('[data-win="' + win.id + '"] .task-btn-label');
      if (tb) tb.textContent = t;
    };
  }

  /* -------------------------------- drag ---------------------------------- */
  function startDrag(win, e) {
    if (win.maximized) {
      // un-maximize and keep the pointer over the title bar
      var ratio = (e.clientX - win.el.offsetLeft) / win.el.offsetWidth;
      var r = win.restoreRect;
      restore(win);
      win.el.style.left = Math.max(0, Math.round(e.clientX - r.w * ratio)) + 'px';
      win.el.style.top = Math.max(0, Math.round(e.clientY - 14)) + 'px';
    }

    var startX = e.clientX, startY = e.clientY;
    var startLeft = win.el.offsetLeft, startTop = win.el.offsetTop;
    var bar = win.titlebar;
    var size = layerSize();
    var snapping = false;

    if (bar.setPointerCapture) {
      try { bar.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }

    function move(ev) {
      var nx = startLeft + (ev.clientX - startX);
      var ny = startTop + (ev.clientY - startY);

      // keep at least a sliver of the title bar reachable
      ny = Math.max(-4, Math.min(size.h - 8, ny));
      nx = Math.max(-win.el.offsetWidth + 60, Math.min(size.w - 60, nx));

      win.el.style.left = nx + 'px';
      win.el.style.top = ny + 'px';

      var wantSnap = ev.clientY <= 2;
      if (wantSnap !== snapping) {
        snapping = wantSnap;
        showGhost(snapping ? 0 : -1, snapping ? 0 : -1, size.w, size.h);
      }
    }

    function up(ev) {
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', up);
      bar.removeEventListener('pointercancel', up);
      try { bar.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      hideGhost();
      if (snapping) maximize(win);
    }

    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up);
    bar.addEventListener('pointercancel', up);
  }

  function showGhost(x, y, w, h) {
    if (!ghost) { ghost = document.getElementById('drag-ghost'); }
    if (!ghost) return;
    ghost.style.cssText = 'display:block;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;';
  }
  function hideGhost() {
    if (!ghost) { ghost = document.getElementById('drag-ghost'); }
    if (ghost) ghost.style.display = 'none';
  }

  /* ------------------------------- resize --------------------------------- */
  function startResize(win, e, dir) {
    e.preventDefault();
    e.stopPropagation();
    focus(win);
    if (win.maximized) return;

    var grip = e.currentTarget;
    var startX = e.clientX, startY = e.clientY;
    var L = win.el.offsetLeft, T = win.el.offsetTop;
    var W = win.el.offsetWidth, H = win.el.offsetHeight;
    var minW = win.spec.minWidth || 240;
    var minH = win.spec.minHeight || 130;
    var size = layerSize();

    if (grip.setPointerCapture) {
      try { grip.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }

    function move(ev) {
      var dx = ev.clientX - startX, dy = ev.clientY - startY;
      var nL = L, nT = T, nW = W, nH = H;

      if (dir.indexOf('e') > -1) nW = Math.max(minW, Math.min(size.w - L, W + dx));
      if (dir.indexOf('s') > -1) nH = Math.max(minH, Math.min(size.h - T, H + dy));
      if (dir.indexOf('w') > -1) { nW = Math.max(minW, W - dx); nL = L + (W - nW); }
      if (dir.indexOf('n') > -1) { nH = Math.max(minH, H - dy); nT = T + (H - nH); }

      win.el.style.left = nL + 'px';
      win.el.style.top = nT + 'px';
      win.el.style.width = nW + 'px';
      win.el.style.height = nH + 'px';
      notifyResize(win);
    }

    function up(ev) {
      grip.removeEventListener('pointermove', move);
      grip.removeEventListener('pointerup', up);
      grip.removeEventListener('pointercancel', up);
      try { grip.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      notifyResize(win);
    }

    grip.addEventListener('pointermove', move);
    grip.addEventListener('pointerup', up);
    grip.addEventListener('pointercancel', up);
  }

  function notifyResize(win) {
    if (typeof win.spec.onResize === 'function') {
      try { win.spec.onResize(win); } catch (err) { /* ignore */ }
    }
    emit('resize', win);
  }

  /* ------------------------------- state ---------------------------------- */
  function focus(win) {
    if (!win || win.active) {
      if (win) win.el.style.zIndex = ++zTop;
      return;
    }
    wins.forEach(function (w) { w.active = false; });
    win.active = true;
    win.el.style.zIndex = ++zTop;
    applyFocusVisuals();
    if (typeof win.spec.onFocus === 'function') {
      try { win.spec.onFocus(win); } catch (err) { /* ignore */ }
    }
    emit('focus', win);
  }

  function applyFocusVisuals() {
    wins.forEach(function (w) {
      w.el.classList.toggle('is-blurred', !w.active);
      if (taskbarStrip) {
        var b = taskbarStrip.querySelector('[data-win="' + w.id + '"]');
        if (b) b.classList.toggle('is-active', w.active && !w.minimized);
      }
    });
  }

  function minimize(win) {
    win.minimized = true;
    win.el.classList.add('is-minimized');
    if (win.active) {
      var next = null;
      wins.forEach(function (w) { if (!w.minimized && w !== win) next = w; });
      if (next) focus(next);
      else { win.active = false; applyFocusVisuals(); }
    }
    emit('minimize', win);
    XP.audio.play('close');
  }

  function restore(win) {
    win.minimized = false;
    win.el.classList.remove('is-minimized');
    focus(win);
    emit('restore', win);
  }

  function maximize(win) {
    if (win.maximized) return;
    var size = layerSize();
    win.restoreRect = { x: win.el.offsetLeft, y: win.el.offsetTop, w: win.el.offsetWidth, h: win.el.offsetHeight };
    win.maximized = true;
    win.el.classList.add('is-maximized');
    win.el.style.left = '0px';
    win.el.style.top = '0px';
    win.el.style.width = size.w + 'px';
    win.el.style.height = size.h + 'px';
    var b = win.el.querySelector('.tb-max');
    if (b) {
      b.innerHTML = '<svg viewBox="0 0 10 10" aria-hidden="true">' +
        '<rect x="1.5" y="3.5" width="7" height="6" fill="none" stroke="#fff" stroke-width="1.5"/>' +
        '<path d="M0.5 6.5h6v-6" fill="none" stroke="#fff" stroke-width="1.5"/></svg>';
      b.title = 'Restore Down';
    }
    notifyResize(win);
  }

  function unmaximize(win) {
    if (!win.maximized) return;
    win.maximized = false;
    win.el.classList.remove('is-maximized');
    var r = win.restoreRect || { x: 40, y: 30, w: 620, h: 420 };
    win.el.style.left = r.x + 'px';
    win.el.style.top = r.y + 'px';
    win.el.style.width = r.w + 'px';
    win.el.style.height = r.h + 'px';
    var b = win.el.querySelector('.tb-max');
    if (b) {
      b.innerHTML = '<svg viewBox="0 0 10 10" aria-hidden="true">' +
        '<rect x="1" y="1" width="8" height="8" fill="none" stroke="#fff" stroke-width="1.6"/>' +
        '<rect x="1" y="1" width="8" height="2.4" fill="#fff"/></svg>';
      b.title = 'Maximize';
    }
    notifyResize(win);
  }

  function toggleMaximize(win) {
    if (win.maximized) unmaximize(win); else maximize(win);
    XP.audio.play('click');
  }

  function close(win) {
    if (typeof win.spec.onClose === 'function') {
      try { if (win.spec.onClose(win) === false) return; } catch (err) { /* ignore */ }
    }
    win.el.remove();
    wins = wins.filter(function (w) { return w !== win; });
    var b = taskbarStrip && taskbarStrip.querySelector('[data-win="' + win.id + '"]');
    if (b) b.remove();
    if (win.active) {
      var next = null;
      wins.forEach(function (w) { if (!w.minimized) next = w; });
      if (next) focus(next); else applyFocusVisuals();
    }
    emit('close', win);
    XP.audio.play('close');
  }

  /* ---------------------------- taskbar buttons --------------------------- */
  function addTaskButton(win) {
    if (!taskbarStrip) return;
    if (win.spec.frame === false) return; // frameless windows get no button

    var btn = document.createElement('button');
    btn.className = 'task-btn';
    btn.type = 'button';
    btn.dataset.win = win.id;
    btn.title = win.spec.title || '';
    btn.innerHTML = (win.spec.iconHtml || '') +
      '<span class="task-btn-label">' + escapeHtml(win.spec.title || '') + '</span>';
    btn.addEventListener('click', function () {
      if (win.minimized) { restore(win); return; }
      if (win.active) { minimize(win); } else { focus(win); }
    });
    taskbarStrip.appendChild(btn);
    taskbarStrip._buttons = taskbarStrip._buttons || [];
    taskbarStrip._buttons.push(btn);
    trimTaskbar();
  }

  function trimTaskbar() {
    if (!taskbarStrip) return;
    var btns = taskbarStrip.querySelectorAll('.task-btn');
    var max = Math.max(1, Math.floor((taskbarStrip.clientWidth - 8) / 60));
    Array.prototype.forEach.call(btns, function (b, i) {
      b.style.display = i < max ? '' : 'none';
    });
  }

  /* ------------------------------- public --------------------------------- */
  window.XP = window.XP || {};

  XP.wm = {
    init: function () {
      layer = document.getElementById('window-layer');
      taskbarStrip = document.getElementById('task-buttons');
      desktopEl = document.getElementById('desktop');

      // wires every resize grip in one delegated pass
      layer.addEventListener('pointerdown', function (e) {
        var grip = e.target.closest('.xp-grip');
        if (!grip) return;
        var node = grip.closest('.xp-window');
        var win = wins.filter(function (w) { return w.el === node; })[0];
        if (win) startResize(win, e, grip.dataset.dir);
      });

      // click anywhere in a window raises it
      layer.addEventListener('pointerdown', function (e) {
        var node = e.target.closest('.xp-window');
        if (!node) return;
        var win = wins.filter(function (w) { return w.el === node; })[0];
        if (win && !win.active) focus(win);
      }, true);

      window.addEventListener('resize', function () {
        var size = layerSize();
        wins.forEach(function (w) {
          if (w.maximized) {
            w.el.style.width = size.w + 'px';
            w.el.style.height = size.h + 'px';
          } else {
            var L = w.el.offsetLeft, T = w.el.offsetTop;
            w.el.style.left = Math.max(-w.el.offsetWidth + 60, Math.min(L, size.w - 60)) + 'px';
            w.el.style.top = Math.max(-4, Math.min(T, size.h - 8)) + 'px';
          }
          notifyResize(w);
        });
        trimTaskbar();
      });

      XP.wm.trimTaskbar = trimTaskbar;
    },
    open: open,
    close: close,
    focus: focus,
    minimize: minimize,
    restore: restore,
    maximize: maximize,
    unmaximize: unmaximize,
    toggleMaximize: toggleMaximize,
    on: on,
    list: function () { return wins.slice(); },
    get layer() { return layer; },
    get desktopEl() { return desktopEl; },
    escapeHtml: escapeHtml,
    /** bring every window to the top of the z-stack, front to back */
    cascadeAll: function () {
      wins.forEach(function (w, i) { w.el.style.zIndex = 100 + i; });
      zTop = 100 + wins.length;
    }
  };

  /* win.close() is used pervasively by apps */
  XP.wm.open = (function (orig) {
    return function (spec) {
      var win = orig(spec);
      win.close = function () { close(win); };
      win.minimize = function () { minimize(win); };
      win.focusSelf = function () { focus(win); };
      win.maximize = function () { maximize(win); };
      win.restoreDown = function () { unmaximize(win); };
      win.toggleMaximize = function () { toggleMaximize(win); };
      return win;
    };
  })(open);
})();
