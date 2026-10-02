# Aditya Shaji - terminal portfolio

A personal site that is a command prompt. No build step, no framework, no
bundle, no web fonts, no analytics, no cookies, no sounds.

```
aditya@portfolio:~$ who
```

Live at **https://ps-aditya.github.io/portfolio/**.

---

## What is in here

| File | Purpose |
| --- | --- |
| `index.html` | Markup + all the CSS, inlined. The greeting is real HTML, so it paints before any JavaScript runs. |
| `js/data.js` | **All your content.** Config, projects, experience, skills, resume text. This is the only file you need to edit. |
| `js/main.js` | The terminal: REPL, commands, tab completion, Minesweeper, Snake. |
| `resume.txt` | Plain-text resume, for recruiters and ATS. |
| `llms.txt` | Machine-readable summary for AI agents. |
| `.nojekyll` | Stops GitHub Pages' Jekyll pass from touching anything. |

Total is about 49 KB uncompressed, two network requests, no images and no
fonts - the entire visual identity is one inline `<style>` block and an
inline SVG of a dog.

## Run it

```bash
git clone https://github.com/ps-aditya/portfolio.git
cd portfolio
python -m http.server 8000
```

Or just double-click `index.html`. The scripts are classic `<script>` tags on
purpose, so there is no CORS problem over `file://`.

## Make it yours

Everything content-related is the `CONFIG` block at the top of `js/data.js`.

```js
var CONFIG = {
  name: 'Aditya Shaji',
  handle: 'aditya',
  version: '1.0.0',
  tagline:  'I build developer tools and local-first AI runtimes.',
  now:      'building Low End LLM - a runtime that runs quantized LLMs on 4GB-RAM laptops',

  email:    'you@example.com',                                       // TODO
  linkedin: 'https://www.linkedin.com/in/<YOUR-LINKEDIN-HANDLE>',    // TODO
  twitter:  'https://x.com/<YOUR-HANDLE>',                            // TODO
  github:   'https://github.com/ps-aditya'
};
```

Anything still wrapped in `<ANGLE_BRACKETS>` is a placeholder, and the site
says so - `contact` marks it `[TODO]` instead of printing a dead link, and
clicking it tells you which file to open. You cannot ship a broken link by
accident.

Two places outside `data.js` also carry the name, and both are one-line edits:

- the `<h1>` / contact block in `index.html`
- the JSON-LD block in the `<head>` of `index.html` (this is what search
  engines and AI agents actually read)

If you add a post, drop it into `BLOG.posts` in `data.js` and it appears in
`blog`. If you change your projects, re-copy the output of the `resume`
command into `resume.txt` and `llms.txt`.

## Commands

| Command | Alias | Prints |
| --- | --- | --- |
| `who` | `w` | who I am, education, what I am building |
| `skills` | `s` | languages and technologies |
| `projects` | `pj` | everything built so far |
| `projects <name>` | `pj <name>` | one project in detail |
| `misc` | | experience, education, and how this site is built |
| `games` | `g` | the distractions |
| `games minesweeper` | `g ms` | Minesweeper, in the output stream |
| `games snake` | `g snake` | Snake |
| `blog` | `b` | posts, or what I am into if there are none |
| `resume` | `cv` | the whole resume as plain text |
| `contact` | | every link, flagged if it is still a TODO |
| `clear` | | wipe the screen |
| `help` | | the list above |

`Tab` completes. `Up`/`Down` walks history. `Ctrl`+`L` clears. `Escape` leaves
a game. Every `[bracket]` in the output is clickable.

## Deploy

```bash
git add .
git commit -m "update"
git push
```

Then **Settings -> Pages -> Deploy from a branch -> `main` / `/ (root)`**.
There is no build step to configure.

## Notes

- Paints the full greeting before JavaScript runs; the terminal just takes
  over once it is ready.
- Respects `prefers-reduced-motion` (there is nothing to animate) and works
  with a keyboard, a mouse or a thumb.
- With JavaScript disabled you get the whole thing as readable prose in a
  `<noscript>` block, plus `resume.txt`.
- The Bliss green is the only Windows XP reference left besides the decorative
  title bar. Rover is in the corner because he was always the point.