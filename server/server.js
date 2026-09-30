const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const { env } = require('./config/env');
const { connectDB } = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const { seedIfEmpty } = require('./seed/seed');
const { uploadsDir } = require('./utils/files');

fs.mkdirSync(uploadsDir(), { recursive: true });

const app = express();

if (env.nodeEnv === 'production') app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());

if (env.nodeEnv !== 'production') app.use(morgan('dev'));

app.use('/uploads', express.static(uploadsDir()));
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

if (env.nodeEnv === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

connectDB()
  .then(() => seedIfEmpty())
  .then(() => {
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
  })
  .catch((error) => {
    console.error('Failed to start InvoiceFlow');
    console.error(error.message);
    process.exit(1);
  });
