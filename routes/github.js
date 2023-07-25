const { Router } = require('express');
const github = require('../controllers/github');
const auth = require('../middlewares/auth');
const router = new Router();

/**
 * @internal webhook for github
 */
router.post('/webhook', auth.github, github.post);

module.exports = router;
