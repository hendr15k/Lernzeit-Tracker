const path = require('path');

function getFileUrl(filename = 'index.html') {
  const basePath = path.resolve(__dirname, '..');
  return `file://${path.join(basePath, filename)}`;
}

module.exports = { getFileUrl };
