# XP://Terminal

A personal site that boots into Windows XP and hands you a command prompt.
Everything in the resume is one `help` away, and there is a file explorer, a
browser, notepad and a working Minesweeper if you get bored.

Vanilla HTML, CSS and JavaScript. No framework, no bundler, no dependencies,
no analytics, no cookies. Clone it, open `index.html`, done.

---

## Quick start

```bash
git clone https://github.com/<YOUR-GITHUB-USERNAME>/<REPO-NAME>.git
cd <REPO-NAME>
python -m http.server 8000     # any static server works
# open http://localhost:8000
```

It also works by double-clicking `index.html` - the scripts are classic
`<script>` tags on purpose, so there is no CORS problem over `file://`.

---

## Make it yours

**Everything content-related lives in one file: `js/data.js`.**
Open the `CONFIG` block at the top and replace the placeholders.

```js
var CONFIG = {
  github:   'https://github.com/<YOUR-GITHUB-USERNAME>',   // <- replace
  linkedin: 'https://www.linkedin.com/in/<YOUR-LINKEDIN-HANDLE>',
  twitter:  'https://x.com/<YOUR-HANDLE>',
  email:    'you@example.com',
  website:  'https://<YOUR-GITHUB-USERNAME>.github.io/<REPO-NAME>/'
};
```

Until you do, the site flags every placeholder with a `[TODO]` marker in the
terminal and the contact page, so you can never ship a dead link by accident.

The rest of `data.js` holds the resume itself - experience, projects, skills
and a small virtual file system (`XP.fs` resolves paths against it). If you
add a project to `PROJECTS`, it automatically appears in the terminal, in the
browser, in `neofetch`, and as a file under `My Documents\Projects`.

Also worth editing:

| What | Where |
| --- | --- |
| Name, tagline, summary, location | `CONFIG` in `js/data.js` |
| Projects, experience, education, skills | `data.js` |
| Boot and welcome screens | `js/boot.js`, `index.html` |
| Wallpaper + Luna/Bliss colours | `css/xp.css` (`:root` and `html[data-theme="bliss"]`) |
| Terminal colours and font | `css/terminal.css` |
| Desktop icons | `ICON_LAYOUT` in `js/shell.js` |
| Start menu entries | `START_ITEMS` / `START_SIDE` in `js/shell.js` |

The wallpaper is a CSS gradient on purpose - it scales to any screen instead of
being a 1 MB JPEG that breaks the retro feel on a 4K monitor. If you want an
actual Bliss photo, drop it in and change `#wallpaper` in `css/xp.css`.

---

## Deploy to GitHub Pages

1. Create the repo and push:

   ```bash
   git init
   git add .
   git commit -m "Windows XP terminal portfolio"
   git branch -M main
   git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/<REPO-NAME>.git
   git push -u origin main
   ```

   No build step, no `npm install`, nothing to generate. With the GitHub CLI
   installed it is one line:

   ```bash
   gh repo create <REPO-NAME> --public --source=. --push
   ```

2. **Settings -> Pages -> Build and deployment -> Source: Deploy from a branch**,
   branch `main`, folder `/ (root)`.

3. Wait a minute. The site is live at `https://<you>.github.io/<repo>/`.

That is the whole deployment. There is no build to run.

If you ever add a folder or file starting with an underscore, add an empty
`.nojekyll` file at the root so Jekyll does not eat it.

Then set `website` in `CONFIG` to that URL so `neofetch` reports the right host.

---

## The terminal

Click **Command Prompt** on the desktop, or `Start -> Programs -> Terminal`.

```
help              list every command
help <command>    explain one
about             who this person is
skills            languages and technologies
projects [name]   everything built so far
experience        work and internships
education         where the degree comes from
contact           links, with [TODO] markers on placeholders
resume            the resume as plain text
neofetch          system info (real cores, real memory, real uptime)

ls / cd / pwd / tree / cat / search   wander the virtual file system
open <program|file>          launch an app or open a document
apps             what is installed
theme [luna|bliss]           swap the wallpaper
crt [on|off]                 CRT scanlines
history / env / date / echo  odds and ends
win              an encouragement
```

Aliases exist for the muscle-memory ones: `cls`, `dir`, `type`, `h`, `exp`,
`edu`, `bio`, `socials`, `?`.

| Key | Does |
| --- | --- |
| `Tab` | complete commands, app names and file paths |
| `Up` / `Down` | history |
| `Ctrl`+`L` | clear the screen |
| `Ctrl`+`C` | abandon the line |
| `Ctrl`+`V` | paste |

## The rest of the desktop

- **My Computer** - the file system in `data.js`. Double-click folders, open
  documents in Notepad, switch to Details view.
- **Notepad** - reads any file in the tree. Word wrap, a font toggle, a caret
  position readout. Read-only, because there is nothing to save it to.
- **My Web Browser** - the same content with windows on it. Frames real sites
  are blocked by their `X-Frame-Options`, so the pages are rendered locally.
- **Minesweeper** - actual Minesweeper: first click is safe, flood fill,
  chording, flags via right click or long press, three difficulties, best times
  in `localStorage`.
- **Recycle Bin** - empty. It wants to stay that way.

Desktop extras: right-click for the context menu, drag a window to the top edge
to maximize it, resize from any edge or corner, `Win+L` to lock,
`Ctrl`+`Alt`+`Del` for the security dialog, `Alt`+`F4` to close.

Sound is a five-note startup jingle synthesised with the Web Audio API - no
audio files. It is off unless you tick the box on the welcome screen, and the
tray icon toggles it later. Your preference is remembered.

---

## File map

```
index.html          the whole markup: boot, splash, welcome, desktop shell
css/xp.css          theme tokens, wallpaper, taskbar, Start menu, boot screens
css/windows.css     window frames, buttons, toolbars, scrollbars
css/terminal.css    the command prompt
css/apps.css        explorer, notepad, browser, minesweeper
js/data.js          <-- all your content lives here
js/fs.js            path maths over the virtual file system
js/icons.js         every icon, as inline SVG
js/audio.js         Web Audio blips
js/wm.js            window manager: drag, resize, min/max, focus, taskbar
js/shell.js         desktop icons, Start menu, context menu, tray, shortcuts
js/boot.js          BIOS POST, splash, welcome screen
js/apps/*.js        one file per app
js/main.js          wiring
```

Nothing is minified and nothing is generated. The whole thing is meant to be
read.

---

## Notes

- Respects `prefers-reduced-motion`: the boot sequence is skipped entirely.
- Works with a mouse, a trackpad or a finger (pointer events throughout).
- Mobile: the taskbar grows, sidebar panes collapse, window buttons enlarge.
- `prefers-color-scheme` is deliberately ignored - it is 2001, the wallpaper is
  blue, and that is correct.
