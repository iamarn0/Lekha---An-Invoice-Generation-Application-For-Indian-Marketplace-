const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { uploadLogo } = require('../middleware/upload');
const settings = require('../controllers/settingsController');

const router = require('express').Router();

const password = body('newPassword')
  .isString()
  .isLength({ min: 8, max: 72 })
  .withMessage('Use 8 to 72 characters')
  .matches(/[A-Za-z]/)
  .withMessage('Include at least one letter')
  .matches(/\d/)
  .withMessage('Include at least one number');

router.use(protect);
router.put(
  '/',
  validate([
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your name'),
    body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('businessName').optional({ values: 'falsy' }).isLength({ max: 120 }),
    body('address').optional({ values: 'falsy' }).isLength({ max: 400 }),
    body('phone').optional({ values: 'falsy' }).isLength({ max: 40 }),
    body('taxNumber').optional({ values: 'falsy' }).isLength({ max: 40 }),
    body('gstin').optional({ values: 'falsy' }).isLength({ max: 15 }),
    body('pan').optional({ values: 'falsy' }).isLength({ max: 10 }),
    body('state').optional({ values: 'falsy' }).isLength({ max: 2 }),
    body('upiId').optional({ values: 'falsy' }).isLength({ max: 80 }),
    body('razorpayKeyId').optional({ values: 'falsy' }).isLength({ max: 80 }),
    body('businessType').optional({ values: 'falsy' }).isLength({ max: 20 }),
  ]),
  settings.update
);
router.put(
  '/password',
  validate([body('currentPassword').notEmpty().withMessage('Enter your current password'), password]),
  settings.updatePassword
);
router.post('/logo', uploadLogo, settings.uploadLogo);
router.delete('/logo', settings.removeLogo);

module.exports = router;
