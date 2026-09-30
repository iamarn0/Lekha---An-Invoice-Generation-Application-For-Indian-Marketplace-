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

if (!process.env.VERCEL) {
  fs.mkdirSync(uploadsDir(), { recursive: true });
}

const app = express();

if (env.nodeEnv === 'production') app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '4mb' }));
app.use(cookieParser());
app.use(mongoSanitize());

if (env.nodeEnv !== 'production') app.use(morgan('dev'));

let ready;
function ensureReady() {
  if (!ready) {
    ready = connectDB()
      .then(() => seedIfEmpty())
      .catch((error) => {
        ready = null;
        throw error;
      });
  }
  return ready;
}

app.use(async (req, res, next) => {
  try {
    await ensureReady();
    next();
  } catch (error) {
    next(error);
  }
});

if (!process.env.VERCEL) {
  app.use('/uploads', express.static(uploadsDir()));
}
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

if (env.nodeEnv === 'production' && !process.env.VERCEL) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

module.exports = app;
