const { Router } = require('express');
const github = require('../controllers/github');
const router = new Router();

/**
 * @internal webhook for github
 */
router.post('/webhook', github.post);

module.exports = router;
