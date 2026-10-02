/* =============================================================================
 *  boot.js — BIOS POST, splash screen, welcome screen, lock & shut down
 * ========================================================================== */

(function () {
  'use strict';

  var C = window.XP_DATA.config;

  var biosEl, splashEl, logonEl, desktopEl;
  var stage = 0;          // 0 = bios, 1 = splash, 2 = welcome, 3 = desktop
  var skipping = false;

  var BIOS_LINES = [
    { t: 'Award Modular BIOS v6.00PG, An Energy Star Ally', c: 'bios-dim' },
    { t: 'Copyright (C) 1984-2001, Award Software, Inc.', c: 'bios-dim' },
    { t: '', c: '' },
    { t: 'ADITYA-SHAJI / XPT-900', c: 'bios-ok' },
    { t: '', c: '' },
    { t: 'Main Processor : XP Terminal @ 1.00 GHz equivalent', c: '' },
    { t: 'Memory Testing : ', c: '', then: { t: '65536K OK', c: 'bios-ok' } },
    { t: '', c: '' },
    { t: 'Detecting IDE drives ...', c: 'bios-dim' },
    { t: '  Primary Master   : LOCAL DISK (C:)  - 100% full of nostalgia', c: '' },
    { t: '  Primary Slave    : None', c: 'bios-dim' },
    { t: '  Secondary Master : FLOPPY DRIVE (A:) - please insert a disk', c: '' },
    { t: '', c: '' },
    { t: 'Verifying DMI Pool Data ...', c: 'bios-dim' },
    { t: 'Boot device : \\\\XPBOOT\\\\PAGEFILE.SYS', c: '' },
    { t: '', c: '' },
    { t: 'Press DEL to enter SETUP, F12 for Boot Menu', c: 'bios-dim' },
    { t: '', c: '' },
    { t: 'Starting Windows XP ...', c: 'bios-ok' }
  ];

  var CAPTIONS = [
    'Starting Windows...',
    'Loading personal settings...',
    'Applying the Luna theme...',
    'Restoring windows...'
  ];

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function wait(ms) {
    return new Promise(function (res) { setTimeout(res, ms); });
  }

  /* ------------------------------- the BIOS -------------------------------- */
  function runBios() {
    biosEl.hidden = false;
    biosEl.classList.add('is-entering');
    if (reducedMotion()) return Promise.resolve();

    var i = 0;
    function nextLine() {
      if (skipping) return Promise.resolve();
      if (i >= BIOS_LINES.length) return Promise.resolve();
      var line = BIOS_LINES[i++];
      var span = document.createElement('div');
      span.className = line.c;
      biosEl.appendChild(span);
      var text = line.t;
      var tail = line.then ? line.then.t : '';

      return new Promise(function (resolve) {
        var n = 0;
        (function type() {
          if (skipping) {
            span.textContent = text + tail;
            return resolve();
          }
          n += 3;
          span.textContent = text.slice(0, n) + (n >= text.length ? tail : '');
          if (n < text.length) setTimeout(type, 6);
          else setTimeout(resolve, text.length > 30 ? 130 : 60);
        })();
      }).then(nextLine);
    }

    return nextLine().then(function () {
      return wait(180);
    });
  }

  function hideBios() {
    if (biosEl.hidden) return Promise.resolve();
    if (reducedMotion()) { biosEl.hidden = true; return Promise.resolve(); }
    return new Promise(function (resolve) {
      biosEl.classList.add('is-leaving');
      setTimeout(function () {
        biosEl.hidden = true;
        resolve();
      }, 450);
    });
  }

  /* ------------------------------- the splash ------------------------------ */
  function runSplash() {
    var bar = document.getElementById('splash-bar');
    var caption = document.getElementById('splash-caption');
    splashEl.hidden = false;

    if (reducedMotion()) {
      bar.style.setProperty('--fill', '100%');
      return Promise.resolve();
    }

    var step = 60;
    var progress = 0;
    var capIndex = -1;

    return new Promise(function (resolve) {
      var tick = setInterval(function () {
        if (skipping) {
          progress = 100;
        } else {
          // ease out so it feels like the loading screen it is imitating
          progress += (100 - progress) * 0.16 + Math.random() * 3;
          if (progress > 99.4) progress = 99.4;
        }

        bar.style.setProperty('--fill', progress.toFixed(1) + '%');
        bar.setAttribute('aria-valuenow', Math.round(progress));

        var wantCap = Math.min(CAPTIONS.length - 1, Math.floor(progress / 26));
        if (wantCap !== capIndex) {
          capIndex = wantCap;
          caption.textContent = CAPTIONS[wantCap];
        }

        if (progress >= 99.4) {
          clearInterval(tick);
          bar.style.setProperty('--fill', '100%');
          bar.setAttribute('aria-valuenow', 100);
          resolve();
        }
      }, step);
    });
  }

  function hideSplash() {
    if (splashEl.hidden) return Promise.resolve();
    if (reducedMotion()) { splashEl.hidden = true; return Promise.resolve(); }
    return new Promise(function (resolve) {
      splashEl.classList.add('is-leaving');
      setTimeout(function () {
        splashEl.hidden = true;
        resolve();
      }, 420);
    });
  }

  /* ------------------------------ the welcome ------------------------------ */
  function showWelcome() {
    stage = 2;
    logonEl.hidden = false;
    desktopEl.classList.add('is-live');

    document.getElementById('logon-name').textContent = C.name;

    var soundBox = document.getElementById('logon-sound');
    var stored = null;
    try { stored = localStorage.getItem('xp-sound'); } catch (e) { /* ignore */ }
    if (stored === '0') soundBox.checked = false;

    var btn = document.getElementById('logon-user');
    btn.addEventListener('click', function () { logOn(soundBox.checked); });
    logonEl.addEventListener('click', function (e) {
      if (e.target === logonEl || e.target === logonEl.querySelector('.logon-box')) logOn(soundBox.checked);
    });
    logonEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); logOn(soundBox.checked); }
    });
    setTimeout(function () { btn.focus(); }, 120);
  }

  function logOn(withSound) {
    if (stage !== 2) return;
    stage = 3;
    XP.audio.setEnabled(!!withSound);
    if (withSound) XP.audio.play('startup');
    if (XP.shellRefreshSound) XP.shellRefreshSound();

    logonEl.classList.add('is-leaving');
    setTimeout(function () {
      logonEl.hidden = true;
    }, reducedMotion() ? 0 : 450);

    // give the shell a beat, then put the terminal in front of the visitor
    setTimeout(function () {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      XP.launch('terminal');
      var layer = XP.wm.layer;
      if (!layer) return;
      if (layer.clientWidth < 640) {
        // on a phone there is no point pretending a window can float
        XP.wm.list().forEach(function (w) { w.maximize(); });
        return;
      }
      var x = Math.max(6, Math.round((layer.clientWidth - 700) / 2));
      var y = Math.max(6, Math.round((layer.clientHeight - 440) / 2.6));
      XP.wm.list().forEach(function (w) {
        w.el.style.left = x + 'px';
        w.el.style.top = y + 'px';
      });
    }, reducedMotion() ? 0 : 260);
  }

  /* ------------------------------ lock / off ------------------------------- */
  function lock() {
    if (stage !== 3) return;
    stage = 2;
    logonEl.hidden = false;
    logonEl.classList.remove('is-leaving');
    logonEl.classList.add('is-entering');
    document.getElementById('logon-user').focus();
  }

  function shutDown() {
    stage = 0;
    desktopEl.classList.remove('is-live');
    logonEl.hidden = true;
    splashEl.hidden = true;
    splashEl.classList.remove('is-leaving');
    biosEl.hidden = false;
    biosEl.classList.remove('is-leaving');
    biosEl.innerHTML = '';
    XP.audio.play('boot');
    boot();
  }

  /* -------------------------------- skip ----------------------------------- */
  function skip() {
    if (stage > 2) return;
    if (stage === 2) return;
    skipping = true;
    hideBios();
    showWelcome();
  }

  /* -------------------------------- boot ----------------------------------- */
  function boot() {
    stage = 0;
    skipping = false;
    biosEl.innerHTML = '';
    runBios()
      .then(hideBios)
      .then(runSplash)
      .then(hideSplash)
      .then(function () {
        if (stage > 2) return;
        stage = 1;
      })
      .then(function () {
        if (stage === 1) showWelcome();
      })
      .catch(function (err) {
        if (window.console) console.warn('[xp] boot hiccup:', err);
        showWelcome();
      });
  }

  function init() {
    biosEl = document.getElementById('bios');
    splashEl = document.getElementById('splash');
    logonEl = document.getElementById('logon');
    desktopEl = document.getElementById('desktop');

    document.addEventListener('keydown', function (e) {
      if (stage === 0 || stage === 1) {
        if (e.key === 'Tab' || e.key === 'Meta') return;
        skip();
      }
    });
    document.addEventListener('pointerdown', function () {
      if (stage === 0 || stage === 1) skip();
    });

    document.addEventListener('xp:lock', lock);
    document.addEventListener('xp:shutdown', function () {
      setTimeout(function () {
        shutDown();
      }, 260);
    });

    // expose for anyone poking around in devtools
    XP.logOn = logOn;
    XP.lock = lock;

    boot();
  }

  window.addEventListener('DOMContentLoaded', init);
})();
