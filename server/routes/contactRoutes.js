const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const contact = require('../controllers/contactController');

const router = require('express').Router();

router.post(
  '/',
  authLimiter,
  validate([
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your name'),
    body('email').trim().isEmail().withMessage('Enter a valid email'),
    body('company').optional({ values: 'falsy' }).isLength({ max: 120 }),
    body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Write a short message'),
  ]),
  contact.submit
);

module.exports = router;
