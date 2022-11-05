const router = require('express').Router();
const WebhookResponse = require('@jambonz/node-client').WebhookResponse;

// User calls a fixed phone number with this app set to the number in the Phone Numbers section of the web portal
// Phone number is a Twilio phone number

// Does this webhook cause an error that restart feature-server?
router.post('/answeringMachineDetection', async (req, res) => {
    const { logger } = req.app.locals;
    const payload = req.body;
    const { type, reason } = payload;
    let currentTime = new Date().getTime();
    logger.info({payload}, currentTime + ' POST /menu-demo/menu-greeting');
    console.log(`/answeringMachineDetection type: ${type}, reason: ${reason}`);

    if (type === 'amd_no_speech_detected') {
      return {
        "verb": "say",
        "text": "Record your message and press pound or press star to contact the operator.",
        "synthesizer" : {
          "vendor": "Google",
          "language": "en-US"
        }
      }
    }
    //res.sendStatus(200); // this would return before line 16. Is a return needed if amd_no_speech_detected does not trigger?
  });

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
        app.pause({length: 2}).gather(gatherDetailsGreeting);
        res.status(200).json(app);
      } catch (err) {
        logger.error({err}, 'Error');
        res.sendStatus(503);
      }
});

// Menu transfers user to extension. The PBX carrier trunk is used so three-digit extensions without DIDs can be used.
router.post('/process-selection-greeting', async (req, res) => {
    const { logger } = req.app.locals;
    const payload = req.body;
    const { from } = payload;
    let currentTime = new Date().getTime();
    logger.info({payload}, currentTime + ' POST /menu-demo/process-selection-greeting');
  
    const app = new WebhookResponse();

    try {
        if (payload.speech && payload.speech.alternatives.length) {
            const resultData = payload.speech.alternatives[0];
            const extensionNumber = [...resultData.transcript].filter((c) => /\d/.test(c)).join('');
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
                            actionHook: '/menu-demo/answeringMachineDetection',
                        }
                    });
        } else if (payload.digits) {
            const extensionNumber = payload.digits;
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
                            actionHook: '/menu-demo/answeringMachineDetection',
                        }
                    });
        }
        res.status(200).json(app);
    } catch (err) {
        logger.error({err}, 'Error');
        res.sendStatus(503);
    }
});
  
module.exports = router;