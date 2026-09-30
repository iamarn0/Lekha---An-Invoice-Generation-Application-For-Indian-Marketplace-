const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth');
const auth = require('../controllers/authController');

const router = require('express').Router();

const email = body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail();
const password = body('password')
  .isString()
  .isLength({ min: 8, max: 72 })
  .withMessage('Use 8 to 72 characters')
  .matches(/[A-Za-z]/)
  .withMessage('Include at least one letter')
  .matches(/\d/)
  .withMessage('Include at least one number');
const name = body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your name');

router.post('/register', authLimiter, validate([name, email, password]), auth.register);
router.post('/login', authLimiter, validate([email, body('password').notEmpty().withMessage('Enter your password')]), auth.login);
router.post('/logout', auth.logout);
router.get('/me', protect, auth.me);
router.post('/forgot-password', authLimiter, validate([email]), auth.forgotPassword);
router.post(
  '/reset-password',
  authLimiter,
  validate([
    body('token').isString().isLength({ min: 20 }).withMessage('Reset link is invalid'),
    password,
  ]),
  auth.resetPassword
);

module.exports = router;
