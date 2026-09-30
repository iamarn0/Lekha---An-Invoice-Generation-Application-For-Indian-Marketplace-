const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const invoices = require('../controllers/invoiceController');

const router = require('express').Router();

router.use(protect);
router.get('/', invoices.list);
router.post('/', invoices.create);
router.get('/:id/pdf', invoices.pdf);
router.post('/:id/duplicate', invoices.duplicate);
router.post('/:id/convert', invoices.convert);
router.post('/:id/send', invoices.send);
router.patch('/:id/status', validate([body('status').isString().withMessage('Choose a status')]), invoices.updateStatus);
router.get('/:id', invoices.getOne);
router.put('/:id', invoices.update);
router.delete('/:id', invoices.remove);

module.exports = router;
