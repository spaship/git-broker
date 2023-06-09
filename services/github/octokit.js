const { log } = require('@spaship/common/lib/logging/pino');
const { Octokit } = require('@octokit/rest');
const { config, deployment } = require('../../config');

const octokit = new Octokit({ auth: config.githubAccessToken });

const commentOnPullRequest = async (payload, pullRequestNumber, commentBody) => {
  await octokit.issues
    .createComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: pullRequestNumber,
      body: commentBody
    })
    .then((response) => {
      log.info(`Commented on Pull Request ${pullRequestNumber} Successfully`);
      log.info(response.data);
    })
    .catch((error) => {
      log.error('Error in commentOnPullRequest');
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
      log.info(commentBody);
      if (commentBody.includes(deployment.SPECIFIER)) {
        const matches = commentBody.match(deployment.ENVS_REGEX);
        matches.forEach((env) => {
          deploymentEnvs.add(env);
        });
      }
    });
    log.info(`To be Deployed in ${[...deploymentEnvs]}`);
    return deploymentEnvs;
  } catch (error) {
    log.error('Error in fetchComments');
    log.error(error);
  }
};

const commentOnCommit = async (payload, commentBody) => {
  await octokit.rest.repos
    .createCommitComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      commit_sha: payload.pull_request.merge_commit_sha,
      body: commentBody
    })
    .then((response) => {
      log.info(`Comment created successfully : ${commitSha}`);
      log.info(response.data);
    })
    .catch((error) => {
      log.error('Error in commentOnCommit');
      log.error(error);
    });
};

const createFileOnGithubRepository = async (payload, commentBody) => {
  await octokit.rest.repos
    .createOrUpdateFileContents({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      path: 'path/to/file5.txt',
      message: 'Add comment',
      content: Buffer.from(commentBody).toString('base64'),
      branch: payload.repository.default_branch
    })
    .then((response) => {
      log.info('File created successfully');
      log.info(response.data);
    })
    .catch((error) => {
      log.error('Error in createFileOnGithubRepository');
      log.error(error);
    });
};

const alterFileOnGithubRepository = async (payload, currentContent) => {
  const newContent = 'This is the new content of the file.';
  await octokit.repos
    .createOrUpdateFileContents({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      path: 'path/to/file5.txt',
      message: 'Update file',
      content: Buffer.from(newContent).toString('base64'),
      sha: currentContent.data.sha
    })
    .then((response) => {
      log.info(`File updated. New commit: ${response.data.commit.sha}`);
      log.info(response.data);
    })
    .catch((error) => {
      log.error('Error in alterFileOnGithubRepository');
      log.error(error);
    });
};

const createNewBranchOnGithubRepository = async (payload) => {
  const branchName = 'new-branchForDemoToday';
  const { data: masterBranch } = await octokit.request(
    `GET /repos/${payload.repository.owner.login}/${payload.repository.name}/git/ref/heads/master`
  );
  const masterSha = masterBranch.object.sha;
  await octokit
    .request(`POST /repos/${payload.repository.owner.login}/${payload.repository.name}/git/refs`, {
      ref: `refs/heads/${branchName}`,
      sha: masterSha
    })
    .then((response) => {
      log.info(`Successfully created new branch : ${branchName}`);
      log.info(response.data);
    })
    .catch((error) => {
      log.info('Error in createNewBranchOnGithubRepository');
      log.error(error);
    });
};

module.exports = {
  commentOnPullRequest,
  commentOnCommit,
  createFileOnGithubRepository,
  createNewBranchOnGithubRepository,
  alterFileOnGithubRepository,
  fetchComments
};
