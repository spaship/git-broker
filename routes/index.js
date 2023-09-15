const { Router } = require('express');
const github = require('./github');
const gitlab = require('./gitlab');
const events = require('./events');
const router = new Router();

const v1 = new Router();
v1.use('/github', github);
v1.use('/gitlab', gitlab);
v1.use('/events', events);

router.use('/v1', v1);

module.exports = router;
