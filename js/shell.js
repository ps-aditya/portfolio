/* =============================================================================
 *  shell.js — desktop icons, taskbar, Start menu, context menu, tray, shortcuts
 * ========================================================================== */

(function () {
  'use strict';

  var D = window.XP_DATA;
  var C = D.config;

  var desktop, iconLayer, startBtn, startMenu, ctxMenu, tray, clockEl, tooltip;
  var desktopIcons = [];
  var startOpen = false;

  /* ------------------------------ app registry ---------------------------- */
  var apps = {};
  window.XP = window.XP || {};
  XP.apps = apps;

  XP.defineApp = function (id, cfg) { apps[id] = cfg; };

  XP.launch = function (id, arg) {
    var app = apps[id];
    if (!app) return null;
    if (app.available === false) return null;
    return app.launch(arg);
  };

  function appLabel(id) { return (apps[id] && apps[id].title) || id; }

  /* ------------------------------ utilities ------------------------------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) { return XP.wm.escapeHtml(s); }

  var tipTimer = null;
  function showTip(target, text) {
    if (!tooltip) return;
    clearTimeout(tipTimer);
    tipTimer = setTimeout(function () {
      tooltip.textContent = text;
      tooltip.style.display = 'block';
      var r = target.getBoundingClientRect();
      var t = tooltip.getBoundingClientRect();
      var x = Math.min(window.innerWidth - t.width - 4, Math.max(4, r.left));
      var y = r.bottom + 4;
      if (y + t.height > window.innerHeight - 4) y = r.top - t.height - 4;
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    }, 550);
  }
  function hideTip() {
    clearTimeout(tipTimer);
    if (tooltip) tooltip.style.display = 'none';
  }

  /* ---------------------------- desktop icons ----------------------------- */
  var ICON_LAYOUT = [
    { label: 'My Computer', icon: 'computer', action: function () { XP.launch('explorer', { path: 'C:\\' }); } },
    { label: 'My Documents', icon: 'folder', action: function () { XP.launch('explorer', { path: D.home }); } },
    { label: 'Command Prompt', icon: 'terminal', action: function () { XP.launch('terminal'); } },
    { label: 'My Web Browser', icon: 'browser', action: function () { XP.launch('browser'); } },
    { label: 'Read Me.txt', icon: 'file', action: function () { XP.launch('notepad', 'C:\\Documents and Settings\\Aditya\\My Documents\\Read Me.txt'); } },
    { label: 'Minesweeper', icon: 'mine', action: function () { XP.launch('minesweeper'); } },
    { label: 'Recycle Bin', icon: 'recycle', action: function () { XP.launch('recyclebin'); } }
  ];

  function buildDesktop() {
    iconLayer.innerHTML = '';
    desktopIcons = [];

    ICON_LAYOUT.forEach(function (spec) {
      var node = el('button', 'xp-icon');
      node.type = 'button';
      node.setAttribute('role', 'listitem');
      node.innerHTML = window.XP_ICONS.get(spec.icon) +
        '<span class="xp-icon-label">' + esc(spec.label) + '</span>';
      node.addEventListener('click', function (e) {
        e.stopPropagation();
        selectOnly(node);
      });
      node.addEventListener('dblclick', function () { XP.audio.play('open'); spec.action(); });
      node.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); spec.action(); }
      });
      node.addEventListener('mouseenter', function () { showTip(node, spec.label); });
      node.addEventListener('mouseleave', hideTip);
      iconLayer.appendChild(node);
      desktopIcons.push(node);
    });
  }

  function selectOnly(node) {
    desktopIcons.forEach(function (n) { n.classList.toggle('is-selected', n === node); });
  }

  function clearSelection() {
    desktopIcons.forEach(function (n) { n.classList.remove('is-selected'); });
  }

  /* ------------------------------ start menu ------------------------------ */
  var START_ITEMS = [
    {
      type: 'item', label: 'Programs', icon: 'docs', submenu: [
        { type: 'item', label: 'Terminal', icon: 'terminal', run: function () { XP.launch('terminal'); } },
        { type: 'item', label: 'Notepad', icon: 'notepad', run: function () { XP.launch('notepad'); } },
        { type: 'item', label: 'My Web Browser', icon: 'browser', run: function () { XP.launch('browser'); } },
        { type: 'item', label: 'Minesweeper', icon: 'mine', run: function () { XP.launch('minesweeper'); } },
        { type: 'item', label: 'My Computer', icon: 'computer', run: function () { XP.launch('explorer', { path: 'C:\\' }); } }
      ]
    },
    {
      type: 'item', label: 'My Documents', icon: 'folder', run: function () { XP.launch('explorer', { path: D.home }); } },
    {
      type: 'item', label: 'My Computer', icon: 'computer', run: function () { XP.launch('explorer', { path: 'C:\\' }); } },
    { type: 'sep' },
    {
      type: 'item', label: 'Search', icon: 'search', submenu: [
        { type: 'item', label: 'Projects...', run: function () { XP.launch('terminal', 'projects'); } },
        { type: 'item', label: 'Skills...', run: function () { XP.launch('terminal', 'skills'); } },
        { type: 'item', label: 'Resume...', run: function () { XP.launch('terminal', 'resume'); } }
      ]
    },
    { type: 'item', label: 'Run...', icon: 'go', run: function () { runDialog(); } },
    { type: 'sep' },
    { type: 'item', label: 'Log Off ' + C.name + '...', icon: 'avatar', run: function () { lockSession(); } },
    { type: 'item', label: 'Turn Off Computer...', icon: 'shutdown', run: function () { turnOff(); } }
  ];

  var START_SIDE = [
    { type: 'item', label: 'My Documents', icon: 'folder', run: function () { XP.launch('explorer', { path: D.home }); } },
    { type: 'item', label: 'My Computer', icon: 'computer', run: function () { XP.launch('explorer', { path: 'C:\\' }); } },
    { type: 'item', label: 'Help and Support', icon: 'info', run: function () { XP.launch('terminal', 'help'); } }
  ];

  function buildStartMenu() {
    startMenu.innerHTML = '';

    var back = el('div', 'sm-back');
    back.innerHTML = '<div style="width:3px;margin:0 auto;background:#fff;box-shadow:0 -22px 0 #fff,0 22px 0 #fff;height:2px;margin-top:9px"></div>';

    var body = el('div', 'sm-body');

    var head = el('div', 'sm-head');
    head.innerHTML = window.XP_ICONS.get('avatar') +
      '<div><div class="sm-user">' + esc(C.name) + '</div>' +
      '<div class="sm-sub">' + esc(C.tagline.length > 42 ? C.tagline.slice(0, 40) + '...' : C.tagline) + '</div></div>';
    body.appendChild(head);

    var items = el('div', 'sm-items');
    START_ITEMS.forEach(function (it) { items.appendChild(renderMenuItem(it, true)); });
    body.appendChild(items);

    startMenu.appendChild(back);
    startMenu.appendChild(body);

    var foot = el('div', 'sm-footer');
    [
      { icon: 'docs', title: 'My Documents', run: function () { XP.launch('explorer', { path: D.home }); } },
      { icon: 'computer', title: 'My Computer', run: function () { XP.launch('explorer', { path: 'C:\\' }); } },
      { icon: 'search', title: 'Search', run: function () { XP.launch('terminal', 'projects'); } },
      { icon: 'shutdown', title: 'Turn Off Computer', run: turnOff }
    ].forEach(function (b) {
      var btn = el('button');
      btn.type = 'button';
      btn.title = b.title;
      btn.innerHTML = window.XP_ICONS.get(b.icon);
      btn.addEventListener('click', function (e) { e.stopPropagation(); closeStart(); b.run(); });
      foot.appendChild(btn);
    });
    startMenu.appendChild(foot);

    // the right-hand "sidebar" of XP's start menu, folded into the footer row
    back.addEventListener('click', function () {
      // clicking the XP sidebar re-renders it as the classic Programs column
      showProgramsColumn();
    });
  }

  function showProgramsColumn() {
    var items = startMenu.querySelector('.sm-items');
    if (!items) return;
    items.innerHTML = '';
    START_SIDE.forEach(function (it) { items.appendChild(renderMenuItem(it, true)); });
    startMenu.querySelector('.sm-head').style.display = 'none';
  }

  var openSubmenu = null;
  function closeSubmenus() {
    if (openSubmenu) { openSubmenu.remove(); openSubmenu = null; }
  }

  function renderMenuItem(spec, inStart) {
    if (spec.type === 'sep') return el('div', 'menu-sep');

    var node = el('div', 'menu-item' + (spec.disabled ? ' is-disabled' : ''));
    node.setAttribute('role', 'menuitem');
    node.tabIndex = 0;

    var glyph = inStart ? window.XP_ICONS.get(spec.icon || 'page') : window.XP_ICONS.get(spec.icon || 'page');
    node.innerHTML = glyph +
      '<span class="mi-label"><span>' + esc(spec.label) + '</span>' +
      (spec.sub ? '<span class="mi-sub">' + (spec.subtitle || 'submenu') + '</span>' : '') + '</span>' +
      (spec.submenu ? '<span class="mi-arrow">&#9654;</span>' : '');

    function enter() {
      if (openSubmenu && openSubmenu.dataset.owner === spec.label) return;
      closeSubmenus();
      if (!spec.submenu) return;
      var sub = el('div', 'menu-item-flyout');
      sub.dataset.owner = spec.label;
      sub.style.cssText = 'position:absolute;z-index:6401;min-width:180px;padding:2px;' +
        'background:var(--face);border:1px solid #7a9db9;box-shadow:3px 3px 6px rgba(0,0,0,.35);';
      spec.submenu.forEach(function (child) { sub.appendChild(renderMenuItem(child, false)); });
      var r = node.getBoundingClientRect();
      sub.style.left = (r.right - 3) + 'px';
      sub.style.top = (r.top - 3) + 'px';
      document.body.appendChild(sub);
      openSubmenu = sub;
    }

    node.addEventListener('mouseenter', enter);
    node.addEventListener('focus', enter);
    node.addEventListener('click', function (e) {
      e.stopPropagation();
      if (spec.submenu) { enter(); return; }
      if (spec.disabled) return;
      closeAllMenus();
      if (spec.run) XP.audio.play('open'), spec.run();
    });
    node.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); node.click(); }
    });
    return node;
  }

  function closeAllMenus() {
    closeStart();
    closeCtx();
    closeSubmenus();
  }

  function toggleStart() {
    if (startOpen) closeStart(); else openStart();
  }
  function openStart() {
    startMenu.classList.add('is-open');
    startBtn.classList.add('is-open');
    startBtn.setAttribute('aria-expanded', 'true');
    startOpen = true;
  }
  function closeStart() {
    startMenu.classList.remove('is-open');
    startBtn.classList.remove('is-open');
    startBtn.setAttribute('aria-expanded', 'false');
    startOpen = false;
    var head = startMenu.querySelector('.sm-head');
    if (head) head.style.display = '';
  }

  /* ---------------------------- context menu ------------------------------ */
  var CONTEXT_ITEMS = [
    { type: 'item', label: 'Open Command Prompt', icon: 'terminal', run: function () { XP.launch('terminal'); } },
    { type: 'sep' },
    {
      type: 'item', label: 'View', icon: 'docs', submenu: [
        { type: 'item', label: 'Luna (default)', run: function () { setTheme('luna'); } },
        { type: 'item', label: 'Bliss', run: function () { setTheme('bliss'); } }
      ]
    },
    { type: 'item', label: 'Refresh', icon: 'refresh', run: function () { XP.audio.play('click'); flashDesktop(); } },
    { type: 'item', label: 'Select all icons', icon: 'page', run: function () { desktopIcons.forEach(function (n) { n.classList.add('is-selected'); }); } },
    { type: 'sep' },
    { type: 'item', label: 'About this computer', icon: 'info', run: function () { XP.launch('about'); } },
    { type: 'item', label: 'Properties', icon: 'computer', run: function () { propertiesDialog(); } }
  ];

  function openCtx(x, y) {
    ctxMenu.innerHTML = '';
    CONTEXT_ITEMS.forEach(function (it) { ctxMenu.appendChild(renderMenuItem(it, false)); });
    ctxMenu.style.left = '0px';
    ctxMenu.style.top = '0px';
    ctxMenu.classList.add('is-open');

    var r = ctxMenu.getBoundingClientRect();
    var left = Math.min(x, window.innerWidth - r.width - 4);
    var top = Math.min(y, window.innerHeight - r.height - 4);
    ctxMenu.style.left = Math.max(2, left) + 'px';
    ctxMenu.style.top = Math.max(2, top) + 'px';
  }
  function closeCtx() { ctxMenu.classList.remove('is-open'); closeSubmenus(); }

  function flashDesktop() {
    var w = document.getElementById('wallpaper');
    w.style.transition = 'opacity .12s';
    w.style.opacity = '.45';
    setTimeout(function () { w.style.opacity = ''; }, 130);
  }

  /* ----------------------------- dialogs ---------------------------------- */
  function dialog(spec) {
    return XP.wm.open({
      appId: 'dialog-' + (spec.id || 'generic'),
      title: spec.title || 'Windows',
      icon: spec.icon || 'info',
      width: spec.width || 400,
      height: spec.height || 220,
      resizable: false,
      minimizable: false,
      maximizable: false,
      centered: true,
      singleton: false,
      build: function (body, win) {
        var shell = el('div', 'dialog-shell');
        var msg = el('div', 'dialog-msg');
        msg.innerHTML = '<div class="d-ico">' + window.XP_ICONS.get(spec.icon || 'info') + '</div>' +
          '<div class="d-txt">' + (spec.html || esc(spec.text || '')) + '</div>';
        shell.appendChild(msg);
        body.appendChild(shell);

        var actions = el('div', 'dialog-actions');
        (spec.buttons || [{ label: 'OK', primary: true }]).forEach(function (b) {
          var btn = el('button', 'xp-btn', esc(b.label));
          btn.type = 'button';
          btn.addEventListener('click', function () {
            if (b.run) b.run();
            if (b.close !== false) win.close();
          });
          actions.appendChild(btn);
        });
        body.appendChild(actions);

        win.el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); win.close(); }
          if (e.key === 'Escape') { e.preventDefault(); win.close(); }
        });
        setTimeout(function () {
          var first = body.querySelector('.xp-btn');
          if (first) first.focus();
        }, 40);
      }
    });
  }

  function propertiesDialog() {
    var w = document.getElementById('desktop').clientWidth;
    var h = document.getElementById('desktop').clientHeight;
    dialog({
      id: 'props',
      title: 'System Properties',
      icon: 'computer',
      width: 380,
      html:
        '<b>Computer:</b> ' + esc(C.name) + '<br>' +
        '<b>OS:</b> Windows XP Professional (vanilla build, 2001 aesthetic)<br>' +
        '<b>Memory:</b> ' + (navigator.deviceMemory || 8) + ' GB' +
        '<br><b>Processor:</b> ' + (navigator.hardwareConcurrency || 4) + ' logical cores' +
        '<br><b>Display:</b> ' + w + ' x ' + h +
        '<br><b>Shell:</b> xp-sh 1.0 (vanilla JS, ' + (window.XP_ICONS ? 'no framework' : '') + ')',
      buttons: [{ label: 'OK', primary: true }]
    });
  }

  function runDialog() {
    dialog({
      id: 'run',
      title: 'Run',
      icon: 'go',
      width: 360,
      height: 190,
      html: '<label class="field-label" for="run-cmd">What do you want to open?</label>' +
        '<input class="xp-input" id="run-cmd" value="cmd.exe" spellcheck="false">',
      buttons: [
        {
          label: 'OK',
          run: function () {
            var v = (document.getElementById('run-cmd') || {}).value || '';
            runCommand(v.trim());
          }
        },
        { label: 'Cancel' }
      ]
    });
  }

  function runCommand(v) {
    var s = v.toLowerCase();
    if (s === 'cmd.exe' || s === 'cmd' || s === 'command.com' || s === 'terminal') return XP.launch('terminal');
    if (s === 'notepad.exe' || s === 'notepad') return XP.launch('notepad');
    if (s === 'explorer.exe' || s === 'explorer') return XP.launch('explorer', { path: D.home });
    if (s === 'winmine.exe' || s === 'minesweeper.exe') return XP.launch('minesweeper');
    if (s === 'msiexec.exe' || s === 'iexplore.exe') return XP.launch('browser');
    if (/\.(txt|md)$/i.test(s)) return XP.launch('notepad', D.home + '\\' + s);
    dialog({
      id: 'runerr', title: 'Run', icon: 'error', width: 380,
      html: 'Cannot find the file <b>' + esc(v || '(empty)') + '</b>. Make sure you typed the name correctly, ' +
        'and then try again.<br><br><small>Try <code>cmd.exe</code>, <code>notepad.exe</code> or ' +
        '<code>explorer.exe</code>.</small>',
      buttons: [{ label: 'OK', primary: true }]
    });
  }

  function lockSession() {
    closeAllMenus();
    XP.wm.list().forEach(function (w) { w.close(); });
    document.dispatchEvent(new CustomEvent('xp:lock'));
  }

  function turnOff() {
    closeAllMenus();
    dialog({
      id: 'shutdown', title: 'Shut Down Windows', icon: 'shutdown', width: 380, height: 200,
      html: 'Are you sure you want to shut down?<br><br>' +
        '<small>Tip: shutting down just restarts the boot sequence. Nothing is lost, ' +
        'because none of this was ever really on.</small>',
      buttons: [
        {
          label: 'Shut Down',
          run: function () {
            XP.wm.list().forEach(function (w) { w.close(); });
            document.dispatchEvent(new CustomEvent('xp:shutdown'));
          }
        },
        { label: 'Cancel' }
      ]
    });
  }

  /* ------------------------------- theme ---------------------------------- */
  function setTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
    try { localStorage.setItem('xp-theme', name); } catch (e) { /* private mode */ }
    closeAllMenus();
  }
  function loadTheme() {
    var saved = null;
    try { saved = localStorage.getItem('xp-theme'); } catch (e) { /* ignore */ }
    if (saved === 'luna' || saved === 'bliss') document.documentElement.setAttribute('data-theme', saved);
  }

  /* ------------------------------- clock ---------------------------------- */
  function tickClock() {
    var d = new Date();
    var h12 = d.getHours() % 12 || 12;
    var ampm = d.getHours() < 12 ? 'AM' : 'PM';
    var text = h12 + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + ampm;
    clockEl.textContent = text;
    clockEl.title = C.name + '\n' + d.toDateString() + '\n\nSession uptime: ' + uptime();
  }

  function uptime() {
    var s = Math.floor((Date.now() - (window.__xpBoot || Date.now())) / 1000);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h) return h + 'h ' + m + 'm';
    if (m) return m + 'm ' + sec + 's';
    return sec + 's';
  }
  XP.uptime = uptime;

  /* ------------------------------ shortcuts ------------------------------- */
  function wireShortcuts() {
    startBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleStart(); });

    document.addEventListener('pointerdown', function (e) {
      if (!e.target.closest('#start-menu') && !e.target.closest('#start-button')) closeStart();
      if (!e.target.closest('#context-menu') && !e.target.closest('.menu-item-flyout')) closeCtx();
    });

    // Right-click on the wallpaper opens the desktop menu. Windows sit in a
    // layer above #icon-layer, so this has to listen on #desktop itself.
    desktop.addEventListener('contextmenu', function (e) {
      if (e.target.closest('.xp-window')) return; // apps handle their own
      e.preventDefault();
      var node = e.target.closest('.xp-icon');
      if (node) selectOnly(node); else clearSelection();
      openCtx(e.clientX, e.clientY);
    });

    iconLayer.addEventListener('pointerdown', function (e) {
      if (!e.target.closest('.xp-icon')) clearSelection();
    });

    document.addEventListener('keydown', function (e) {
      var key = e.key;

      // Windows key or Ctrl+Escape opens the Start menu
      if (key === 'Meta' || (key === 'Escape' && e.ctrlKey)) {
        e.preventDefault();
        toggleStart();
        return;
      }

      // Ctrl+Escape in most XP installs is "Start"; plain Escape closes menus
      if (key === 'Escape') { closeAllMenus(); return; }

      // Win+L locks, like it used to
      if ((key === 'l' || key === 'L') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); lockSession(); return; }

      // Alt+F4 closes the active window
      if (key === 'F4' && e.altKey) {
        e.preventDefault();
        var active = XP.wm.list().filter(function (w) { return w.active; })[0];
        if (active) active.close();
        else lockSession();
        return;
      }

      // Ctrl+Alt+Del -> the security dialog, for the nostalgia
      if (e.ctrlKey && e.altKey && (key === 'Delete' || key === 'Backspace')) {
        e.preventDefault();
        securityDialog();
      }
    });
  }

  function securityDialog() {
    XP.wm.open({
      appId: 'security',
      title: 'Windows Security',
      icon: 'warning',
      width: 360,
      height: 190,
      resizable: false,
      minimizable: false,
      maximizable: false,
      centered: true,
      build: function (body, win) {
        body.innerHTML =
          '<div class="dialog-shell"><div class="dialog-msg">' +
          '<div class="d-ico">' + window.XP_ICONS.get('warning') + '</div>' +
          '<div class="d-txt"><b>Windows Security</b><br>' +
          'This site has no cookies, no trackers and no network calls. ' +
          'Your only threat is the minesweeper grid.</div></div></div>' +
          '<div class="dialog-actions">' +
          '<button class="xp-btn" type="button" data-a="close">Close</button></div>';
        body.querySelector('[data-a="close"]').addEventListener('click', function () { win.close(); });
      }
    });
  }

  /* ------------------------------- init ----------------------------------- */
  function init() {
    desktop = document.getElementById('desktop');
    iconLayer = document.getElementById('icon-layer');
    startBtn = document.getElementById('start-button');
    startMenu = document.getElementById('start-menu');
    ctxMenu = document.getElementById('context-menu');
    tray = document.getElementById('tray');
    clockEl = document.getElementById('clock');
    tooltip = document.getElementById('tooltip');

    loadTheme();
    buildDesktop();
    buildStartMenu();
    wireShortcuts();

    var soundBtn = document.getElementById('tray-sound');
    function paintSound() {
      var on = XP.audio.isEnabled();
      soundBtn.innerHTML = window.XP_ICONS.get(on ? 'speakerOn' : 'speakerOff');
      soundBtn.classList.toggle('is-off', !on);
      soundBtn.title = on ? 'Sound: on' : 'Sound: off (click to enable)';
    }
    soundBtn.addEventListener('click', function () {
      var next = !XP.audio.isEnabled();
      XP.audio.setEnabled(next);
      try { localStorage.setItem('xp-sound', next ? '1' : '0'); } catch (e) { /* ignore */ }
      paintSound();
      if (next) XP.audio.play('ding');
    });
    paintSound();
    XP.shellRefreshSound = paintSound;

    document.getElementById('tray-net').innerHTML = window.XP_ICONS.get('network');
    document.getElementById('tray-net').title = 'Local Area Connection\nConnected';

    document.getElementById('show-desktop').addEventListener('click', function () {
      var visible = XP.wm.list().filter(function (w) { return !w.minimized; });
      if (visible.length) visible.forEach(function (w) { w.minimize(); });
      else XP.wm.list().forEach(function (w) { w.restore(); });
    });

    tickClock();
    setInterval(tickClock, 5000);

    window.addEventListener('blur', hideTip);
  }

  window.XP = window.XP || {};
  XP.shell = {
    init: init,
    dialog: dialog,
    runDialog: runDialog,
    lock: lockSession,
    setTheme: setTheme,
    closeAllMenus: closeAllMenus
  };
})();
