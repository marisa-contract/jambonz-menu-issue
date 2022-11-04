const router = require('express').Router();

router.use('/call-status', require('./call-status'));
router.use('/menu-demo', require('./menu-demo'));

module.exports = router;
