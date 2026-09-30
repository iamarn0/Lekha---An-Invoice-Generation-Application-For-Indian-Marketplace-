function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsRegex(value) {
  return new RegExp(escapeRegex(String(value).trim()), 'i');
}

module.exports = { escapeRegex, containsRegex };
