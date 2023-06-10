const { log } = require('@spaship/common/lib/logging/pino');
const { Octokit } = require('@octokit/rest');
const { config, deployment } = require('../../config');

const octokit = new Octokit({ auth: config.githubAccessToken });

const commentOnGithubPullRequest = async (payload, pullRequestNumber, commentBody) => {
  await octokit.issues
    .createComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: pullRequestNumber,
      body: commentBody
    })
    .then(() => {
      log.info(getRepoDetails(payload));
      log.info(`Commented on Pull Request ${pullRequestNumber} Successfully`);
    })
    .catch((error) => {
      log.error('Error in commentOnGithubPullRequest');
      log.error(error);
    });
};

const fetchComments = async (payload) => {
  const deploymentEnvs = new Set();
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const pullRequestNumber = payload?.pull_request?.number || payload?.issue?.number;
  try {
    const response = await octokit.issues.listComments({ owner, repo, issue_number: pullRequestNumber, per_page: 1000 });
    const comments = response.data;
    comments.forEach((comment) => {
      const commentBody = comment.body.toLowerCase();
      if (commentBody.includes(deployment.SPECIFIER)) {
        const matches = commentBody.match(deployment.ENVS_REGEX);
        matches.forEach((env) => {
          deploymentEnvs.add(env);
        });
      }
    });
    if (deploymentEnvs.size) log.info(`To be Deployed in ${[...deploymentEnvs]}`);
    else log.info('No environment found for deployment');
    return deploymentEnvs;
  } catch (error) {
    log.error('Error in fetchComments');
    log.error(error);
  }
};

const commentOnGithubMergedCommit = async (payload) => {
  await octokit.rest.repos
    .createCommitComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      commit_sha: payload.pull_request.merge_commit_sha,
      body: 'Application deployed by SPAship'
    })
    .then(() => {
      log.info(getRepoDetails(payload));
      log.info(`Comment added successfully on merged commit : ${payload.pull_request.merge_commit_sha}`);
    })
    .catch((error) => {
      log.error('Error in commentOnCommit');
      log.error(error);
    });
};

const createFileOnGithubRepository = async (payload, commentBody, filePath, newRef) => {
  await octokit.rest.repos
    .createOrUpdateFileContents({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      path: filePath,
      message: 'feat(spaship) : spaship.yaml added',
      content: Buffer.from(commentBody).toString('base64'),
      branch: newRef
    })
    .then(() => {
      log.info(getRepoDetails(payload));
      log.info('File created successfully');
    })
    .catch((error) => {
      log.error('Error in createFileOnGithubRepository');
      log.error(error);
    });
};

const alterFileOnGithubRepository = async (payload, currentContent, newRef) => {
  const content = '### Deployment by SPAship Puzzle 1.0.0.';
  await octokit.repos
    .createOrUpdateFileContents({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      path: currentContent.data.path,
      message: 'chore(spaship) : spaship.yaml updated',
      content: Buffer.from(content).toString('base64'),
      sha: currentContent.data.sha,
      branch: newRef
    })
    .then((response) => {
      log.info(getRepoDetails(payload));
      log.info(`File updated. New commit sha: ${response.data.commit.sha}`);
    })
    .catch((error) => {
      log.error('Error in alterFileOnGithubRepository');
      log.error(error);
    });
};

const createNewBranchOnGithubRepository = async (payload, newRef) => {
  let gitResponse;
  try {
    gitResponse = await octokit.request(
      `GET /repos/${payload.repository.owner.login}/${payload.repository.name}/git/ref/heads/${payload.pull_request.base.ref}`
    );
  } catch (error) {
    log.error(error);
    return;
  }
  await octokit
    .request(`POST /repos/${payload.repository.owner.login}/${payload.repository.name}/git/refs`, {
      ref: `refs/heads/${newRef}`,
      sha: gitResponse.data.object.sha
    })
    .then(() => {
      log.info(getRepoDetails(payload));
      log.info(`Successfully created new branch : ${newRef}`);
    })
    .catch((error) => {
      log.error('Error in createNewBranchOnGithubRepository');
      log.error(error);
    });
};

const updatedGithubRepositoryDetails = async (payload, filePath, newRef) => {
  return await octokit.repos
    .getContent({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      path: filePath,
      ref: newRef
    })
    .catch((error) => {
      log.error(error);
    });
};

const getRepoDetails = (payload) => {
  return {
    repository: payload.repository.name,
    pullRequestNumber: payload?.pull_request?.number,
    headRef: payload.pull_request.head.ref,
    baseRef: payload.pull_request.base.ref,
    owner: payload.repository.owner.login
  };
};

module.exports = {
  commentOnGithubPullRequest,
  commentOnGithubMergedCommit,
  createFileOnGithubRepository,
  createNewBranchOnGithubRepository,
  alterFileOnGithubRepository,
  updatedGithubRepositoryDetails,
  fetchComments
};
