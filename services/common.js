const { log } = require('@spaship/common/lib/logging/pino');
const axios = require('axios');

const orchestratorRequest = async (data) => {
  log.info(data);
  const headers = { 'Content-Type': 'application/json' };
  await axios
    .post(config.orchestratorBaseUrl, data, { headers })
    .then((response) => {
      log.info('OrchestratorResponse', response.data);
    })
    .catch((error) => {
      log.info('Error in sending data to Orchestrator', error);
    });
};

module.exports = {
  orchestratorRequest
};
