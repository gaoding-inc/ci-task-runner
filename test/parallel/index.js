const child_process = require('child_process');

console.time('「「parallel:1」」');
console.log(child_process.execSync('git-webpack --parallel=1', {
    cwd: __dirname
}).toString());
console.timeEnd('「parallel:1」');

console.time('「parallel:2」');
console.log(child_process.execSync('git-webpack --parallel=2', {
    cwd: __dirname
}).toString());
console.timeEnd('「parallel:2」');

console.time('「parallel:3」');
console.log(child_process.execSync('git-webpack --parallel=3', {
    cwd: __dirname
}).toString());
console.timeEnd('「parallel:3」');

console.time('「parallel:4」');
console.log(child_process.execSync('git-webpack --parallel=4', {
    cwd: __dirname
}).toString());
console.timeEnd('「parallel:4」');

console.time('「parallel:5」');
console.log(child_process.execSync('git-webpack --parallel=5', {
    cwd: __dirname
}).toString());
console.timeEnd('「parallel:5」');

console.time('「parallel:6」');
console.log(child_process.execSync('git-webpack --parallel=6', {
    cwd: __dirname
}).toString());
console.timeEnd('「parallel:6」');

console.time('「parallel:7」');
console.log(child_process.execSync('git-webpack --parallel=7', {
    cwd: __dirname
}).toString());
console.timeEnd('「parallel:7」');

console.time('「parallel:8」');
console.log(child_process.execSync('git-webpack --parallel=8', {
    cwd: __dirname
}).toString());
console.timeEnd('「parallel:8」');