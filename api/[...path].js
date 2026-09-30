const app = require('../server/app');

module.exports = (req, res) => {
  const slug = req.query?.path;
  const parts = Array.isArray(slug) ? slug : (slug ? [slug] : []);
  if (parts.length && !String(req.url || '').startsWith('/api/')) {
    const query = String(req.url || '').includes('?')
      ? String(req.url).slice(String(req.url).indexOf('?'))
      : '';
    req.url = `/api/${parts.join('/')}${query}`;
  }
  return app(req, res);
};
