const router = require('express').Router();
const WebhookResponse = require('@jambonz/node-client').WebhookResponse;

router.post('/', (req, res) => {
    const { logger } = req.app.locals;
    const payload = req.body;
    console.log({payload});
    logger.info({payload}, 'POST /answeringMachineDetection');
  
    if (type === 'amd_no_speech_detected') {
      const app = new WebhookResponse();
      app.say({
        text: 'Record your message and press pound or press star to contact the operator.',
        synthesizer : {
          vendor: 'Google',
          language: 'en-US'
        }
      });
      return res.status(200).json(app);
    }
    // otherwise, just return a 200
    res.sendStatus(200);
});

module.exports = router;