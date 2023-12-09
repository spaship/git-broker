const { log } = require('@spaship/common/lib/logging/pino');
const axios = require('axios');
const { config } = require('../config');

const orchestratorDeploymentRequest = async (data) => {
  log.info(data);
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.orchestratorSecret}`
  };
  try {
    const response = await axios.post(`${config.orchestratorBaseUrl}/applications/git/deploy`, data, { headers });
    log.info(response?.data);
    return response?.data?.data;
  } catch (error) {
    log.error('Error in sending data to Orchestrator');
    log.error(error);
    throw new Error(error?.response?.data.message);
  }
};

const orchestratorEnvListRequest = async (repoUrl, contextDir) => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.orchestratorSecret}`
  };
  try {
    const response = await axios.get(`${config.orchestratorBaseUrl}/environment/git?repoUrl=${repoUrl}&contextDir=${contextDir}`, { headers });
    log.info(response?.data);
    return response?.data?.data;
  } catch (error) {
    log.error('Error in sending data to Orchestrator');
    log.error(error);
    throw new Error(error?.response?.data.message);
  }
};

const orchestratorLighthouseDetails = async (data) => {
  log.info(data);
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.orchestratorSecret}`
  };
  try {
    const response = await axios.post(`${config.orchestratorBaseUrl}/applications/lighthouse/consumer`, data, { headers });
    log.info(response?.data);
    return response?.data?.data;
  } catch (error) {
    log.error('Error in sending data to Orchestrator');
    log.error(error);
  }
};


const createOrchestratorPayload = (payload, contextDir, envs, ref, ephemeral) => {
  return {
    repoUrl: payload?.repository?.html_url || payload?.project?.web_url,
    gitRef: payload?.pull_request?.head?.ref || payload?.object_attributes?.source_branch || ref,
    commitId: payload?.pull_request?.head?.sha || payload?.object_attributes?.last_commit?.id || payload?.object_attributes?.commit_id,
    mergeId: payload?.pull_request?.number?.toString() || payload?.object_attributes?.iid?.toString(),
    projectId: `${payload.project.id}` || 'NA',
    contextDir: contextDir,
    ephemeral: ephemeral,
    envs: envs
  };
};

module.exports = {
  orchestratorDeploymentRequest,
  createOrchestratorPayload,
  orchestratorEnvListRequest,
  orchestratorLighthouseDetails
};
