const express = require('express');
const bodyParser = require('body-parser');
const { Octokit } = require('@octokit/rest');
const axios = require('axios');
const { response } = require('express');


const app = express();
require('dotenv').config()
app.use(bodyParser.json());
const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN
});


const url = 'https://spaship.dev.redhat.com/api/v1/applications/git/deploy';
var entitiesForGitHub = new Set();
var entitiesForGitlab = new Set();
const entityRegex =  /\["(.*?)"]/g;


app.post('/webhook', async (req, res) => {
  const payload = req.body;
  const { action, pull_request } = req.body;
 if(action==='opened' && payload.pull_request.state ==="open"){
  const commentBody = `Kindly specify the names of env u want to specify in the given format [dev,stage,qa]`; 
  const owner = payload.repository.owner.login 
  const repo = payload.repository.name; 
  const pullRequestNumber = payload.pull_request.number;

    await octokit.issues.createComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.pull_request.number,
      body: commentBody,
    }).then(response=>{
      console.log("Comment on PR created Sucessfully",response.data);;
    })
    .catch(error=>{
      console.log("error in commenting on PR",error)
    })


async function fetchComments() {
  try {
    const response = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: pullRequestNumber,
    });
    const comments = response.data; 
  comments.forEach(comment => {
    const commentBody = comment.body.toLowerCase();
    const matches = commentBody.match(entityRegex); 
    if (matches) {
      matches.forEach(match => {
        const envName = match.replace(/\[|"|]/g, '');
    const envNamesArray = envName.split(',');
    envNamesArray.forEach(env => entitiesForGitHub.add(env.trim()));
      });
    }
  });
    const pullRequest = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pullRequestNumber,
    });

    if (pullRequest.data.state === "closed" || pullRequest.data.state ==="merged") {
      console.log("Pull request is closed.");
      return;
    }
    setTimeout(fetchComments, 5000); 
  } catch (error) {
    console.error(error);
  }
}

fetchComments();


 }
  if (action === 'closed' && payload.pull_request.merged) {
// 1.comment on a specific PR
const envs = Array.from(entitiesForGitHub);
const data = {
   "repoUrl" : payload.repository.html_url,
   "gitRef" : payload.pull_request.head.ref,
   "commitId" : payload.pull_request.head.sha,
   "mergeId" : payload.pull_request.number,
   "contextDir" : payload.pull_request.head.repo.full_name,
   "envs":envs
};
console.log(data)
const headers = {
  'Content-Type': 'application/json',
};

try {
 await axios.post(url, data, { headers })
 .then(response =>{
  console.log("Data Sent Successfully to Orchetrator",response.data);
 })
.catch(error =>{
  console.log("Error in sending data to Orchetrator",error)
})
  const commentBody = `The third-party API responded with: ${JSON.stringify(response.data)}`; 
  //1.comment on specific PR
  await octokit.issues.createComment({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: payload.pull_request.number,
    body: commentBody,
  }).then(response=>{
    console.log("Comment on PR created Sucessfully",response.data);;
  })
  .catch(error=>{
    console.log("error in commenting on PR",error)
  })


  // 2. Comment on a specific commit
await octokit.rest.repos.createCommitComment({
  owner:payload.repository.owner.login,
  repo: payload.repository.name,
  commit_sha: payload.pull_request. merge_commit_sha,
  body: commentBody,
})
.then(response => {
  console.log(commitSha);
  console.log('Comment created successfully:', JSON.stringify(response.data));
})
.catch(error => {
  console.error('Error creating comment:', error);
});


//3. Write/Add a new file to the repo 
await octokit.rest.repos.createOrUpdateFileContents({
  owner: payload.repository.owner.login,
  repo: payload.repository.name,
  path: 'path/to/file5.txt',
  message: 'Add comment',
  content: Buffer.from(commentBody).toString('base64'),
  branch: payload.repository.default_branch,
})
.then(response => {
  console.log('File created successfully:', response.data.content.html_url);
})
.catch(error => {
  console.error('Error creating file:', error);
});


// 4.Alter an existing file in the repo 
const currentContent = await octokit.repos.getContent({
  owner:payload.repository.owner.login,
  repo:payload.repository.name,
  path: 'path/to/file5.txt',
});
const newContent = "This is the new content of the file.";
await octokit.repos.createOrUpdateFileContents({
  owner:payload.repository.owner.login,
  repo:payload.repository.name,
  path: 'path/to/file5.txt',
  message: "Update file",
  content: Buffer.from(newContent).toString("base64"),
  sha: currentContent.data.sha,
}).then(response =>{
  console.log(`File updated. New commit: ${response.data.commit.sha}`);
})
.catch(error => {
  console.error('Error in Updating the File:', error);
});



// 5 .Create a new Branch.
const branchName = "new-branchForDemoToday";
const { data: masterBranch } = await octokit.request(`GET /repos/${payload.repository.owner.login}/${payload.repository.name}/git/ref/heads/master`);
const masterSha = masterBranch.object.sha;
await octokit.request(`POST /repos/${payload.repository.owner.login}/${payload.repository.name}/git/refs`, {
  ref: `refs/heads/${branchName}`,
  sha: masterSha
})
.then((response)=>{
  console.log("Successfully created new branch",response.data)
})
.catch((error)=>{
  console.log("Something went Wrong",error)
})
} catch (error) {
  console.error('Error sending request to third-party API:', error.message);
}
  }


  res.sendStatus(200);
});











