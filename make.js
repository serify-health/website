'use strict';

/**
 * Module dependencies
 */
var fs = require('fs');
var exec = require('child_process').execSync;
var execAsync = require('child_process').spawn;
var glob = require('glob');
var https = require('https');
var path = require('path');

var AwsArchitect = require('aws-architect');
var ci = require('ci-build-tools')(process.env.GIT_TAG_PUSHER);
//var version = ci.GetVersion();
var version = '0.0.1';
var commander = require('commander');
commander.version(version);

var packageMetadataFile = path.join(__dirname, 'package.json');
var packageMetadata = require(packageMetadataFile);

var contentOptions = {
	bucket: 'health-verify-service',
	contentDirectory: path.join(__dirname, 'content')
};
var awsArchitect = new AwsArchitect(packageMetadata, null, contentOptions);

commander
	.command('build')
	.description('Setup require build files for npm package.')
	.action(() => {
		packageMetadata.version = version;
		fs.writeFileSync(packageMetadataFile, JSON.stringify(packageMetadata, null, 2));

		console.log("Building package %s (%s)", packageMetadata.name, version);
		console.log('');

		console.log('Running tests')
		var test = exec('npm test');
		console.log(' ' + test);
	});

commander
	.command('run')
	.description('Run lambda web service locally.')
	.action(() => {
		awsArchitect.Run(8080)
		.then((result) => console.log(JSON.stringify(result, null, 2)))
		.catch((failure) => console.log(JSON.stringify(failure, null, 2)));
	});

commander
	.command('deploy')
	.description('Deploy to AWS.')
	.action(() => {
		var production = 'v1';
		var websitePromise = awsArchitect.PublishWebsite(production);
		Promise.all([websitePromise]).then((result) => console.log(`${JSON.stringify(result, null, 2)}`))
		.catch((failure) => console.log(`Failed to upload website ${failure} - ${JSON.stringify(failure, null, 2)}`));
	});

commander.on('*', () => {
	if(commander.args.join(' ') == 'tests/**/*.js') { return; }
	console.log('Unknown Command: ' + commander.args.join(' '));
	commander.help();
	process.exit(0);
});
commander.parse(process.argv[2] ? process.argv : process.argv.concat(['build']));