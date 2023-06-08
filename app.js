const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { pinoExpress } = require('@spaship/common/lib/logging/pino');
const responseWrapper = require('./middlewares/responseWrapper');
const errorHandler = require('./middlewares/errorHandler');
const { liveness, readiness } = require('./health');
const routes = require('./routes');

const app = new express();
app
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(cors())
  .use(pinoExpress)
  .use(responseWrapper())
  .get('/liveness', liveness)
  .get('/readiness', readiness)
  .use('/puzzle', routes)
  .use(errorHandler());

module.exports = app;
