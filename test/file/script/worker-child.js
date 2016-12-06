const worker = require('../../../lib/worker');
worker.send({
    id: process.env.TEST_ID,
    cwd: process.cwd()
});