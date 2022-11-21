const router = require('express').Router();

router.use('/call-status', require('./call-status'));
router.use('/menu-demo', require('./menu-demo'));
router.use('/answeringMachineDetection', require('./answeringMachineDetection'));

module.exports = router;
