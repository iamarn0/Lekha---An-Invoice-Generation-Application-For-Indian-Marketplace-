const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const clients = require('../controllers/clientController');

const router = require('express').Router();

const clientRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter the client name'),
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('company').optional({ values: 'falsy' }).isLength({ max: 120 }).withMessage('Company name is too long'),
  body('phone').optional({ values: 'falsy' }).isLength({ max: 40 }).withMessage('Phone number is too long'),
  body('address').optional({ values: 'falsy' }).isLength({ max: 400 }).withMessage('Address is too long'),
  body('gstin').optional({ values: 'falsy' }).isLength({ max: 15 }),
  body('pan').optional({ values: 'falsy' }).isLength({ max: 10 }),
  body('state').optional({ values: 'falsy' }).isLength({ max: 2 }),
];

router.use(protect);
router.get('/', clients.list);
router.post('/', validate(clientRules), clients.create);
router.get('/:id', clients.getOne);
router.put('/:id', validate(clientRules), clients.update);
router.delete('/:id', clients.remove);

module.exports = router;
