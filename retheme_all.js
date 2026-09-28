const fs = require('fs');
const path = require('path');

const dirsToRetheme = [
  path.join(__dirname, 'pages'),
  path.join(__dirname, 'components')
];

const colorMap = {
  'green': 'blue',
  'lime': 'purple',
  'emerald': 'indigo',
  'teal': 'cyan',
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

      // Replace colors in Tailwind classes
      Object.keys(colorMap).forEach(oldColor => {
        const newColor = colorMap[oldColor];
        // Only replace if preceded by a dash or colon to target tailwind (e.g. text-green, from-green, hover:text-green)
        // Note: also replacing hex green where applicable? The original script didn't. That's fine.
        const regex = new RegExp(`(?<=[-:])${oldColor}(?=-\\d+)`, 'g');
        content = content.replace(regex, newColor);
      });

      // Special cases (like the logo text, "CropCoin" -> "CryptoPay")
      content = content.replace(/CropCoin/g, 'CryptoPay');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Rethemed ${fullPath.replace(__dirname, '')}`);
      }
    }
  });
}

dirsToRetheme.forEach(processDirectory);
console.log('Complete');
