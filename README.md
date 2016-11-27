# AWS Microservice package
This is a Node based lambda microservice package created by AWS-Architect.

## Recent Changes
Visit the [changelog](CHANGELOG.md).

## Prerequisites

* Install NodeJS (4.3 this is what lambda uses) & npm
  ```bash
  curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
* Your user will need access to the following resources (or the continuously deployment user):
	* Development time resources (identical for deployment CI), [example security policy](../deployment-policy.json)
	* Service runtime resources (for testing only, not required, execute lambda, api gateway access, etc...)

## Development
Development is templated using the make.js file. All the needed actions are present there. For ease, the AWS Architect to managed as a npm package. So all functionality is available directly from native nodejs, no having to write shell scripts just do some simple development.

* Website is created from the content directory.
* Lambda functions are created from the `src/index.js` source.
* `npm install`: Install necessary dependencies.
* `npm run build` or `node make.js build`: Builds and run unit tests.
* `sudo npm start`: Runs the microservice locally, it inhabits the api and lambda functions using nodejs express.
* `npm run deploy`: Deploys the package to AWS.

### Building

  ```bash
    npm install
    npm run build
  ```

### Running server locally
AWS Architect uses [OpenAPI Factory](https://github.com/wparad/openapi-factory.js) to convert the `src/index.js` into a node server API used by `node-express`.  This can be loaded, and the server can be started by running

```bash
   npm install
   npm run start
```

### Deploying to AWS

	* Using the built in make.js file

```bash
	npm install
	npm run deploy
```
	* Configure awsArchitect

```javascript
	var packageMetadataFile = path.join(__dirname, 'package.json');
	var packageMetadata = require(packageMetadataFile);

	var apiOptions = {
		sourceDirectory: path.join(__dirname, 'src'),
		description: 'This is the description of the lambda function',
		regions: ['us-east-1'],
		//role: 'optional-role-override',
		runtime: 'nodejs4.3',
		memorySize: 128,
		publish: true,
		timeout: 3,
		securityGroupIds: [],
		subnetIds: []
	};
	var contentOptions = {
		bucket: 'WEBSITE_BUCKET_NAME',
		contentDirectory: path.join(__dirname, 'content')
	};
	var awsArchitect = new AwsArchitect(packageMetadata, apiOptions, contentOptions);
```

## Todo:
* Fix the home page
* Annoymous health results by allowing a user to generate a special link just for that login name on the other site. (so source usercode + nsource website + username is unique and will stop people stealing)
* PNG display
* logo.png dispaly
* login flow, fix location
* main page necessary
* user page display
* update eventamanger and apiProvider to contain this services lambda and log function.
* Update cognito email redirect to point to website page which will do the code login redirect authorize.  Right now it points to garbage.
	* Create the DNS
* Determine which action of aws-architect is taking so long to figure out (after s3 deployment-policy)
* Update where you log API requests
* How to encrypt data records (can I wait, I think so since I'm only signing off on what they have entered.)