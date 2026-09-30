const { protect } = require('../middleware/auth');
const analytics = require('../controllers/analyticsController');

const router = require('express').Router();

router.use(protect);
router.get('/dashboard', analytics.dashboard);
router.get('/', analytics.overview);

module.exports = router;
