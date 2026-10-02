/* =============================================================================
 *  data.js — single source of truth for everything on this site.
 *  Loaded first; everything else reads from window.XP_DATA.
 * ========================================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------------------------
   *  >> EDIT ME FIRST  <<
   *  Every value below wrapped in <> is a placeholder. Replace them and you're
   *  done — nothing else needs touching to get the site live.
   *  ------------------------------------------------------------------------ */
  var CONFIG = {
    name: 'Aditya Shaji',
    handle: 'aditya',
    // TODO: put your real handles/URLs in here.
    github: 'https://github.com/<YOUR-GITHUB-USERNAME>',
    linkedin: 'https://www.linkedin.com/in/<YOUR-LINKEDIN-HANDLE>',
    twitter: 'https://x.com/<YOUR-HANDLE>',
    email: 'you@example.com',
    // TODO: rename to your actual Pages URL once the repo is public.
    website: 'https://<YOUR-GITHUB-USERNAME>.github.io/<YOUR-REPO-NAME>/',
    // Optional: link to a hosted PDF. Falls back to the built-in resume.txt.
    resumePdf: '',
    location: 'Mumbai, India',
    // Shown on the welcome screen + About window.
    tagline: 'CS undergrad (2029) building things that run locally, on modest hardware.',
    summary:
      'B.Tech Computer Science (AI & ML) at Atlas SkillTech University, graduating Aug 2029. ' +
      'I build developer tools and local-first AI runtimes — currently an adaptive runtime that runs ' +
      'quantized LLMs on 4GB-RAM laptops, and a Redis state inspector that streams live key changes ' +
      'into VS Code.',
    // Shown in the About dialog / `about` output.
    interests: [
      'LLM runtimes & quantization',
      'Developer tooling & editor extensions',
      'Local-first AI',
      'Observability / state inspection'
    ]
  };

  var EDU = [
    {
      school: 'Atlas SkillTech University',
      location: 'Mumbai, India',
      degree: 'Bachelor of Technology in Computer Science, Artificial Intelligence & Machine Learning',
      period: 'Aug 2025 - Aug 2029'
    }
  ];

  var EXPERIENCE = [
    {
      role: 'Founder',
      org: 'Low End LLM',
      location: 'Remote',
      period: 'Jul 2026 - Present',
      bullets: [
        'Building an adaptive runtime to run quantized LLMs locally on 4GB-RAM laptops, aimed at developers without high-end GPUs who want a real, local taste of tools like Claude Code and Codex.',
        'Implemented and verified real-time RAM/CPU/battery profiling and a per-turn safety floor that halts inference before memory exhaustion.',
        'Currently integrating quantized model loading (GGUF via llama.cpp, Q4_K_M quantization, mmap-based weight loading) and a pre-flight capacity check ahead of v1.'
      ]
    },
    {
      role: 'Creator & Maintainer',
      org: 'Redis State Explorer',
      location: 'Remote',
      period: 'Jun 2026 - Present',
      bullets: [
        'Designed and shipped a VS Code extension connecting directly to Redis via the Engine API, featuring a live state panel and a diff timeline showing exactly which keys changed after a code save.',
        '1,000+ downloads.',
        'Invited Reviewer - ISMIR 2026 (International Society for Music Information Retrieval).'
      ]
    }
  ];

  // TODO: give this project its real name (the resume draft had an unfinished
  // note here). Everything else about it is accurate.
  var PROJECTS = [
    {
      name: 'Docker Vitals',
      blurb: 'Live Docker container monitoring inside VS Code.',
      stack: ['TypeScript', 'Docker Engine API', 'VS Code Extension API', 'dockerode'],
      status: 'Shipped',
      details: [
        'VS Code extension for live Docker container monitoring - connects directly to the Docker Engine API via dockerode, streaming CPU, memory and network stats.',
        'Pushes container start/stop events in real time rather than polling.',
        'Includes a compose-diff feature that shows exactly what changed in running containers the moment you save a docker-compose.yml or Dockerfile.'
      ]
    },
    {
      name: 'Redis State Explorer',
      blurb: 'See which Redis keys changed, and when.',
      stack: ['TypeScript', 'Redis Engine API', 'VS Code Extension API'],
      status: '1,000+ downloads',
      details: [
        'Live state panel wired straight to Redis over the Engine API.',
        'Diff timeline showing exactly which keys changed after a code save.',
        'Invited Reviewer - ISMIR 2026.'
      ]
    },
    {
      name: 'Git Blend',
      blurb: "A commit's full diff, inline, the moment you hover a line.",
      stack: ['TypeScript', 'Git', 'VS Code Extension API'],
      status: 'Built',
      details: [
        "VS Code extension that shows a commit's full diff inline the instant you hover a line - not just blame attribution.",
        'Positioned as a fast, free, zero-config alternative to GitLens\'s heavier, subscription-gated blame view.'
      ]
    },
    {
      name: 'Low End LLM',
      blurb: 'An adaptive runtime for quantized LLMs on 4GB-RAM laptops.',
      stack: ['Python', 'llama.cpp', 'GGUF', 'Q4_K_M'],
      status: 'In progress',
      details: EXPERIENCE[0].bullets
    },
    {
      // TODO: replace with the real project name.
      name: 'AI Coding Assistant',
      blurb: 'Built from scratch in Java, with an autonomous agent loop.',
      stack: ['Java', 'OpenRouter API'],
      status: 'Built',
      details: [
        'AI coding assistant built from scratch in Java with an autonomous agent loop for multi-step file read, write and run tasks.'
      ]
    },
    {
      name: 'Pulsar Classification Model',
      blurb: 'Calibrated Random Forest for pulsar detection.',
      stack: ['Python', 'scikit-learn', 'pandas'],
      status: 'ROC-AUC 0.97',
      details: [
        'Calibrated Random Forest classifier for pulsar detection on the HTRU2 dataset (~17,900 candidates, ~9% positive class).',
        'Probability calibration (Platt/isotonic) validated via reliability diagrams and Brier score.',
        'Decision threshold derived from an explicit cost model rather than a default 0.5 cutoff.',
        'Achieves ROC-AUC ~0.97 and recall ~0.90 at precision ~0.90 on held-out test data.'
      ]
    }
  ];

  var SKILLS = [
    {
      group: 'Languages',
      items: ['Python', 'Java', 'JavaScript', 'TypeScript', 'Go', 'SQL']
    },
    {
      group: 'Technologies',
      items: [
        'Redis',
        'Git / GitHub Actions',
        'VS Code Extension API',
        'Chrome Extension APIs',
        'Oracle SQL',
        'Microsoft Azure',
        'Azure Machine Learning',
        'OpenRouter API',
        'Docker Engine API',
        'llama.cpp / GGUF'
      ]
    }
  ];

  /* ---------------------------------------------------------------------------
   *  Virtual file system.
   *  Explorer, Notepad and the terminal's `cat` all read from this same tree,
   *  so a file only ever exists in one place.
   *  kind: 'folder' | 'text'
   * ------------------------------------------------------------------------ */
  var ROOT = 'C:\\Documents and Settings\\Aditya';

  var FS = {
    name: 'Local Disk (C:)',
    kind: 'folder',
    path: 'C:\\',
    children: [
      {
        name: 'Documents and Settings',
        kind: 'folder',
        children: [
          {
            name: 'Aditya',
            kind: 'folder',
            children: [
              {
                name: 'My Documents',
                kind: 'folder',
                children: [
          {
            name: 'About Me.txt',
            kind: 'text',
            owner: 'aditya',
            content: function (d) {
              return [
                d.name,
                '='.repeat(d.name.length),
                '',
                d.tagline,
                '',
                d.summary,
                '',
                '-- Currently into -------------------------------------------------------',
                d.interests.map(function (i, n) { return '  ' + (n + 1) + '. ' + i; }).join('\n'),
                '',
                '-- Where to find me ---------------------------------------------------',
                '  GitHub    : ' + d.config.github,
                '  LinkedIn  : ' + d.config.linkedin,
                '  Email     : ' + d.config.email,
                '  Based in  : ' + d.config.location,
                '',
                '(pro tip: open Command Prompt on the desktop and type `help`)',
                ''
              ].join('\n');
            }
          },
          {
            name: 'Resume.txt',
            kind: 'text',
            content: function (d) {
              return buildResumeText(d);
            }
          },
          {
            name: 'Projects',
            kind: 'folder',
            children: [
              {
                name: 'low-end-llm.txt',
                kind: 'text',
                content: function (d) { return projectText(d, 'Low End LLM'); }
              },
              {
                name: 'redis-state-explorer.txt',
                kind: 'text',
                content: function (d) { return projectText(d, 'Redis State Explorer'); }
              },
              {
                name: 'docker-vitals.txt',
                kind: 'text',
                content: function (d) { return projectText(d, 'Docker Vitals'); }
              },
              {
                name: 'git-blend.txt',
                kind: 'text',
                content: function (d) { return projectText(d, 'Git Blend'); }
              },
              {
                name: 'ai-coding-assistant.txt',
                kind: 'text',
                content: function (d) { return projectText(d, 'AI Coding Assistant'); }
              },
              {
                name: 'pulsar-classifier.txt',
                kind: 'text',
                content: function (d) { return projectText(d, 'Pulsar Classification Model'); }
              }
            ]
          },
          {
            name: 'Experience.txt',
            kind: 'text',
            content: function (d) {
              return [
                'EXPERIENCE',
                '===========',
                '',
                EXPERIENCE.map(function (e) {
                  return [
                    e.role + ' - ' + e.org + '  (' + e.location + ')',
                    e.period,
                    '',
                    e.bullets.map(function (b) { return '  * ' + b; }).join('\n')
                  ].join('\n');
                }).join('\n\n'),
                ''
              ].join('\n');
            }
          },
          {
            name: 'Education.txt',
            kind: 'text',
            content: function () {
              return [
                'EDUCATION',
                '=========',
                '',
                EDU.map(function (e) {
                  return [
                    e.school + ' - ' + e.location,
                    e.degree,
                    e.period
                  ].join('\n');
                }).join('\n\n'),
                ''
              ].join('\n');
            }
          },
          {
            name: 'Contact.txt',
            kind: 'text',
            content: function (d) {
              return [
                'CONTACT',
                '=======',
                '',
                '  GitHub    : ' + d.config.github,
                '  LinkedIn  : ' + d.config.linkedin,
                '  X/Twitter : ' + d.config.twitter,
                '  Email     : ' + d.config.email,
                '  Website   : ' + d.config.website,
                '  Location  : ' + d.config.location,
                '',
                '(replace the placeholders in js/data.js to make these real)',
                ''
              ].join('\n');
            }
          },
          {
            name: 'Read Me.txt',
            kind: 'text',
            content: function () {
              return [
                'WELCOME TO XP://TERMINAL',
                '========================',
                '',
                'This is a Windows XP desktop that runs entirely in your browser. Every',
                'window you can open is hand-built HTML, CSS and JavaScript - no',
                'frameworks, no build step.',
                '',
                'Things worth trying:',
                '',
                '  * Double-click "My Computer" and wander around the C: drive.',
                '  * Open Command Prompt and run `help` - the whole resume is one',
                '    shell away.',
                '  * Right-click the desktop for the XP context menu.',
                '  * Press the Windows key (or Ctrl+Escape) for the Start menu.',
                '  * Minesweeper is in Program Files. It is fully working.',
                '  * Win + L "locks" the screen back to the welcome page.',
                '',
                'Ctrl+L clears the screen in the terminal, like a real one would.',
                ''
              ].join('\n');
            }
          }
                ]
              }
            ]
          }
        ]
      },
      {
        name: 'Program Files',
        kind: 'folder',
        children: [
          { name: 'Command Prompt', kind: 'text', app: 'terminal' },
          { name: 'Notepad', kind: 'text', app: 'notepad' },
          { name: 'My Web Browser', kind: 'text', app: 'browser' },
          { name: 'Minesweeper', kind: 'text', app: 'minesweeper' }
        ]
      },
      {
        name: 'Windows',
        kind: 'folder',
        children: [
          { name: 'explorer.exe', kind: 'text', app: 'explorer' },
          { name: 'notepad.exe', kind: 'text', app: 'notepad' },
          { name: 'terminal.exe', kind: 'text', app: 'terminal' },
          { name: 'winmine.exe', kind: 'text', app: 'minesweeper' },
          { name: 'msiexec.exe', kind: 'text' }
        ]
      },
      {
        name: 'Recycle Bin',
        kind: 'folder',
        app: 'recyclebin'
      }
    ]
  };

  /* --------------------------- text builders ------------------------------ */

  function projectText(d, projectName) {
    var p = PROJECTS.filter(function (x) { return x.name === projectName; })[0];
    if (!p) return '404: no such project.';
    var out = [p.name, '='.repeat(p.name.length), '', p.blurb, ''];
    if (p.stack.length) {
      out.push('STACK');
      out.push(p.stack.map(function (s) { return '  ' + s; }).join('\n'));
      out.push('');
    }
    if (p.status) { out.push('STATUS : ' + p.status); out.push(''); }
    out.push('DETAILS');
    out.push(p.details.map(function (b) { return '  * ' + b; }).join('\n'));
    out.push('');
    if (p.name === 'Redis State Explorer' || p.name === 'Low End LLM') {
      out.push('SOURCE');
      out.push('  ' + d.config.github);
      out.push('');
    }
    return out.join('\n');
  }

  function buildResumeText(d) {
    var L = [];
    var rule = function (t) { L.push(t); L.push('='.repeat(t.length)); L.push(''); };

    L.push(d.name);
    L.push('='.repeat(d.name.length));
    L.push(d.config.email + '  |  ' + d.config.github.replace('https://', '') +
           '  |  ' + d.config.linkedin.replace('https://www.', ''));
    L.push(d.config.location);
    L.push('');

    rule('SUMMARY');
    L.push(d.summary);
    L.push('');

    rule('EXPERIENCE');
    EXPERIENCE.forEach(function (e) {
      L.push(e.role + ' - ' + e.org + '  (' + e.location + ')');
      L.push(e.period);
      L.push('');
      e.bullets.forEach(function (b) { L.push('  * ' + b); });
      L.push('');
    });

    rule('EDUCATION');
    EDU.forEach(function (e) {
      L.push(e.school + ' - ' + e.location);
      L.push(e.degree);
      L.push(e.period);
      L.push('');
    });

    rule('PROJECTS');
    PROJECTS.forEach(function (p) {
      L.push(p.name + '  [' + p.stack.join(', ') + ']');
      p.details.forEach(function (b) { L.push('  * ' + b); });
      L.push('');
    });

    rule('TECHNICAL SKILLS');
    SKILLS.forEach(function (g) {
      L.push(g.group + ': ' + g.items.join(', '));
    });
    L.push('');

    return L.join('\n');
  }

  /* ------------------------- 5x5 block ASCII font ------------------------- */
  /* Only the letters we actually need - keeps the logo crisp and verifiable. */
  var FONT = {
    A: [' ███ ', '█   █', '█████', '█   █', '█   █'],
    B: ['████ ', '█   █', '████ ', '█   █', '████ '],
    C: [' ████', '█    ', '█    ', '█    ', ' ████'],
    D: ['████ ', '█   █', '█   █', '█   █', '████ '],
    E: ['█████', '█    ', '████ ', '█    ', '█████'],
    H: ['█   █', '█   █', '█████', '█   █', '█   █'],
    I: ['█████', '  █  ', '  █  ', '  █  ', '█████'],
    J: ['█████', '    █', '    █', '█   █', ' ███ '],
    L: ['█    ', '█    ', '█    ', '█    ', '█████'],
    M: ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
    N: ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
    O: [' ███ ', '█   █', '█   █', '█   █', ' ███ '],
    P: ['████ ', '█   █', '████ ', '█    ', '█    '],
    R: ['████ ', '█   █', '████ ', '█ █  ', '█  ██'],
    S: [' ████', '█    ', ' ████', '    █', '████ '],
    T: ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
    U: ['█   █', '█   █', '█   █', '█   █', ' ███ '],
    Y: ['█   █', '█   █', '█████', '  █  ', '  █  '],
    Z: ['█████', '   ██', '  █  ', ' █   ', '█████'],
    ' ': ['   ', '   ', '   ', '   ', '   '],
    '-': ['     ', '     ', '█████', '     ', '     '],
    '.': ['     ', '     ', '     ', '     ', '  █  '],
    '>': ['█    ', ' █   ', '  █  ', ' █   ', '█    '],
    '_': ['     ', '     ', '     ', '     ', '█████'],
    '/': ['    █', '    █', '   █ ', '  █  ', ' █   ']
  };

  function blockText(str) {
    var rows = ['', '', '', '', ''];
    str.toUpperCase().split('').forEach(function (ch, i) {
      var glyph = FONT[ch] || FONT[' '];
      // one column of air between letters, or they merge into a slab
      if (i) rows = rows.map(function (r) { return r + ' '; });
      for (var i2 = 0; i2 < 5; i2++) rows[i2] += glyph[i2];
    });
    return rows.map(function (r) { return r.replace(/\s+$/, ''); }).join('\n');
  }

  window.XP = window.XP || {};

  /* A config value is still a placeholder if it contains <ANGLE_BRACKETS> or
   * an obvious "your-..." stub. The UI flags these with a [TODO] marker. */
  function isPlaceholder(value) {
    if (!value) return true;
    var s = String(value);
    return /<[^>]+>/.test(s) || /your[-_ ]?(username|handle|name|repo|project)/i.test(s) ||
           /^(you|example)@/i.test(s) || /^https?:\/\/example/i.test(s);
  }

  XP.isPlaceholder = isPlaceholder;

  window.XP_DATA = {
    config: CONFIG,
    education: EDU,
    experience: EXPERIENCE,
    projects: PROJECTS,
    skills: SKILLS,
    fs: FS,
    root: ROOT,
    home: ROOT + '\\My Documents',
    blockText: blockText,
    resumeText: buildResumeText,
    projectText: projectText,
    /* Convenience bundle so apps don't have to thread `d` through everywhere. */
    get me() {
      var d = this;
      return {
        name: CONFIG.name,
        handle: CONFIG.handle,
        tagline: CONFIG.tagline,
        summary: CONFIG.summary,
        interests: CONFIG.interests,
        config: CONFIG,
        education: EDU,
        experience: EXPERIENCE,
        projects: PROJECTS,
        skills: SKILLS
      };
    }
  };
})();