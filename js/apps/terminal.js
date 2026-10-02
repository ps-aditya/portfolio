/* =============================================================================
 *  apps/terminal.js â€” Command Prompt. XP window chrome, DOS-flavoured CLI.
 * ========================================================================== */

(function () {
  'use strict';

  var D = window.XP_DATA;
  var C = D.config;
  var FS = XP.fs;
  var M = D.me;

  /* ------------------------------ output kit ------------------------------ */
  function esc(s) { return XP.wm.escapeHtml(String(s)); }

  /* ------------------------------- commands -------------------------------- */
  var CMDS = [];
  function def(name, usage, desc, run) {
    CMDS.push({ name: name, usage: usage, desc: desc, run: run });
  }
  function alias(name, target) {
    var t = CMDS.filter(function (c) { return c.name === target; })[0];
    if (t) t.aliases = t.aliases || [], t.aliases.push(name);
  }

  function projectList(t, names, indent) {
    names.forEach(function (n) {
      var name = typeof n === 'string' ? n : n.name;
      var p = M.projects.filter(function (x) { return x.name.toLowerCase() === name.toLowerCase(); })[0];
      if (!p) return;
      var meta = p.stack.slice(0, 3).join(', ');
      if (p.status) meta += '  [' + p.status + ']';
      t.raw('<span class="term-entry"><span class="te-head">' +
        '<span class="te-name t-white">' + esc(p.name) + '</span>' +
        '<span class="te-meta t-dim">' + esc(meta) + '</span></span>' +
        '<span class="te-body t-dim">' + esc(p.blurb) + '</span></span>');
    });
  }

  function projectDetail(t, p) {
    t.rule(p.name);
    t.out(p.blurb, 't-bright');
    t.out('stack  : ' + p.stack.join(', '), 't-dim');
    if (p.status) t.out('status : ' + p.status, 't-dim');
    t.out('details:');
    p.details.forEach(function (b) {
      t.wrap('<span class="t-cyan">-</span> ' + esc(b), 't-cyan');
    });
    var isPublic = /redis|low end/i.test(p.name);
    if (isPublic) {
      t.out('source : ' + C.github, 't-dim');
      if (XP.isPlaceholder(C.github)) t.out('(still a placeholder - edit js/data.js)', 't-amber');
    }
    if (/low end/i.test(p.name)) {
      t.out('');
      t.out('try: open low-end-llm.txt   (reads it in Notepad)', 't-dim');
    }
  }

  /* ------------------------------ the shell -------------------------------- */
  function Terminal(win, prefill) {
    this.win = win;
    this.cwd = D.home;
    this.history = [];
    this.histIndex = -1;
    this.crt = false;
    this.fontScale = 1;
    this.build();
    this.boot(prefill);
  }

  Terminal.prototype.build = function () {
    var self = this;
    var shell = document.createElement('div');
    shell.className = 'term-shell';
    shell.innerHTML =
      '<div class="term-menu">' +
        '<span class="mb-item" data-menu="file">File</span>' +
        '<span class="mb-item" data-menu="edit">Edit</span>' +
        '<span class="mb-item" data-menu="view">View</span>' +
        '<span class="mb-item" data-menu="help">Help</span>' +
        '<span class="mb-spacer" style="flex:1"></span>' +
      '</div>' +
      '<div class="term-screen scroller-thin" tabindex="-1"></div>' +
      '<div class="term-shortcuts">' +
        '<span><kbd>Tab</kbd> complete</span>' +
        '<span><kbd>&#8593;</kbd><kbd>&#8595;</kbd> history</span>' +
        '<span><kbd>Ctrl</kbd>+<kbd>L</kbd> clear</span>' +
        '<span><kbd>Ctrl</kbd>+<kbd>C</kbd> cancel</span>' +
      '</div>';
    this.win.body.appendChild(shell);
    this.shell = shell;
    this.screen = shell.querySelector('.term-screen');

    shell.addEventListener('click', function (e) {
      if (window.getSelection && String(window.getSelection()).length) return;
      if (e.target.tagName === 'A' || e.target.closest('a')) return;
      self.focus();
    });

    // menus
    var menuDefs = {
      file: [
        { label: 'New Window', run: function () { XP.launch('terminal'); } },
        { sep: true },
        { label: 'Clear Screen', hint: 'Ctrl+L', run: function () { self.clear(); } },
        { sep: true },
        { label: 'Close', run: function () { self.win.close(); } }
      ],
      edit: [
        { label: 'Select All', run: function () { self.focus(); self.input.select(); } },
        { label: 'Copy', run: function () { self.copyAll(); } },
        { sep: true },
        { label: 'Paste', hint: 'Ctrl+V', run: function () { self.paste(); }, disabled: !self.canPaste() }
      ],
      view: [
        { label: 'Font Size', sub: [
          { label: 'Small', run: function () { self.setFont(0.88); } },
          { label: 'Normal', run: function () { self.setFont(1); } },
          { label: 'Large', run: function () { self.setFont(1.18); } }
        ] },
        { label: 'CRT Effect', sub: [
          { label: 'On', run: function () { self.setCrt(true); } },
          { label: 'Off', run: function () { self.setCrt(false); } }
        ] }
      ],
      help: [
        { label: 'Commands', run: function () { self.run('help'); } },
        { label: 'Keyboard Shortcuts', run: function () { self.shortcutHelp(); } },
        { sep: true },
        { label: 'About Command Prompt', run: function () { self.aboutPrompt(); } }
      ]
    };

    shell.querySelectorAll('.term-menu .mb-item').forEach(function (node) {
      node.addEventListener('click', function (e) {
        e.stopPropagation();
        var wasOpen = node.classList.contains('is-open');
        self.closeMenus();
        if (!wasOpen) self.openMenu(node, menuDefs[node.dataset.menu]);
      });
      node.addEventListener('mouseenter', function () {
        if (shell.querySelector('.mb-item.is-open')) {
          self.closeMenus();
          self.openMenu(node, menuDefs[node.dataset.menu]);
        }
      });
    });

    document.addEventListener('pointerdown', function (e) {
      if (!e.target.closest('.term-menu') && !e.target.closest('.term-dropdown')) self.closeMenus();
    });
  };

  Terminal.prototype.openMenu = function (anchor, items) {
    var self = this;
    anchor.classList.add('is-open');
    var drop = document.createElement('div');
    drop.className = 'term-dropdown';
    drop.style.cssText = 'position:absolute;z-index:5000;min-width:190px;padding:2px;background:var(--face);' +
      'border:1px solid #7a9db9;box-shadow:2px 2px 5px rgba(0,0,0,.3);font-size:11px;';

    // the list one level up, so hovering a parent row can restore it
    var parentList = null;

    function renderList(list, from) {
      drop.innerHTML = '';
      list.forEach(function (it) {
        if (it.sep) {
          var s = document.createElement('div');
          s.className = 'menu-sep';
          drop.appendChild(s);
          return;
        }
        var row = document.createElement('div');
        row.className = 'menu-item' + (it.disabled ? ' is-disabled' : '');
        row.style.padding = '4px 16px 4px 10px';
        row.innerHTML = '<span class="mi-label"><span>' + esc(it.label) + '</span></span>' +
          (it.hint ? '<span class="mi-arrow" style="margin-left:auto;font-size:10px;color:#777">' + esc(it.hint) + '</span>' : '') +
          (it.sub ? '<span class="mi-arrow" style="margin-left:auto;font-size:9px">&#9654;</span>' : '');
        row.addEventListener('mouseenter', function () {
          if (it.sub) {
            var r = row.getBoundingClientRect();
            renderList(it.sub, list);
            drop.style.left = (r.right - 3 - hostRect().left) + 'px';
            drop.style.top = (r.top - 3 - hostRect().top) + 'px';
          } else if (parentList) {
            parentList = null;
            renderList(list, from);
          }
        });
        if (!it.sub) {
          row.addEventListener('click', function (e) {
            e.stopPropagation();
            self.closeMenus();
            self.focus();
            it.run();
          });
        }
        drop.appendChild(row);
      });
    }

    function hostRect() { return self.win.el.getBoundingClientRect(); }

    var r = anchor.getBoundingClientRect();
    var host = this.win.el.getBoundingClientRect();
    renderList(items, null);
    drop.style.left = (r.left - host.left) + 'px';
    drop.style.top = (r.bottom - host.top) + 'px';
    this.win.body.appendChild(drop);
    this.dropdown = drop;
  };

  Terminal.prototype.closeMenus = function () {
    var bar = this.win.body.querySelector('.term-menu');
    if (bar) bar.querySelectorAll('.mb-item').forEach(function (n) { n.classList.remove('is-open'); });
    if (this.dropdown) { this.dropdown.remove(); this.dropdown = null; }
  };

  /* ------------------------------ printing --------------------------------- */
  Terminal.prototype.out = function (txt, cls) {
    var d = document.createElement('div');
    d.className = 'term-line' + (cls ? ' ' + cls : '');
    d.textContent = txt;
    this.screen.appendChild(d);
    return d;
  };
  Terminal.prototype.raw = function (html, cls) {
    var d = document.createElement('div');
    d.className = 'term-line' + (cls ? ' ' + cls : '');
    d.innerHTML = html;
    this.screen.appendChild(d);
    return d;
  };
Terminal.prototype.wrap = function (html, cls) {
    var d = document.createElement('div');
    d.className = 'term-line' + (cls ? ' ' + cls : '');
    d.style.whiteSpace = 'normal';
    d.innerHTML = html;
    this.screen.appendChild(d);
    return d;
  };
  /* same as raw(), but keeps runs of spaces - required for ASCII art */
  Terminal.prototype.pre = function (html, cls) {
    var d = document.createElement('div');
    d.className = 'term-line' + (cls ? ' ' + cls : '');
    d.style.whiteSpace = 'pre';
    d.innerHTML = html;
    this.screen.appendChild(d);
    return d;
  };
  Terminal.prototype.blank = function (n) {
    for (var i = 0; i < (n || 1); i++) this.out('');
  };
  Terminal.prototype.rule = function (title) {
    var text = title;
    var line = '';
    var width = Math.max(0, 58 - text.length);
    for (var i = 0; i < width; i++) line += '-';
    this.raw('<span class="t-dim t-rule">' + esc(text) + ' ' + esc(line) + '</span>');
  };

  Terminal.prototype.scroll = function () {
    this.screen.scrollTop = this.screen.scrollHeight;
  };

  Terminal.prototype.clear = function () {
    this.screen.innerHTML = '';
    if (this.inputRow) this.inputRow.remove();
    this.newPrompt();
  };

  /* ------------------------------- prompt ---------------------------------- */
Terminal.prototype.promptHtml = function () {
    var p = this.promptUser();
    var i = p.lastIndexOf('\\');
    var head = i > 0 ? p.slice(0, i + 1) : '';
    var tail = i > 0 ? p.slice(i + 1) : p;
    return '<span class="t-dim">' + esc(head) + '</span>' +
      '<span class="t-white t-bold">' + esc(tail) + '</span>' +
      '<span class="t-accent">&gt;</span>';
  };

  /* XP shows the full C:\Documents and Settings\<user> path while you are inside
     it, then shortens to the drive root elsewhere. */
  Terminal.prototype.promptUser = function () {
    var userRoot = D.root; // C:\Documents and Settings\Aditya
    var cwd = this.cwd || 'C:\\';
    if (cwd.toLowerCase().indexOf(userRoot.toLowerCase()) === 0) return userRoot;
    return cwd;
  };

  Terminal.prototype.newPrompt = function () {
    var self = this;
    var row = document.createElement('div');
    row.className = 'term-input-row';
    row.innerHTML = '<span class="term-prompt">' + this.promptHtml() + '</span>';
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'term-typed';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('aria-label', 'Command input');
    row.appendChild(input);
    this.screen.appendChild(row);

input.addEventListener('keydown', function (e) { self.onKey(e, input); });

    this.inputRow = row;
    this.input = input;
    this.scroll();
    return input;
  };

Terminal.prototype.focus = function () {
    if (this.input && !this.input.readOnly) {
      this.input.focus();
      var v = this.input.value.length;
      try { this.input.setSelectionRange(v, v); } catch (e) { /* ignore */ }
    }
  };

  /* called by `cd` so the visible prompt tracks the current directory */
  Terminal.prototype.refreshPrompt = function () {
    if (!this.inputRow) return;
    var p = this.inputRow.querySelector('.term-prompt');
    if (p) p.innerHTML = this.promptHtml();
  };

  Terminal.prototype.onKey = function (e, input) {
    var self = this;
    var k = e.key;

if (k === 'Enter') {
      e.preventDefault();
      var line = input.value;
      // collapse the selection, otherwise the frozen line keeps a highlight box
      try { input.setSelectionRange(line.length, line.length); } catch (err) { /* ignore */ }
      input.readOnly = true;
      input.blur();
      this.out('');
      if (line.trim()) this.history.push(line);
      this.histIndex = -1;
      this.newPrompt();
      this.execute(line);
      return;
    }

    if (k === 'Tab') {
      e.preventDefault();
      this.complete(input);
      return;
    }

    if (k === 'ArrowUp') {
      e.preventDefault();
      if (!this.history.length) return;
      this.histIndex = this.histIndex < 0 ? this.history.length - 1 : Math.max(0, this.histIndex - 1);
      input.value = this.history[this.histIndex];
      var v = input.value.length;
      try { input.setSelectionRange(v, v); } catch (err) { /* ignore */ }
      return;
    }

    if (k === 'ArrowDown') {
      e.preventDefault();
      if (this.histIndex < 0) return;
      this.histIndex++;
      if (this.histIndex >= this.history.length) {
        this.histIndex = -1;
        input.value = '';
      } else {
        input.value = this.history[this.histIndex];
      }
      return;
    }

    if (k === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.clear();
      return;
    }

    if (k === 'c' && e.ctrlKey) {
      e.preventDefault();
      input.value = '';
      return;
    }

    if (k === 'Escape') {
      e.preventDefault();
      input.value = '';
      input.blur();
      return;
    }
  };

/* ----------------------------- completion -------------------------------- */
  var NAMES = {};
  function buildNameIndex() {
    CMDS.forEach(function (c) {
      NAMES[c.name] = c;
      (c.aliases || []).forEach(function (a) { NAMES[a] = c; });
    });
  }

  Terminal.prototype.complete = function (input) {
    var value = input.value;
    var parts = value.split(/\s+/);
    var trailing = /\s$/.test(value);
    var head = parts[0] || '';
    var last = trailing ? '' : parts[parts.length - 1];

    var pool = [];
    if (parts.length <= 1) {
      pool = Object.keys(NAMES).filter(function (n) { return n.indexOf(head.toLowerCase()) === 0; });
    } else {
      var cmd = NAMES[head.toLowerCase()];
      if (!cmd) return;
      if (cmd.completions) pool = cmd.completions(this).filter(function (n) {
        return n.toLowerCase().indexOf(last.toLowerCase()) === 0;
      });
    }

    if (!pool.length) return;

    if (pool.length === 1) {
      var done = parts.slice();
      done[done.length - 1] = pool[0];
      input.value = done.join(' ') + ' ';
      return;
    }

    // multiple: extend to the longest shared prefix, then show the options
    var prefix = pool[0];
    pool.forEach(function (c) {
      while (c.indexOf(prefix) !== 0) prefix = prefix.slice(0, -1);
    });
    if (prefix.length > last.length) {
      var d2 = parts.slice();
      d2[d2.length - 1] = prefix;
      input.value = d2.join(' ');
      return;
    }

    this.out('');
    this.wrap('<span class="t-dim">' + pool.map(esc).join('   ') + '</span>');
  };

  /* ------------------------------ execution -------------------------------- */
  Terminal.prototype.execute = function (line) {
    var self = this;
    line = String(line || '').trim();
    if (!line) return;

    var m = line.match(/^(\S+)\s*([\s\S]*)$/);
    var name = m ? m[1].toLowerCase() : line.toLowerCase();
    var rest = m ? m[2].trim() : '';
    var args = rest.length ? rest.match(/"[^"]*"|'[^']*'|\S+/g).map(function (a) {
      return a.replace(/^["']|["']$/g, '');
    }) : [];

    var cmd = NAMES[name];
    if (!cmd) {
      XP.audio.play('error');
      this.out("'" + line.split(' ')[0] + "' is not recognised as an internal or external command,", 't-red');
      this.out('operable program or batch file.', 't-red');
      this.out('');
      this.out("Type " + 'help' + " to see what does work here.", 't-dim');
      return;
    }

    try {
      cmd.run(this, args, rest);
    } catch (err) {
      XP.audio.play('error');
      this.out('Oops - ' + (err && err.message || err), 't-red');
      if (window.console) console.error('[xp:term]', err);
    }
    this.scroll();
  };

  Terminal.prototype.run = function (line) {
    // used by the menus: behaves as if the visitor typed it
    this.execute(line);
    this.scroll();
  };

  /* ------------------------------ boot banner ------------------------------ */
  Terminal.prototype.boot = function (prefill) {
    this.banner();
    this.out('');
    this.wrap(
      '<span class="t-bright">This is the whole resume, in a shell.</span> ' +
      '<span class="t-dim">Type</span> <span class="t-yellow">help</span> ' +
      '<span class="t-dim">for the command list,</span> <span class="t-yellow">neofetch</span> ' +
      '<span class="t-dim">for system info,</span> <span class="t-yellow">cat resume.txt</span> ' +
      '<span class="t-dim">for the plain text version.</span>'
    );
    this.out('');
    this.newPrompt();
    if (prefill) {
      this.out(D.home + '\\' + C.handle + '> ' + prefill, 't-dim');
      this.execute(prefill);
    }
    setTimeout(function () { this.focus(); }, 60);
  };

Terminal.prototype.banner = function () {
    var art = D.blockText(C.name).split('\n');
    this.pre('<span class="term-art term-ascii">' + art.map(function (l) { return esc(l); }).join('\n') + '</span>');
    this.raw(
      '<span class="t-bright">Windows XP Professional</span>' +
      '<span class="t-dim">  |  resume build 2026.01  |  vanilla js, zero dependencies</span>'
    );
  };

  Terminal.prototype.shortcutHelp = function () {
    this.rule('Keyboard shortcuts');
    var rows = [
      ['Tab', 'complete the current command or path'],
      ['Up / Down', 'walk through the history'],
      ['Ctrl + L', 'clear the screen'],
      ['Ctrl + C', 'abandon the current line'],
      ['Ctrl + V', 'paste (the usual way)'],
      ['Ctrl + Enter', 'copy this whole session as text'],
      ['Win / Ctrl+Esc', 'open the Start menu'],
      ['Alt + F4', 'close the focused window'],
      ['Win + L', 'lock the session']
    ];
    rows.forEach(function (r) {
      this.raw('<span class="t-yellow t-bold">' + esc(r[0].padEnd(14)) + '</span><span class="t-dim">' + esc(r[1]) + '</span>');
    }, this);
    this.out('');
  };

  Terminal.prototype.aboutPrompt = function () {
    this.rule('Command Prompt');
    this.wrap(
      'A <span class="t-bright">Windows XP</span> window that happens to be a terminal. ' +
      'Drag the title bar, resize from any edge, throw it to the top of the screen to maximize. ' +
      'No frameworks, no build step, no telemetry.'
    );
    this.out('');
    this.raw('<span class="t-dim">shell </span><span class="t-bright">xp-sh 1.0</span>' +
             '<span class="t-dim">   renderer </span><span class="t-bright">the DOM</span>');
  };

  Terminal.prototype.copyAll = function () {
    var self = this;
    var text = this.screen.innerText || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        self.out('Copied ' + text.length + ' characters to the clipboard.', 't-green');
        self.scroll();
      }, function () {
        self.out('Clipboard blocked by the browser. Select the text and press Ctrl+C.', 't-amber');
        self.scroll();
      });
    } else {
      this.out('Clipboard unavailable here. Select the text and press Ctrl+C.', 't-amber');
    }
  };

  Terminal.prototype.canPaste = function () {
    return !!(navigator.clipboard && navigator.clipboard.readText);
  };

  Terminal.prototype.paste = function () {
    var self = this;
    this.focus();
    if (!this.canPaste()) { this.out('This browser will not hand over the clipboard. Try Ctrl+V.', 't-dim'); return; }
    navigator.clipboard.readText().then(function (txt) {
      if (!self.input || self.input.readOnly) return;
      self.input.value += txt.replace(/\s+/g, ' ');
      self.focus();
    }, function () {
      self.out('Paste needs permission - use Ctrl+V instead.', 't-dim');
      self.scroll();
    });
  };

  Terminal.prototype.setFont = function (scale) {
    this.fontScale = scale;
    this.screen.style.fontSize = (13 * scale).toFixed(2) + 'px';
  };
  Terminal.prototype.setCrt = function (on) {
    this.crt = !!on;
    this.shell.classList.toggle('has-crt', this.crt);
  };

  /* ============================ THE COMMANDS ============================== */

  /* ------------------------------- help ------------------------------------ */
  def('help', 'help [command]', 'list every command, or explain one', function (t, args) {
    if (args[0]) {
      var c = NAMES[args[0].toLowerCase()];
      if (!c) { t.out('No help for "' + args[0] + '". Try `help`.', 't-red'); return; }
      t.blank();
      t.rule(c.name);
      t.out(c.desc);
      t.raw('<span class="t-dim">usage: </span><span class="t-bright">' + esc(c.usage) + '</span>');
      (c.aliases || []).length &&
        t.raw('<span class="t-dim">aliases: </span>' + c.aliases.map(function (a) { return '<span class="t-bright">' + esc(a) + '</span>'; }).join(', '));
      t.blank();
      return;
    }

    t.blank();
    t.rule('available commands');
    var cols = document.createElement('div');
    cols.className = 'term-columns';
    CMDS.forEach(function (c) {
      var row = document.createElement('div');
      row.className = 'term-col-item';
      row.innerHTML = '<span class="t-key t-accent t-bold">' + esc(c.name) + '</span>' +
        '<span class="t-desc">' + esc(c.desc) + '</span>';
      cols.appendChild(row);
    });
    var _grid = t.wrap('');
    _grid.appendChild(cols);
    t.blank();
    t.wrap('<span class="t-dim">tips: </span><span class="t-yellow">help projects</span>' +           '<span class="t-dim"> explains a command. </span>' +
           '<span class="t-yellow">open &lt;app&gt;</span><span class="t-dim"> launches a program. ' +
           '</span><span class="t-yellow">theme bliss</span><span class="t-dim"> switches the wallpaper.</span>');
    t.blank();
  });

  /* ------------------------------- about ----------------------------------- */
  def('about', 'about', 'who this person is, in a paragraph', function (t) {
    t.blank();
    t.wrap('<span class="t-white t-bold" style="font-size:1.1em">' + esc(C.name) + '</span>');
    t.out(C.tagline, 't-bright');
    t.blank();
    t.wrap(esc(C.summary));
    t.blank();
    t.raw('<span class="t-dim">based in </span><span class="t-bright">' + esc(C.location) + '</span>' +
          '<span class="t-dim">   studying </span><span class="t-bright">' +
          esc(M.education[0].school) + '</span>');
    t.blank();
    t.wrap('<span class="t-cyan">interests</span>');
    M.interests.forEach(function (i) { t.wrap('<span class="t-cyan">-</span> ' + esc(i)); });
    t.blank();
    t.raw('<span class="t-dim">try </span><span class="t-yellow">contact</span><span class="t-dim">, </span>' +
          '<span class="t-yellow">projects</span><span class="t-dim"> or </span><span class="t-yellow">skills</span><span class="t-dim"> next</span>');
    t.blank();
  });

  /* ------------------------------- skills ---------------------------------- */
  def('skills', 'skills', 'languages and technologies', function (t) {
    t.blank();
    M.skills.forEach(function (g) {
      t.wrap('<span class="t-cyan t-bold">' + esc(g.group) + '</span>');
      g.items.forEach(function (i) { t.wrap('<span class="t-cyan">-</span> ' + esc(i)); });
      t.blank();
    });
    t.raw('<span class="t-dim">rough tally: </span><span class="t-bright">' +
      (function () {
        var set = {};
        M.skills.forEach(function (g) { g.items.forEach(function (i) { set[i] = 1; }); });
        return Object.keys(set).length;
      })() + '</span><span class="t-dim"> distinct tools, most of them learned by shipping them.</span>');
    t.blank();
  });

  /* ------------------------------ projects --------------------------------- */
  def('projects', 'projects [name]', 'everything built so far', function (t, args) {
    if (args[0]) {
      var p = M.projects.filter(function (x) {
        return x.name.toLowerCase().indexOf(args[0].toLowerCase()) > -1;
      })[0];
      if (!p) { t.out('No project matches "' + args[0] + '".', 't-red'); return; }
      projectDetail(t, p);
      return;
    }
    t.blank();
    t.rule('projects');
    projectList(t, M.projects);
    t.blank();
    t.raw('<span class="t-dim">details: </span><span class="t-yellow">projects docker vitals</span>');
    t.blank();
  });

  /* ----------------------------- experience -------------------------------- */
  def('experience', 'experience', 'work and internships', function (t) {
    t.blank();
    t.rule('experience');
    M.experience.forEach(function (e) {
      t.wrap('<span class="t-white t-bold">' + esc(e.role) + '</span>' +
             '<span class="t-dim"> @ </span><span class="t-yellow">' + esc(e.org) + '</span>' +
             '<span class="t-dim"> (' + esc(e.location) + ')</span>');
      t.raw('<span class="t-dim">' + esc(e.period) + '</span>');
      e.bullets.forEach(function (b) { t.wrap('<span class="t-green">*</span> ' + esc(b)); });
      t.blank();
    });
  });

  /* ------------------------------ education -------------------------------- */
  def('education', 'education', 'where the degree comes from', function (t) {
    t.blank();
    t.rule('education');
    M.education.forEach(function (e) {
      t.wrap('<span class="t-white t-bold">' + esc(e.school) + '</span>' +
             '<span class="t-dim">, ' + esc(e.location) + '</span>');
      t.wrap(esc(e.degree));
      t.raw('<span class="t-dim">' + esc(e.period) + '</span>');
      t.blank();
    });
  });

  /* -------------------------------- resume ---------------------------------- */
