## Serify Website


## Prerequisites

* Install NodeJS (4.3 this is what lambda uses) & npm
* Your user will need access to the following resources (or the continuously deployment user):
	* Development time resources (identical for deployment CI), [example security policy](../deployment-policy.json)
	* Service runtime resources (for testing only, not required, execute lambda, api gateway access, etc...)

## Repository
This is an angular 1 website which is statically hosted in an AWS S3 bucket.  It targets backend lambda functions and dynamoDB.
## Development
Development is templated using the make.js file. All the needed actions are present there. For ease, the AWS Architect to managed as a npm package. So all functionality is available directly from native nodejs, no having to write shell scripts just do some simple development.

* Website is created from the content directory.
* Lambda functions are created from the `src/index.js` source.
* `npm install`: Install necessary dependencies.
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

## Style:
* http://www.december.com/html/spec/color3.html

Color Set: [Color Picker](http://www.perbang.dk/rgb/ADFFE5/)

* #00CED1 Blue
* #0099CC Dark Blue

Disabled:
* #989288 Border Light Grey
* #989288 Background Light Grey