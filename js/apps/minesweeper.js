/* =============================================================================
 *  apps/minesweeper.js — winmine.exe. Real rules: first click is safe, flood
 *  fill, chording, flags, best times in localStorage.
 * ========================================================================== */

(function () {
  'use strict';

  var BEST_KEY = 'xp-mine-best-';

  var LEVELS = {
    beginner: { label: 'Beginner', cols: 9, rows: 9, mines: 10 },
    intermediate: { label: 'Intermediate', cols: 16, rows: 16, mines: 40 },
    expert: { label: 'Expert', cols: 30, rows: 16, mines: 99 }
  };

  function esc(s) { return XP.wm.escapeHtml(s); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* --------------------------------- faces --------------------------------- */
  function face(kind) {
    var eyes, mouth;
    if (kind === 'dead') {
      eyes = '<g stroke="#000" stroke-width="2.2" stroke-linecap="round">' +
        '<line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>' +
        '<line x1="17" y1="9" x2="23" y2="15"/><line x1="23" y1="9" x2="17" y2="15"/></g>';
      mouth = '<path d="M10 21a6 6 0 0 1 11 0z" fill="#000"/>';
    } else if (kind === 'cool') {
      eyes = '<rect x="5" y="7" width="10" height="6" rx="1.5" fill="#000"/>' +
             '<rect x="17" y="7" width="10" height="6" rx="1.5" fill="#000"/>';
      mouth = '<path d="M11 19a5 5 0 0 0 10 0" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/>';
    } else {
      eyes = '<g fill="#000"><circle cx="11" cy="11" r="1.9"/><circle cx="20" cy="11" r="1.9"/></g>';
      mouth = kind === 'o'
        ? '<ellipse cx="15.5" cy="19" rx="3" ry="2.4" fill="#000"/>'
        : '<path d="M10.5 17.5a5.5 5.5 0 0 0 10 0" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">' +
      '<circle cx="15.5" cy="15.5" r="13" fill="#f5c53a" stroke="#8a6500" stroke-width="1.4"/>' +
      eyes + mouth + '</svg>';
  }

  var FLAG_SVG = '<svg viewBox="0 0 32 32" width="15" height="15" aria-hidden="true">' +
    '<path d="M8 25V7h13l-3 5 3 5H8z" fill="#e02020" stroke="#7a0000" stroke-width="1.6" ' +
    'stroke-linejoin="round"/><rect x="6" y="25" width="12" height="3" rx="1" fill="#7a0000"/></svg>';

  var MINE_SVG = '<svg viewBox="0 0 32 32" width="15" height="15" aria-hidden="true">' +
    '<g stroke="#5f5f5f" stroke-width="3" stroke-linecap="round">' +
    '<line x1="16" y1="3" x2="16" y2="9"/><line x1="16" y1="23" x2="16" y2="29"/>' +
    '<line x1="3" y1="16" x2="9" y2="16"/><line x1="23" y1="16" x2="29" y2="16"/></g>' +
    '<circle cx="16" cy="16" r="8" fill="#1c1c1c"/><circle cx="13" cy="13" r="2.2" fill="#fff"/></svg>';

  /* --------------------------------- game ---------------------------------- */
  function Minesweeper(win, level) {
    this.win = win;
    this.level = LEVELS[level] ? level : 'beginner';
    this.reset();
    this.build();
    this.render();
  }

  Minesweeper.prototype.build = function () {
    var self = this;
    var root = el('div', 'mines');

    var menu = el('div', 'menu-bar');
    var game = el('span', 'mb-item', 'Game');
    game.addEventListener('click', function () {
      self.dropdown(game, [
        { label: 'New', hint: 'F2', run: function () { self.reset(); self.render(); } },
        { sep: true },
        { label: 'Beginner', run: function () { self.switchLevel('beginner'); } },
        { label: 'Intermediate', run: function () { self.switchLevel('intermediate'); } },
        { label: 'Expert', run: function () { self.switchLevel('expert'); } },
        { sep: true },
        { label: 'Best Times...', run: function () { self.bestTimes(); } },
        { sep: true },
        { label: 'Exit', run: function () { self.win.close(); } }
      ]);
    });
    menu.appendChild(game);

    var help = el('span', 'mb-item', 'Help');
    help.addEventListener('click', function () { self.help(); });
    menu.appendChild(help);
    root.appendChild(menu);

    var frame = el('div', 'mn-frame');
    this.mineDigits = el('div', 'mn-digits');
    this.timeDigits = el('div', 'mn-digits');
    var mineLcd = el('div', 'mn-lcd');
    mineLcd.appendChild(this.mineDigits);
    var timeLcd = el('div', 'mn-lcd');
    timeLcd.appendChild(this.timeDigits);

    this.faceBtn = el('button', 'mn-face', face('smile'));
    this.faceBtn.type = 'button';
    this.faceBtn.title = 'New game (F2)';
    this.faceBtn.setAttribute('aria-label', 'New game');
    this.faceBtn.addEventListener('click', function () {
      self.faceBtn.innerHTML = face('smile');
      self.reset();
      self.render();
    });

    frame.appendChild(mineLcd);
    frame.appendChild(this.faceBtn);
    frame.appendChild(timeLcd);
    root.appendChild(frame);

    this.boardWrap = el('div', 'mn-board-wrap scroller');
    this.board = el('div', 'mn-board');
    this.board.setAttribute('role', 'grid');
    this.board.setAttribute('aria-label', 'Minesweeper board');
    this.board.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    this.boardWrap.appendChild(this.board);
    root.appendChild(this.boardWrap);

    this.status = el('div', 'mn-status', 'F2 for a new game. Right click to flag.');
    root.appendChild(this.status);

    this.win.body.appendChild(root);
    this.root = root;

    this.win.el.tabIndex = -1;
    this.win.el.addEventListener('keydown', function (e) {
      if (e.key === 'F2') {
        e.preventDefault();
        self.faceBtn.innerHTML = face('smile');
        self.reset();
        self.render();
      }
    });
  };

  Minesweeper.prototype.dropdown = function (anchor, items) {
    document.querySelectorAll('.mines-dropdown').forEach(function (n) { n.remove(); });
    anchor.classList.add('is-open');
    var drop = el('div', 'mines-dropdown');
    drop.style.cssText = 'position:absolute;z-index:5000;min-width:160px;padding:2px;background:var(--face);' +
      'border:1px solid #7a9db9;box-shadow:2px 2px 5px rgba(0,0,0,.3);font-size:11px;';
    items.forEach(function (it) {
      if (it.sep) { drop.appendChild(el('div', 'menu-sep')); return; }
      var row = el('div', 'menu-item');
      row.style.cssText = 'padding:4px 12px;display:flex;gap:16px;align-items:center;';
      row.innerHTML = '<span>' + esc(it.label) + '</span>' +
        (it.hint ? '<span style="margin-left:auto;color:#777;font-size:10px">' + esc(it.hint) + '</span>' : '');
      row.addEventListener('click', function (e) {
        e.stopPropagation();
        drop.remove();
        anchor.classList.remove('is-open');
        it.run();
      });
      drop.appendChild(row);
    });
    var host = this.win.el.getBoundingClientRect();
    var r = anchor.getBoundingClientRect();
    drop.style.left = (r.left - host.left) + 'px';
    drop.style.top = (r.bottom - host.top) + 'px';
    this.win.body.appendChild(drop);

    var off = function (e) {
      if (e.target.closest('.mines-dropdown') || e.target.closest('.menu-bar')) return;
      drop.remove();
      anchor.classList.remove('is-open');
      document.removeEventListener('pointerdown', off);
    };
    setTimeout(function () { document.addEventListener('pointerdown', off); }, 0);
  };

  /* ------------------------------ game state ------------------------------- */
  Minesweeper.prototype.reset = function () {
    this.cfg = LEVELS[this.level];
    this.grid = [];
    for (var r = 0; r < this.cfg.rows; r++) {
      var row = [];
      for (var c = 0; c < this.cfg.cols; c++) {
        row.push({ mine: false, open: false, flag: false, n: 0 });
      }
      this.grid.push(row);
    }
    this.started = false;
    this.over = false;
    this.flags = 0;
    this.opened = 0;
    this.time = 0;
    this.stopTimer();
  };

  Minesweeper.prototype.stopTimer = function () {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  };

  Minesweeper.prototype.startTimer = function () {
    if (this.timer) return;
    var self = this;
    this.timer = setInterval(function () {
      self.time = Math.min(999, self.time + 1);
      self.paintLcd();
    }, 1000);
  };

  Minesweeper.prototype.nbrs = function (r, c) {
    var out = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        var nr = r + dr, nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= this.cfg.rows || nc >= this.cfg.cols) continue;
        out.push([nr, nc]);
      }
    }
    return out;
  };

  Minesweeper.prototype.placeMines = function (safeR, safeC) {
    var placed = 0;
    while (placed < this.cfg.mines) {
      var r = Math.floor(Math.random() * this.cfg.rows);
      var c = Math.floor(Math.random() * this.cfg.cols);
      var cell = this.grid[r][c];
      if (cell.mine) continue;
      // the opening click (and its immediate neighbours) stays clear
      if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
      cell.mine = true;
      placed++;
    }
    for (var i = 0; i < this.cfg.rows; i++) {
      for (var j = 0; j < this.cfg.cols; j++) {
        var cell2 = this.grid[i][j];
        cell2.n = this.nbrs(i, j).filter(function (p) { return this.grid[p[0]][p[1]].mine; }, this).length;
      }
    }
  };

  /* -------------------------------- actions -------------------------------- */
  Minesweeper.prototype.reveal = function (r, c) {
    var cell = this.grid[r][c];
    if (this.over || cell.open || cell.flag) return;

    if (!this.started) {
      this.started = true;
      this.placeMines(r, c);
      this.startTimer();
      this.repaint();
    }

    cell.open = true;
    this.opened++;
    this.paintCell(r, c);

    if (cell.mine) { this.lose(); return; }

    if (cell.n === 0) {
      var self = this;
      this.nbrs(r, c).forEach(function (p) {
        if (!self.grid[p[0]][p[1]].open) self.reveal(p[0], p[1]);
      });
    }
    this.checkWin();
  };

  Minesweeper.prototype.toggleFlag = function (r, c) {
    if (this.over) return;
    var cell = this.grid[r][c];
    if (cell.open) return;
    cell.flag = !cell.flag;
    this.flags += cell.flag ? 1 : -1;
    this.paintCell(r, c);
    this.paintLcd();
  };

  Minesweeper.prototype.chord = function (r, c) {
    if (this.over) return;
    var cell = this.grid[r][c];
    if (!cell.open || !cell.n) return;
    var coords = this.nbrs(r, c);
    var flagged = coords.filter(function (p) { return this.grid[p[0]][p[1]].flag; }, this).length;
    if (flagged !== cell.n) return;
    var self = this;
    coords.forEach(function (p) {
      if (self.grid[p[0]][p[1]].flag) return;
      self.reveal(p[0], p[1]);
    });
  };

  Minesweeper.prototype.lose = function () {
    this.over = true;
    this.stopTimer();
    this.faceBtn.innerHTML = face('dead');
    this.revealAllMines();
    XP.audio.play('error');
    this.status.textContent = 'Boom. Press the face (or F2) to try again.';
  };

  Minesweeper.prototype.revealAllMines = function () {
    for (var r = 0; r < this.cfg.rows; r++) {
      for (var c = 0; c < this.cfg.cols; c++) {
        var cell = this.grid[r][c];
        if (cell.mine) {
          cell.open = true;
          this.paintCell(r, c);
        } else if (cell.flag) {
          cell.wrong = true;
          this.paintCell(r, c);
        }
      }
    }
  };

  Minesweeper.prototype.checkWin = function () {
    if (this.opened < this.cfg.rows * this.cfg.cols - this.cfg.mines) return;
    this.over = true;
    this.stopTimer();
    this.faceBtn.innerHTML = face('cool');
    // flag every remaining mine, like the original
    for (var r = 0; r < this.cfg.rows; r++) {
      for (var c = 0; c < this.cfg.cols; c++) {
        var cell = this.grid[r][c];
        if (cell.mine && !cell.flag) { cell.flag = true; this.flags++; }
      }
    }
    this.repaint();
    this.paintLcd();
    XP.audio.play('ding');

    var key = BEST_KEY + this.level;
    var best = readBest(key);
    var self = this;
    if (!best || this.time < best.time) {
      try {
        localStorage.setItem(key, JSON.stringify({ time: this.time, when: Date.now() }));
      } catch (e) { /* private mode */ }
      this.status.textContent = 'New best time: ' + this.time + ' seconds. Press F2 to play again.';
      setTimeout(function () {
        XP.shell.dialog({
          title: 'Fastest Mine Sweepers', icon: 'trophy', width: 380,
          html: '<b>' + self.time + ' seconds</b> - a new record for ' + esc(self.cfg.label) + '.<br><br>' +
            'Stored in this browser only. Now break it.',
          buttons: [{ label: 'OK', primary: true }]
        });
      }, 400);
    } else {
      this.status.textContent = 'Cleared in ' + this.time + ' seconds. Best: ' + best.time + '. Press F2 to play again.';
    }
  };

  function readBest(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }

  Minesweeper.prototype.switchLevel = function (level) {
    this.level = level;
    this.faceBtn.innerHTML = face('smile');
    this.reset();
    this.render();
  };

  Minesweeper.prototype.bestTimes = function () {
    var rows = Object.keys(LEVELS).map(function (k) {
      var b = readBest(BEST_KEY + k);
      return '<tr><td style="padding:3px 14px 3px 0">' + esc(LEVELS[k].label) + '</td>' +
        '<td style="padding:3px 0">' + (b ? b.time + ' seconds' : '<span style="color:#999">999</span>') + '</td></tr>';
    }).join('');
    XP.shell.dialog({
      title: 'Fastest Mine Sweepers', icon: 'trophy', width: 340,
      html: '<table style="border-collapse:collapse;font-size:12px">' + rows + '</table>' +
        '<br><small>Stored in this browser only.</small>',
      buttons: [{ label: 'OK', primary: true }]
    });
  };

  Minesweeper.prototype.help = function () {
    XP.shell.dialog({
      title: 'Minesweeper', icon: 'mine', width: 400,
      html: '<b>Left click</b> reveals a square.<br>' +
        '<b>Right click</b> (or long press on touch) plants a flag.<br>' +
        '<b>Click a number</b> with matching flags around it to clear its neighbours - or click it with both ' +
        'mouse buttons at once.<br>' +
        '<b>F</b> flags the focused square. <b>F2</b> starts a new game.<br><br>' +
        'Best times are kept in this browser only.',
      buttons: [{ label: 'OK', primary: true }]
    });
  };

  /* ------------------------------- rendering ------------------------------- */
  Minesweeper.prototype.render = function () {
    var self = this;
    this.board.style.gridTemplateColumns = 'repeat(' + this.cfg.cols + ', 20px)';
    this.board.innerHTML = '';
    this.cells = [];

    for (var r = 0; r < this.cfg.rows; r++) {
      this.cells[r] = [];
      for (var c = 0; c < this.cfg.cols; c++) {
        this.cells[r][c] = this.makeCell(r, c);
        this.board.appendChild(this.cells[r][c]);
      }
    }

    this.win.setTitle(this.cfg.label + ' - Minesweeper');
    this.status.textContent = 'F2 for a new game. Right click (or long press) to flag.';
    this.paintLcd();
  };

  Minesweeper.prototype.repaint = function () {
    if (!this.cells) return;
    for (var r = 0; r < this.cfg.rows; r++) {
      for (var c = 0; c < this.cfg.cols; c++) this.paintCell(r, c);
    }
  };

  Minesweeper.prototype.makeCell = function (r, c) {
    var self = this;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'mn-cell';
    b.setAttribute('role', 'gridcell');

    var held = 0;      // bitmask of buttons currently held
    var longPress = null;

    b.addEventListener('pointerdown', function (e) {
      b.focus({ preventScroll: true });
      self.faceBtn.innerHTML = face('o');
      held |= (e.button === 2 ? 2 : 1);
      if (e.pointerType === 'touch' && !self.over) {
        longPress = setTimeout(function () {
          self.toggleFlag(r, c);
          b.dataset.long = '1';
        }, 420);
      }
    });

    function release(e) {
      clearTimeout(longPress);
      var wasLong = b.dataset.long === '1';
      delete b.dataset.long;
      if (!self.over) self.faceBtn.innerHTML = face(self.over ? 'dead' : 'smile');
      var button = e.button === 2 ? 2 : 0;
      var wasBoth = (held & 3) === 3;
      held = 0;
      if (wasLong || self.over) return;
      if (button === 2) self.toggleFlag(r, c);
      else if (wasBoth) self.chord(r, c);
      else self.reveal(r, c);
    }

    b.addEventListener('pointerup', release);
    b.addEventListener('pointerup', function () {
      if (!self.over && !self.started) self.faceBtn.innerHTML = face('smile');
    });
    b.addEventListener('pointercancel', function () {
      clearTimeout(longPress);
      delete b.dataset.long;
      held = 0;
      self.faceBtn.innerHTML = face(self.over ? 'dead' : 'smile');
    });
    b.addEventListener('pointerleave', function () {
      if (!self.over) self.faceBtn.innerHTML = face('smile');
    });
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    b.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); self.reveal(r, c); }
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); self.toggleFlag(r, c); }
    });

    return b;
  };

  Minesweeper.prototype.paintCell = function (r, c) {
    var cell = this.grid[r][c];
    var b = this.cells[r][c];
    if (!b) return;

    b.className = 'mn-cell';
    b.style.color = '';
    b.innerHTML = '';

    if (cell.wrong) {
      b.classList.add('is-open', 'is-wrong');
      b.innerHTML = '<span style="color:#000">&#10006;</span>';
      b.setAttribute('aria-label', 'wrong flag');
      return;
    }

    if (cell.open) {
      b.classList.add('is-open');
      if (cell.mine) {
        b.classList.add('is-boom');
        b.innerHTML = MINE_SVG;
        b.setAttribute('aria-label', 'mine');
      } else if (cell.n) {
        b.classList.add('n' + cell.n);
        b.textContent = cell.n;
        b.setAttribute('aria-label', cell.n + ' adjacent mines');
      } else {
        b.setAttribute('aria-label', 'empty');
      }
      return;
    }

    if (cell.flag) {
      b.innerHTML = FLAG_SVG;
      b.setAttribute('aria-label', 'flagged');
      return;
    }

    b.setAttribute('aria-label', 'covered');
  };

  Minesweeper.prototype.paintLcd = function () {
    paint(this.mineDigits, this.cfg.mines - this.flags);
    paint(this.timeDigits, this.time);

    function paint(host, n) {
      var s = String(Math.max(-99, Math.min(999, n)));
      // the XP counter is always three digits wide
      while (s.length < 3) s = '0' + s;
      host.innerHTML = s.split('').map(function (ch) {
        return '<span class="mn-digit">' + (ch === '-' ? '-' : ch) + '</span>';
      }).join('');
    }
  };

  XP.defineApp('minesweeper', {
    title: 'Minesweeper',
    icon: 'mine',
    blurb: 'because of course there is minesweeper',
    width: 400,
    height: 480,
    minWidth: 300,
    minHeight: 300,
    launch: function (level) {
      var lvl = typeof level === 'string' && LEVELS[level] ? level : 'beginner';
      var cfg = LEVELS[lvl];
      var boardW = cfg.cols * 20 + 26;
      var boardH = cfg.rows * 20 + 168;
      return XP.wm.open({
        appId: 'minesweeper',
        title: 'Minesweeper',
        icon: 'mine',
        width: Math.max(260, boardW),
        height: Math.max(320, boardH),
        minWidth: 260,
        minHeight: 300,
        centered: true,
        singleton: true,
        build: function (body, w) { w.game = new Minesweeper(w, lvl); },
        onResize: function (w) {
          if (!w.game) return;
          w.game.board.style.gridTemplateColumns = 'repeat(' + w.game.cfg.cols + ', 20px)';
        },
        onClose: function (w) {
          if (w.game) w.game.stopTimer();
        }
      });
    }
  });
})();
