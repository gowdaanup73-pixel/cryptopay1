const fs = require('fs');
const path = require('path');

const dirsToRetheme = [
  path.join(__dirname, 'pages'),
  path.join(__dirname, 'components')
];

const hexMap = {
  '#22c55e': '#60a5fa',
  '#16a34a': '#2563eb',
  '#a3e635': '#a78bfa',
  '#84cc16': '#7c3aed',
  'rgba(34,197,94': 'rgba(96,165,250',
  'rgba(22,163,74': 'rgba(37,99,235'
};

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      Object.keys(hexMap).forEach(oldHex => {
        content = content.split(oldHex).join(hexMap[oldHex]);
      });

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Rethemed hex in ${fullPath.replace(__dirname, '')}`);
      }
    }
  });
}

dirsToRetheme.forEach(processDirectory);
console.log('Hex script complete');
