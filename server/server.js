const { env } = require('./config/env');
const app = require('./app');

if (require.main === module) {
  const server = app.listen(env.port, () => {
    console.log(`LEKHA API listening on http://localhost:${env.port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${env.port} is already in use.`);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  });
}

module.exports = app;
