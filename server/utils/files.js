const fs = require('fs');
const path = require('path');

function uploadsDir() {
  return path.join(__dirname, '..', 'uploads');
}

function removeUpload(logoPath) {
  if (!logoPath || !logoPath.startsWith('/uploads/')) return;
  const filePath = path.join(uploadsDir(), path.basename(logoPath));
  fs.promises.unlink(filePath).catch(() => {});
}

module.exports = { uploadsDir, removeUpload };
