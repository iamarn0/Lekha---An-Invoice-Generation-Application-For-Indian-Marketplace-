const { protect } = require('../middleware/auth');
const activity = require('../controllers/activityController');

const router = require('express').Router();

router.use(protect);
router.get('/', activity.list);

module.exports = router;
