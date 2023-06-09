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

const createOrchestratorPayload = (payload, contextDir, envs) => {
  return {
    repoUrl: payload.repository.html_url,
    gitRef: payload.pull_request.head.ref,
    commitId: payload.pull_request.head.sha,
    mergeId: payload.pull_request.number.toString(),
    contextDir: contextDir,
    envs: envs
  };
};

module.exports = {
  orchestratorRequest,
  createOrchestratorPayload
};
