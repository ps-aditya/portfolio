/* =============================================================================
 *  apps/notepad.js — Notepad, reading the virtual file system (read-only)
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

  function Notepad(win, path) {
    this.win = win;
    this.path = path || null;
    this.wrapped = false;
    this.dirty = false;
    this.build();
    this.load(path);
  }

  Notepad.prototype.build = function () {
    var self = this;

    var menu = el('div', 'menu-bar');
    [
      ['File', [
        ['New', function () { self.win.close(); XP.launch('notepad'); }],
        ['Open...', function () { XP.launch('explorer', { path: D.home }); }],
        ['Save', function () { self.save(); }],
        ['-'],
        ['Page Setup...', function () { self.noop('Page Setup'); }],
        ['Print', function () { self.noop('Print'); }],
        ['-'],
        ['Exit', function () { self.win.close(); }]
      ]],
      ['Edit', [
        ['Undo', function () { document.execCommand('undo'); }],
        ['-'],
        ['Cut', function () { self.noop('Cut'); }],
        ['Copy', function () { self.noop('Copy'); }],
        ['Paste', function () { self.noop('Paste'); }],
        ['Delete', function () { self.noop('Delete'); }],
        ['-'],
        ['Select All', function () { self.area.focus(); self.area.select(); }],
        ['Time/Date', function () { self.insert(new Date().toLocaleString()); }]
      ]],
      ['Format', [
        ['Word Wrap', function () { self.toggleWrap(); }],
        ['Font...', function () { self.cycleFont(); }]
      ]],
      ['View', [
        ['Status Bar', function () { self.status.style.display = self.status.style.display === 'none' ? '' : 'none'; }]
      ]],
      ['Help', [
        ['View Help', function () { self.help(); }],
        ['About Notepad', function () { self.about(); }]
      ]]
    ].forEach(function (pair) {
      var item = el('span', 'mb-item', esc(pair[0]));
      item.addEventListener('click', function () { self.dropdown(item, pair[1]); });
      menu.appendChild(item);
    });

    var root = el('div', 'notepad');
    root.appendChild(menu);

    this.area = el('textarea');
    this.area.spellcheck = false;
    this.area.setAttribute('aria-label', 'Document text');

    this.area.addEventListener('input', function () { self.onEdit(); });
    this.area.addEventListener('keyup', function () { self.updateCaret(); });
    this.area.addEventListener('click', function () { self.updateCaret(); });
    root.appendChild(this.area);

    this.status = el('div', 'status-bar');
    this.status.innerHTML =
      '<div class="status-cell grow" data-a="info">&nbsp;</div>' +
      '<div class="status-cell" data-a="ln">Ln 1, Col 1</div>';
    root.appendChild(this.status);

    this.win.body.appendChild(root);
    this.root = root;
    this.updateCaret();
  };

  Notepad.prototype.dropdown = function (anchor, items) {
    document.querySelectorAll('.notepad-dropdown').forEach(function (n) { n.remove(); });
    anchor.classList.add('is-open');
    var drop = el('div', 'notepad-dropdown');
    drop.style.cssText = 'position:absolute;z-index:5000;min-width:190px;padding:2px;background:var(--face);' +
      'border:1px solid #7a9db9;box-shadow:2px 2px 5px rgba(0,0,0,.3);font-size:11px;';
    items.forEach(function (it) {
      if (it[0] === '-') { drop.appendChild(el('div', 'menu-sep')); return; }
      var row = el('div', 'menu-item');
      row.style.padding = '4px 12px';
      row.textContent = it[0];
      row.addEventListener('click', function (e) {
        e.stopPropagation();
        drop.remove();
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
      if (e.target.closest('.notepad-dropdown') || e.target.closest('.menu-bar')) return;
      drop.remove();
      anchor.classList.remove('is-open');
      document.removeEventListener('pointerdown', off);
    };
    setTimeout(function () { document.addEventListener('pointerdown', off); }, 0);
  };

  Notepad.prototype.load = function (path) {
    var self = this;
    if (!path) {
      this.area.value = '';
      this.area.readOnly = false;
      this.win.setTitle('Untitled - Notepad');
      this.status.querySelector('[data-a="info"]').innerHTML = '&nbsp;';
      setTimeout(function () { self.area.focus(); }, 60);
      return;
    }
    var node = FS.node(path);
    if (!node) {
      this.area.value = 'Cannot find the file "' + path + '".\n\nIt may have been moved, renamed, or deleted.';
      this.area.readOnly = true;
      this.win.setTitle('Notepad');
      return;
    }
    this.area.value = FS.textOf(node);
    this.area.readOnly = true;
    this.win.setTitle(FS.baseName(path) + ' - Notepad');
    this.status.querySelector('[data-a="info"]').textContent =
      this.area.value.length + ' characters';
  };

  Notepad.prototype.onEdit = function () {
    if (!this.dirty) {
      this.dirty = true;
      var base = this.win.spec.title.replace(/^Notepad$/, 'Untitled');
      if (!/^\*/.test(base)) this.win.setTitle('*' + base);
    }
    this.status.querySelector('[data-a="info"]').textContent = this.area.value.length + ' characters';
    this.updateCaret();
  };

  Notepad.prototype.updateCaret = function () {
    var pos = this.area.selectionStart || 0;
    var before = this.area.value.slice(0, pos);
    var lines = before.split('\n');
    this.status.querySelector('[data-a="ln"]').textContent =
      'Ln ' + lines.length + ', Col ' + (lines[lines.length - 1].length + 1);
  };

  Notepad.prototype.insert = function (text) {
    var a = this.area;
    var s = a.selectionStart, e = a.selectionEnd;
    a.value = a.value.slice(0, s) + text + a.value.slice(e);
    a.selectionStart = a.selectionEnd = s + text.length;
    this.onEdit();
  };

  Notepad.prototype.toggleWrap = function () {
    this.wrapped = !this.wrapped;
    this.area.classList.toggle('wrap', this.wrapped);
    this.win.setTitle((this.path ? FS.baseName(this.path) : 'Untitled') + ' - Notepad');
  };

  Notepad.prototype.cycleFont = function () {
    var fonts = ['Consolas, monospace', 'Courier New, monospace', 'Verdana, sans-serif', 'Georgia, serif'];
    var cur = fonts.indexOf(this.area.style.fontFamily);
    this.area.style.fontFamily = fonts[(cur + 1) % fonts.length];
  };

  Notepad.prototype.save = function () {
    if (this.area.readOnly) {
      XP.audio.play('error');
      return XP.shell.dialog({
        title: 'Notepad', icon: 'warning', width: 360,
        html: 'This document came from <code>js/data.js</code>, so there is nothing on disk to save it to. ' +
          'Edit the text in that file and reload.',
        buttons: [{ label: 'OK', primary: true }]
      });
    }
    XP.shell.dialog({
      title: 'Notepad', icon: 'info', width: 360,
      html: 'This is a browser tab. Where would you like it saved?',
      buttons: [{ label: 'OK', primary: true }]
    });
  };

  Notepad.prototype.noop = function (what) {
    XP.audio.play('error');
    XP.shell.dialog({
      title: 'Notepad', icon: 'warning', width: 340,
      html: esc(what) + ' is not implemented. <small>Some things have to stay 2001.</small>',
      buttons: [{ label: 'OK', primary: true }]
    });
  };

  Notepad.prototype.help = function () {
    XP.launch('terminal', 'help');
  };

  Notepad.prototype.about = function () {
    XP.shell.dialog({
      title: 'About Notepad', icon: 'notepad', width: 360,
      html: '<b>Notepad</b><br>Version 5.1 (build 2600.xpsp_sp3)<br>' +
        '<br>Every document here is a string inside <code>js/data.js</code>. ' +
        'Open the Start menu to find the same text in the terminal.',
      buttons: [{ label: 'OK', primary: true }]
    });
  };

  XP.defineApp('notepad', {
    title: 'Notepad',
    icon: 'notepad',
    blurb: 'read the resume as plain text',
    width: 640,
    height: 460,
    minWidth: 340,
    minHeight: 220,
    launch: function (path) {
      var p = typeof path === 'string' ? path : (path && path.path) || null;
      return XP.wm.open({
        appId: 'notepad-' + (p || 'untitled'),
        title: 'Notepad',
        icon: 'notepad',
        width: 660,
        height: 480,
        minWidth: 340,
        minHeight: 220,
        build: function (body, w) { w.notepad = new Notepad(w, p); },
        onClose: function (w) {
          if (w.notepad && w.notepad.dirty) {
            return confirm('Do you want to save changes to ' +
              (w.notepad.win.spec.title.replace(/^\*/, '')) + '?');
          }
        }
      });
    }
  });
})();
