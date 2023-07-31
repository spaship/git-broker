const { log } = require('@spaship/common/lib/logging/pino');
const { config, gitlab, deployment } = require('../../config');
const axios = require('axios');

const getGitlabHeaders = () => {
  return { 'PRIVATE-TOKEN': config.gitlabAccessToken, 'Content-Type': 'application/json' };
};

const fetchCommentsFromGitlab = async (projectId, mergeRequestId) => {
  const deploymentEnvs = new Set();
  try {
    const response = await axios.get(`${gitlab.BASE_URL}/${projectId}/merge_requests/${mergeRequestId}/notes`, { headers: getGitlabHeaders() });
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
  } catch (error) {
    log.error(`Error in fetchCommentsFromGitlab`);
    log.error(error);
  }
  return deploymentEnvs;
};

const commentOnGitlabMergeRequest = async (payload, projectId, mergeRequestId, commentBody) => {
  log.info(gitlab.BASE_URL);
  try {
    await axios.post(
      `${gitlab.BASE_URL}/${projectId}/merge_requests/${mergeRequestId}/notes`,
      { body: commentBody },
      { headers: getGitlabHeaders() }
    );
    log.info(getRepoDetails(payload));
    log.info(`Commented on Pull Request ${mergeRequestId} Successfully`);
  } catch (error) {
    log.error('Error in commenting on Specific PR: ');
    log.error(error);
  }
};

const commentOnGitlabMergedCommit = async (payload, projectId, commitSha, commentBody) => {
  try {
    await axios.post(
      `${gitlab.BASE_URL}/${projectId}/repository/commits/${commitSha}/comments`,
      { note: commentBody },
      { headers: getGitlabHeaders() }
    );
    log.info(getRepoDetails(payload));
    log.info(`Success in commenting on Specific commit : ${commitSha}`);
  } catch (error) {
    log.error('Error in commentOnGitlabMergedCommit');
    log.error(error);
  }
};

const createNewBranchOnGitlabRepository = async (payload, projectId, newRef, targetBranch) => {
  try {
    await axios.post(
      `${gitlab.BASE_URL}/${projectId}/repository/branches`,
      {
        branch: newRef,
        ref: targetBranch
      },
      { headers: getGitlabHeaders() }
    );
    log.info(getRepoDetails(payload));
    log.info(`Successfully created new branch : ${newRef}`);
  } catch (error) {
    log.error('Error in createNewBranchOnGithubRepository');
    log.error(error);
  }
};

const createFileOnGitlabRepository = async (payload, projectId, commentBody, filePath, newRef) => {
  try {
    await axios.post(
      `${gitlab.BASE_URL}/${projectId}/repository/files/${encodeURIComponent(filePath)}`,
      {
        branch: newRef,
        content: commentBody,
        commit_message: 'feat(spaship) : spaship.yaml added'
      },
      { headers: getGitlabHeaders() }
    );
    log.info(getRepoDetails(payload));
    log.info('File created successfully on Gitlab');
  } catch (error) {
    log.error('Error in createFileOnGitlabRepository');
    log.error(error);
  }
};

const alterFileOnGitlabRepository = async (payload, projectId, commentBody, filePath, newRef) => {
  try {
    const response = await axios.put(
      `${gitlab.BASE_URL}/${projectId}/repository/files/${encodeURIComponent(filePath)}`,
      {
        branch: newRef,
        content: commentBody,
        commit_message: 'chore(spaship) : spaship.yaml updated'
      },
      { headers: getGitlabHeaders() }
    );
    log.info(getRepoDetails(payload));
    log.info('File updated successfully on Gitlab');
  } catch (error) {
    log.error('Error in alterFileOnGitlabRepository');
    log.error(error);
  }
};

const getRepoDetails = (payload) => {
  return {
    repository: payload.repository.name,
    pullRequestNumber: payload.object_attributes.iid,
    headRef: payload.object_attributes.target_branch,
    baseRef: payload.object_attributes.source_branch,
    owner: payload.user.name
  };
};

module.exports = {
  fetchCommentsFromGitlab,
  commentOnGitlabMergeRequest,
  commentOnGitlabMergedCommit,
  createNewBranchOnGitlabRepository,
  createFileOnGitlabRepository,
  alterFileOnGitlabRepository
};
