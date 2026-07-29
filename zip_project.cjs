const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const zip = new AdmZip();

function addDirToZip(dirPath, zipPath) {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relativePath = path.join(zipPath, item);
        
        if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'public' || item.endsWith('.zip') || item.endsWith('.tar.gz')) {
            continue;
        }

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            zip.addLocalFolder(fullPath, relativePath);
        } else {
            zip.addLocalFile(fullPath, zipPath);
        }
    }
}

// Add the public folder separately, avoiding the zips
const publicItems = fs.readdirSync('public');
for (const item of publicItems) {
    if (!item.endsWith('.zip') && !item.endsWith('.tar.gz')) {
        const fullPath = path.join('public', item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            zip.addLocalFolder(fullPath, path.join('public', item));
        } else {
            zip.addLocalFile(fullPath, 'public');
        }
    }
}

addDirToZip('.', '');

zip.writeZip('public/TrendHunter_App.zip');
console.log('Zip file created successfully.');
