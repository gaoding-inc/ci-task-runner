const worker = require('../../../../lib/worker');
function getRandom(n,m){
  return Math.round(Math.random()*(m-n)+n);
}

setTimeout(function() {
    worker.send({
        id: process.env.TEST_ID
    });
}, getRandom(16, 512));
