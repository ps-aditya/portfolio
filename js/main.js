/* =============================================================================
 *  main.js - the terminal. No window manager, no boot, no audio, no build step.
 *
 *  Everything it knows lives in js/data.js. This file is just the plumbing.
 * ========================================================================== */

(function () {
  'use strict';

  var D = window.DATA;
  var C = D.config;

  var screenEl = document.getElementById('screen');
  var inputEl = document.getElementById('input');
  var barEl = document.getElementById('bar');

  var history = [];
  var histIdx = -1;

  /* ================================ output =============================== */

  function el(tag, cls, markup) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    n.innerHTML = markup == null ? '' : markup;
    return n;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function scroll() { screenEl.scrollTop = screenEl.scrollHeight; }

  function out(text, cls) {
    screenEl.appendChild(el('div', 'line' + (cls ? ' ' + cls : ''), esc(text)));
    scroll();
  }

  function html(markup, cls) {
    screenEl.appendChild(el('div', 'line' + (cls ? ' ' + cls : ''), markup));
    scroll();
  }

  function para(markup) { html(markup, 'wrap'); }

  function blank(n) { for (var i = 0; i < (n || 1); i++) out(''); }

  function rule(label) {
    var tail = '';
    var width = Math.max(4, 56 - label.length);
    for (var i = 0; i < width; i++) tail += '-';
    html('<span class="rule">' + esc(label) + ' ' + esc(tail) + '</span>');
  }

  /* ============================== commands =============================== */

  var CMDS = [];
  function def(names, desc, run) {
    var list = Array.isArray(names) ? names : [names];
    CMDS.push({ names: list, desc: desc, run: run });
  }

  var INDEX = {};
  function reindex() {
    INDEX = {};
    CMDS.forEach(function (c) { c.names.forEach(function (n) { INDEX[n] = c; }); });
  }

  function link(href, label) {
    if (!href) return '';
    if (D.isPlaceholder(href)) {
      return '<span class="warn">' + esc(label) + '</span>';
    }
    return '<a data-ext href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(label) + '</a>';
  }

  /* ------------------------------- who ---------------------------------- */
  def(['who', 'w', 'about'], 'who I am', function (t) {
    blank();
    html('<span class="hi">' + esc(C.name) + '</span>');
    out(C.role + '  -  ' + C.location, 'dim');
    blank();
    para('I build developer tools and local-first AI runtimes. Currently ' +
      '<b>' + esc(C.now.split(' - ')[0]) + '</b> - ' +
      esc(C.now.split(' - ').slice(1).join(' - ') || C.now) + '.');
    blank();
    rule('education');
    D.education.forEach(function (e) {
      html('<span class="hi">' + esc(e.school) + '</span> <span class="dimmer">' + esc(e.period) + '</span>');
      out('  ' + e.degree, 'dim');
    });
    blank();
    rule('currently');
    para('<b>' + esc(C.now.split(' - ')[0]) + '</b> - ' +
      esc(C.now.split(' - ').slice(1).join(' - ')) + '.');
    blank();
    para('<span class="dim">more:</span> ' +
      cmdLink('projects', 'projects') + ' &nbsp; ' + cmdLink('skills', 'skills') +
      ' &nbsp; ' + cmdLink('misc', 'misc') + ' &nbsp; ' + cmdLink('contact', 'contact'));
    blank();
  });

  /* ------------------------------ skills -------------------------------- */
  def(['skills', 's'], 'languages and tools', function (t) {
    blank();
    rule('skills');
    var grid = el('div', 'grid');
    D.skills.forEach(function (g) {
      grid.appendChild(el('div', 'wrap',
        '<span class="acc">' + esc(g.group) + '</span><br>' +
        g.items.map(function (i) { return '<span class="dim">' + esc(i) + '</span>'; }).join(', ')));
    });
    screenEl.appendChild(grid);
    blank();
    out('Mostly learned by shipping them rather than by reading about them.', 'dimmer');
    blank();
  });

  /* ----------------------------- projects ------------------------------- */
  function projectDetail(t, p) {
    rule(p.name);
    para('<span class="hi">' + esc(p.blurb) + '</span>');
    var meta = p.stack.join('  ');
    if (p.status) meta += '   <span class="dimmer">' + esc(p.status) + '</span>';
    para('<span class="dim">' + esc(meta) + '</span>');
    blank();
    p.details.forEach(function (d) { para('<span class="acc">-</span> ' + esc(d)); });
    var l = (p.links || []).map(function (x) {
      return link(C.github, x.label);
    }).filter(Boolean).join(' &nbsp;|&nbsp; ');
    if (l) para('<span class="dimmer">' + l + '</span>');
    blank();
  }

  def(['projects', 'pj', 'p'], 'things I have built', function (t, args) {
    if (args[0]) {
      var q = args[0].toLowerCase();
      var hit = D.projects.filter(function (p) {
        return p.name.toLowerCase().indexOf(q) > -1 ||
          p.stack.join(' ').toLowerCase().indexOf(q) > -1;
      })[0];
      if (!hit) {
        out('no project matches "' + args[0] + '"', 'warn');
        out('try: ' + D.projects.map(function (p) { return p.name.split(' ')[0].toLowerCase(); }).join(', '), 'dimmer');
        return;
      }
      blank();
      projectDetail(t, hit);
      return;
    }
    blank();
    rule('projects');
    D.projects.forEach(function (p) {
      var meta = p.stack.slice(0, 3).join(', ');
      if (p.status) meta += '  [' + p.status + ']';
      para('<span class="entry"><span class="t">' + esc(p.name) + '</span> ' +
        '<span class="m">' + esc(meta) + '</span><br>' +
        '<span class="d">' + esc(p.blurb) + '</span></span>');
    });
    blank();
    para('<span class="dimmer">detail:</span> ' + cmdLink('pj docker vitals', 'pj docker vitals'));
    blank();
  });

  /* -------------------------------- misc -------------------------------- */
  def(['misc', 'miscellaneous'], 'experience and education', function (t) {
    blank();
    rule('experience');
    D.experience.forEach(function (e) {
      para('<span class="hi">' + esc(e.role) + '</span> <span class="dimmer">@ ' +
        esc(e.org) + '  (' + esc(e.location) + ')</span><br>' +
        '<span class="dimmer">' + esc(e.period) + '</span>');
      e.bullets.forEach(function (b) { para('<span class="acc">-</span> ' + esc(b)); });
      blank();
    });

    rule('education');
    D.education.forEach(function (e) {
      para('<span class="hi">' + esc(e.school) + '</span> <span class="dimmer">' + esc(e.location) + '</span><br>' +
        esc(e.degree) + '<br><span class="dimmer">' + esc(e.period) + '</span>');
    });
    blank();

    rule('this site');
    para('One HTML file with the CSS inlined, plus <span class="acc">js/data.js</span> (all the content) ' +
      'and <span class="acc">js/main.js</span> (the terminal). No frameworks, no bundler, no analytics, ' +
      'no cookies, no fonts fetched. The green is Bliss.');
    para('Type <span class="acc">games</span> if you have a minute to kill.', 'dim');
    blank();
    cmdLink('contact', 'contact');
    blank();
  });

  /* ------------------------------- blog --------------------------------- */
  def(['blog', 'b', 'notes'], 'what I am into', function (t) {
    blank();
    rule('blog');
    if (D.blog.posts.length) {
      D.blog.posts.forEach(function (p) {
        para('<span class="hi">' + link(p.url, p.title) + '</span> ' +
          '<span class="dimmer">' + esc(p.date || '') + '</span>' +
          (p.note ? '<br><span class="d">' + esc(p.note) + '</span>' : ''));
      });
      blank();
      return;
    }
    para('No posts yet. I would rather ship something than announce it.');
    blank();
    out('What I am into right now:', 'acc');
    D.blog.thinking.forEach(function (x) { para('<span class="acc">-</span> ' + esc(x)); });
    blank();
    para('Until then: ' + link(C.github, 'the repos') + ' &nbsp; ' + link(C.linkedin, 'linkedin'));
    blank();
  });

  /* ------------------------------ resume -------------------------------- */
  def(['resume', 'cv'], 'the whole thing, as text', function (t) {
    blank();
    D.resumeText().split('\n').forEach(function (line) {
      if (!line.trim()) { out(''); return; }
      if (/^[A-Z][A-Z ]{2,}$/.test(line.trim())) { rule(line.trim()); return; }
      para(esc(line));
    });
    blank();
    para('<span class="dimmer">the same file lives at</span> ' + link(C.resumeUrl, 'resume.txt'));
    blank();
  });

  /* ------------------------------ contact -------------------------------- */
  def(['contact', 'links'], 'where to find me', function (t) {
    blank();
    rule('contact');
    D.contactRows().forEach(function (c) {
      var todo = D.isPlaceholder(c.value);
      para('<span class="acc">' + esc(c.key) + '</span>  ' +
        (todo
          ? '<span class="warn">' + esc(c.value) + '</span> <span class="warn">  [TODO - set it in js/data.js]</span>'
          : link(c.href, D.shortUrl(c.value))));
    });
    blank();
    out(C.location, 'dim');
    blank();
  });

  /* ------------------------------- help ---------------------------------- */
  def(['help', 'h', '?'], 'list every command', function (t) {
    blank();
    rule('commands');
    var grid = el('div', 'grid');
    CMDS.forEach(function (c) {
      grid.appendChild(el('div', 'r',
        '<span class="c">' + c.names.map(function (n) { return '[' + esc(n) + ']'; }).join(' ') +
        '</span> <span class="d">' + esc(c.desc) + '</span>'));
    });
    screenEl.appendChild(grid);
    blank();
    out('tab completes - up/down walks history - ctrl+l clears', 'dimmer');
    blank();
  });

  /* ------------------------------- misc bits ------------------------------ */
  def(['clear', 'cls'], 'wipe the screen', function (t) {
    screenEl.innerHTML = '';
    out('');
  });

  def(['date'], "today's date", function (t) { out(new Date().toDateString(), 'dim'); });

  def(['sudo'], 'ask nicely', function (t) {
    out('nice try. this is a static site; there is nothing to escalate.', 'warn');
  });

/* helper: a clickable in-terminal command */
  function cmdLink(cmd, label) {
    return '<a data-cmd="' + esc(cmd) + '" href="#">' + esc(label || cmd) + '</a>';
  }

/* ================================ games ================================
   * Games print straight into the output stream - no windows, no chrome.
   * While one is running the prompt ignores arrows so the game can have them.
   * ====================================================================== */

var gameKeys = null;     // keyboard handler, while a game wants the arrows
  var gameTeardown = null; // anything that must be stopped (timers)

  function endGame() {
    if (gameTeardown) { try { gameTeardown(); } catch (e) { /* never fatal */ } }
    gameTeardown = null;
    gameKeys = null;
  }

  var GAMES = {
    minesweeper: { aliases: ['minesweeper', 'ms', 'winmine'], desc: 'left click reveals, right click flags' },
    snake: { aliases: ['snake'], desc: 'arrow keys or the pad' }
  };

  def(['games', 'g'], 'a couple of distractions', function (t, args) {
    if (args.length) return play(args.join(' '));
    blank();
    rule('games');
    para('Two of them, off the drive of the machine that taught me to use a mouse.');
    blank();
    Object.keys(GAMES).forEach(function (k) {
      para(cmdLink('g ' + k, '[' + k + ']') + ' <span class="dim">' + esc(GAMES[k].desc) + '</span>');
    });
    blank();
  });

  function play(name) {
    var q = String(name || '').toLowerCase();
    endGame();
    if (q.indexOf('mine') > -1) return minesweeper(q.indexOf('expert') > -1 ? 'expert'
      : (q.indexOf('inter') > -1 ? 'intermediate' : 'beginner'));
    if (q.indexOf('snake') > -1) return snake();
    out('no game called "' + name + '". try: games', 'warn');
  }

  /* ------------------------------ minesweeper ---------------------------- */
  var LEVELS = { beginner: [9, 10], intermediate: [16, 40], expert: [16, 99] };

  function minesweeper(level) {
    var size = LEVELS[level] || LEVELS.beginner;
    var cols = size[0], rows = size[0], mines = size[1];
    var grid = [], cells = [], started = false, over = false, flags = 0, opened = 0;

    for (var i = 0; i < rows; i++) {
      grid[i] = [];
      for (var j = 0; j < cols; j++) grid[i][j] = { m: false, o: false, f: false, n: 0 };
    }

    blank();
    out('minesweeper - ' + level + ' - ' + cols + 'x' + rows + ' - ' + mines + ' mines', 'dim');
    var status = el('div', 'ms-hint', '');
    var hint = el('div', 'ms-hint', 'left click reveals  -  right click flags  -  type `games` to leave');
    var board = el('div', 'ms');
    board.style.gridTemplateColumns = 'repeat(' + cols + ', auto)';

    function nbrs(r, c) {
      var list = [];
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          var nr = r + dr, nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
          list.push([nr, nc]);
        }
      }
      return list;
    }

    function plant(sr, sc) {
      var placed = 0;
      while (placed < mines) {
        var r = Math.floor(Math.random() * rows), c = Math.floor(Math.random() * cols);
        if (grid[r][c].m) continue;
        if (Math.abs(r - sr) <= 1 && Math.abs(c - sc) <= 1) continue;
        grid[r][c].m = true;
        placed++;
      }
      for (var a = 0; a < rows; a++) {
        for (var b = 0; b < cols; b++) {
          grid[a][b].n = nbrs(a, b).filter(function (p) { return grid[p[0]][p[1]].m; }).length;
        }
      }
    }

    function repaint() {
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var cell = grid[r][c], b = cells[r][c];
          b.className = cell.o
            ? 'ms o' + (cell.m ? ' boom' : (cell.n ? ' o' + cell.n : ''))
            : 'ms';
          b.setAttribute('aria-pressed', cell.f ? 'true' : 'false');
          b.textContent = cell.o ? (cell.m ? '*' : (cell.n || '')) : (cell.f ? 'F' : '.');
        }
      }
      status.textContent = 'mines left ' + (mines - flags) + '   -   opened ' + opened;
      scroll();
    }

    function reveal(r, c) {
      if (over || grid[r][c].o || grid[r][c].f) return;
      if (!started) { started = true; plant(r, c); }
      grid[r][c].o = true;
      opened++;
      if (grid[r][c].m) return finish(false);
      if (!grid[r][c].n) nbrs(r, c).forEach(function (p) { reveal(p[0], p[1]); });
      if (opened >= rows * cols - mines) finish(true);
    }

    function toggleFlag(r, c) {
      if (over || grid[r][c].o) return;
      grid[r][c].f = !grid[r][c].f;
      flags += grid[r][c].f ? 1 : -1;
      repaint();
    }

    function finish(won) {
      over = true;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          if (won && grid[r][c].m) grid[r][c].f = true;
          if (!won) grid[r][c].o = true;
        }
      }
      repaint();
      hint.innerHTML = won
        ? 'cleared. not bad. type <span class="acc">games</span> for another round'
        : 'boom. type <span class="acc">games</span> to try again';
    }

    for (var r2 = 0; r2 < rows; r2++) {
      cells[r2] = [];
      for (var c2 = 0; c2 < cols; c2++) {
        cells[r2][c2] = makeCell(r2, c2);
        board.appendChild(cells[r2][c2]);
      }
    }

    function makeCell(r, c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = '.';
      b.addEventListener('click', function () { reveal(r, c); });
      b.addEventListener('contextmenu', function (e) { e.preventDefault(); toggleFlag(r, c); });
      return b;
    }

