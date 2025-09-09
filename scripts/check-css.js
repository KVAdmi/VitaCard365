const fs = require('fs');
const html = fs.readFileSync('dist/index.html', 'utf8');
const cssMatch = html.match(/href="(.+?\.css)"/);
if (!cssMatch) throw new Error('No CSS bundle found!');
const cssFile = 'dist/' + cssMatch[1];
const css = fs.readFileSync(cssFile, 'utf8');
if (!css.trim()) throw new Error('CSS bundle is empty!');
console.log('CSS bundle OK:', cssFile);
