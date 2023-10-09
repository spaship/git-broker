const { commentOnGitlabCommit, commentOnGitlabMergeRequest } = require('./../gitlab/api');
const { status: deploymentStatus } = require('../../config');
const processResponse = async (payload) => {
  const { projectId, commitId, status: applicationStatus, mergeId, accessUrl } = payload;
  const messageHeader = '<b>🔔 Application Build & Deployment Status 🚀 </b> \n\n';
  let commentBody = "We're encountering some issue with the Deployment, Please connect with the SPAship Team.";
  try {
    if (applicationStatus) {
      if (applicationStatus === deploymentStatus.APPLICATION_DEPLOYED)
        commentBody = `${messageHeader} 🥳 Application is deployed Successfully. 🌐 You can access the Application from here : ${accessUrl?.toString()}`;
      else if (applicationStatus === deploymentStatus.APPLICATION_BUILD_FAILED)
        commentBody = `${messageHeader} ❌ Application build is failed, please check the logs from the SPAship manager for the stacktrace.`;
      else if (applicationStatus === deploymentStatus.APPLICATION_BUILD_TIMEOUT)
        commentBody = `${messageHeader} 🕘 ❌ There is the timeout while building the application, please check the logs from the SPAship manager for the stacktrace.`;
      else if (applicationStatus === deploymentStatus.APPLICATION_BUILD_TERMINATED)
        commentBody = `${messageHeader} 🚫 Application build has been terminated, please check the logs from the SPAship manager for the stacktrace.`;
      else if (applicationStatus === deploymentStatus.APPLICATION_DEPLOYMENT_FAILED)
        commentBody = `${messageHeader} ❌ Application deployment is failed, please check the SPAship manager for the more details.`;
      else if (applicationStatus === deploymentStatus.APPLICATION_DEPLOYMENT_TIMEOUT)
        commentBody = `${messageHeader} 🕘 ❌ There is the timeout while deploying the application, please check the SPAship manager for the more details.`;
      if (payload.mergeId) await commentOnGitlabMergeRequest(payload, projectId, mergeId, commentBody);
      else await commentOnGitlabCommit(payload, projectId, commitId, commentBody);
    }
    return { message: `Commented on the ${commitId} commit successfully.` };
  } catch (error) {
    throw new Error({ message: 'Error while commenting on Gitlab' });
  }
};

module.exports = {
  processResponse
};
