const worker = require('../../../lib/worker');
const packageData = require('../../../package.json');
console.log('worker');
worker.send(packageData);