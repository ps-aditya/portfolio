/* =============================================================================
 *  apps/browser.js — "My Web Browser". Renders local pages instead of an iframe,
 *  because every real site sends X-Frame-Options and would come up blank.
 * ========================================================================== */

(function () {
  'use strict';

  var D = window.XP_DATA;
  var C = D.config;
  var M = D.me;

  function esc(s) { return XP.wm.escapeHtml(s); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* --------------------------------- pages --------------------------------- */
  var PAGES = {};

  PAGES['xp://start'] = {
    title: 'About Me',
    render: function () {
      var toolCount = M.skills.reduce(function (n, g) { return n + g.items.length; }, 0);
      var cards = [
        ['Projects', M.projects.length + ' things shipped or nearly, from ' +
          M.projects[0].name + ' to ' + M.projects[M.projects.length - 1].name + '.'],
        ['Skills', toolCount + ' tools across ' + M.skills[0].items.length +
          ' languages - Python, TypeScript, Java, Go, SQL.'],
        ['Experience', 'Currently founding ' + M.experience[0].org + '. Maintainer of a ' +
          '1,000+ download VS Code extension.'],
        ['Education', M.education[0].school + ' - ' +
          M.education[0].degree.replace('Bachelor of Technology in ', 'B.Tech ') + '.']
      ];
      return '' +
        '<div class="page-hero"><h1>' + esc(C.name) + '</h1><p>' + esc(C.tagline) + '</p></div>' +
        '<div class="page-body">' +
          '<h2>Welcome</h2>' +
          '<p>' + esc(C.summary) + '</p>' +
          '<h2>Start here</h2>' +
          '<div class="card-grid">' +
            cards.map(function (c) {
              return '<div class="card"><h3>' + esc(c[0]) + '</h3><p>' + esc(c[1]) + '</p></div>';
            }).join('') +
          '</div>' +
          '<h2>Places to go</h2>' +
          '<ul>' +
            '<li><a href="xp://contact">Contact &amp; links</a></li>' +
            '<li><a href="xp://projects">Projects</a></li>' +
            '<li><a href="xp://resume">Resume (plain text)</a></li>' +
            '<li><a href="xp://shell">The command prompt</a></li>' +
          '</ul>' +
          (todoNotice('The links above are still placeholders until you fill in the ' +
            '<code>CONFIG</code> block in <code>js/data.js</code>. Nothing else needs editing.')) +
        '</div>';
    }
  };

  PAGES['xp://contact'] = {
    title: 'Contact',
    render: function () {
      var rows = [
        ['GitHub', C.github, 'code, issues, and the Low End LLM runtime'],
        ['LinkedIn', C.linkedin, 'the professional version of this'],
        ['X / Twitter', C.twitter, 'occasional build notes'],
        ['Email', C.email, 'best for anything with words in it'],
        ['Website', C.website, 'you are already here']
      ];
      return '' +
        '<div class="page-hero"><h1>Contact</h1><p>' + esc(C.location) + '</p></div>' +
        '<div class="page-body">' +
          '<h2>Links</h2>' +
          '<ul>' + rows.map(function (r) {
            var todo = XP.isPlaceholder(r[1]);
            return '<li><b>' + esc(r[0]) + '</b><br>' +
              (todo
                ? '<code>' + esc(r[1]) + '</code> <b>[TODO]</b><br><span style="color:#666">' + esc(r[2]) + '</span>'
                : '<a href="' + esc(r[1]) + '" data-ext="1">' + esc(r[1]) + '</a><br><span style="color:#666">' + esc(r[2]) + '</span>') +
              '</li>';
          }).join('') + '</ul>' +
          (todoNotice('Every <code>&lt;PLACEHOLDER&gt;</code> above comes straight from <code>CONFIG</code> in ' +
            '<code>js/data.js</code>. Replace the values and this page is live - no other file needs touching.')) +
          '<h2>Good to know</h2>' +
          '<ul>' +
            '<li>Open to internships, contract work and collaborators on developer tooling.</li>' +
            '<li>Comfortable shipping: TypeScript, Python, Java, and a lot of VS Code extensions.</li>' +
            '<li>Based in ' + esc(C.location) + ', working remotely.</li>' +
          '</ul>' +
        '</div>';
    }
  };

  PAGES['xp://projects'] = {
    title: 'Projects',
    render: function () {
      return '' +
        '<div class="page-hero"><h1>Projects</h1><p>' + esc(M.projects.length) + ' things, shipped or nearly</p></div>' +
        '<div class="page-body">' +
          M.projects.map(function (p, i) {
            return '<h2>' + esc(p.name) +
              (p.status ? ' <span style="font-weight:normal;color:#666">- ' + esc(p.status) + '</span>' : '') +
              '</h2>' +
              '<p>' + esc(p.blurb) + '</p>' +
              '<ul>' + p.details.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' +
              '<p><span class="tagrow">' + p.stack.map(function (s) {
                return '<span class="tag">' + esc(s) + '</span>';
              }).join(' ') + '</span></p>';
          }).join('') +
        '</div>';
    }
  };

  PAGES['xp://resume'] = {
    title: 'Resume',
    render: function () {
      return '' +
        '<div class="page-hero"><h1>Resume</h1><p>the whole thing, as text</p></div>' +
        '<div class="page-body">' +
          '<pre style="white-space:pre-wrap;font:11px Consolas,monospace;line-height:1.45;background:#f7f7f2;' +
          'border:1px solid #c9c9c9;padding:12px;margin:0">' + esc(D.resumeText(M)) + '</pre>' +
          '<p style="margin-top:12px"><a href="xp://contact">Contact details &rarr;</a></p>' +
        '</div>';
    }
  };

  PAGES['xp://shell'] = {
    title: 'The shell',
    render: function () {
      return '' +
        '<div class="page-hero"><h1>The command prompt</h1><p>start menu &rarr; Programs &rarr; Terminal</p></div>' +
        '<div class="page-body">' +
          '<h2>Useful commands</h2>' +
          '<ul>' +
            '<li><code>help</code> - every command, with a one line description</li>' +
            '<li><code>about</code>, <code>skills</code>, <code>projects</code>, <code>experience</code>, <code>education</code></li>' +
            '<li><code>contact</code> - the links above, flagged if they are still placeholders</li>' +
            '<li><code>cat resume.txt</code> - the plain text resume</li>' +
            '<li><code>ls</code>, <code>cd</code>, <code>tree</code> - wander the file system</li>' +
            '<li><code>neofetch</code> - system info, some of it read from the browser</li>' +
            '<li><code>theme bliss</code> - a different green hill</li>' +
          '</ul>' +
          '<h2>Handy shortcuts</h2>' +
          '<ul>' +
            '<li><kbd>Tab</kbd> completes commands and file names</li>' +
            '<li><kbd>&#8593;</kbd> / <kbd>&#8595;</kbd> walks the history</li>' +
            '<li><kbd>Ctrl</kbd> + <kbd>L</kbd> clears the screen</li>' +
            '<li>Drag a window to the very top of the screen to maximize it</li>' +
          '</ul>' +
        '</div>';
    }
  };

  PAGES['xp://about:blank'] = {
    title: 'about:blank',
    render: function () {
      return '<div class="page-body"><h2>Nothing here</h2>' +
        '<p>This browser only knows a handful of local pages, because a real <code>&lt;iframe&gt;</code> ' +
        'of github.com would be blocked by their <code>X-Frame-Options</code> header.</p>' +
        '<p>Start from <a href="xp://start">the home page</a>.</p></div>';
    }
  };

  function todoNotice(msg) {
    return '<div class="todo"><b>Still to do:</b> ' + msg + '</div>';
  }

  /* ------------------------------- the window ------------------------------ */
  function Browser(win, startUrl) {
    this.win = win;
    this.history = [];
    this.hIndex = -1;
    this.build();
    this.navigate(startUrl || 'xp://start');
  }

  Browser.prototype.build = function () {
    var self = this;
    var root = el('div', 'browser');

    var menu = el('div', 'menu-bar');
    [['File', 'New window'], ['Edit', 'Cut'], ['View', 'Refresh'], ['Favorites', 'Add'], ['Tools', 'Options'],
     ['Help', 'About']].forEach(function (pair) {
      var item = el('span', 'mb-item', esc(pair[0]));
      item.addEventListener('click', function () {
        if (pair[1] === 'About') return self.about();
        XP.audio.play('error');
        XP.shell.dialog({
          title: esc(pair[0]), icon: 'warning', width: 340,
          html: esc(pair[1]) + ' is not implemented. <small>The 2001 internet had fewer buttons.</small>',
          buttons: [{ label: 'OK', primary: true }]
        });
      });
      menu.appendChild(item);
    });
    root.appendChild(menu);

    var bar = el('div', 'br-toolbar');
    bar.innerHTML =
      '<button class="tool-btn" data-a="back" title="Back">' + XP_ICONS.get('back') + '</button>' +
      '<button class="tool-btn" data-a="forward" title="Forward">' + XP_ICONS.get('forward') + '</button>' +
      '<button class="tool-btn" data-a="stop" title="Stop">' + XP_ICONS.get('stop') + '</button>' +
      '<button class="tool-btn" data-a="refresh" title="Refresh">' + XP_ICONS.get('refresh') + '</button>' +
      '<span class="tool-sep"></span>' +
      '<button class="tool-btn" data-a="home" title="Home">' + XP_ICONS.get('home') + '</button>' +
      '<button class="tool-btn" data-a="search" title="Search">' + XP_ICONS.get('search') + '</button>';
    var addr = el('div', 'br-addr');
    addr.innerHTML = '<span style="font-size:11px;color:#333">Address</span>';
    this.input = el('input');
    this.input.type = 'text';
    this.input.spellcheck = false;
    this.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') self.navigate(self.input.value);
    });
    addr.appendChild(this.input);
    bar.appendChild(addr);
    var go = el('button', 'tool-btn', XP_ICONS.get('go'));
    go.title = 'Go';
    go.addEventListener('click', function () { self.navigate(self.input.value); });
    bar.appendChild(go);
    root.appendChild(bar);

    this.view = el('div', 'br-view scroller');
    this.view.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (a.hasAttribute('data-ext')) {
        if (XP.isPlaceholder(href)) {
          e.preventDefault();
          return self.placeholder(href);
        }
        e.preventDefault();
        window.open(href, '_blank', 'noopener');
        return;
      }
      e.preventDefault();
      self.navigate(href);
    });
    root.appendChild(this.view);

    this.status = el('div', 'status-bar');
    this.status.innerHTML = '<div class="status-cell grow" data-a="zone">Done</div>' +
      '<div class="status-cell" data-a="security">Local intranet</div>';
    root.appendChild(this.status);

    this.win.body.appendChild(root);
    this.root = root;

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-a]');
      if (!btn) return;
      var a = btn.dataset.a;
      if (a === 'back') self.back();
      else if (a === 'forward') self.forward();
      else if (a === 'refresh') self.reload();
      else if (a === 'home') self.navigate('xp://start');
      else if (a === 'search') self.navigate('xp://start');
    });
  };

  Browser.prototype.navigate = function (url) {
    var raw = String(url || '').trim();
    var key = raw;

    // friendly aliases
    var aliasMap = {
      '': 'xp://start',
      'home': 'xp://start',
      'start': 'xp://start',
      'contact': 'xp://contact',
      'about': 'xp://contact',
      'projects': 'xp://projects',
      'resume': 'xp://resume',
      'shell': 'xp://shell',
      'cmd': 'xp://shell',
      'github': C.github,
      'linkedin': C.linkedin,
      'email': 'mailto:' + C.email,
      'mail': 'mailto:' + C.email
    };
    if (aliasMap[key.toLowerCase()] !== undefined) key = aliasMap[key.toLowerCase()];

    if (!/^xp:\/\//i.test(key)) {
      if (/^https?:\/\//i.test(key)) {
        if (XP.isPlaceholder(key)) { this.placeholder(key); this.input.value = raw; return; }
        window.open(key, '_blank', 'noopener');
        this.input.value = raw;
        return;
      }
      if (/^mailto:/i.test(key)) {
        if (XP.isPlaceholder(C.email)) { this.placeholder(C.email); this.input.value = raw; return; }
        window.location.href = key;
        return;
      }
      key = 'xp://' + key.replace(/^\/+/, '');
    }

    var page = PAGES[key.toLowerCase()] || PAGES['xp://about:blank'];
    this.url = key;
    this.input.value = key;
    this.view.innerHTML = '<div class="page">' + page.render() + '</div>';
    this.view.scrollTop = 0;
    this.status.querySelector('[data-a="zone"]').textContent = 'Done';
    this.win.setTitle(page.title + ' - My Web Browser');

    if (this.hIndex < 0 || this.history[this.hIndex] !== key) {
      this.history = this.history.slice(0, this.hIndex + 1);
      this.history.push(key);
      this.hIndex = this.history.length - 1;
    }
  };

  Browser.prototype.reload = function () {
    this.view.style.opacity = '.4';
    var self = this;
    this.status.querySelector('[data-a="zone"]').textContent = 'Opening page...';
    setTimeout(function () {
      self.navigate(self.url);
      self.view.style.opacity = '';
    }, 180);
  };

  Browser.prototype.back = function () {
    if (this.hIndex <= 0) return;
    this.hIndex--;
    this.navigate(this.history[this.hIndex]);
  };
  Browser.prototype.forward = function () {
    if (this.hIndex >= this.history.length - 1) return;
    this.hIndex++;
    this.navigate(this.history[this.hIndex]);
  };

  Browser.prototype.placeholder = function (href) {
    XP.audio.play('error');
    XP.shell.dialog({
      title: 'My Web Browser', icon: 'warning', width: 400,
      html: '<b>' + esc(href) + '</b> is still a placeholder.<br><br>' +
        'Open <code>js/data.js</code> and replace the values in the <code>CONFIG</code> block at the top ' +
        '(github, linkedin, twitter, email, website). Everything on the site reads from there.',
      buttons: [{ label: 'OK', primary: true }]
    });
  };

  Browser.prototype.about = function () {
    XP.shell.dialog({
      title: 'About My Web Browser', icon: 'browser', width: 380,
      html: '<b>My Web Browser</b><br>Version 6.0 (build 2900.xpsp2_sp2)<br><br>' +
        'This does not fetch anything. Real sites refuse to be framed, so the pages here are rendered ' +
        'locally from the same data the terminal uses.',
      buttons: [{ label: 'OK', primary: true }]
    });
  };

  XP.defineApp('browser', {
    title: 'My Web Browser',
    icon: 'browser',
    blurb: 'the same resume, with windows',
    width: 720,
    height: 520,
    minWidth: 360,
    minHeight: 260,
    launch: function (url) {
      return XP.wm.open({
        appId: 'browser',
        title: 'My Web Browser',
        icon: 'browser',
        width: 720,
        height: 520,
        minWidth: 360,
        minHeight: 260,
        centered: true,
        build: function (body, w) { w.browser = new Browser(w, url); }
      });
    }
  });
})();
