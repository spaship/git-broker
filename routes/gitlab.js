const { Router } = require('express');
const gitlab = require('../controllers/gitlab');
const router = new Router();

/**
 * @internal webhook for gitlab
 */
router.post('/webhook', gitlab.post);

module.exports = router;
