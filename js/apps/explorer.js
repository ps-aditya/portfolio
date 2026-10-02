/* =============================================================================
 *  apps/explorer.js — My Computer / Windows Explorer over the virtual file system
 * ========================================================================== */

(function () {
  'use strict';

  var D = window.XP_DATA;
  var FS = XP.fs;

  function esc(s) { return XP.wm.escapeHtml(s); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* the root of C:\ gets the XP treatment: drives, not folders */
  function isDriveRoot(path) {
    return /^c:\\?$/i.test(FS.normalize(path));
  }

  function Explorer(win, startPath, details) {
    this.win = win;
    this.path = FS.resolve(startPath || D.home, '');
    this.details = !!details;
    this.history = [this.path];
    this.hIndex = 0;
    this.selected = null;
    this.build();
    this.render();
  }

  Explorer.prototype.build = function () {
    var self = this;
    var root = el('div', 'explorer');

    /* menu bar */
    var menu = el('div', 'menu-bar');
    [
      ['File', [
        ['Open', function () { self.openSelected(); }],
        ['-'],
        ['Close', function () { self.win.close(); }]
      ]],
      ['Edit', [
        ['Select All', function () { self.selectAll(); }],
        ['Invert Selection', function () { self.invertSelection(); }]
      ]],
      ['View', [
        ['Large Icons', function () { self.setDetails(false); }],
        ['Details', function () { self.setDetails(true); }],
        ['-'],
        ['Refresh', function () { self.render(); }]
      ]],
      ['Help', [
        ['About Windows Explorer', function () { self.about(); }]
      ]]
    ].forEach(function (pair) {
      var item = el('span', 'mb-item', esc(pair[0]));
      item.addEventListener('click', function () { self.showDropdown(item, pair[1]); });
      menu.appendChild(item);
    });
    root.appendChild(menu);

    /* toolbar + address bar */
    var bar = el('div', 'toolbar');
    bar.innerHTML =
      '<button class="tool-btn" data-a="back" title="Back" aria-label="Back">' + XP_ICONS.get('back') + '</button>' +
      '<button class="tool-btn" data-a="forward" title="Forward" aria-label="Forward">' + XP_ICONS.get('forward') + '</button>' +
      '<button class="tool-btn" data-a="up" title="Up One Level" aria-label="Up one level">' + XP_ICONS.get('up') + '</button>' +
      '<span class="tool-sep"></span>' +
      '<button class="tool-btn" data-a="views" title="Toggle view" aria-label="Toggle view">' + XP_ICONS.get('docs') + '</button>' +
      '<span class="tool-sep"></span>';
    var addr = el('div', 'ex-addr');
    addr.innerHTML = '<label for="ex-addr-' + this.win.id + '">Address</label>';
    var addrInput = el('input');
    addrInput.type = 'text';
    addrInput.id = 'ex-addr-' + this.win.id;
    addrInput.spellcheck = false;
    addrInput.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var p = FS.resolve(self.path, addrInput.value);
      self.go(p);
    });
    addr.appendChild(addrInput);
    root.appendChild(bar);
    root.appendChild(addr);
    this.addrInput = addrInput;

    /* main split */
    var main = el('div', 'ex-main');

    var side = el('div', 'ex-side');
    side.innerHTML = '<div class="ex-side-title">Folders</div>';
    var sideItems = [
      ['Desktop', 'folder'],
      ['My Documents', 'folder'],
      ['My Computer', 'computer'],
      ['My Web Browser', 'browser'],
      ['Recycle Bin', 'recycle']
    ];
    sideItems.forEach(function (s, i) {
      var node = el('div', 'ex-folder');
      node.innerHTML = XP_ICONS.get(s[1]) + '<span>' + esc(s[0]) + '</span>';
      node.tabIndex = 0;
      node.addEventListener('click', function () { self.jump(s[0]); });
      node.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') self.jump(s[0]);
      });
      side.appendChild(node);
      if (i === 1) {
        var sub = el('div', 'ex-folder is-indented');
        sub.innerHTML = XP_ICONS.get('folder') + '<span>Projects</span>';
        sub.tabIndex = 0;
        sub.addEventListener('click', function () { self.go(FS.join(D.home, 'Projects')); });
        sub.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') self.go(FS.join(D.home, 'Projects'));
        });
        side.appendChild(sub);
      }
    });
    main.appendChild(side);

    var list = el('div', 'ex-list scroller');
    list.setAttribute('role', 'listbox');
    list.addEventListener('pointerdown', function (e) {
      if (!e.target.closest('.ex-item') && !e.target.closest('.ex-details-row')) self.select(null);
    });
    main.appendChild(list);

    root.appendChild(main);
    this.list = list;
    this.side = side;

    /* status bar */
    var status = el('div', 'status-bar');
    status.innerHTML = '<div class="status-cell grow" data-a="count">0 objects</div>' +
      '<div class="status-cell" data-a="sel">&nbsp;</div>';
    root.appendChild(status);
    this.status = status;

    this.win.body.appendChild(root);
    this.root = root;

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-a]');
      if (!btn) return;
      var a = btn.dataset.a;
      if (a === 'back') self.back();
      if (a === 'forward') self.forward();
      if (a === 'up') self.go(FS.parent(self.path));
      if (a === 'views') self.setDetails(!self.details);
    });
  };

  Explorer.prototype.showDropdown = function (anchor, items) {
    var self = this;
    document.querySelectorAll('.explorer-dropdown').forEach(function (n) { n.remove(); });
    anchor.classList.add('is-open');
    var drop = el('div', 'menu-item-flyout explorer-dropdown');
    drop.style.cssText = 'position:absolute;z-index:5000;min-width:160px;padding:2px;background:var(--face);' +
      'border:1px solid #7a9db9;box-shadow:2px 2px 5px rgba(0,0,0,.3);font-size:11px;';
    items.forEach(function (it) {
      if (it[0] === '-') { drop.appendChild(el('div', 'menu-sep')); return; }
      var row = el('div', 'menu-item');
      row.style.padding = '4px 12px';
      row.textContent = it[0];
      row.addEventListener('click', function (e) {
        e.stopPropagation();
        document.querySelectorAll('.explorer-dropdown').forEach(function (n) { n.remove(); });
        anchor.classList.remove('is-open');
        it[1]();
      });
      drop.appendChild(row);
    });
    var host = this.win.el.getBoundingClientRect();
    var r = anchor.getBoundingClientRect();
    drop.style.left = (r.left - host.left) + 'px';
    drop.style.top = (r.bottom - host.top) + 'px';
    this.win.body.appendChild(drop);

    var off = function (e) {
      if (e.target.closest('.explorer-dropdown') || e.target.closest('.menu-bar')) return;
      drop.remove();
      anchor.classList.remove('is-open');
      document.removeEventListener('pointerdown', off);
    };
    setTimeout(function () { document.addEventListener('pointerdown', off); }, 0);
  };

  /* ----------------------------- navigation -------------------------------- */
  Explorer.prototype.jump = function (label) {
    if (label === 'Desktop') return XP.launch('explorer', { path: D.home });
    if (label === 'My Documents') return this.go(D.home);
    if (label === 'My Computer') return this.go('C:\\');
    if (label === 'Recycle Bin') return XP.launch('recyclebin');
    if (label === 'My Web Browser') return XP.launch('browser');
  };

  Explorer.prototype.go = function (path) {
    var p = FS.resolve(this.path, path);
    if (!FS.node(p)) {
      XP.audio.play('error');
      XP.shell.dialog({
        title: 'Windows Explorer', icon: 'error', width: 360,
        html: 'Windows cannot find <b>' + esc(path) + '</b>.<br>Check the spelling and try again.',
        buttons: [{ label: 'OK', primary: true }]
      });
      return;
    }
    if (FS.node(p).kind !== 'folder') {
      return XP.launch('notepad', p);
    }
    this.path = p;
    this.selected = null;
    this.history = this.history.slice(0, this.hIndex + 1);
    this.history.push(p);
    this.hIndex = this.history.length - 1;
    this.render();
  };

  Explorer.prototype.back = function () {
    if (this.hIndex <= 0) return;
    this.hIndex--;
    this.path = this.history[this.hIndex];
    this.render();
  };
  Explorer.prototype.forward = function () {
    if (this.hIndex >= this.history.length - 1) return;
    this.hIndex++;
    this.path = this.history[this.hIndex];
    this.render();
  };

  /* ------------------------------- rendering ------------------------------- */
  Explorer.prototype.setDetails = function (on) {
    this.details = !!on;
    this.render();
  };

  Explorer.prototype.select = function (name) {
    this.selected = name;
    this.list.querySelectorAll('.is-selected').forEach(function (n) { n.classList.remove('is-selected'); });
    if (!name) {
      this.status.querySelector('[data-a="sel"]').innerHTML = '&nbsp;';
      return;
    }
    var node = this.list.querySelector('[data-name="' + CSS.escape(name) + '"]');
    if (node) node.classList.add('is-selected');
    var found = FS.node(FS.join(this.path, name));
    var type = found ? FS.typeLabel(found) : '';
    this.status.querySelector('[data-a="sel"]').textContent = type;
  };

  Explorer.prototype.selectAll = function () {
    this.list.querySelectorAll('[data-name]').forEach(function (n) { n.classList.add('is-selected'); });
  };
  Explorer.prototype.invertSelection = function () {
    this.list.querySelectorAll('[data-name]').forEach(function (n) { n.classList.toggle('is-selected'); });
  };

  Explorer.prototype.openSelected = function () {
    if (!this.selected) return;
    var p = FS.join(this.path, this.selected);
    var n = FS.node(p);
    if (!n) return;
    if (n.kind === 'folder') this.go(p);
    else if (n.app) XP.launch(n.app, { path: p });
    else XP.launch('notepad', p);
  };

  Explorer.prototype.about = function () {
    XP.shell.dialog({
      title: 'About Windows Explorer', icon: 'computer', width: 360,
      html: 'This file system is a plain JS object literal in <code>js/data.js</code>. ' +
        'There is no backend - every file you open is a string in the bundle.',
      buttons: [{ label: 'OK', primary: true }]
    });
  };

  Explorer.prototype.render = function () {
    var self = this;
    this.addrInput.value = this.path;
    this.win.setTitle(this.path);
    this.list.classList.toggle('in-details', this.details);
    this.list.innerHTML = '';

    var rows;

    if (isDriveRoot(this.path)) {
      rows = [
        { name: 'Local Disk (C:)', kind: 'folder', icon: 'drive', real: 'C:\\' },
        { name: 'Floppy Drive (A:)', kind: 'folder', icon: 'drive', fake: 'Insert a floppy disk to continue.' },
        { name: 'Control Panel', kind: 'folder', icon: 'folder', fake: 'Nothing to configure here.' },
        { name: 'Documents and Settings', kind: 'folder', icon: 'folder', real: FS.join('C:\\', 'Documents and Settings') }
      ];
    } else {
      var kids = FS.list(this.path) || [];
      rows = kids.map(function (k) {
        return {
          name: k.name,
          kind: k.kind,
          icon: k.kind === 'folder' ? 'folder' : (k.app ? 'fileApp' : 'file'),
          app: k.app,
          node: k
        };
      });
    }

    if (!rows.length) {
      this.list.appendChild(el('div', 'ex-empty',
        XP_ICONS.get('folder') + '<span>This folder is empty.</span>'));
      this.status.querySelector('[data-a="count"]').textContent = '0 objects';
      return;
    }

    var count = 0;
    var bytes = 0;

    rows.forEach(function (r) {
      count++;
      if (r.node && r.node.kind === 'text') bytes += FS.textOf(r.node).length * 3;

      var fullPath = r.real || FS.join(self.path, r.name);

      if (!self.details) {
        var item = el('div', 'ex-item');
        item.setAttribute('role', 'option');
        item.dataset.name = r.name;
        item.tabIndex = 0;
        item.innerHTML = XP_ICONS.get(r.icon) + '<span>' + esc(r.name) + '</span>';
        item.addEventListener('click', function () { self.select(r.name); });
        item.addEventListener('dblclick', function () { self.open(r, fullPath); });
        item.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') self.open(r, fullPath);
        });
        self.list.appendChild(item);
        return;
      }

      var row = el('div', 'ex-details-row');
      row.setAttribute('role', 'option');
      row.dataset.name = r.name;
      row.tabIndex = 0;
      var size = r.fake ? '' : (r.node ? FS.sizeOf(r.node, r.name) : '');
      row.innerHTML =
        '<span class="c-name">' + XP_ICONS.get(r.icon) + '<span>' + esc(r.name) + '</span></span>' +
        '<span class="c-type">' + esc(r.fake ? 'System Folder' : FS.typeLabel(r.node || { kind: r.kind })) + '</span>' +
        '<span class="c-size">' + esc(size) + '</span>' +
        '<span class="c-date">' + esc(FS.dateOf(fullPath)) + '</span>';
      row.addEventListener('click', function () { self.select(r.name); });
      row.addEventListener('dblclick', function () { self.open(r, fullPath); });
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') self.open(r, fullPath);
      });
      self.list.appendChild(row);
    });

    var mb = (bytes / 1024).toFixed(0);
    this.status.querySelector('[data-a="count"]').textContent = count + ' object' + (count === 1 ? '' : 's');
    var selCell = this.status.querySelector('[data-a="sel"]');
    if (mb !== 'NaN') selCell.textContent = 'C:\\ ' + mb + ' KB';
    this.side.querySelectorAll('.ex-folder').forEach(function (n) { n.classList.remove('is-selected'); });
  };

  Explorer.prototype.open = function (row, fullPath) {
    if (row.fake) {
      XP.audio.play('error');
      XP.shell.dialog({
        title: fullPath, icon: 'warning', width: 340,
        html: esc(row.fake) + '<br><br><small>Try <b>Local Disk (C:)</b> instead.</small>',
        buttons: [{ label: 'OK', primary: true }]
      });
      return;
    }
    var n = row.node;
    if (n && n.app && row.kind !== 'folder') return XP.launch(n.app, { path: fullPath });
    if (row.kind === 'folder') return this.go(fullPath);
    return XP.launch('notepad', fullPath);
  };

  /* ------------------------------- register -------------------------------- */
  XP.defineApp('explorer', {
    title: 'My Computer',
    icon: 'computer',
    blurb: 'the virtual file system',
    width: 660,
    height: 430,
    minWidth: 380,
    minHeight: 240,
    launch: function (opts) {
      opts = opts || {};
      var path = opts.path || D.home;
      return XP.wm.open({
        appId: 'explorer-' + path,
        title: FS.baseName(path) || 'My Computer',
        icon: isDriveRoot(path) ? 'computer' : 'folder',
        width: opts.width || 660,
        height: opts.height || 430,
        minWidth: 380,
        minHeight: 240,
        build: function (body, w) {
          w.explorer = new Explorer(w, path, opts.details);
        }
      });
    }
  });
})();
