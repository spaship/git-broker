const { Router } = require('express');
const gitlab = require('../controllers/gitlab');
const auth = require('../middlewares/auth');
const router = new Router();

/**
 * @internal webhook for gitlab
 */
router.post('/webhook', auth.gitlab, gitlab.post);

module.exports = router;
