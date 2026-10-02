/* =============================================================================
 *  audio.js — tiny WebAudio blip factory. No audio files to ship.
 *  Nothing plays until XP.audio.arm() runs, which happens on first click
 *  (browser autoplay policy) and only if the visitor ticked the box.
 * ========================================================================== */

(function () {
  'use strict';

  var ctx = null;
  var master = null;
  var armed = false;
  var enabled = false;

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
    return ctx;
  }

  function tone(opts) {
    if (!enabled || !armed) return;
    var c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();

    var t0 = c.currentTime + (opts.delay || 0);
    var dur = opts.dur || 0.16;
    var osc = c.createOscillator();
    var gain = c.createGain();

    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(opts.peak || 0.9, t0 + Math.min(0.02, dur * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function arp(notes, opts) {
    opts = opts || {};
    var step = opts.step || 0.14;
    notes.forEach(function (n, i) {
      tone({
        freq: n,
        to: opts.slideTo,
        dur: opts.dur || 0.42,
        type: opts.type || 'triangle',
        peak: opts.peak || 0.75,
        delay: i * step
      });
    });
  }

  var SOUNDS = {
    /* The XP startup sound, reduced to its recognisable five-note shape. */
    startup: function () {
      arp([392.0, 523.25, 659.25, 783.99, 1046.5], { step: 0.155, dur: 0.5, peak: 0.7 });
      tone({ freq: 130.81, dur: 1.5, type: 'sine', peak: 0.28, delay: 0.6 });
    },
    logon: function () {
      arp([523.25, 659.25, 783.99], { step: 0.11, dur: 0.28, peak: 0.6 });
    },
    click: function () {
      tone({ freq: 1400, to: 900, dur: 0.045, type: 'square', peak: 0.16 });
    },
    open: function () {
      tone({ freq: 300, to: 620, dur: 0.1, type: 'triangle', peak: 0.3 });
    },
    close: function () {
      tone({ freq: 620, to: 260, dur: 0.11, type: 'triangle', peak: 0.28 });
    },
    error: function () {
      tone({ freq: 220, dur: 0.16, type: 'square', peak: 0.32 });
      tone({ freq: 165, dur: 0.2, type: 'square', peak: 0.32, delay: 0.15 });
    },
    ding: function () {
      arp([880, 1174.66], { step: 0.1, dur: 0.34, type: 'sine', peak: 0.5 });
    },
    boot: function () {
      tone({ freq: 70, to: 45, dur: 0.7, type: 'sine', peak: 0.4 });
    },
    eject: function () {
      tone({ freq: 1800, to: 2400, dur: 0.12, type: 'triangle', peak: 0.3 });
    }
  };

  window.XP = window.XP || {};

  XP.audio = {
    arm: function () {
      armed = true;
      var c = ensure();
      if (c && c.state === 'suspended') c.resume();
    },
    play: function (name) {
      if (!enabled) return;
      var fn = SOUNDS[name];
      if (fn) { try { fn(); } catch (e) { /* audio is never worth an exception */ } }
    },
    setEnabled: function (on) {
      enabled = !!on;
      if (enabled) this.arm();
      return enabled;
    },
    isEnabled: function () { return enabled; }
  };
})();
