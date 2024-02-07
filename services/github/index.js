const { log } = require('@spaship/common/lib/logging/pino');
const { v4: uuidv4 } = require('uuid');
const { deployment } = require('../../config');
const { orchestratorDeploymentRequest, createOrchestratorPayload } = require('../common');
const {
  commentOnGithubPullRequest,
  fetchComments,
  commentOnGithubMergedCommit,
  alterFileOnGithubRepository,
  createFileOnGithubRepository,
  createNewBranchOnGithubRepository,
  updatedGithubRepositoryDetails
} = require('./octokit');

const githubPullRequestOnOpen = async (action, payload) => {
  const commentBody = `Kindly specify the names of env you want to specify in the given format [dev,stage,qa]`;
  const pullRequestNumber = payload?.pull_request?.number || payload?.issue?.number;
  // @internal comment on a specific Pull Request
  await commentOnGithubPullRequest(payload, pullRequestNumber, commentBody);
};

const githubFetchComments = async (payload) => {
  await fetchComments(payload);
};

const githubPullRequestOnCloseAndMerge = async (payload) => {
  // @internal fetch comments from the specific Pull Request
  const deploymentEnvs = await fetchComments(payload);
  if (!deploymentEnvs?.size) return;
  const envs = Array.from(deploymentEnvs);
  const pullRequestNumber = payload?.pull_request?.number || payload?.issue?.number;
  const repoFullName = payload.pull_request.head.repo.full_name;
  const repoName = payload.repository.name;
  // @internal add 1 to include the slash after the repository name
  const repoPathIndex = repoFullName.indexOf(repoName) + repoName.length + 1;
  const directoryPath = repoFullName.substring(repoPathIndex);
  let contextDir = '';
  if (directoryPath) {
    // @internal directory path is present, remove repository name and add trailing slash
    contextDir = '/' + directoryPath;
  } else {
    // @internal directory path is not present, set to root directory
    contextDir = '/';
  }
  try {
    const orchestratorPayload = createOrchestratorPayload(payload, contextDir, envs, '', '');
    const response = await orchestratorDeploymentRequest(orchestratorPayload);
    if (response) {
      // @internal comment on specific PR
      await commentOnGithubPullRequest(payload, pullRequestNumber, response.message);
      // @internal git operations [TBD use-cases]
      //await gitOperations(payload);
    } else {
      await commentOnGithubPullRequest(payload, pullRequestNumber, `Some issue occurred for the deployment. Please contact to SPAship team.`);
    }
  } catch (error) {
    log.error(error);
  }
};

const gitOperations = async (payload) => {
  const filePath = 'spaship.yaml';
  const commentBody = `## Deployed by SPAship Git Broker`;
  const newRef = `${deployment.SPECIFIER}-${uuidv4().substring(0, 5)}`;
  // @internal comment on a specific commit
  await commentOnGithubMergedCommit(payload, commentBody);
  // @internal create a new Branch.
  await createNewBranchOnGithubRepository(payload, newRef);
  // @internal create a new file in the repo
  await createFileOnGithubRepository(payload, commentBody, filePath, newRef);
  // @internal alter an existing file in the repo
  const currentContent = await updatedGithubRepositoryDetails(payload, filePath, newRef);
  await alterFileOnGithubRepository(payload, currentContent, newRef);
};

module.exports = {
  githubFetchComments,
  githubPullRequestOnOpen,
  githubPullRequestOnCloseAndMerge
};