def('resume', 'resume', 'the resume as plain text', function (t) {
    var text = D.resumeText(M);
    t.blank();
    text.split('\n').forEach(function (line) {
      if (!line.trim()) { t.out(''); return; }
      if (/^[A-Z][A-Z ]+$/.test(line)) { t.rule(line); return; }
      t.wrap(esc(line));
    });
    t.blank();
    t.raw('<span class="t-dim">the same file lives at </span>' +
          '<span class="t-yellow">' + esc(D.home + '\\Resume.txt') + '</span>');
    t.raw('<span class="t-dim">open it in notepad: </span><span class="t-yellow">open resume.txt</span>');
    t.blank();
  });

  /* -------------------------------- contact --------------------------------- */
  def('contact', 'contact', 'how to reach me (placeholders for now)', function (t) {
    t.blank();
    t.rule('contact');
    var rows = [
      ['github', C.github],
      ['linkedin', C.linkedin],
      ['x', C.twitter],
      ['email', C.email],
      ['website', C.website]
    ];
    rows.forEach(function (r) {
      var todo = XP.isPlaceholder(r[1]);
      t.raw('<span class="t-accent t-bold">' + esc(r[0].padEnd(10)) + '</span>' +
            (todo ? '<span class="t-amber">' + esc(r[1]) + '</span> <span class="t-amber t-bold">[TODO]</span>'
                  : '<a data-href="' + esc(r[1]) + '" href="' + esc(r[1]) + '" target="_blank" rel="noopener">' + esc(r[1]) + '</a>'));
    });
    t.blank();
    t.raw('<span class="t-dim">' + esc(C.location) + '</span>');
    t.blank();
    if (rows.some(function (r) { return XP.isPlaceholder(r[1]); })) {
      t.wrap('<span class="t-amber">These are placeholders.</span> <span class="t-dim">Everything above comes ' +
             'from js/data.js - swap the values in and this screen is live.</span>');
      t.blank();
    }
    t.raw('<span class="t-dim">or open the graphical version: </span><span class="t-yellow">open contact</span>');
    t.blank();
  });

  /* ------------------------------- social ---------------------------------- */
  def('social', 'social', 'links only', function (t) {
    t.blank();
    [['GitHub', C.github], ['LinkedIn', C.linkedin], ['X', C.twitter]].forEach(function (r) {
      var todo = XP.isPlaceholder(r[1]);
      t.wrap('<span class="t-cyan">-</span> <span class="t-bright">' + esc(r[0]) + '</span>  ' +
        (todo ? '<span class="t-amber">' + esc(r[1]) + '</span>'
              : '<a href="' + esc(r[1]) + '" target="_blank" rel="noopener">' + esc(r[1]) + '</a>'));
    });
    t.blank();
  });

  /* ---------------------------- filesystem --------------------------------- */
  def('ls', 'ls [path]', 'list a directory', function (t, args) {
    var path = FS.resolve(t.cwd, args[0] || '');
    var kids = FS.list(path);
    if (!kids) { t.out("The system cannot find the path specified: " + path, 't-red'); return; }
    t.blank();
    var cols = document.createElement('div');
    cols.className = 'term-columns';
    if (!kids.length) {
      cols.innerHTML = '<span class="t-dim">File Not Found</span>';
    }
    kids.forEach(function (k) {
      var row = document.createElement('div');
      row.className = 'term-col-item';
      row.innerHTML = '<span class="t-key ' + (k.kind === 'folder' ? 't-yellow' : 't-white') + '">' +
        esc(k.name) + '</span>';
      cols.appendChild(row);
    });
    var _grid = t.wrap('');
    _grid.appendChild(cols);
    t.blank();
  });

  def('cd', 'cd <path>', 'change directory', function (t, args) {
    var target = FS.resolve(t.cwd, args[0] || '~');
    if (!FS.node(target)) { t.out('The system cannot find the path specified: ' + target, 't-red'); return; }
    if (FS.node(target).kind !== 'folder') { t.out('Not a directory: ' + target, 't-red'); return; }
    t.cwd = target;
    t.refreshPrompt();
  });

  def('pwd', 'pwd', 'where am I', function (t) {
    t.out(t.cwd, 't-bright');
  });

  def('tree', 'tree [path]', 'the whole file system at a glance', function (t, args) {
    var root = FS.resolve(t.cwd, args[0] || 'c:\\');
    if (!FS.node(root)) { t.out('The system cannot find the path specified: ' + root, 't-red'); return; }
    t.blank();
    t.raw('<span class="t-white t-bold">' + esc(root) + '</span>');
var count = 0;
    FS.walk(root, function (n, p, depth) {
      if (!depth) return;
      count++;
      var pad = new Array(depth).join('   ');
      var glyph = n.kind === 'folder' ? '<span class="t-yellow">[]</span>' : '<span class="t-dim">.-</span>';
      var name = n.kind === 'folder'
        ? '<span class="t-yellow">' + esc(n.name) + '</span>'
        : '<span class="t-bright">' + esc(n.name) + '</span>';
      t.raw('<span class="t-dim">' + pad + '|--</span> ' + glyph + ' ' + name);
    });
    t.blank();
    t.raw('<span class="t-dim">' + count + ' objects, ' +
      FS.textFiles(root).length + ' readable</span>');
    t.blank();
  });

  def('cat', 'cat <file>', 'print a file', function (t, args) {
    if (!args[0]) { t.out('Usage: cat <file>', 't-dim'); t.out('try: cat resume.txt', 't-dim'); return; }
    var p = FS.resolve(t.cwd, args[0]);
    var n = FS.node(p);
    if (!n) { t.out("File not found - " + args[0], 't-red'); return; }
    if (n.kind === 'folder') { t.out('"' + args[0] + '" is a directory. Try `ls ' + args[0] + '`.', 't-amber'); return; }
    var text = FS.textOf(n);
    t.blank();
    text.split('\n').forEach(function (line) {
      if (!line.trim()) { t.out(''); return; }
      if (/^[=]{3,}$/.test(line.trim())) { t.raw('<span class="t-dim">' + esc(line) + '</span>'); return; }
      t.wrap(esc(line));
    });
    t.blank();
  });

  def('search', 'search <text>', 'find files anywhere on the C: drive', function (t, args) {
    if (!args[0]) { t.out('Usage: search <text>', 't-dim'); t.out('try: search project', 't-dim'); return; }
    var hits = FS.search(args.join(' '));
    t.blank();
    if (!hits.length) {
      t.out('No files found matching "' + args.join(' ') + '".', 't-amber');
      t.blank();
      return;
    }
    hits.forEach(function (hit) {
      t.raw('<span class="t-yellow">[' + (hit.node.kind === 'folder' ? 'dir ' : 'file') + ']</span> ' +
        '<span class="t-bright">' + esc(hit.path) + '</span>');
    });
    t.blank();
    t.raw('<span class="t-dim">' + hits.length + ' result' + (hits.length === 1 ? '' : 's') + '</span>');
    t.blank();
  });

  /* --------------------------------- open ---------------------------------- */
  function openTargets(t) {
    var out = ['terminal', 'notepad', 'explorer', 'browser', 'minesweeper', 'about', 'recyclebin',
      'readme', 'resume', 'contact', 'projects', 'skills'];
    FS.textFiles(t.cwd).forEach(function (p) { out.push(FS.baseName(p)); });
    FS.list(t.cwd || 'C:\\') && FS.list(t.cwd).forEach(function (k) {
      if (k.kind === 'folder') out.push(k.name);
    });
    return out;
  }

  def('open', 'open <program|file>', 'launch a program or open a file', function (t, args) {
    var what = args[0];
    if (!what) {
      t.blank();
      t.rule('open');
      t.raw('<span class="t-dim">usage: </span><span class="t-bright">open &lt;program|file&gt;</span>');
      t.blank();
      t.wrap('<span class="t-cyan">programs</span>');
      t.wrap('<span class="t-cyan">terminal notepad explorer browser minesweeper about</span>');
      t.wrap('<span class="t-cyan">readme resume contact projects skills</span>');
      t.blank();
      return;
    }
    var w = what.toLowerCase();

    var shortcuts = {
      readme: 'Read Me.txt', resume: 'Resume.txt', contact: 'Contact.txt',
      projects: 'Projects', skills: 'Skills.txt'
    };
    if (shortcuts[w]) what = shortcuts[w];

    if (['terminal', 'notepad', 'explorer', 'browser', 'minesweeper', 'about', 'recyclebin'].indexOf(w) > -1) {
      if (w === 'explorer') return XP.launch('explorer', { path: t.cwd });
      if (w === 'notepad') return XP.launch('notepad');
      if (w === 'terminal') return XP.launch('terminal');
      return XP.launch(w);
    }

    if (w === 'skills') { t.run('skills'); return; }
    if (w === 'projects') { t.run('projects'); return; }

    // treat it as a path
    var p = FS.resolve(t.cwd, what);
    var n = FS.node(p);
    if (n) {
      if (n.kind === 'folder') return XP.launch('explorer', { path: p });
      return XP.launch('notepad', p);
    }

    // or an exe-style name
    if (/\.(exe|com|bat)$/i.test(what)) {
      var guess = FS.childPath(FS.join('C:\\', 'Windows'), FS.baseName(what));
      if (guess && FS.node(guess)) {
        var node = FS.node(guess);
        if (node.app) return XP.launch(node.app, { path: p });
        return XP.launch('notepad', guess);
      }
    }

    t.out('Windows cannot find "' + what + '".', 't-red');
    t.out('Make sure you typed the name correctly, and then try again.', 't-red');
  });

  /* --------------------------------- apps ---------------------------------- */
  def('apps', 'apps', 'what is installed on this machine', function (t) {
    t.blank();
    t.rule('installed programs');
    var cols = document.createElement('div');
    cols.className = 'term-columns';
    Object.keys(XP.apps).forEach(function (id) {
      var a = XP.apps[id];
      var row = document.createElement('div');
      row.className = 'term-col-item';
      row.innerHTML = '<span class="t-key t-accent t-bold">' + esc(id) + '</span>' +
        '<span class="t-desc">' + esc(a.title + ' - ' + (a.blurb || 'a program')) + '</span>';
      cols.appendChild(row);
    });
    var _grid = t.wrap('');
    _grid.appendChild(cols);
    t.blank();
  });

  /* ------------------------------ neofetch --------------------------------- */
  def('neofetch', 'neofetch', 'system info, real values where it matters', function (t) {
var art = D.blockText(C.handle).split('\n');
    var desk = document.getElementById('desktop');
    var cores = navigator.hardwareConcurrency || 4;
    var mem = navigator.deviceMemory || 8;
    var lang = (navigator.language || 'en');
    var up = XP.uptime();

    // don't print a placeholder hostname on a "finished looking" screen
    var siteHost = (C.website || '').match(/^https?:\/\/([^/]+)/);
    siteHost = siteHost ? siteHost[1] : 'localhost';
    if (XP.isPlaceholder(C.website)) siteHost = 'localhost [TODO: set website in js/data.js]';

    var info = [
      [C.handle + '@xp', ''],
      ['-'.repeat(26), '', true],
      ['OS', 'Windows XP Professional x86'],
      ['Host', siteHost],
      ['Kernel', 'NT 5.1.296'],
      ['Shell', 'xp-sh 1.0'],
      ['Resolution', (desk ? desk.clientWidth : 0) + 'x' + (desk ? desk.clientHeight : 0)],
      ['DE', 'Luna'],
      ['Theme', document.documentElement.getAttribute('data-theme') || 'luna'],
      ['Terminal', 'xp-term'],
      ['CPU', cores + ' logical cores'],
      ['Memory', mem + ' GB @ ' + lang],
      ['Uptime', up],
      ['Disk', 'C:\\  (100% full of nostalgia)']
    ];

    var artHtml = art.map(function (l) {
      return '<span class="term-ascii">' + esc(l.padEnd(11)) + '</span>';
    }).join('\n');
    var infoHtml = info.map(function (r) {
      if (r[2]) return '<span class="t-dim">' + esc(r[0]) + '</span>';
      if (!r[1]) return '<span class="t-white t-bold">' + esc(r[0]) + '</span>';
      return '<span class="t-cyan t-bold">' + esc(r[0].padEnd(11)) + '</span><span class="t-bright">' + esc(r[1]) + '</span>';
    }).join('\n');

    var wrap = document.createElement('div');
    wrap.style.cssText = 'white-space:pre;display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap';
    wrap.innerHTML = '<div>' + artHtml + '</div><div>' + infoHtml + '</div>';
    var d = document.createElement('div');
    d.className = 'term-line';
    d.style.whiteSpace = 'normal';
    d.appendChild(wrap);
    t.screen.appendChild(d);
    t.blank();
  });

  /* ------------------------------ appearance -------------------------------- */
  def('theme', 'theme [luna|bliss]', 'swap the desktop wallpaper', function (t, args) {
    var name = (args[0] || '').toLowerCase();
    if (!name) {
      t.out('current theme: ' + (document.documentElement.getAttribute('data-theme') || 'luna'), 't-bright');
      t.out('available      : luna, bliss', 't-dim');
      return;
    }
    if (name !== 'luna' && name !== 'bliss') { t.out('Unknown theme: ' + name, 't-red'); return; }
    XP.shell.setTheme(name);
    t.out('Theme set to ' + name + '.', 't-green');
    if (name === 'bliss') t.out('Rest in peace, my beloved green hill.', 't-dim');
  });

  def('crt', 'crt [on|off]', 'toggle the CRT scanline effect', function (t, args) {
    var on = args.length ? args[0].toLowerCase() !== 'off' : !t.crt;
    t.setCrt(on);
    t.out('CRT effect ' + (on ? 'on' : 'off') + '.', 't-green');
    t.out('(it is off by default because it is not subtle)', 't-dim');
  });

  def('font', 'font [small|normal|large]', 'resize the terminal text', function (t, args) {
    var map = { small: 0.88, normal: 1, large: 1.18 };
    var k = (args[0] || 'normal').toLowerCase();
    if (!(k in map)) { t.out('Usage: font small|normal|large', 't-dim'); return; }
    t.setFont(map[k]);
    t.out('Font size: ' + k, 't-green');
  });

  /* --------------------------------- misc ----------------------------------- */
  def('clear', 'clear', 'wipe the screen', function (t) { t.clear(); });
  def('history', 'history', 'what you have typed so far', function (t) {
    if (!t.history.length) { t.out('No history yet.', 't-dim'); return; }
    t.blank();
    t.history.forEach(function (h, i) {
      var n = String(i + 1).padStart(4, ' ');
      t.raw('<span class="t-dim">' + n + '</span>  ' + esc(h));
    });
    t.blank();
  });
  def('date', 'date', "today's date", function (t) { t.out(new Date().toDateString(), 't-bright'); });
  def('time', 'time', 'the current time', function (t) { t.out(new Date().toLocaleTimeString(), 't-bright'); });
  def('echo', 'echo <text>', 'print text back', function (t, args, rest) { t.out(rest); });
  def('env', 'env', 'a few environment variables', function (t) {
    t.blank();
    var env = [
      ['COMPUTERNAME', 'XP-TOKEN'],
      ['USERNAME', C.handle.toUpperCase()],
      ['USERPROFILE', D.home],
      ['HOMEDRIVE', 'C:'],
      ['OS', 'Windows_NT'],
      ['PROCESSOR_ARCHITECTURE', 'x86'],
      ['PATH', 'C:\\Windows;C:\\Program Files'],
      ['WINDIR', 'C:\\Windows'],
      ['SHELL', 'xp-sh 1.0'],
      ['BROWSER', navigator.userAgent.slice(0, 44) + '...'],
      ['COUNTRY', 'IN'],
      ['RESUME', '/home/' + C.handle + '/resume.txt']
    ];
    env.forEach(function (r) {
      t.raw('<span class="t-cyan">' + esc(r[0] + '='.repeat(Math.max(1, 16 - r[0].length))) + '</span>' + esc(r[1]));
    });
    t.blank();
  });

  def('whoami', 'whoami', 'current user', function (t) {
    t.raw('<span class="xp-domain">' + esc('xp-token') + '</span>' + '<span class="t-dim">\\</span>' +
      '<span class="t-white t-bold">' + esc(C.name) + '</span>');
    t.out('groups: everyone, users, developers, caffeine-dependent', 't-dim');
  });

  def('win', 'win', 'it is not that hard', function (t) {
    t.blank();
    t.wrap('<span class="t-white t-bold">You already do.</span>');
    t.out('This desktop is ~15 files of HTML, CSS and JavaScript.', 't-dim');
    t.out('Open the Start menu and look at "View" on the desktop.', 't-dim');
    t.blank();
  });

  def('sudo', 'sudo <anything>', 'ask nicely', function (t, args) {
    XP.audio.play('error');
    t.out('aditya is not in the sudoers file. This incident has been reported.', 't-red');
    t.out('(to the guy who wrote the sudoers file, who is also me)', 't-dim');
  });

  def('404', '404', 'a page that is not here', function (t) {
    t.blank();
    t.wrap('<span class="t-red t-bold" style="font-size:1.3em">404</span> <span class="t-dim">Not Found</span>');
    t.out('There is nothing at this address. That is, in fairness, on purpose.', 't-dim');
    t.blank();
  });

  def('exit', 'exit', 'close this window', function (t) {
    t.out('Goodbye.', 't-dim');
    t.win.close();
  });

  def('banner', 'banner', 'print the XP logo again', function (t) { t.banner(); t.blank(); });

  /* aliases */
  alias('dir', 'ls');
  alias('cls', 'clear');
  alias('type', 'cat');
  alias('info', 'about');
  alias('bio', 'about');
  alias('exp', 'experience');
  alias('edu', 'education');
  alias('work', 'experience');
  alias('socials', 'social');
  alias('start', 'open');
  alias('h', 'help');
  alias('?', 'help');
  alias('lls', 'ls');

  buildNameIndex();

  /* completions that need shell context */
  var completions = {
    open: function (t) { return openTargets(t); },
    cat: function (t) { return FS.textFiles(t.cwd).map(function (p) { return FS.baseName(p); }); },
    cd: function (t) { return FS.list(t.cwd).map(function (k) { return k.name; }).concat(['..']); },
    ls: function (t) { return FS.list(t.cwd).map(function (k) { return k.name; }); },
    tree: function (t) { return FS.list(t.cwd).map(function (k) { return k.name; }); },
    search: function (t) { return FS.list(t.cwd).map(function (k) { return k.name; }); },
    projects: function () { return D.me.projects.map(function (p) { return p.name; }); },
    theme: function () { return ['luna', 'bliss']; },
    font: function () { return ['small', 'normal', 'large']; },
    crt: function () { return ['on', 'off']; },
    help: function () { return CMDS.map(function (c) { return c.name; }); }
  };
  CMDS.forEach(function (c) {
    if (completions[c.name]) c.completions = completions[c.name];
  });

  /* -------------------------- clickable links ------------------------------ */
  function wireLinks(win) {
    win.body.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#') return;
      if (XP.isPlaceholder(href)) {
        e.preventDefault();
        XP.audio.play('error');
        XP.shell.dialog({
          title: 'Not configured yet', icon: 'warning', width: 380,
          html: '<b>' + XP.wm.escapeHtml(href) + '</b> is still a placeholder.<br><br>' +
            'Open <code>js/data.js</code> and set <code>CONFIG.github / linkedin / twitter / email</code> ' +
            'to your real links.',
          buttons: [{ label: 'OK', primary: true }]
        });
        return;
      }
      e.preventDefault();
      window.open(href, '_blank', 'noopener');
    });
  }

  /* ------------------------------- register --------------------------------- */
  XP.defineApp('terminal', {
    title: 'Command Prompt',
    icon: 'terminal',
    blurb: 'a shell that happens to be the whole resume',
    width: 700,
    height: 440,
    minWidth: 320,
    minHeight: 190,
    singleton: true,
launch: function (prefill) {
      var pre = typeof prefill === 'string' && prefill.trim() ? prefill.trim() : null;

      // if a terminal is already open, reuse it instead of stacking windows
      var existing = XP.wm.list().filter(function (w) { return w.spec.appId === 'terminal'; })[0];

      var win = XP.wm.open({
        appId: 'terminal',
        title: 'Command Prompt',
        icon: 'terminal',
        width: 700,
        height: 440,
        minWidth: 320,
        minHeight: 190,
        singleton: true,
        centered: true,
        build: function (body, w) {
          w.term = new Terminal(w, pre);
          wireLinks(w);
          setTimeout(function () { w.term.focus(); }, 60);
        },
        onFocus: function (w) { if (w.term) w.term.focus(); }
      });

      if (existing && pre && win.term) win.term.run(pre);
      return win;
    }
  });
})();
