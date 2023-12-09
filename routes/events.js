const { Router } = require('express');
const events = require('../controllers/events');
const auth = require('../middlewares/auth');
const router = new Router();
const lighthouse = require('../controllers/lighthouse');
/**
 * @internal webhook for gitlab
 */
router.post('/comment', events.post);

router.post('/lighthouse', lighthouse.launchChromeAndRunLighthouse);

router.post('/lhcli', lighthouse.lhcli);


module.exports = router;
