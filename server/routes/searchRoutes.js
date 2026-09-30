const { protect } = require('../middleware/auth');
const search = require('../controllers/searchController');

const router = require('express').Router();

router.use(protect);
router.get('/', search.search);

module.exports = router;
