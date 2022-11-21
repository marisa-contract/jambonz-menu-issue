const router = require('express').Router();
const WebhookResponse = require('@jambonz/node-client').WebhookResponse;

// AMD webhook is in ./answeringMachineDetection

// User calls a fixed phone number with this app set to the number in the Phone Numbers section of the web portal
// Phone number is a Twilio phone number

const speechGreeting = `<speak>
<s>This is a demo app. Please input or say the extension of the employee you are trying to reach.</s>
<break time="5s"/>
</speak>`;

const gatherDetailsGreeting = {
  actionHook: '/menu-demo/process-selection-greeting',
  input: ["digits", "speech"],
  minDigits: 1,
  maxDigits: 3,
  interDigitTimeout: 1.5,
  timeout: 20,
  recognizer: {
    vendor: "google",
    language: "en-US",
  },
  say: {
    text: speechGreeting,
    loop: 3
  },
};

router.post('/menu-greeting', async (req, res) => {
  const { logger } = req.app.locals;
  const payload = req.body;
  let currentTime = new Date().getTime();
  logger.info({payload}, currentTime + ' POST /menu-demo/menu-greeting');
  try {
    const app = new WebhookResponse();
    app.gather(gatherDetailsGreeting);
    res.status(200).json(app);
  } catch (err) {
    logger.error({err}, 'Error');
    console.log('503 in menu greeting.')
    res.sendStatus(503);
  }
});

// Menu transfers user to extension. The PBX carrier trunk is used so three-digit extensions without DIDs can be used.
router.post('/process-selection-greeting', async (req, res) => {
  const { logger } = req.app.locals;
  const payload = req.body;
  const { from } = payload;
  const currentTime = new Date().getTime();
  logger.info({payload}, currentTime + ' POST /menu-demo/process-selection-greeting');
  const app = new WebhookResponse();

  try {
    if (payload.speech && payload.speech.alternatives.length) {
      const resultData = payload.speech.alternatives[0];
      const extensionNumber = [...resultData.transcript].filter((c) => /\d/.test(c)).join('');
      console.log(`Speech received. Transferring to ${extensionNumber}`);
      app.say({text: 'Transferring to extension ' + extensionNumber})
        .dial({
          callerId: from,
          answerOnBridge: true,
          dialMusic: process.env.DIAL_MUSIC,
          target: [{
            type: 'phone',
            number: extensionNumber,
            trunk: process.env.JAMBONZ_PBX_CARRIER_NAME
            }],
            amd: {
              actionHook: '/answeringMachineDetection',
            }
          });
          res.status(200).json(app);
    } else if (payload.digits) {
      const extensionNumber = payload.digits;
      console.log(`Digits received. Transferring to ${extensionNumber}`);
      app.say({text: 'Transferring to extension ' + extensionNumber})
        .dial({
          callerId: from,
          answerOnBridge: true,
          dialMusic: process.env.DIAL_MUSIC,
          target: [{
              type: 'phone',
              number: extensionNumber,
              trunk: process.env.JAMBONZ_PBX_CARRIER_NAME
            }],
            amd: {
              actionHook: '/answeringMachineDetection',
              recognizer: {
                vendor: 'google',
                language: 'en-US'
              }
            }
          });
          res.status(200).json(app);
    }
  } catch (err) {
        logger.error({err}, 'Error');
        console.log('503 in process-selection-greeting.');
        res.sendStatus(503);
    }
});
  
module.exports = router;
