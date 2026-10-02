/* =============================================================================
 *  apps/misc.js — the small windows: About Me and the Recycle Bin
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

  function linkOrTodo(value, label) {
    if (XP.isPlaceholder(value)) {
      return '<code style="color:#8a5a00">' + esc(value) + '</code> <b style="color:#8a5a00">[TODO]</b>';
    }
    return '<a href="' + esc(value) + '" data-ext="1" target="_blank" rel="noopener">' +
      esc(label || value) + '</a>';
  }

  /* ------------------------------ About Me --------------------------------- */
  XP.defineApp('about', {
    title: 'About Me',
    icon: 'avatar',
    blurb: 'the graphical version of `about`',
    width: 620,
    height: 470,
    minWidth: 340,
    minHeight: 260,
    launch: function () {
      return XP.wm.open({
        appId: 'about',
        title: 'About ' + C.name,
        icon: 'avatar',
        width: 640,
        height: 490,
        minWidth: 340,
        minHeight: 260,
        centered: true,
        singleton: true,
        build: function (body, win) {
          var root = el('div', 'about scroller');

          var head = el('div', 'ab-head');
          head.innerHTML =
            '<div class="avatar">' + XP_ICONS.get('avatar') + '</div>' +
            '<div><h1>' + esc(C.name) + '</h1>' +
            '<p class="ab-tag">' + esc(C.tagline) + '</p></div>';
          root.appendChild(head);

          var summary = el('div', 'ab-block');
          summary.innerHTML = '<h3>Summary</h3><p>' + esc(C.summary) + '</p>';
          root.appendChild(summary);

          var cols = el('div', 'about-cols');

          var skills = el('div', 'ab-block');
          skills.innerHTML = '<h3>Skills</h3><div class="tagrow">' +
            M.skills.reduce(function (acc, g) {
              return acc.concat(g.items);
            }, []).map(function (s) {
              return '<span class="tag">' + esc(s) + '</span>';
            }).join(' ') + '</div>';
          cols.appendChild(skills);

          var exp = el('div', 'ab-block');
          exp.innerHTML = '<h3>Experience</h3><ul>' + M.experience.map(function (e) {
            return '<li><b>' + esc(e.role) + '</b>, ' + esc(e.org) +
              '<br><span style="color:#666">' + esc(e.period) + '</span></li>';
          }).join('') + '</ul>';
          cols.appendChild(exp);

          var edu = el('div', 'ab-block');
          edu.innerHTML = '<h3>Education</h3><ul>' + M.education.map(function (e) {
            return '<li><b>' + esc(e.school) + '</b><br>' + esc(e.degree) +
              '<br><span style="color:#666">' + esc(e.period) + '</span></li>';
          }).join('') + '</ul>';
          cols.appendChild(edu);

          var links = el('div', 'ab-block');
          links.innerHTML = '<h3>Links</h3><ul>' +
            '<li><b>GitHub</b><br>' + linkOrTodo(C.github) + '</li>' +
            '<li><b>LinkedIn</b><br>' + linkOrTodo(C.linkedin) + '</li>' +
            '<li><b>X</b><br>' + linkOrTodo(C.twitter) + '</li>' +
            '<li><b>Email</b><br>' + linkOrTodo('mailto:' + C.email, C.email) + '</li>' +
            '</ul>';
          cols.appendChild(links);

          root.appendChild(cols);

          var projs = el('div', 'ab-block');
          projs.innerHTML = '<h3>Projects</h3><ul>' + M.projects.map(function (p) {
            return '<li><b>' + esc(p.name) + '</b> - ' + esc(p.blurb) + '</li>';
          }).join('') + '</ul>';
          root.appendChild(projs);

          var note = el('div', 'ab-block');
          note.innerHTML = '<h3>About this site</h3><p>Hand-built HTML, CSS and JavaScript. ' +
            'No frameworks, no build step, no analytics, no cookies. ' +
            'The icons are inline SVG and the startup jingle is synthesised with the Web Audio API. ' +
            'Everything lives in a handful of files you can read in one sitting.</p>';
          root.appendChild(note);

          body.appendChild(root);

          root.addEventListener('click', function (e) {
            var a = e.target.closest('a[data-ext]');
            if (!a) return;
            var href = a.getAttribute('href') || '';
            if (XP.isPlaceholder(href)) {
              e.preventDefault();
              return XP.shell.dialog({
                title: 'Not configured yet', icon: 'warning', width: 400,
                html: '<b>' + esc(href) + '</b> is still a placeholder.<br><br>' +
                  'Edit the <code>CONFIG</code> block at the top of <code>js/data.js</code> - that is the ' +
                  'only file you need to touch to make this site yours.',
                buttons: [{ label: 'OK', primary: true }]
              });
            }
            e.preventDefault();
            window.open(href, '_blank', 'noopener');
          });
        }
      });
    }
  });

  /* ----------------------------- Recycle Bin ------------------------------- */
  XP.defineApp('recyclebin', {
    title: 'Recycle Bin',
    icon: 'recycle',
    blurb: 'empty, and it wants to stay that way',
    width: 400,
    height: 300,
    minWidth: 280,
    minHeight: 200,
    launch: function () {
      return XP.wm.open({
        appId: 'recyclebin',
        title: 'Recycle Bin',
        icon: 'recycle',
        width: 400,
        height: 300,
        minWidth: 280,
        minHeight: 200,
        centered: true,
        build: function (body, win) {
          var root = el('div', 'trash');
          root.innerHTML =
            '<div class="trash-ico">' + XP_ICONS.get('recycle') + '</div>' +
            '<div class="trash-msg">' +
              '<b>This Recycle Bin is empty.</b><br>' +
              'Nothing has been deleted here, because nothing on this site was ever created ' +
              'in a way that could be deleted.<br><br>' +
              '<small>Try the Command Prompt instead. It has more in it.</small>' +
            '</div>';
          body.appendChild(root);

          var bar = el('div', 'status-bar');
          bar.innerHTML = '<div class="status-cell grow">0 objects</div>';
          body.appendChild(bar);

          var action = el('div', 'dialog-actions');
          action.style.padding = '0 10px 10px';
          var btn = el('button', 'xp-btn', 'Empty Recycle Bin');
          btn.type = 'button';
          btn.addEventListener('click', function () {
            XP.audio.play('error');
            XP.shell.dialog({
              title: 'Delete Multiple Items', icon: 'warning', width: 380,
              html: 'Are you sure you want to permanently delete these items?<br><br>' +
                '<small>There are no items. This button exists for nostalgia.</small>',
              buttons: [{ label: 'Yes', primary: true }, { label: 'No' }]
            });
          });
          action.appendChild(btn);
          body.appendChild(action);
        }
      });
    }
  });
})();
