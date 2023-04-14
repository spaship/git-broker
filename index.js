const express = require('express');
const bodyParser = require('body-parser');
const { Octokit } = require('@octokit/rest');
const axios = require('axios');
const request = require('request');
// const MockAdapter = require('axios-mock-adapter');
const { Gitlab } = require('@gitbeaker/node');
const app = express();
// const mock = new MockAdapter(axios);
const fs = require('fs');
require('dotenv').config()
// Github API authentication
const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN
});

const api = new Gitlab({
  token: process.env.GITLAB_ACCESS_TOKEN,
  url: 'https://gitlab.com/api/v4'
});


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
// 1.comment on a specific PR
const url = 'https://smee.io/aWMY6G3acItkWaAq';
const data = {
  title: payload.pull_request.title,
  body: payload.pull_request.body
};
const headers = {
  'Content-Type': 'application/json',
};


// Mock the HTTP POST request
// mock.onPost('https://smee.io/aWMY6G3acItkWaAq').reply(200, {
//   message: 'Mock response from Smee.io',
// });
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
  

  if (eventType === 'Merge Request Hook' ) {
    const projectId = eventData.project.id;
    const mergeRequestId = eventData.object_attributes.iid;  
    const commitSha = eventData.object_attributes.last_commit.id; // replace with the SHA of the commit you want to comment on
    const commentBody = 'This is a test comment'; // replace with the body of your comment
// 1.comment on a specific MP
try {
  const response = await axios.post(`https://gitlab.cee.redhat.com/api/v4/projects/${projectId}/merge_requests/${mergeRequestId}/notes`, { 'body': `test by Palak - ${Date.now()}` }, {
    headers: {
      'PRIVATE-TOKEN': process.env.GITLAB_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
  });
  console.log(response.data)
  // Send the response to the server
  res.send(response.data);
} catch (error) {
  // Handle the error response
  console.log(error.response);
  res.status(error.response.status).send(error.response.data);
}




// 2.comment on a specific commit
// try {
//   const response = await axios.post(`https://gitlab.cee.redhat.com/api/v4/projects/${projectId}/repository/commits/${commitSha}/comments`, {
//     note: commentBody
//   }, {
//     headers: {
//       'PRIVATE-TOKEN': process.env.GITLAB_ACCESS_TOKEN,
//       'Content-Type': 'application/json'
//     }
//   });
//  console.log(response.data)
//   // Send the response data to the server
//   res.send(response.data);
// } catch (error) {
//   // Handle the error response
//   console.log(error)
// }

    
//3. Write/Add a new file to the repo 
// try {
//   const filePath = 'path/to/new/file2.txt';
//   const branchName = 'main'; // The branch name where the file will be created
//   // Create the file content
//   const fileContent = 'This is the content of the new file.';
//   // Encode the content as base64
//   const contentBase64 = Buffer.from(fileContent).toString('base64');
//   // Make the API call to create the file
//   const response = await axios.post(`https://gitlab.cee.redhat.com/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}`, {
//     branch: branchName,
//     content: contentBase64,
//     commit_message: 'Create new file'
//   }, {
//     headers: {
//       'PRIVATE-TOKEN': process.env.GITLAB_ACCESS_TOKEN, // Replace with your GitLab access token
//       'Content-Type': 'application/json'
//     }
//   });
//   console.log(response.data)
//   // Send the response to the server
//   res.send(response.data);
// } catch (error) {
//   // Handle the error response
//   res.status(error.response.status).send(error.response.data);
// }

// // 4.Alter an existing file in the repo 

// try {
//   // Update the file contents
//    const newContent = "This is the Updated Content";
//   const filePathToAlter= 'path/to/new/file2.txt'
//   // Make the PUT request to update the file
//   const putResponse = await axios.put(`https://gitlab.cee.redhat.com/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePathToAlter)}`, {
//     branch: 'main',
//     content: newContent.toString('base64'),
//     commit_message: 'Update file',
//   }, {
//     headers: {
//       'PRIVATE-TOKEN': process.env.GITLAB_ACCESS_TOKEN,
//       'Content-Type': 'application/json',
//     },
//   });
//   console.log(putResponse.data)
//   // Send the response to the server
//   res.send(putResponse.data);
// } catch (error) {
//   // Handle the error response
//   console.log(error.response)
//   res.status(error.response.status).send(error.response.data);
// }

// 5 .Create a new Branch.
// try {
//   const response = await axios.post(`https://gitlab.cee.redhat.com/api/v4/projects/${projectId}/repository/branches`, {
//     branch: 'demoBranch',
//     ref: 'main' // The branch to base the new branch off of
//   }, {
//     headers: {
//       'PRIVATE-TOKEN': process.env.GITLAB_ACCESS_TOKEN,
//       'Content-Type': 'application/json'
//     }
//   });

//   console.log(response.data)
//   //   // Send the response to the server
//     res.send(response.data);
// } catch (error) {
//   // Handle the error response
//     console.log(error.response)
//   res.status(error.response.status).send(error.response.data);
// }

  }

});

// Start server
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});

