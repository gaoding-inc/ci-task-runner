# ci-task-runner

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][travis-ci-image]][travis-ci-url]

[[简体中文]](./README.ZH-CN.md) 

This is a multiprocess building tasks dispatcher base on NodeJS, support increment and parallel building, can improve speed of server building largely.

ci-task-runner as an usual tasks dispatcher, it improves these tools such as Jenkins、Gitlab-CI or Webpack、Gulp these tools running speed, rather than takes place of them.

> "We move a large frond-end project to continuous integration for building, every small change need almost 10 minutes to finish building, so we develop ci-task-runner, and reduce this process to 10 seconds."

## Principle

1\. **Incremental Building**:

Medium and large project needs full dose building if a little file has changed, in this way the building speed will be very slow. For sloving this problem, ci-task-runner diff commit logs of Git or Svn and building changed file.

2\. **Parallel Building**:

When multiple tasks need execute, ci-task-runner will run a new process according to current server's CPU quantities, using mutiprocess parallel building to finish tasks quickly.

## Installation

```shell
npm install ci-task-runner@1.0.0-beta2 -g
```

## Basic Usage

Ci-task-runner's configuration file type is JSON, mkdir a new `.ci-task-runner.json`, for example:

```json
{
  "tasks": ["mod1", "mod2", "mod3"],
  "cache": ".ci-task-runner-cache.json",
  "repository": "git",
  "program": "cd ${taskPath} && webpack --color"
}
```

Run `.ci-task-runner.json`:

```shell
ci-task-runner
```

Above-mentioned: mod1、mod2、mod3 will run `cd ${taskPath} && webpack --color` ordered by catelogue changed.

According basic usage, the most different ci-task-runnder with other task management: every task base on code repository's file or folder.

> Using CI tools run ci-task-runner in server-side, reference: [Continuous integration](#continuous-integration).

## Configuration

### `tasks`

Task target list, target is any file or folder in repository.

Abrreviation: `{string[]}`

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

1. [`dependencies`](#dependencies) and [`program`](#program) will inherit the top configuration，or cover it.
2. [`tasks`](#tasks) support configure parallel tasks，reference: [Mutiprocess Parallel Tasks](#mutiprocess-parallel-tasks).

### `cache`

ci-task-runner cache files write in path, to use save the last task info. Default: `ci-task-runner-cache.json` 

> Ignore `.ci-task-runner-cache.json` in repository.

### `dependencies`

Tasks target outside's dependencies list. If task target depends on repository outside category's, can add manully dependency, then outside's repository can trigger task run.

> ci-task-runner use Git or Svn to realize changed detection, so the path must be in version control.

### `repository`

Setting type of repository. Support Git and Svn.

### `parallel`

Setting the most parallel progress quantities. Default: `require('os').cpus().length`.

### `program`

Running task's configuration.

Abrreviation: `{string}`

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

> `timeout` in `program.options` will terminate progress, and throw error. `child_process.exec` only throw error.

#### Variable

`program` supporting string variable.

* `${taskName}` task name
* `${taskPath}` task target absolute path
* `${taskDirname}` equal with `path.diranme(taskPath)`，[detail](https://nodejs.org/api/path.html#path_path_dirname_path)

## Configuration Example

### Mutiprocess Parallel Tasks

If tasks have no dependencies in each other, it can open mutiprocess run task, then take full advantage of Multi-core CPU accelerating running.

Tasks outside task name is serial run, if array will parallel running:

```json
{
  "tasks": ["dll", ["mod1", "mod2", "mod3"]],
  "cache": "dist/.ci-task-runner-cache.json",
  "repository": "git",
  "program": "cd ${taskPath} && webpack --color"
}
```

Above-mentioned: when dll has build, mod1、mod2、mod3 will parallel building by multi-thread.

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

Above-mentioned: when package.json has changed, it will run `npm install` to install dependencies to keep project up to date.

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
[travis-ci-image]: https://travis-ci.org/aui/ci-task-runner.svg?branch=master
[travis-ci-url]: https://travis-ci.org/aui/ci-task-runner
