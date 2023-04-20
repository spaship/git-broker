const express = require('express');
const bodyParser = require('body-parser');
const { Octokit } = require('@octokit/rest');
const axios = require('axios');
// const MockAdapter = require('axios-mock-adapter');
const { Gitlab } = require('@gitbeaker/node');
const app = express();
// const mock = new MockAdapter(axios);
const fs = require('fs');
const { response } = require('express');
require('dotenv').config()
// Github API authentication
const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN
});



app.use(bodyParser.json());


var entities = new Set(); // Use a Set to store distinct entities
var entitiesForGitlab = new Set();
const entityRegex =  /\["(.*?)"]/g;
// Webhook endpoint to receive events from Github
app.post('/webhook', async (req, res) => {
  const payload = req.body;
  // Use a regular expression to match entities within square brackets
const entityRegex =  /\["(.*?)"]/g;

  // Handle the payload as needed
  const { action, pull_request } = req.body;
 if(action==='opened' && payload.pull_request.state ==="open"){
  const commentBody = `Kindly specify the names of env u want to specify in the given format [dev,stage,qa]`; 
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

    const owner = payload.repository.owner.login // Replace with the owner of the repository
    const repo = payload.repository.name; // Replace with the name of the repository
    const pullRequestNumber = payload.pull_request.number; // Replace with the number of the pull request

async function fetchComments() {
  try {
    // Fetch comments for the pull request
    const response = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: pullRequestNumber,
    });
    const comments = response.data; // Array of comments
  // Loop through each comment and apply regex pattern
  comments.forEach(comment => {
    const commentBody = comment.body.toLowerCase();
    const matches = commentBody.match(entityRegex); // Find matches using regex
    if (matches) {
      matches.forEach(match => {
            // Remove the square brackets and double quotes from the match
        const envName = match.replace(/\[|"|]/g, '');
     // Split the match by commas to get individual environment names
    const envNamesArray = envName.split(',');
    // Add each environment name to the Set
    envNamesArray.forEach(env => entities.add(env.trim()));
      });
    }
  });
    // Check if the pull request is closed
    const pullRequest = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pullRequestNumber,
    });

    if (pullRequest.data.state === "closed" || pullRequest.data.state ==="merged") {
      console.log("Pull request is closed.");
      return;
    }

    // Fetch comments again after a delay
    setTimeout(fetchComments, 5000); // Fetch comments every 5 seconds (adjust the delay as needed)
  } catch (error) {
    console.error(error);
  }
}

// Start fetching comments
fetchComments();


 }
  if (action === 'closed' && payload.pull_request.merged) {
    // If an issue is opened, create a comment on it
    const comment = {
      body: 'Thanks for opening this issue!',
    };
// 1.comment on a specific PR
const url = 'https://smee.io/aWMY6G3acItkWaAq';
const envs = Array.from(entities);

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
  console.log(eventData)

  if (eventType === 'Merge Request Hook') {
    const projectId = eventData.project.id;
    const mergeRequestId = eventData.object_attributes.iid;  
    const commitSha = eventData.object_attributes.last_commit.id; // replace with the SHA of the commit you want to comment on
    const commentBody = 'This is a test comment'; // replace with the body of your comment
   
// Function to fetch comments for a pull request using GitLab API
const fetchComments = async (projectId, pullRequestId) => {
  try {
    const response = await axios.get(`https://gitlab.cee.redhat.com/api/v4/projects/${projectId}/merge_requests/${pullRequestId}/notes`, {
    headers: {
      'PRIVATE-TOKEN': process.env.GITLAB_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
  });
  // Send the response to the server

    return response;
  } catch (error) {
    console.error(`Error fetching comments: ${error.message}`);
    return [];
  }
};


// Function to continuously fetch comments with intervals
const fetchCommentsWithIntervals = async (projectId, pullRequestId) => {
  
  let isMerged = false;
  let isClosed = false;

 

  // Fetch comments initially
  const response= await fetchComments(projectId, pullRequestId);
  const comments=response.data
    // Loop through each comment and apply regex pattern
    if(comments){
    comments.forEach(comment => {
      const commentBody = comment.body.toLowerCase();
      const matches = commentBody.match(entityRegex); // Find matches using regex
      if (matches) {
        matches.forEach(match => {
              // Remove the square brackets and double quotes from the match
          const envName = match.replace(/\[|"|]/g, '');
       // Split the match by commas to get individual environment names
      const envNamesArray = envName.split(',');
      // Add each environment name to the Set
      envNamesArray.forEach(env => entitiesForGitlab.add(env.trim()));
        });
      }
    });
    }

  // Continuously fetch comments with intervals of 5 seconds
  const interval = setInterval(async () => {
    // Fetch comments
    const newComments = await fetchComments(projectId, pullRequestId);
  const newCommentsData=newComments.data
  if(newCommentsData){
  newCommentsData.forEach(comment => {
      const commentBody = comment.body.toLowerCase();
      const matches = commentBody.match(entityRegex); // Find matches using regex
      if (matches) {
        matches.forEach(match => {
              // Remove the square brackets and double quotes from the match
          const envName = match.replace(/\[|"|]/g, '');
       // Split the match by commas to get individual environment names
      const envNamesArray = envName.split(',');
      // Add each environment name to the Set
      envNamesArray.forEach(env => entitiesForGitlab.add(env.trim()));
        });
      }
    });
  }
    // Check if the MR is merged
    if (eventData.object_attributes && eventData.object_attributes.state === 'merged')  {
      isMerged = true;
      console.log('Merge request is merged.');
    }

    // Check if the MR is closed
    if (eventData.object_attributes && eventData.object_attributes.state === 'closed') {
      isClosed = true;
      console.log('Merge request is closed.');
    }

    // If MR is merged or closed, stop fetching comments
    if (isMerged || isClosed) {
      clearInterval(interval);
      console.log('Comments fetching stopped.');
      console.log('All comments:', entitiesForGitlab);
    }
  }, 5000); // Interval of 5 seconds
};

// Call the function with the project ID and pull request ID
fetchCommentsWithIntervals(projectId, mergeRequestId); // Replace with your actual project ID and pull request ID
// 1.comment on a specific MP
if (eventData.object_attributes.state === 'merged'){


// try {
//   const response = await axios.post(`https://gitlab.cee.redhat.com/api/v4/projects/${projectId}/merge_requests/${mergeRequestId}/notes`, { 'body': `test by Palak - ${Date.now()}` }, {
//     headers: {
//       'PRIVATE-TOKEN': process.env.GITLAB_ACCESS_TOKEN,
//       'Content-Type': 'application/json'
//     },
//   });
 
//   // Send the response to the server
//   res.send(response);
// } catch (error) {
//   // Handle the error response
//   console.log(error);
//   res.send(error);
// }


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
  }

});

// Start server
app.listen(3001, () => {
  console.log('Server listening on port 3001');
});

