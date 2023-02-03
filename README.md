# cloud-server

http://cloudserver1-env.eba-aaqmt3pb.us-east-1.elasticbeanstalk.com/

Was able to figure out my issue and successfully deployed on AWS EB

http://cloudserver2-env.eba-jpmy2iqp.us-east-1.elasticbeanstalk.com/

This was deployed through the AWS cloud shell console

https://github.com/Apokoala/cloud-server/pull/2

I have automated deployment to this application by connecting my github repository to aws, I created a cloudcommit repo. then set up a lambda function to trigger on changes to the github repo

Amazon CLI:
```
aws codecommit create-repository --repository-name cloud
aws codecommit create-trigger --repository-name cloud --trigger-name CloudTrigger --destination arn:aws:lambda:us-east-1:038834531647:function:autoDeploy --events all
```

The lambda function connects to my cloudcommit:

```
const AWS = require("aws-sdk");

exports.handler = async function(event, context) {
  // Connect to CodeCommit repository
  const codecommit = new AWS.CodeCommit();
  const repo_name = "cloud"";
  const response = await codecommit.getBranch({
    repositoryName: repo_name,
    branchName: "master"
  }).promise();
  const commit_id = response.branch.commitId;
  ```

  It then downloads the latest version to a s3 bucket where it is zipped:
  
```
   // Download the latest version of the application
  const s3 = new AWS.S3();
  await s3.getObject({
    Bucket: "elasticbeanstalk-us-east-1-038834531647",
    Key: `${commit_id}.zip`
  }).promise()
    .then(data => {
      const fs = require("fs");
      fs.writeFileSync("/tmp/app.zip", data.Body);
    });
```

  Then install the app:

```
    // Install the application on the AWS instance
  const ssh = new AWS.SSM();
  await ssh.sendCommand({
    InstanceIds: "i-0ca77e87c1c3624ce",
    DocumentName: "AWS-RunShellScript",
    Parameters: {
      commands: [
        "unzip /tmp/app.zip -d /var/www",
        "chown -R www-data:www-data /var/www/app",
        "systemctl restart nginx"
      ]
    }
  }).promise();
  
  return {
    statusCode: 200,
    body: "Application updated successfully"
  };
};
```

We now have to create the connection using the aws cloud cli:
```
aws codecommit create-connectin --connection-name gitcloud --repository-name cloud --provider-type "GitHub" --auth-type "PersonalAccessToken" --token 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
```

note this token expires in 7 days.

test your connection with the following command:
```
aws codecommit get-connection --connection-name gitcloud

```
now when you commit in github to main it will redeploy your site
