const express = require('express');
const bodyParser = require('body-parser');
const { Octokit } = require('@octokit/rest');
const axios = require('axios');
const request = require('request');
const MockAdapter = require('axios-mock-adapter');
const { Gitlab } = require('@gitbeaker/node');
const app = express();
const mock = new MockAdapter(axios);
const fs = require('fs');
require('dotenv').config()
// Github API authentication
const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN
});


const gitlab_access_token = process.env.GITLAB_ACCESS_TOKEN
app.use(bodyParser.json());



// Webhook endpoint to receive events from Github
app.post('/webhook', async (req, res) => {
  const payload = req.body;
  // Handle the payload as needed
  const { action, issue } = req.body;
  if (action === 'closed' && payload.pull_request.merged) {
    // If an issue is opened, create a comment on it
    const comment = {
      body: 'Thanks for opening this issue!',
    };
// 1.comment on a specific Issue
const url = 'https://smee.io/aWMY6G3acItkWaAq';
const data = {
  title: payload.pull_request.title,
  body: payload.pull_request.body
};
const headers = {
  'Content-Type': 'application/json',
};


// Mock the HTTP POST request
mock.onPost('https://smee.io/aWMY6G3acItkWaAq').reply(200, {
  message: 'Mock response from Smee.io',
});
try {
  const response = await axios.post(url, data, { headers });
  console.log(response.data);
  const commentBody = `The third-party API responded with: ${JSON.stringify(response.data)}`; 

  //1.comment on specific PR
  await octokit.issues.createComment({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: payload.pull_request.number,
    body: commentBody,
  }).then(response=>{
    console.log("Comment on PR created Sucessfully");;
  })
  .catch(error=>{
    console.log("error in commenting on PR")
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


// // 4.Alter an existing file in the repo 
const currentContent = await octokit.repos.getContent({
  owner:payload.repository.owner.login,
  repo:payload.repository.name,
  path: 'path/to/file5.txt',
});

// update the content of the file
const newContent = "This is the new content of the file.";
const updateResult = await octokit.repos.createOrUpdateFileContents({
  owner:payload.repository.owner.login,
  repo:payload.repository.name,
  path: 'path/to/file5.txt',
  message: "Update file",
  content: Buffer.from(newContent).toString("base64"),
  sha: currentContent.data.sha,
});

console.log(`File updated. New commit: ${updateResult.data.commit.sha}`);


// 5 .Create a new Branch.

// Define the branch name
const branchName = "new-branchForDemoToday";

// Get the SHA of the master branch
const { data: masterBranch } = await octokit.request(`GET /repos/${payload.repository.owner.login}/${payload.repository.name}/git/ref/heads/master`);
const masterSha = masterBranch.object.sha;

// Create a new reference with the SHA of the master branch
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

// gitlab application will send data to the specified webhook
//this end point will be written in the reposiotry as a webhook which we are aiming to trigger the events
app.post('/webhookForGitlab', async (req, res) => {

    const eventType = req.header('X-Gitlab-Event');
  const eventData = req.body;

  if (eventType === 'Merge Request Hook' && eventData.object_attributes.state === 'merged') {
    const projectId = eventData.project.id;
    const mergeRequestId = eventData.object_attributes.id;
    const commitSha = eventData.after;

  const option1 = {
    url: `https://gitlab.com/api/v4/projects/${projectId}/merge_requests/${mergeRequestId}/notes`,
    headers: {
      'PRIVATE-TOKEN': gitlab_access_token // Replace with your GitLab private token
    },
    json: {
      body: 'This is a comment on the merge request' // Replace with your comment text
    },
    timeout: 60000 // Timeout in milliseconds (60 seconds)
  };
  const commentBody = 'This is a test comment on the commit'; // Replace with the body of the comment you want to create

const option2 = {
  method: 'POST',
  url: `https://gitlab.com/api/v4/projects/${projectId}/repository/commits/${commitSha}/comments`,
  headers: {
    'PRIVATE-TOKEN': gitlab_access_token // Replace with your GitLab private token
  },
  body: {
    note: commentBody
  },
  json: true
};

const filePath = 'path/to/new/file.txt'; // Replace with the path to the new file you want to create
const fileContent = 'This is the content of the new file'; // Replace with the content of the new file
const branch = 'main';
const option3 = {
  method: 'POST',
  url: `https://gitlab.com/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}`,
  headers: {
    'PRIVATE-TOKEN': gitlab_access_token
  },
  body: {
    branch: branch,
    content: fileContent,
    commit_message: 'Create new file' // Replace with your commit message
  },
  json: true
};
const filePathToAlter = 'path/to/new/file.txt'; // Replace with the path to the file you want to update
// Read the new content for the file from a local file
const newContent = "kfkmfm"
const option4 = {
  method: 'PUT',
  url: `https://gitlab.com/api/v4/projects/${projectId}/repository/files/${filePathToAlter}`,
  headers: {
    'PRIVATE-TOKEN': gitlab_access_token
  },
  body: {
    branch: 'main', // Replace with the name of the branch you want to update
    content: newContent.toString('base64'), // Encode the new content as base64
    commit_message: 'Update file' // Replace with your commit message
  },
  json: true
};

const branchName = 'new-branch'; // Replace with the name of the new branch you want to create
const ref = 'main'; // Replace with the name of the branch you want to create the new branch from
const option5 = {
  method: 'POST',
  url: `https://gitlab.com/api/v4/projects/${projectId}/repository/branches`,
  headers: {
    'PRIVATE-TOKEN': gitlab_access_token
  },
  body: {
    branch: branchName,
    ref: ref
  },
  json: true,

};


  // Send the API request to add the comment
  request.post(option1, (error, response, body) => {
    if (error) {
      console.error(error);
      res.status(500).send('Error adding comment');
    } else {
      console.log('Comment added successfully');
      res.status(200).send('Comment added');
    }
  });
  request.post(option2, (error, response, body) => {
    if (error) {
      console.error(error);
    } else {
      console.log('Comment added successfully on commit');
     
    }
  });
  request.post(option3, (error, response, body) => {
    if (error) {
      console.error(error);
    } else {
      console.log('successfully Write/Add a new file to the repo');
     
    }
  });
  request.post(option4, (error, response, body) => {
    if (error) {
      console.error(error);
    } else {
      console.log('successfully altered the file to the repo');
     
    }
  });
  request.post(option5, (error, response, body) => {
    if (error) {
      console.error(error);
    } else {
      console.log('successfully created a new branch');
     
    }
  });
  }

});

// Start server
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});

