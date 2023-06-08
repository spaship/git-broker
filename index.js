const { log } = require('@spaship/common/lib/logging/pino');
const app = require('./app');
const config = require('./config');
const pkgJSON = require('./package.json');

if (config.env === 'production') {
  log.info(`Starting SPAship Puzzle ${pkgJSON.version} running on production.`);
} else {
  log.info(`Starting SPAship Puzzle ${pkgJSON.version} running.`);
}

(async () => {
  app.listen(9191, () => {
    log.info(`Server started for ${config.env}!`);
  });
})();
