const { log } = require('@spaship/common/lib/logging/pino');
const app = require('./app');
const { config } = require('./config');
const pkgJSON = require('./package.json');

console.info(`
███████╗██████╗  █████╗ ███████╗██╗  ██╗██╗██████╗     ██████╗ ██╗   ██╗███████╗███████╗██╗     ███████╗
██╔════╝██╔══██╗██╔══██╗██╔════╝██║  ██║██║██╔══██╗    ██╔══██╗██║   ██║╚══███╔╝╚══███╔╝██║     ██╔════╝
███████╗██████╔╝███████║███████╗███████║██║██████╔╝    ██████╔╝██║   ██║  ███╔╝   ███╔╝ ██║     █████╗  
╚════██║██╔═══╝ ██╔══██║╚════██║██╔══██║██║██╔═══╝     ██╔═══╝ ██║   ██║ ███╔╝   ███╔╝  ██║     ██╔══╝  
███████║██║     ██║  ██║███████║██║  ██║██║██║         ██║     ╚██████╔╝███████╗███████╗███████╗███████╗
╚══════╝╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝         ╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝╚══════╝                                                                                                     
`);

if (config.env === 'production') {
  log.info(`Starting SPAship Puzzle ${pkgJSON.version} running on production`);
} else {
  log.info(`Starting SPAship Puzzle ${pkgJSON.version} running on ${config.env}`);
}

(async () => {
  app.listen(config.port, () => {
    log.info(`Server started for SPAship puzzle on port ${config.port}`);
  });
})();
