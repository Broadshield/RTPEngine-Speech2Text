/* Basic Recording Spooler for RTPENGINE */
/* (C) 2017 QXIP BV */

const fs = require('fs');
const chokidar = require('chokidar');
const speechService = require('ms-bing-speech-service');

const options = {
	language: 'en-US',
	subscriptionKey: 'YOUR_OWN_KEY_HERE' // https://azure.microsoft.com/en-us/services/cognitive-services
};

const socket = new speechService(options);
const watcher = chokidar.watch('/recording', { ignored: /(^|[\/\\])\../, persistent: true });
watcher
	.on('error', error => log(`Watcher error: ${error}`))
	.on('add', path => log(`File ${path} has been added`))
	.on('change', path => log(`File ${path} has been changed`))
	.on('addDir', path => log(`Directory ${path} has been added`))
	.on('unlinkDir', path => log(`Directory ${path} has been removed`))
	.on('ready', () => log('Initial scan complete. Ready for changes'))
	.on('raw', (event, path, details) => { // internal
		log('Raw event info:', event, path, details);
	})
	.on('unlink', function (path) {
		console.log('File', path, 'has been removed');
		if (path.endsWith('.meta')) {
			var newpath = path.replace(/\.meta/i, '-mix.wav');
			console.log('Meta Hit! Seeking Audio at: ', newpath);
			socket.start((error, service) => {
				console.log('Speech service started');
				service.on('recognition', (e) => {
					if (e.RecognitionStatus === 'Success') console.log(e);
				});
				service.sendFile(newpath, function (e) {
					console.log(e);
					setTimeout(function () { fs.unlink(newpath); }, 1000);
				});
			});
		}
	});
