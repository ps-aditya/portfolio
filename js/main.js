/* =============================================================================
 *  main.js — wires everything together once the DOM is parsed.
 * ========================================================================== */

(function () {
  'use strict';

  function init() {
    window.__xpBoot = Date.now();

    XP.wm.init();
    XP.shell.init();

    if (window.console && console.log) {
      var C = window.XP_DATA.config;
      console.log(
        '%c' + C.name,
        'font:700 16px Consolas,monospace;color:#4a94ff',
        '\nYou opened devtools. Of course you did.\n' +
        'This whole desktop is vanilla HTML/CSS/JS - read js/data.js to change the content, ' +
        'js/wm.js for the window manager, js/apps/terminal.js for the shell.\n' +
        'Nothing here is minified. Pull it apart.'
      );
    }

    /* expose a tiny console API, because it is a CLI site after all */
    XP.repl = function (line) {
      var win = XP.launch('terminal');
      if (win && win.term && typeof line === 'string') win.term.run(line);
      return win;
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