app.post('/webhookForGitlab', async (req, res) => {
  const eventType = req.header('X-Gitlab-Event');
  const eventData = req.body;

  if (eventType === 'Merge Request Hook') {
    const projectId = eventData.project.id;
    const mergeRequestId = eventData.object_attributes.iid;  
    const commitSha = eventData.object_attributes.last_commit.id; 
    const commentBody = 'This is a test comment'; 
const fetchComments = async (projectId, pullRequestId) => {
  try {
    const response = await axios.get(`https://gitlab.cee.redhat.com/api/v4/projects/${projectId}/merge_requests/${pullRequestId}/notes`, {
    headers: {
      'PRIVATE-TOKEN': process.env.GITLAB_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
  });
    return response;
  } catch (error) {
    console.error(`Error fetching comments: ${error.message}`);
    return [];
  }
};


const fetchCommentsWithIntervals = async (projectId, pullRequestId) => {
  
  let isMerged = false;
  let isClosed = false;
  const response= await fetchComments(projectId, pullRequestId);
  const comments=response.data
    if(comments){
    comments.forEach(comment => {
      const commentBody = comment.body.toLowerCase();
      const matches = commentBody.match(entityRegex); 
      if (matches) {
        matches.forEach(match => {
          const envName = match.replace(/\[|"|]/g, '');
      const envNamesArray = envName.split(',');
      envNamesArray.forEach(env => entitiesForGitlab.add(env.trim()));
        });
      }
    });
    }

  const interval = setInterval(async () => {
  const newComments = await fetchComments(projectId, pullRequestId);
  const newCommentsData=newComments.data
  if(newCommentsData){
  newCommentsData.forEach(comment => {
      const commentBody = comment.body.toLowerCase();
      const matches = commentBody.match(entityRegex); 
      if (matches) {
        matches.forEach(match => {
          const envName = match.replace(/\[|"|]/g, '');
      const envNamesArray = envName.split(',');
      envNamesArray.forEach(env => entitiesForGitlab.add(env.trim()));
        });
      }
    });
  }
    if (eventData.object_attributes && eventData.object_attributes.state === 'merged')  {
      isMerged = true;
      console.log('Merge request is merged.');
    }

    if (eventData.object_attributes && eventData.object_attributes.state === 'closed') {
      isClosed = true;
      console.log('Merge request is closed.');
    }

    if (isMerged || isClosed) {
      clearInterval(interval);
      console.log('Comments fetching stopped.');
      console.log('All comments:', entitiesForGitlab);
    }
  }, 5000);
};

fetchCommentsWithIntervals(projectId, mergeRequestId);


if (eventData.object_attributes.state === 'merged'){
  const envs = Array.from(entitiesForGitlab);
  const data = {
     "repoUrl" :  eventData.project.web_url,
     "gitRef" : eventData.object_attributes.source_branch,
     "commitId" : eventData.object_attributes.last_commit.id,
     "mergeId" : eventData.object_attributes.iid,
     "contextDir" : eventData.object_attributes.source.change_path || '' ,
     "envs":envs
  };
  console.log("Data to send to Orchestrator: ",data)
  const headers = {
    'Content-Type': 'application/json',
  };

  await axios.post(url, data, { headers })
  .then(response =>{
   console.log("Data Sent Successfully to Orchetrator",response.data);
  })
 .catch(error =>{
   console.log("Error in sending data to Orchetrator",error)
 })

try {
  const response = await axios.post(`https://gitlab.cee.redhat.com/api/v4/projects/${projectId}/merge_requests/${mergeRequestId}/notes`, { 'body': `test by Palak - ${Date.now()}` }, {
    headers: {
      'PRIVATE-TOKEN': process.env.GITLAB_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
  });
  console.log("Success in commenting on Specific PR: ",response.data)
} catch (error) {
  console.log("Error in commenting on Specific PR: ",error);
}


// 2.comment on a specific commit
try {
  const response = await axios.post(`https://gitlab.cee.redhat.com/api/v4/projects/${projectId}/repository/commits/${commitSha}/comments`, {
    note: commentBody
  }, {
    headers: {
      'PRIVATE-TOKEN': process.env.GITLAB_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    }
  });
  console.log("Success in commenting on Specific commit: ",response.data)
} catch (error) {
  console.log("Error in commenting on Specific commit: ",error);
}

    
// 3. Write/Add a new file to the repo 
try {
  const filePath = 'path/to/new/file2.txt';
  const branchName = 'master';
  const fileContent = 'This is the content of the new file.';
  const contentBase64 = Buffer.from(fileContent).toString('base64');
  const response = await axios.post(`https://gitlab.cee.redhat.com/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}`, {
    branch: branchName,
    content: contentBase64,
    commit_message: 'Create new file'
  }, {
    headers: {
      'PRIVATE-TOKEN': process.env.GITLAB_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    }
  });
  console.log("Success in writing new file to the repository: ",response.data)
} catch (error) {
  console.log("Error in writing new file to the repository: ",error);
}


// 4.Alter an existing file in the repo 
try {
   const newContent = "This is the Updated Content";
  const filePathToAlter= 'path/to/new/file2.txt'
  const putResponse = await axios.put(`https://gitlab.cee.redhat.com/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePathToAlter)}`, {
    branch: 'main',
    content: newContent.toString('base64'),
    commit_message: 'Update file',
  }, {
    headers: {
      'PRIVATE-TOKEN': process.env.GITLAB_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  });
  console.log("Success in altering  file to the repository: ",putResponse.data)
} catch (error) {
  console.log("Error in altering  file to the repository: ",error);
}

// 5 .Create a new Branch.
try {
  const response = await axios.post(`https://gitlab.cee.redhat.com/api/v4/projects/${projectId}/repository/branches`, {
    branch: 'demoBranch',
    ref: 'main' // The branch to base the new branch off of
  }, {
    headers: {
      'PRIVATE-TOKEN': process.env.GITLAB_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    }
  });
  console.log("Success in creating  new Branch to the repository: ",response.data)
} catch (error) {
  console.log("Error in creating  new Branch to the repository: ",error);
}
  }
  }
  res.sendStatus(200);
});


// Start server
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});