screenEl.appendChild(board);
    screenEl.appendChild(status);
    screenEl.appendChild(hint);
    repaint();
    scroll();
  }

  /* -------------------------------- snake -------------------------------- */
  var DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

  function snake() {
    var W = 24, H = 13;
    var body, dir, queued, food, alive = true, paused = false, score = 0, step = 160, timer;

    blank();
    out('snake - arrow keys or the pad', 'dim');

    var wrap = el('div', 'snake');
    var pre = el('pre');
    var pad = el('div', 'pad');
    var note = el('div', 'ms-hint', '');

    var padBtn = function (glyph, fn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = glyph;
      b.addEventListener('click', fn);
      return b;
    };

    var gap = function () { return document.createElement('span'); };
    pad.appendChild(gap());
    pad.appendChild(padBtn('\u2191', function () { turn('ArrowUp'); }));
    pad.appendChild(padBtn('\u2190', function () { turn('ArrowLeft'); }));
    pad.appendChild(padBtn('\u2192', function () { turn('ArrowRight'); }));
    pad.appendChild(gap());
    pad.appendChild(padBtn('\u2193', function () { turn('ArrowDown'); }));
    wrap.appendChild(pre);
    wrap.appendChild(pad);

    var controls = el('div', 'pad');
    controls.style.marginTop = '8px';
    controls.appendChild(padBtn('pause', function () {
      if (!alive) return;
      paused = !paused;
      note.textContent = paused ? 'paused' : '';
      draw();
    }));
    controls.appendChild(padBtn('quit', stop));
    wrap.appendChild(controls);

    screenEl.appendChild(wrap);
    screenEl.appendChild(note);
    scroll();

function stop() {
      clearInterval(timer);
      gameKeys = null;
      gameTeardown = null;
      note.textContent = 'quit - type `games` to play again';
    }

    function turn(k) {
      var d = DIRS[k];
      if (!d || paused || !alive) return;
      if (d[0] === -dir[0] && d[1] === -dir[1]) return;   // no instant reversal
      queued = d;
    }

function key(e) {
      if (e.key === ' ') return;            // space belongs to the prompt
      if (!DIRS[e.key]) return;
      e.preventDefault();
      turn(e.key);
    }
    gameKeys = key;
    gameTeardown = function () { clearInterval(timer); };

    function placeFood() {
      var guard = 0;
      do {
        food = { x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H) };
      } while (body.some(function (s) { return s.x === food.x && s.y === food.y; }) && ++guard < 500);
    }

    function reset() {
      body = [{ x: 4, y: 6 }, { x: 3, y: 6 }, { x: 2, y: 6 }];
      dir = [1, 0];
      queued = [1, 0];
      alive = true;
      paused = false;
      score = 0;
      step = 160;
      placeFood();
      clearInterval(timer);
      timer = setInterval(tick, step);
    }

    function tick() {
      if (paused || !alive) return;
      dir = queued;
      var head = { x: body[0].x + dir[0], y: body[0].y + dir[1] };
      var hitWall = head.x < 0 || head.y < 0 || head.x >= W || head.y >= H;
      var hitSelf = body.some(function (s) { return s.x === head.x && s.y === head.y; });
      if (hitWall || hitSelf) {
        alive = false;
        clearInterval(timer);
        note.textContent = 'died on ' + score + ' - type `games` to play again';
        draw();
        return;
      }
      body.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        step = Math.max(70, 160 - Math.floor(score / 10) * 8);
        clearInterval(timer);
        timer = setInterval(tick, step);
        placeFood();
      } else {
        body.pop();
      }
      draw();
    }

    function draw() {
      var lines = [];
      for (var y = 0; y < H; y++) {
        var row = '';
        for (var x = 0; x < W; x++) {
          var ch = ' ';
          if (food && food.x === x && food.y === y) ch = '\u00b7';
          if (body.some(function (s) { return s.x === x && s.y === y; })) ch = '#';
          row += ch;
        }
        lines.push(row);
      }
      lines.push('');
      lines.push('score ' + score + (paused ? '   [paused]' : '') + (alive ? '' : '   [dead]'));
      pre.textContent = lines.join('\n');
      scroll();
    }

    reset();
    draw();
  }
  /* ================================ repl ================================= */

  /* index every alias now that all commands are registered */
  reindex();

  function execute(line) {
    line = String(line || '').trim();
    if (!line) return;

    var m = line.match(/^(\S+)\s*([\s\S]*)$/);
    var name = (m ? m[1] : line).toLowerCase();
    var rest = m ? m[2].trim() : '';
    var args = rest ? rest.match(/"[^"]*"|\S+/g).map(function (a) { return a.replace(/^"|"$/g, ''); }) : [];

    var cmd = INDEX[name];
    if (!cmd) {
      para('<span class="warn">' + esc(name) + '</span> <span class="dim">is not a command here. ' +
        'Try <span class="acc">help</span>.</span>');
      return;
    }
    try {
      cmd.run(cmd, args);
    } catch (err) {
      para('<span class="warn">something broke: ' + esc(err && err.message || err) + '</span>');
      if (window.console) console.error(err);
    }
    scroll();
  }

  function echo(text, cls) {
    screenEl.appendChild(el('div', 'line ' + (cls || ''),
      '<span style="color:#7ec850">' + esc(C.handle + '@' + C.promptHost) + ':~$</span> ' +
      '<span class="dim">' + esc(text) + '</span>'));
    scroll();
  }

