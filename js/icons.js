/* =============================================================================
 *  icons.js — every icon is inline SVG. No image files, so the whole site is
 *  a handful of text files you can diff in git.
 * ========================================================================== */

(function () {
  'use strict';

  function svg(body, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="' +
      (size || 32) + '" height="' + (size || 32) + '" aria-hidden="true" focusable="false">' +
      body + '</svg>';
  }

  var SPK = 'stroke="#b8b8b8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"';

  var ICONS = {
    /* ------------------------------ system ------------------------------ */
    logo: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="32" height="32" aria-hidden="true">' +
        '<g transform="rotate(4 50 50)">' +
        '<rect x="8" y="10" width="40" height="38" rx="3" fill="#f25022"/>' +
        '<rect x="52" y="10" width="40" height="38" rx="3" fill="#7fba00"/>' +
        '<rect x="8" y="52" width="40" height="38" rx="3" fill="#00a4ef"/>' +
        '<rect x="52" y="52" width="40" height="38" rx="3" fill="#ffb900"/>' +
        '</g></svg>';
    },

    avatar: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">' +
        '<rect width="64" height="64" rx="4" fill="#dfe8fb"/>' +
        '<circle cx="32" cy="24" r="11" fill="#3a5f9e"/>' +
        '<path d="M10 60c0-13 10-21 22-21s22 8 22 21z" fill="#3a5f9e"/>' +
        '</svg>';
    },

    computer: function () {
      return svg(
        '<rect x="2" y="4" width="28" height="20" rx="2" fill="#d4d0c0" stroke="#000"/>' +
        '<rect x="4.5" y="6.5" width="23" height="15" fill="#0a3ea0"/>' +
        '<rect x="6" y="8" width="20" height="12" fill="#5aa2ff"/>' +
        '<path d="M7 18l5-6 4 4 3-3 6 6z" fill="#fff" opacity=".35"/>' +
        '<rect x="12" y="24" width="8" height="3" fill="#d4d0c0" stroke="#000"/>' +
        '<rect x="7" y="27" width="18" height="3" rx="1" fill="#d4d0c0" stroke="#000"/>'
      );
    },

    folder: function (open) {
      if (open) {
        return svg(
          '<path d="M2 9h11l3 3h12v5H5z" fill="#ffd764" stroke="#8a6500"/>' +
          '<path d="M2 12h26v3H2z" fill="#ffe89b" stroke="#8a6500"/>' +
          '<path d="M5 15h25l-4 14H2z" fill="#ffe89b" stroke="#8a6500"/>'
        );
      }
      return svg(
        '<path d="M2 8h11l3 3h14v18H2z" fill="#ffd764" stroke="#8a6500"/>' +
        '<path d="M4 12h24v15H4z" fill="#ffe89b"/>' +
        '<path d="M2 8h11l3 3h14v2H2z" fill="#fff2c4"/>'
      );
    },

    file: function () {
      return svg(
        '<path d="M7 3h12l7 7v19H7z" fill="#fff" stroke="#5f5f5f"/>' +
        '<path d="M19 3v7h7" fill="#e4e4e4" stroke="#5f5f5f"/>' +
        '<g stroke="#9aa6b5" stroke-width="1.6">' +
        '<line x1="10" y1="14" x2="22" y2="14"/><line x1="10" y1="18" x2="22" y2="18"/>' +
        '<line x1="10" y1="22" x2="18" y2="22"/></g>'
      );
    },

    fileApp: function () {
      return svg(
        '<path d="M7 3h12l7 7v19H7z" fill="#fff" stroke="#5f5f5f"/>' +
        '<path d="M19 3v7h7" fill="#e4e4e4" stroke="#5f5f5f"/>' +
        '<rect x="4" y="17" width="18" height="12" rx="2" fill="#d4d0c0" stroke="#000"/>' +
        '<rect x="6" y="19" width="14" height="7" fill="#0a3ea0"/>' +
        '<path d="M7 24l3-4 2 2 2-2 3 4z" fill="#7fba00"/>'
      );
    },

    drive: function () {
      return svg(
        '<rect x="2" y="9" width="28" height="14" rx="2" fill="#e0dccb" stroke="#000"/>' +
        '<rect x="4" y="11" width="24" height="8" fill="#c9c5b4"/>' +
        '<circle cx="25" cy="20.5" r="1.6" fill="#7fba00"/>' +
        '<rect x="5" y="11" width="12" height="8" fill="#b0aa96" opacity=".7"/>'
      );
    },

    recycle: function () {
      return svg(
        '<rect x="6" y="6" width="20" height="3.4" rx="1" fill="#5c7ba8"/>' +
        '<rect x="13" y="3" width="6" height="3" rx="1" fill="#5c7ba8"/>' +
        '<path d="M8 10h16l-1.6 19H9.6z" fill="#dfe8fb" stroke="#5c7ba8"/>' +
        '<g fill="none" stroke="#3a6ea5" stroke-width="2" stroke-linecap="round">' +
        '<path d="M13 15l-2.4 4h4.8z"/><path d="M19 15l-2.4 4h4.8z"/>' +
        '<path d="M13.5 22.5l1.8 3.2h-3.6z"/><path d="M18.6 22.6l-1.6 3.1h3.3z"/></g>'
      );
    },

    terminal: function () {
      return svg(
        '<rect x="1" y="4" width="30" height="24" rx="2.5" fill="#d4d0c0" stroke="#000"/>' +
        '<rect x="4" y="7" width="24" height="18" fill="#0a0a0a"/>' +
        '<path d="M7 11.5l3.5 3.5L7 18.5" fill="none" stroke="#c8f08a" stroke-width="2.4" ' +
        'stroke-linecap="round" stroke-linejoin="round"/>' +
        '<line x1="14" y1="20" x2="20" y2="20" stroke="#c8f08a" stroke-width="2.4" stroke-linecap="round"/>'
      );
    },

    notepad: function () {
      return svg(
        '<path d="M6 3h20v26H6z" fill="#fff" stroke="#5f5f5f"/>' +
        '<rect x="6" y="3" width="20" height="5" fill="#dfe8fb" stroke="#5f5f5f"/>' +
        '<g stroke="#9aa6b5" stroke-width="1.5">' +
        '<line x1="9" y1="12" x2="23" y2="12"/><line x1="9" y1="16" x2="23" y2="16"/>' +
        '<line x1="9" y1="20" x2="23" y2="20"/><line x1="9" y1="24" x2="19" y2="24"/></g>'
      );
    },

    browser: function () {
      return svg(
        '<circle cx="16" cy="16" r="13" fill="#0a3ea0" stroke="#000"/>' +
        '<ellipse cx="16" cy="16" rx="6" ry="13" fill="none" stroke="#8fc0f2" stroke-width="1.4"/>' +
        '<g stroke="#8fc0f2" stroke-width="1.4" fill="none">' +
        '<line x1="3" y1="16" x2="29" y2="16"/>' +
        '<path d="M4.6 9.5c6 2.6 16.8 2.6 22.8 0"/><path d="M4.6 22.5c6-2.6 16.8-2.6 22.8 0"/></g>' +
        '<path d="M6 27L25 5" stroke="#ffd764" stroke-width="2.4" stroke-linecap="round"/>'
      );
    },

    mine: function () {
      return svg(
        '<g stroke="#5f5f5f" stroke-width="2" stroke-linecap="round">' +
        '<line x1="16" y1="2" x2="16" y2="8"/><line x1="16" y1="24" x2="16" y2="30"/>' +
        '<line x1="2" y1="16" x2="8" y2="16"/><line x1="24" y1="16" x2="30" y2="16"/>' +
        '<line x1="6" y1="6" x2="10" y2="10"/><line x1="22" y1="22" x2="26" y2="26"/>' +
        '<line x1="26" y1="6" x2="22" y2="10"/><line x1="10" y1="22" x2="6" y2="26"/></g>' +
        '<circle cx="16" cy="16" r="9" fill="#1c1c1c"/>' +
        '<circle cx="12.5" cy="12.5" r="2.6" fill="#fff"/>'
      );
    },

    /* ------------------------------ taskbar ----------------------------- */
    speakerOn: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">' +
        '<path d="M5 12h5l7-6v20l-7-6H5z" fill="#fff" stroke="#0b4f8f"/>' +
        '<path d="M20 11c3 3 3 7 0 10M24 7c5 5 5 13 0 18" ' + SPK + '/></svg>';
    },
    speakerOff: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">' +
        '<path d="M5 12h5l7-6v20l-7-6H5z" fill="#fff" stroke="#0b4f8f"/>' +
        '<path d="M20 12l8 8M28 12l-8 8" ' + SPK + '/></svg>';
    },
    network: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">' +
        '<rect x="3" y="5" width="26" height="16" rx="2" fill="#e8eef7" stroke="#0b4f8f"/>' +
        '<rect x="6" y="8" width="20" height="10" fill="#5aa2ff"/>' +
        '<rect x="12" y="23" width="8" height="3" fill="#e8eef7" stroke="#0b4f8f"/>' +
        '<rect x="8" y="26" width="16" height="3" rx="1" fill="#e8eef7" stroke="#0b4f8f"/></svg>';
    },
    shutdown: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="17" height="17" aria-hidden="true">' +
        '<circle cx="16" cy="16" r="10" fill="none" stroke="#1c4f8f" stroke-width="3"/>' +
        '<path d="M16 7v9" stroke="#c0392b" stroke-width="3.4" stroke-linecap="round"/></svg>';
    },
    search: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="17" height="17" aria-hidden="true">' +
        '<circle cx="14" cy="13" r="8" fill="none" stroke="#3b5a86" stroke-width="3"/>' +
        '<path d="M20 19l8 8" stroke="#3b5a86" stroke-width="3.6" stroke-linecap="round"/></svg>';
    },
    docs: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="17" height="17" aria-hidden="true">' +
        '<path d="M6 4h11l6 6v18H6z" fill="#fff" stroke="#5f5f5f"/>' +
        '<g stroke="#9aa6b5" stroke-width="1.6">' +
        '<line x1="9" y1="14" x2="20" y2="14"/><line x1="9" y1="18" x2="20" y2="18"/>' +
        '<line x1="9" y1="22" x2="16" y2="22"/></g></svg>';
    },

    /* --------------------------- toolbar glyphs ------------------------- */
    back: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="18" height="18" aria-hidden="true">' +
        '<g fill="none" stroke="#2c5a2e" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M21 9l-8 7 8 7"/><path d="M27 9l-8 7 8 7" opacity=".45"/></g></svg>';
    },
    forward: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="18" height="18" aria-hidden="true">' +
        '<g fill="none" stroke="#2c5a2e" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M11 9l8 7-8 7"/><path d="M5 9l8 7-8 7" opacity=".45"/></g></svg>';
    },
    stop: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="18" height="18" aria-hidden="true">' +
        '<circle cx="16" cy="16" r="11" fill="#d8433a" stroke="#8e241d"/>' +
        '<rect x="11" y="11" width="10" height="10" rx="1" fill="#fff"/></svg>';
    },
    refresh: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="18" height="18" aria-hidden="true">' +
        '<path d="M25 16a9 9 0 1 1-3-6.7" fill="none" stroke="#2c5a2e" stroke-width="3.2" stroke-linecap="round"/>' +
        '<path d="M26 4v6h-6z" fill="#2c5a2e"/></svg>';
    },
    up: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="18" height="18" aria-hidden="true">' +
        '<path d="M9 13h6v-4l8 7-8 7v-4H9z" fill="#e8c33a" stroke="#7a5c00" stroke-width="1.4" ' +
        'stroke-linejoin="round"/></svg>';
    },
    go: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="18" height="18" aria-hidden="true">' +
        '<circle cx="16" cy="16" r="12" fill="#4a94ff" stroke="#0b3fa0"/>' +
        '<path d="M12 10l9 6-9 6z" fill="#fff"/></svg>';
    },
    home: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="18" height="18" aria-hidden="true">' +
        '<path d="M4 15L16 5l12 10h-3v12H8V15z" fill="#f0c040" stroke="#7a5c00" stroke-width="1.4" ' +
        'stroke-linejoin="round"/><rect x="13" y="19" width="6" height="8" fill="#8a6500"/></svg>';
    },
    star: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="18" height="18" aria-hidden="true">' +
        '<path d="M16 3l4 9 10 1-7.5 6.5L25 30l-9-5-9 5 2.5-10.5L2 13l10-1z" fill="#f5c53a" ' +
        'stroke="#9a7400" stroke-width="1.2" stroke-linejoin="round"/></svg>';
    },

    /* ---------------------------- notepad tools ------------------------- */
    page: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">' +
        '<path d="M7 4h12l6 6v18H7z" fill="#fff" stroke="#5f5f5f"/>' +
        '<path d="M19 4v6h6" fill="#e4e4e4" stroke="#5f5f5f"/></svg>';
    },
    save: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">' +
        '<rect x="4" y="4" width="24" height="24" fill="#5a7fb5" stroke="#2c4a75"/>' +
        '<rect x="9" y="4" width="14" height="9" fill="#e8eef7"/>' +
        '<rect x="8" y="18" width="16" height="10" fill="#f5f5f0" stroke="#2c4a75"/></svg>';
    },
    print: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">' +
        '<rect x="8" y="3" width="16" height="8" fill="#fff" stroke="#5f5f5f"/>' +
        '<rect x="4" y="11" width="24" height="11" rx="2" fill="#d4d0c0" stroke="#000"/>' +
        '<circle cx="8" cy="15" r="1.6" fill="#7fba00"/>' +
        '<rect x="8" y="20" width="16" height="9" fill="#fff" stroke="#5f5f5f"/></svg>';
    },
    wordWrap: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">' +
        '<g stroke="#3b5a86" stroke-width="2.4" stroke-linecap="round">' +
        '<line x1="4" y1="9" x2="28" y2="9"/><line x1="4" y1="16" x2="18" y2="16"/>' +
        '<line x1="12" y1="16" x2="12" y2="23"/><line x1="12" y1="23" x2="26" y2="23"/></g></svg>';
    },

    /* ------------------------------- dialogs ---------------------------- */
    info: function () {
      return svg(
        '<circle cx="16" cy="16" r="13" fill="#2f6fd8"/>' +
        '<circle cx="16" cy="9" r="2" fill="#fff"/>' +
        '<rect x="14" y="13" width="4" height="12" fill="#fff"/>'
      );
    },
    warning: function () {
      return svg(
        '<path d="M16 3l14 25H2z" fill="#f5c53a" stroke="#9a7400"/>' +
        '<rect x="14.4" y="12" width="3.2" height="9" fill="#3a2a00"/>' +
        '<circle cx="16" cy="24" r="1.9" fill="#3a2a00"/>'
      );
    },
    error: function () {
      return svg(
        '<circle cx="16" cy="16" r="13" fill="#d8433a" stroke="#8e241d"/>' +
        '<path d="M11 11l10 10M21 11L11 21" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>'
      );
    },
    ok: function () {
      return svg(
        '<circle cx="16" cy="16" r="13" fill="#4f9d2a" stroke="#2f6b16"/>' +
        '<path d="M9.5 16.5l4.5 4.5 8.5-9" fill="none" stroke="#fff" stroke-width="3.4" ' +
        'stroke-linecap="round" stroke-linejoin="round"/>'
      );
    },

    /* ------------------------------- misc ------------------------------- */
    skill: function () {
      return svg(
        '<rect x="5" y="2" width="4" height="20" rx="1.6" fill="#f0a93a"/>' +
        '<rect x="1" y="6" width="12" height="4" rx="1.6" fill="#f0a93a"/>' +
        '<path d="M14 27l5-14 5 5 4-3 3 3-8 6z" fill="#3f8f3a" stroke="#1f5c1a"/>'
      );
    },
    mail: function () {
      return svg(
        '<rect x="3" y="8" width="26" height="17" rx="2" fill="#fff" stroke="#5f5f5f"/>' +
        '<path d="M3.5 9.5L16 19l12.5-9.5" fill="none" stroke="#5f5f5f" stroke-width="1.8"/>' +
        '<path d="M3.5 23.5L12 15M28.5 23.5L20 15" fill="none" stroke="#c0c0c0" stroke-width="1.4"/>'
      );
    },
    trophy: function () {
      return svg(
        '<path d="M9 4h14v7a7 7 0 0 1-14 0z" fill="#f5c53a" stroke="#9a7400"/>' +
        '<path d="M9 6H5v3a4 4 0 0 0 4 4M23 6h4v3a4 4 0 0 1-4 4" fill="none" stroke="#9a7400" stroke-width="2"/>' +
        '<rect x="13" y="17" width="6" height="6" fill="#c0a030"/>' +
        '<rect x="8" y="23" width="16" height="4" rx="1" fill="#9a7400"/>'
      );
    }
  };

  /* Resolve a string, function name or raw markup into SVG markup. */
  function icon(name) {
    if (!name) return '';
    if (typeof name === 'string' && name.charAt(0) === '<') return name;
    var fn = ICONS[name];
    return fn ? fn() : '';
  }

  window.XP_ICONS = { get: icon, raw: svg, all: ICONS };
})();
