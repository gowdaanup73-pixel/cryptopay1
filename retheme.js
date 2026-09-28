const fs = require('fs');
const path = require('path');

const filesToRetheme = [
  'pages/transactions.js',
  'components/Transactions/TransactionDetailsModal.jsx'
];

const colorMap = {
  'green': 'blue',
  'lime': 'purple',
  'emerald': 'indigo',
  'teal': 'cyan',
};

filesToRetheme.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace colors in Tailwind classes (e.g. from-green-500)
  Object.keys(colorMap).forEach(oldColor => {
    const newColor = colorMap[oldColor];
    const regex = new RegExp(`(?<=[-:])${oldColor}(?=-\\d+)`, 'g');
    content = content.replace(regex, newColor);
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Rethemed ${file}`);
});
