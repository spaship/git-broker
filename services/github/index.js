const { log } = require('@spaship/common/lib/logging/pino');
const { orchestratorRequest, createOrchestratorPayload } = require('../common');
const {
  commentOnPullRequest,
  fetchComments,
  alterFileOnGithubRepository,
  createFileOnGithubRepository,
  createNewBranchOnGithubRepository
} = require('./octokit');

const githubPullRequestOnOpen = async (action, payload) => {
  const commentBody = `Kindly specify the names of env u want to specify in the given format [dev,stage,qa]`;
  const pullRequestNumber = payload?.pull_request?.number || payload?.issue?.number;
  // @internal comment on a specific PR
  await commentOnPullRequest(payload, pullRequestNumber, commentBody);
};

const githubFetchComments = async (payload) => {
  await fetchComments(payload);
};

const githubPullRequestOnCloseAndMerge = async (action, payload) => {
  // @internal comment on a specific PR
  const envs = Array.from(await fetchComments(payload));
  const pullRequestNumber = payload?.pull_request?.number || payload?.issue?.number;
  let repoFullName = payload.pull_request.head.repo.full_name;
  let repoName = payload.repository.name;
  // @internal add 1 to include the slash after the repository name
  let repoPathIndex = repoFullName.indexOf(repoName) + repoName.length + 1;
  let directoryPath = repoFullName.substring(repoPathIndex);
  let contextDir = '';
  if (directoryPath) {
    // @internal directory path is present, remove repository name and add trailing slash
    contextDir = '/' + directoryPath;
  } else {
    // @internal directory path is not present, set to root directory
    contextDir = '/';
  }
  try {
    const orchestratorPayload = createOrchestratorPayload(payload, contextDir, envs);
    await orchestratorRequest(orchestratorPayload);
    const commentBody = `The third-party API responded with: ${JSON.stringify(response.data)}`;
    // @internal comment on specific PR
    await commentOnPullRequest(payload, pullRequestNumber, commentBody);
    // @internal comment on a specific commit
    await commentOnCommit(payload, commentBody);
    // @internal write/Add a new file to the repo
    await createFileOnGithubRepository(payload, commentBody);
    // @internal alter an existing file in the repo
    const currentContent = await octokit.repos.getContent({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      path: 'path/to/file5.txt'
    });
    await alterFileOnGithubRepository(payload, currentContent);
    // @internal create a new Branch.
    await createNewBranchOnGithubRepository(payload, newContent, currentContent);
  } catch (error) {
    log.error(error);
  }
};

module.exports = {
  githubFetchComments,
  githubPullRequestOnOpen,
  githubPullRequestOnCloseAndMerge
};
