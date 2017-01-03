const path = require('path');
const assert = require('assert');
const Repository = require('../../lib/repository');

describe('#repository', () => {

    const dbPath = path.join(process.env.TEST_DIST, 'lib', 'repository', '.watch-commit.json');
    const repository = new Repository(dbPath);

    it('watch one file', () => {
        let target = path.join(__dirname, '..', '..', 'package.json');
        return repository.watch(target, dbPath).then(([newCommitId, oldCommitId]) => {
            assert.deepEqual('string', typeof newCommitId);
            if (oldCommitId !== undefined) {
                assert.deepEqual('string', typeof oldCommitId);
            }
            repository.save();
        });
    });

});