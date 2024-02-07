const { log } = require('@spaship/common/lib/logging/pino');
const { v4: uuidv4 } = require('uuid');
const { deployment } = require('../../config');
const { orchestratorDeploymentRequest, createOrchestratorPayload, orchestratorEnvListRequest } = require('../common');
const {
  commentOnGitlabMergeRequest,
  fetchMergeRequestCommentsFromGitlab,
  commentOnGitlabCommit,
  createNewBranchOnGitlabRepository,
  createFileOnGitlabRepository,
  alterFileOnGitlabRepository,
  fetchCommitDetails
} = require('./api');

const gitlabMergeRequest = async (payload) => {
  const projectId = payload.project.id;
  const mergeRequestId = payload.object_attributes.iid;
  const repoUrl = payload?.repository?.homepage;
  let envList;
  try {
    envList = await orchestratorEnvListRequest(repoUrl, '/');
  } catch (error) {
    log.error('Error in gitlabPushRequest');
    log.error(error);
    await commentOnGitlabMergeRequest(payload, projectId, mergeRequestId, error.message);
    return;
  }
  const envs = envList.filter((env) => env.cluster == 'preprod').map((property) => property.env);
  if (envs.length) {
    try {
      const contextDir = '/';
      const orchestratorPayload = createOrchestratorPayload(payload, contextDir, envs[0], '', 'true');
      await orchestratorDeploymentRequest(orchestratorPayload);
      await commentOnGitlabMergeRequest(
        payload,
        projectId,
        mergeRequestId,
        `⌛️ Build & Deployment Process Started Successfully for the ephemeral preview, we'll update you with the access url shortly.`
      );
    } catch (error) {
      log.error('Error in gitlabCommentOnCommit');
      log.error(error);
      await commentOnGitlabMergeRequest(payload, projectId, mergeRequestId, error.message);
    }
  }
};

const gitlabPushRequest = async (payload) => {
  const projectId = payload.project.id;
  const commitId = payload.checkout_sha;
  const repoUrl = payload.repository.homepage;
  let envList;
  try {
    envList = await orchestratorEnvListRequest(repoUrl, '/');
  } catch (error) {
    log.error('Error in gitlabPushRequest');
    log.error(error);
    try {
      await commentOnGitlabCommit(payload, projectId, commitId, error.message);
    } catch (error) {
      log.error(error);
    }
    return;
  }
  const envs = envList.filter((env) => env.cluster == 'preprod').map((property) => property.env);
  const commentBody = `📗 Kindly specify the names of environment you want to deploy [Registered Environment : ${envs.toString()}].`;
  try {
    await commentOnGitlabCommit(payload, projectId, commitId, commentBody);
  } catch (error) {
    log.error(error);
  }
};

const gitlabCommentOnCommit = async (payload) => {
  if (!payload?.object_attributes?.description?.startsWith(deployment.SPECIFIER)) return;
  const commitId = payload.commit.id;
  const projectId = payload.project.id;
  const repoUrl = payload?.repository?.homepage;
  const commentBody = payload.object_attributes.description;
  let envList;
  try {
    await commentOnGitlabCommit(payload, projectId, commitId, "⌛️ We're Currently Processing the Deployment Request, Please wait for sometime.");
  } catch (error) {
    log.error('Error in gitlabCommentOnCommit');
    log.error(error);
    try {
      await commentOnGitlabCommit(payload, projectId, commitId, error.message);
    } catch (error) {
      log.error(error);
    }
    return;
  }
  try {
    envList = await orchestratorEnvListRequest(repoUrl, '/');
  } catch (error) {
    log.error('Error in gitlabPushRequest');
    log.error(error);
    try {
      await commentOnGitlabCommit(payload, projectId, commitId, error.message);
    } catch (error) {
      log.error(error);
    }
    return;
  }
  envList = envList.filter((env) => env.cluster == 'preprod').map((property) => property.env);
  const commentDetails = await fetchCommitDetails(projectId, commitId);
  const ref = commentDetails.last_pipeline.ref;
  const deploymentEnvs = new Set();
  const extractedEnvs = commentBody.split(/[\s,]+/);
  extractedEnvs.map((env) => {
    if (envList.includes(env)) {
      deploymentEnvs.add(env);
    }
  });
  if (!deploymentEnvs?.size) {
    try {
      await commentOnGitlabCommit(
        payload,
        projectId,
        commitId,
        `⚠️ Please provide a valid env for deployment [Registered Environments : ${envList.toString()}].`
      );
      return;
    } catch (error) {
      log.error('Error in gitlabCommentOnCommit');
      log.error(error);
      return;
    }
  }
  const envs = Array.from(deploymentEnvs);
  // @internal TODO : mono repo support to be added
  const contextDir = '/';
  try {
    const orchestratorPayload = createOrchestratorPayload(payload, contextDir, envs, ref, '');
    const response = await orchestratorDeploymentRequest(orchestratorPayload);
    // @internal comment on specific Merge Request
    await commentOnGitlabCommit(payload, projectId, commitId, response.message);
  } catch (error) {
    log.error('Error in gitlabCommentOnCommit');
    log.error(error);
    try {
      await commentOnGitlabCommit(payload, projectId, commitId, error.message);
    } catch (error) {
      log.error(error);
    }
  }
};

const gitlabMergeRequestOnCloseAndMerge = async (payload) => {
  const mergeRequestId = payload.object_attributes.iid;
  const projectId = payload.project.id;
  const deploymentEnvs = await fetchMergeRequestCommentsFromGitlab(projectId, mergeRequestId);
  if (!deploymentEnvs?.size) return;
  const envs = Array.from(deploymentEnvs);
  const contextDir = payload.object_attributes.source.change_path || '/';
  try {
    const orchestratorPayload = createOrchestratorPayload(payload, contextDir, envs, '', '');
    const response = await orchestratorDeploymentRequest(orchestratorPayload);
    // @internal comment on specific Merge Request
    await commentOnGitlabMergeRequest(payload, projectId, mergeRequestId, response.message);
    // @internal git operations [TBD use-cases]
    // await gitlabOperations(payload);
  } catch (error) {
    log.error('Error in createFileOnGitlabRepository');
    log.error(error);
    await commentOnGitlabMergeRequest(payload, projectId, mergeRequestId, error.message);
  }
};

const gitlabOperations = async (payload) => {
  const filePath = 'spaship.yaml';
  const commentBody = `## Deployed by SPAship Git Broker`;
  const projectId = payload.project.id;
  const newRef = `${deployment.SPECIFIER}-${uuidv4().substring(0, 5)}`;
  const targetBranch = payload.object_attributes.target_branch;
  const commitId = payload.object_attributes.last_commit.id;
  // @internal comment on a specific commit
  await commentOnGitlabCommit(payload, projectId, commitId, commentBody);
  // @internal create a new branch
  await createNewBranchOnGitlabRepository(payload, projectId, newRef, targetBranch);
  // @internal create a new file in the repository
  await createFileOnGitlabRepository(payload, projectId, commentBody, filePath, newRef);
  // @internal alter an existing file in the repository
  await alterFileOnGitlabRepository(payload, projectId, commentBody, filePath, newRef);
};

module.exports = {
  gitlabMergeRequest,
  gitlabMergeRequestOnCloseAndMerge,
  gitlabPushRequest,
  gitlabCommentOnCommit
};
