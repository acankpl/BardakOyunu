const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const wwwDir = path.join(rootDir, 'www');

function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
            copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
    } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
    }
}

// 1. Sync index.html
const indexHtml = path.join(rootDir, 'index.html');
const altHtml = path.join(rootDir, '3b_masa_ve_bardak_modelleme_st_dyosu.html');
const sourceHtml = fs.existsSync(indexHtml) ? indexHtml : altHtml;

if (fs.existsSync(altHtml) && !fs.existsSync(indexHtml)) {
    fs.copyFileSync(altHtml, indexHtml);
}

// 2. Validate inline JS syntax & ensure zero external URLs
const htmlContent = fs.readFileSync(sourceHtml, 'utf8');
const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
    throw new Error('Inline script tag not found!');
}
new Function(scriptMatch[1]);

const externalMatches = htmlContent.match(/https?:\/\//gi);
if (externalMatches) {
    throw new Error('External URL found in HTML: ' + externalMatches.join(', '));
}

// 3. Populate www/ for Capacitor Android & iOS
fs.mkdirSync(wwwDir, { recursive: true });
const filesToCopy = [
    'index.html',
    '3b_masa_ve_bardak_modelleme_st_dyosu.html',
    'manifest.webmanifest'
];

for (const f of filesToCopy) {
    const src = path.join(rootDir, f);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(wwwDir, f));
    }
}

for (const entry of fs.readdirSync(rootDir)) {
    if (entry.endsWith('.glb') || entry.endsWith('.png')) {
        fs.copyFileSync(path.join(rootDir, entry), path.join(wwwDir, entry));
    }
}

copyRecursive(path.join(rootDir, 'assets'), path.join(wwwDir, 'assets'));
console.log('SUCCESS: JS syntax verified, zero external URLs, and all .png/.glb assets synced to www/.');
