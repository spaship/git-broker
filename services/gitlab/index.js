const { log } = require('@spaship/common/lib/logging/pino');
const { v4: uuidv4 } = require('uuid');
const { deployment } = require('../../config');
const {
  commentOnGitlabMergeRequest,
  fetchCommentsFromGitlab,
  commentOnGitlabMergedCommit,
  createNewBranchOnGitlabRepository,
  createFileOnGitlabRepository,
  alterFileOnGitlabRepository
} = require('./api');

const gitlabMergeRequest = async (payload) => {
  const projectId = payload.project.id;
  const mergeRequestId = payload.object_attributes.iid;
  const commentBody = `Kindly specify the names of env you want to specify in the given format [dev,stage,qa]`;
  await commentOnGitlabMergeRequest(projectId, mergeRequestId, commentBody);
};

const gitlabMergeRequestOnCloseAndMerge = async (payload) => {
  const mergeRequestId = payload.object_attributes.iid;
  const projectId = payload.project.id;
  const deploymentEnvs = await fetchCommentsFromGitlab(projectId, mergeRequestId);
  if (!deploymentEnvs.size) return;
  const envs = Array.from(deploymentEnvs);
  const contextDir = payload.object_attributes.source.change_path || '/';
  try {
    const orchestratorPayload = createOrchestratorPayload(payload, contextDir, envs);
    const response = await orchestratorRequest(orchestratorPayload);
    if (response) {
      // @internal comment on specific Merge Request
      await commentOnGitlabMergeRequest(payload, projectId, mergeRequestId, response.message);
      // @internal git operations [TBD use-cases]
      // await gitlabOperations(payload);
    } else {
      await commentOnGithubPullRequest(payload, pullRequestNumber, `Some issue occurred for the deployment. Please contact to SPAship team.`);
    }
  } catch (error) {
    log.error('Error in createFileOnGitlabRepository');
    log.error(error);
  }
};

const gitlabOperations = async (payload) => {
  const filePath = 'spaship.yaml';
  const commentBody = `## Deployed by SPAship Puzzle`;
  const projectId = payload.project.id;
  const newRef = `${deployment.SPECIFIER}-${uuidv4().substring(0, 5)}`;
  const targetBranch = payload.object_attributes.target_branch;
  const commitSha = payload.object_attributes.last_commit.id;
  // @internal comment on a specific commit
  await commentOnGitlabMergedCommit(payload, projectId, commitSha, commentBody);
  // @internal create a new branch
  await createNewBranchOnGitlabRepository(payload, projectId, newRef, targetBranch);
  // @internal create a new file in the repository
  await createFileOnGitlabRepository(payload, projectId, commentBody, filePath, newRef);
  // @internal alter an existing file in the repository
  await alterFileOnGitlabRepository(payload, projectId, commentBody, filePath, newRef);
};

module.exports = {
  gitlabMergeRequest,
  gitlabMergeRequestOnCloseAndMerge
};