function complete() {
    var v = inputEl.value;
    var trailing = /\s$/.test(v);
    var parts = v.split(/\s+/).filter(function (p, i) { return p !== '' || i === 0; });
    var head = (parts[0] || '').toLowerCase();
    var last = (parts[parts.length - 1] || '').toLowerCase();
    var completingCommand = parts.length === 1 && !trailing;

    var pool;
    if (completingCommand) {
      pool = Object.keys(INDEX).filter(function (n) { return n.indexOf(head) === 0; });
    } else if (parts.length === 2) {
      var g = Object.keys(GAMES).filter(function (k) { return GAMES[k].aliases.indexOf(head) > -1; })[0];
      pool = g ? GAMES[g].aliases.filter(function (n) { return n.indexOf(last) === 0; }) : [];
    } else {
      pool = [];
    }

    if (!pool.length) return;

    if (pool.length === 1) {
      var done = parts.slice();
      done[done.length - 1] = pool[0];
      inputEl.value = done.join(' ') + ' ';
      return;
    }

    var prefix = pool[0];
    pool.forEach(function (c) { while (c.indexOf(prefix) !== 0) prefix = prefix.slice(0, -1); });
    if (prefix.length > last.length) {
      var d2 = parts.slice();
      d2[d2.length - 1] = prefix;
      inputEl.value = d2.join(' ');
      return;
    }
    para('<span class="dimmer">' + pool.join('   ') + '</span>');
  }

  inputEl.addEventListener('keydown', function (e) {
    var k = e.key;

    // Enter and Ctrl+L always belong to the prompt. While a game is running,
    // arrows are routed to the game instead of caret / history movement.
    if (gameKeys && k.indexOf('Arrow') === 0) return;

    if (k === 'Enter') {
      e.preventDefault();
      var v = inputEl.value;
      inputEl.value = '';
      echo(v);
      if (v.trim()) history.push(v);
      histIdx = -1;
      endGame();
      execute(v);
      return;
    }

    if (k === 'Tab') { e.preventDefault(); complete(); return; }

    if (k === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      histIdx = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
      inputEl.value = history[histIdx];
      return;
    }

    if (k === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < 0) return;
      histIdx++;
      if (histIdx >= history.length) { histIdx = -1; inputEl.value = ''; }
      else inputEl.value = history[histIdx];
      return;
    }

    if ((k === 'l' || k === 'L') && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      endGame();
      screenEl.innerHTML = '';
      out('');
    }
  });

  /* clicks: [cmd] links run commands, external links open normally */
  screenEl.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    var cmd = a.getAttribute('data-cmd');
    if (cmd) {
      e.preventDefault();
      echo(cmd, 'dim');
      execute(cmd);
      return;
    }
    var href = a.getAttribute('href') || '';
    if (a.hasAttribute('data-ext')) {
      if (D.isPlaceholder(href)) {
        e.preventDefault();
        para('<span class="warn">That link is still a placeholder.</span> ' +
          '<span class="dim">Set it in js/data.js and it goes live.</span>');
        return;
      }
      e.preventDefault();
      window.open(href, '_blank', 'noopener');
      return;
    }
    e.preventDefault();
  });

  screenEl.addEventListener('click', function (e) {
    if (window.getSelection && String(window.getSelection()).length) return;
    inputEl.focus();
  });

document.addEventListener('keydown', function (e) {
    // a running game gets first refusal on the arrow keys; Escape always leaves
    if (e.key === 'Escape') { endGame(); return; }
    if (gameKeys) { gameKeys(e); return; }
    if (e.target === inputEl) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Enter|Backspace|Delete| )$/.test(e.key)) {
      inputEl.focus();
    }
  });

  /* focus immediately: the whole point is that it is ready when you arrive */
  inputEl.focus();
  document.addEventListener('pointerdown', function (e) {
    if (window.getSelection && String(window.getSelection()).length) return;
    if (e.target.closest('a') || e.target.closest('button')) return;
    inputEl.focus();
  });

  if (window.console && console.log) {
    console.log('%cAditya Shaji', 'font:700 15px ui-monospace,monospace;color:#7ec850',
      '\nYou opened devtools. Content is in js/data.js, this file is the shell.',
      '\nMachine readable: ' + (C.website || '') + 'llms.txt  ·  ' + (C.website || '') + 'resume.txt');
  }
})();