/* =============================================================================
 *  data.js — everything on this site. This is the only file you need to edit.
 *
 *    1. fill in the CONFIG block below (the <ANGLE_BRACKETS> are placeholders)
 *    2. edit PROJECTS / EXPERIENCE / SKILLS as you build more things
 *    3. if you add a post to BLOG.posts, copy the update into resume.txt
 *
 *  Loaded first. main.js reads everything from window.DATA.
 * ========================================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------------------------
   *  >> EDIT ME  <<
   *  ------------------------------------------------------------------------ */
  var CONFIG = {
    name: 'Aditya Shaji',
    handle: 'aditya',
    version: '1.0.0',
    promptHost: 'portfolio',

    role: 'CS + AI/ML undergraduate',
    location: 'Mumbai, India',

    // The one-liner shown under your name.
    tagline: 'I build developer tools and local-first AI runtimes.',

    // The "CURRENTLY" line on the front page.
    now: 'building Low End LLM - a runtime that runs quantized LLMs on 4GB-RAM laptops',

    // TODO: replace these. Until you do, they render as clear TODOs.
    email: 'you@example.com',
    linkedin: 'https://www.linkedin.com/in/<YOUR-LINKEDIN-HANDLE>',
    twitter: 'https://x.com/<YOUR-HANDLE>',
    github: 'https://github.com/ps-aditya',
    website: 'https://ps-aditya.github.io/portfolio/',
    resumeUrl: 'resume.txt'
  };

  var EDUCATION = [{
    school: 'Atlas SkillTech University',
    location: 'Mumbai, India',
    degree: 'B.Tech Computer Science - Artificial Intelligence & Machine Learning',
    period: 'Aug 2025 - Aug 2029',
    note: 'Graduating 2029.'
  }];

  var EXPERIENCE = [{
    role: 'Founder',
    org: 'Low End LLM',
    location: 'Remote',
    period: 'Jul 2026 - Present',
    bullets: [
      'Building an adaptive runtime to run quantized LLMs locally on 4GB-RAM laptops, for developers without high-end GPUs who want a real, local taste of tools like Claude Code and Codex.',
      'Shipped real-time RAM/CPU/battery profiling and a per-turn safety floor that halts inference before memory exhaustion.',
      'Integrating quantized model loading (GGUF via llama.cpp, Q4_K_M, mmap-based weight loading) and a pre-flight capacity check.'
    ]
  }, {
    role: 'Creator & Maintainer',
    org: 'Redis State Explorer',
    location: 'Remote',
    period: 'Jun 2026 - Present',
    bullets: [
      'A VS Code extension that connects straight to Redis over the Engine API, with a live state panel and a diff timeline showing exactly which keys changed after a code save.',
      '1,000+ downloads.',
      'Invited Reviewer - ISMIR 2026 (International Society for Music Information Retrieval).'
    ]
  }];

  var PROJECTS = [{
    name: 'Docker Vitals',
    blurb: 'Live Docker container monitoring inside VS Code.',
    stack: ['TypeScript', 'Docker Engine API', 'VS Code Extension API'],
    status: 'shipped',
    links: [{ label: 'code', kind: 'github' }],
    details: [
      'Connects directly to the Docker Engine API via dockerode and streams CPU, memory and network stats.',
      'Pushes container start/stop events in real time instead of polling.',
      'Compose-diff shows what changed in running containers the moment you save a docker-compose.yml or Dockerfile.'
    ]
  }, {
    name: 'Redis State Explorer',
    blurb: 'See which Redis keys changed, and when.',
    stack: ['TypeScript', 'Redis Engine API', 'VS Code Extension API'],
    status: '1,000+ downloads',
    links: [{ label: 'code', kind: 'github' }],
    details: [
      'Live state panel wired straight to Redis over the Engine API.',
      'Diff timeline showing exactly which keys changed after a code save.',
      'Invited Reviewer - ISMIR 2026.'
    ]
  }, {
    name: 'Git Blend',
    blurb: "A commit's full diff, inline, the moment you hover a line.",
    stack: ['TypeScript', 'Git', 'VS Code Extension API'],
    status: 'built',
    links: [{ label: 'code', kind: 'github' }],
    details: [
      'Shows a commit\'s full diff inline on hover - not just blame attribution.',
      'A fast, free, zero-config alternative to heavier, subscription-gated blame views.'
    ]
  }, {
    name: 'Low End LLM',
    blurb: 'An adaptive runtime for quantized LLMs on 4GB-RAM laptops.',
    stack: ['Python', 'llama.cpp', 'GGUF', 'Q4_K_M'],
    status: 'in progress',
    links: [{ label: 'code', kind: 'github' }],
    details: EXPERIENCE[0].bullets
  }, {
    // TODO: give this one its real name - the draft had an unfinished note.
    name: 'AI Coding Assistant',
    blurb: 'Built from scratch in Java, with an autonomous agent loop.',
    stack: ['Java', 'OpenRouter API'],
    status: 'built',
    links: [{ label: 'code', kind: 'github' }],
    details: [
      'An AI coding assistant built from scratch in Java with an autonomous agent loop for multi-step file read, write and run tasks.'
    ]
  }, {
    name: 'Pulsar Classification Model',
    blurb: 'Calibrated Random Forest for pulsar detection.',
    stack: ['Python', 'scikit-learn', 'pandas'],
    status: 'ROC-AUC 0.97',
    links: [],
    details: [
      'Calibrated Random Forest on the HTRU2 dataset (~17,900 candidates, ~9% positive class).',
      'Probability calibration (Platt / isotonic) validated with reliability diagrams and Brier score.',
      'Decision threshold derived from an explicit cost model rather than a default 0.5 cutoff.',
      'ROC-AUC ~0.97 and recall ~0.90 at precision ~0.90 on held-out test data.'
    ]
  }];

  var SKILLS = [{
    group: 'Languages',
    items: ['Python', 'Java', 'JavaScript', 'TypeScript', 'Go', 'SQL']
  }, {
    group: 'Technologies',
    items: [
      'Redis', 'Git / GitHub Actions', 'VS Code Extension API', 'Chrome Extension APIs',
      'Oracle SQL', 'Microsoft Azure', 'Azure Machine Learning', 'OpenRouter API',
      'Docker Engine API', 'llama.cpp / GGUF'
    ]
  }];

  /* ---------------------------------------------------------------------------
   *  BLOG — no posts yet. Add { title, url, date, note } and it shows up in `blog`.
   *  Until then the command prints `thinking` instead, which is honest.
   *  ------------------------------------------------------------------------ */
  var BLOG = {
    posts: [],
    thinking: [
      'running quantized LLMs on hardware that was never meant to',
      'editor extensions that show you what changed, not just who changed it',
      'observability as a first-class feature instead of an afterthought',
      'calibration, thresholds and cost models - the unglamorous half of ML'
    ]
  };

  /* ------------------------------- helpers -------------------------------- */
  function isPlaceholder(v) {
    if (!v) return true;
    var s = String(v);
    return /<[^>]+>/.test(s) || /^https?:\/\/example/i.test(s) || /^(you|your)@/i.test(s);
  }

  function contactRows() {
    return [
      { key: 'email', label: 'email', value: CONFIG.email, href: 'mailto:' + CONFIG.email, show: 'email' },
      { key: 'linkedin', label: 'linkedin', value: CONFIG.linkedin, href: CONFIG.linkedin, show: 'short' },
      { key: 'twitter', label: 'twitter', value: CONFIG.twitter, href: CONFIG.twitter, show: 'short' },
      { key: 'github', label: 'github', value: CONFIG.github, href: CONFIG.github, show: 'short' }
    ];
  }

  /* github.com/ps-aditya  ->  github.com/ps-aditya */
  function shortUrl(u) {
    return String(u || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  }

  function resumeText() {
    var L = [];
    var rule = function (t) { L.push(t); L.push(new Array(t.length + 1).join('=')); L.push(''); };

    L.push(CONFIG.name);
    L.push(new Array(CONFIG.name.length + 1).join('='));
    L.push(contactRows().map(function (c) {
      return isPlaceholder(c.value) ? '' : shortUrl(c.value);
    }).filter(Boolean).join('  |  '));
    L.push(CONFIG.role + ' - ' + CONFIG.location);
    L.push('');

    rule('SUMMARY');
    L.push('Currently ' + CONFIG.now + '.');
    L.push('');

    rule('EXPERIENCE');
    EXPERIENCE.forEach(function (e) {
      L.push(e.role + ' - ' + e.org + ' (' + e.location + ')   ' + e.period);
      L.push('');
      e.bullets.forEach(function (b) { L.push('  * ' + b); });
      L.push('');
    });

    rule('PROJECTS');
    PROJECTS.forEach(function (p) {
      L.push(p.name + '  [' + p.stack.join(', ') + ']' + (p.status ? '  - ' + p.status : ''));
      L.push('  ' + p.blurb);
      p.details.forEach(function (d) { L.push('  * ' + d); });
      L.push('');
    });

    rule('EDUCATION');
    EDUCATION.forEach(function (e) {
      L.push(e.school + ' - ' + e.location + '   ' + e.period);
      L.push('  ' + e.degree);
      L.push('');
    });

    rule('SKILLS');
    SKILLS.forEach(function (g) { L.push(g.group + ': ' + g.items.join(', ')); });
    L.push('');

    return L.join('\n');
  }

  window.DATA = {
    config: CONFIG,
    education: EDUCATION,
    experience: EXPERIENCE,
    projects: PROJECTS,
    skills: SKILLS,
    blog: BLOG,
    isPlaceholder: isPlaceholder,
    contactRows: contactRows,
    shortUrl: shortUrl,
    resumeText: resumeText
  };
})();