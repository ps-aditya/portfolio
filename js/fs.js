/* =============================================================================
 *  fs.js — path maths over the virtual file system declared in data.js.
 *  Shared by the terminal (`ls`, `cd`, `cat`, `tree`) and Explorer.
 * ========================================================================== */

(function () {
  'use strict';

  var D = window.XP_DATA;
  var SEP = '\\';

  function normalize(p) {
    p = String(p || '').replace(/\//g, SEP).replace(/\\+/g, SEP);
    return p;
  }

  function isRoot(p) {
    return /^[A-Za-z]:\\?$/.test(p);
  }

  function join(a, b) {
    if (!a) return normalize(b);
    if (isRoot(a) && /^[A-Za-z]:/i.test(b)) return normalize(b);
    if (isRoot(a)) a = a.replace(SEP, '');
    if (/^[A-Za-z]:/i.test(b)) return normalize(b);
    return normalize(a.replace(/\\$/, '') + SEP + b);
  }

  function parent(p) {
    p = normalize(p).replace(/\\$/, '');
    var i = p.lastIndexOf(SEP);
    if (i < 0) return '';
    if (i === 1) return p.charAt(0) + ':' + SEP;
    return p.slice(0, i);
  }

  function baseName(p) {
    p = normalize(p).replace(/\\$/, '');
    var i = p.lastIndexOf(SEP);
    return i < 0 ? p : p.slice(i + 1);
  }

  /* aliases the visitor is likely to type */
  function alias(input) {
    var s = String(input || '').trim().toLowerCase();
    if (s === '~' || s === 'home' || s === 'documents' || s === 'mydocuments' || s === 'my documents') return D.home;
    if (s === '/' || s === 'c:' || s === 'c:\\') return 'C:\\';
    if (s === 'c' || s === 'computer' || s === 'my computer') return 'C:\\';
    if (s === '..') return null; // handled by resolve
    return null;
  }

  /* Walk the tree and return the path with the real on-"disk" casing.
     Returns null if the path does not exist. */
  function canonical(path) {
    var parts = normalize(path).split(SEP).filter(function (s) { return s !== ''; });
    if (!parts.length) return null;
    var cur = D.fs;
    var real = parts[0];
    for (var i = 1; i < parts.length; i++) {
      if (!cur || cur.kind !== 'folder' || !cur.children) return null;
      var want = parts[i].toLowerCase();
      var next = null;
      for (var j = 0; j < cur.children.length; j++) {
        if (cur.children[j].name.toLowerCase() === want) {
          next = cur.children[j];
          real = join(real, cur.children[j].name);
          break;
        }
      }
      if (!next) return null;
      cur = next;
    }
    return real;
  }

  /* Turn user input into an absolute path, canonicalised if it exists. */
  function resolve(base, input) {
    input = String(input == null ? '' : input).trim();
    if (input === '') return normalize(base || 'C:\\');

    var aliased = alias(input);
    if (aliased) input = aliased;

    var abs;
    if (isRoot(input)) {
      abs = input.replace(/\\$/, SEP);
    } else if (/^[A-Za-z]:/.test(input)) {
      abs = input;
    } else if (input.charAt(0) === SEP) {
      abs = 'C:' + input;
    } else {
      abs = join(base || 'C:\\', input);
    }

    // resolve . and ..
    var drive = abs.slice(0, 2);
    var parts = abs.slice(2).split(SEP).filter(function (s) { return s !== ''; });
    var out = [];
    parts.forEach(function (part) {
      if (part === '.') return;
      if (part === '..') { out.pop(); return; }
      out.push(part);
    });
    return canonical(drive + SEP + out.join(SEP)) || (drive + SEP + out.join(SEP));
  }
  /* Exact lookup. */
  function node(path) {
    path = normalize(path);
    var parts = path.split(SEP).filter(function (s) { return s !== ''; });
    // parts[0] is the drive letter
    var cur = D.fs;
    for (var i = 1; i < parts.length; i++) {
      if (!cur || cur.kind !== 'folder' || !cur.children) return null;
      var want = parts[i].toLowerCase();
      var next = null;
      for (var j = 0; j < cur.children.length; j++) {
        if (cur.children[j].name.toLowerCase() === want) { next = cur.children[j]; break; }
      }
      if (!next) return null;
      cur = next;
    }
    return cur;
  }

  function exists(path) { return !!node(path); }

  function list(path) {
    var n = node(path);
    if (!n || n.kind !== 'folder') return null;
    return n.children || [];
  }

  /* Case-insensitive, single-level name match. Returns an absolute path. */
  function childPath(dirPath, name) {
    var kids = list(dirPath);
    if (!kids) return null;
    var want = name.toLowerCase();
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].name.toLowerCase() === want) return join(dirPath, kids[i].name);
    }
    return null;
  }

  /* Walk the whole tree, depth first. cb(node, path) */
  function walk(path, cb, depth) {
    var p = normalize(path);
    var n = node(p);
    if (!n) return;
    cb(n, p, depth || 0);
    if (n.kind === 'folder' && n.children) {
      n.children.forEach(function (c) { walk(join(p, c.name), cb, (depth || 0) + 1); });
    }
  }

  /* Every text file below `path`, as absolute paths. */
  function textFiles(path) {
    var out = [];
    walk(path || 'C:\\', function (n, p) { if (n.kind === 'text') out.push(p); });
    return out;
  }

  function search(term) {
    var t = String(term || '').toLowerCase();
    var out = [];
    walk('C:\\', function (n, p) {
      if (n.name.toLowerCase().indexOf(t) > -1) out.push({ node: n, path: p });
    });
    return out;
  }

  /* The text an editor should show for a node. */
  function textOf(n) {
    if (!n) return '';
    if (n.kind !== 'text') return '';
    if (typeof n.content === 'function') return n.content(D.me);
    if (n.app) {
      return 'This program requires the "' + n.app + '" application.\n\n' +
        'It is installed. Try:  open ' + n.app + '\n';
    }
    return '(this file is empty)';
  }

  function typeLabel(n) {
    if (n.kind === 'folder') return 'File Folder';
    var ext = (n.name.split('.').pop() || '').toLowerCase();
    if (ext === 'txt' || ext === 'md') return 'Text Document';
    if (ext === 'exe') return 'Application';
    if (n.app) return 'Application';
    return 'File';
  }

  /* Deterministic pseudo-size so Explorer looks alive without a real disk. */
  function sizeOf(n, path) {
    if (n.kind === 'folder') return '';
    var text = textOf(n);
    var bytes = text.length * 3 + 137;
    return bytes > 1024 * 1024
      ? (bytes / 1024 / 1024).toFixed(1) + ' MB'
      : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }

  function dateOf(path) {
    var h = 0;
    for (var i = 0; i < path.length; i++) h = (h * 31 + path.charCodeAt(i)) % 100000;
    var day = 1 + (h % 27);
    var month = 1 + (h % 12);
    var year = 2025 + (h % 2);
    return (month < 10 ? '0' : '') + month + '/' + (day < 10 ? '0' : '') + day + '/' + year;
  }

  window.XP = window.XP || {};
  XP.fs = {
    normalize: normalize,
    join: join,
    parent: parent,
    baseName: baseName,
    resolve: resolve,
    canonical: canonical,
    node: node,
    exists: exists,
    list: list,
    childPath: childPath,
    walk: walk,
    textFiles: textFiles,
    search: search,
    textOf: textOf,
    typeLabel: typeLabel,
    sizeOf: sizeOf,
    dateOf: dateOf,
    isRoot: isRoot
  };
})();
