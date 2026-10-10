// Dev helper: prints the plain-text resume straight out of js/data.js so
// resume.txt never drifts from the terminal. Run: node tools/print-resume.js
global.window = global;
require('../js/data.js');
process.stdout.write(window.DATA.resumeText());