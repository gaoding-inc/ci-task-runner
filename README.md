# ci-task-runner

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][travis-ci-image]][travis-ci-url]

[[简体中文]](./README.ZH-CN.md)

This is a multiprocess building tasks scheduler, which is written based on NodeJS. It supports the increment and parallel building and can improve the speed of server building largely.

As a common task scheduler, Ci-task-runner is not to replace Jenkins, Gitlab-CI and other continuous integration tools or Webpack, Gulp and other construction procedures, but to improve their speed of running the task.

> "When we build a large front-end project after moving it into continuous intergration system, it will take nearly 10 minutes to complete the construction of every small modified file, so we have developed ci-task-runner, which will shorten this process to about 10 seconds."

## Principle

1\. **Incremental Building**:

In medium and large projects, the building speed will definitely be very slow if full dose building is required due to the change of a small file. To solve this problem, ci-task-runner will compare commit logs of Git or Svn and only builds the changed file.

2\. **Parallel Building**:

When the execution of multiple tasks is needed, ci-task-runner will run a new process according to current server's CPU quantities and finish the tasks quickly by using multi-process parallel building.

## Installation

```shell
npm install ci-task-runner@1.0.0-beta2 -g
```

## Basic Usage
Ci-task-runner's tasks are defined in the JSON, in the project to create a new `.ci-task-runner.json` file, example:

```json
{
  "tasks": ["mod1", "mod2", "mod3"],
  "cache": ".ci-task-runner-cache.json",
  "repository": "git",
  "program": "cd ${taskPath} && webpack --color"
}
```


And then run the command in the project directory to perform the above defined `tasks`

```shell
ci-task-runner
```

Above-mentioned: mod1、mod2、mod3 will run `cd ${taskPath} && webpack --color` ordered by catelogue changed.

Through the introductory tutorial, you can see that the biggest difference between the task concept of ci-task-runner and other task executors is that each task is based on a file or folder in the code repository.

> Using CI tools run ci-task-runner On the server, reference: [Continuous integration](#continuous-integration).

## Configuration

### `tasks`

Task target list, the target can be any directory or file in the repository.

Simplified: `{string[]}`

```json
{
  "tasks": ["mod1", "mod2", "mod3"]
}
```

Advanced: `{Object[]}`

```json
{
  "tasks": [
      {
          "name": "mod1",
          "path": "path/mod1",
          "dependencies": ["common/v1"],
          "program": "cd ${taskPath} && gulp"
      },
      "mod2",
      "mod3"
  ]
}
```

1. [`dependencies`](#dependencies) and [`program`](#program) will inherit the top of the configuration, you can also cover them.
2. [`tasks`](#tasks) support configure parallel tasks, reference: [Mutiprocess Parallel Tasks](#mutiprocess-parallel-tasks).

### `cache`
ci-task-runner cache file write path, used to save the last task information. Default: `ci-task-runner-cache.json`

> Ignore `.ci-task-runner-cache.json` in repository.

### `dependencies`

Task target external dependency list. If the task target relies on a library outside the directory, you can specify the dependency manually, so that changes to the external library can also trigger the task to run.

> ci-task-runner use Git or Svn to realize changed detection, so the path must already be versioned

### `repository`

Setting the type of repository. Support Git and Svn.

### `parallel`

Set the maximum number of parallel progress. Default: `require('os').cpus().length`.

### `program`

Running task's configuration.

Simplified: `{string}`

```json
{
  "program": "cd ${taskPath} && node build.js"
}
```

Advanced: `{Object}`

```json
{
  "program": {
    "command": "node build.js",
    "options": {
      "cwd": "${taskPath}",
      "timeout": 360000
    }
  }
}
```

#### `program.command`

Setting start command.

> program will put `${options.cwd}/node_modules/.bin` and `${process.cwd()}/node_modules/.bin` in environment variable `PATH`, like `npm scripts` install on local.

#### `program.options`

Progress configuration. Reference: [child_process.exec](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback).

> The `timeout` field in `program.options` takes effect and terminates the process and throws an error.This is not the same as `child_process.exec`, it only throws an error. `child_process.exec` only throw error.

#### Variable

`program` supporting string variable.

* `${taskName}` task name
* `${taskPath}` task target absolute path
* `${taskDirname}` equal to `path.diranme(taskPath)`，[detail](https://nodejs.org/api/path.html#path_path_dirname_path)

## Configuration Example

### Mutiprocess Parallel Tasks

If there is no dependency between tasks, you can open mutiprocess to run the task, so that you can take full advantage of multi-core CPU to speed up the operation.

Tasks outside task name is serial run, if array will parallel running:

```json
{
  "tasks": ["dll", ["mod1", "mod2", "mod3"]],
  "cache": "dist/.ci-task-runner-cache.json",
  "repository": "git",
  "program": "cd ${taskPath} && webpack --color"
}
```

Above-mentioned: when dll has build, mod1、mod2、mod3 will be built in a multi-threaded manner in parallel.

### Change Dependencies Trigger Buliding

```json
{
  "tasks": ["dll", ["mod1", "mod2", "mod3"]],
  "dependencies": ["dll", "package.json"],
  "cache": "dist/.ci-task-runner-cache.json",
  "repository": "git",
  "program": "cd ${taskPath} && webpack --color"
}
```

Above-mentioned: when dll and package.json has changed, whatever other task's target has changed or not it will be forced to building.

### Auto Updating Npm Packages

```json
{
  "tasks": [
    {
      "name": "package.json",
      "program": "npm install"
    },
    "dll",
    ["mod1", "mod2", "mod3"]
  ],
  "dependencies": ["package.json", "dll"],
  "cache": "dist/.ci-task-runner-cache.json",
  "repository": "git",
  "program": "cd ${taskPath} && webpack --color"
}
```

Above-mentioned: when package.json has changed, it will run `npm install` to install dependencies to keep project up-to-date.

## Continuous integration

Using CI tool to run ci-task-runner on server-site.

**About:**

* gitlab: gitlab-ci
* github: travis
* Jenkins

CI configuration can refer to relative API.

> Webpack throw error but didn't exit: [Webpack configuration.bail](http://webpack.github.io/docs/configuration.html#bail)

[npm-image]: https://img.shields.io/npm/v/ci-task-runner.svg
[npm-url]: https://npmjs.org/package/ci-task-runner
[node-version-image]: https://img.shields.io/node/v/ci-task-runner.svg
[node-version-url]: http://nodejs.org/download/
[downloads-image]: https://img.shields.io/npm/dm/ci-task-runner.svg
[downloads-url]: https://npmjs.org/package/ci-task-runner
[travis-ci-image]: https://travis-ci.org/huanleguang/ci-task-runner.svg?branch=master
[travis-ci-url]: https://travis-ci.org/huanleguang/ci-task-runner
