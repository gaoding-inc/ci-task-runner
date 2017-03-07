# ci-task-runner

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][travis-ci-image]][travis-ci-url]

这是一个基于 NodeJS 编写的多进程构建任务调度器，它支持增量与并行构建，可以大幅度提高服务器端构建速度。
This is a building multiprocess tasks dispatcher base on NodeJS, supporting increment and building parallel, can improve speed of server building largely.

ci-task-runner 作为一个通用的任务调度器，它并不是为了取代 Jenkins、Gitlab-CI 等持续集成工具或 Webpack、Gulp 等构建程序，而是提高它们运行任务的速度。
ci-task-runner as an usual tasks dispatcher, it rather than improves these tools like Jenkins、Gitlab-CI or Webpack、Gulp tasks running speed than takes place of them.

## 原理
## Principle

1\. **增量构建**：
1\. **Incremental Building**:

在中大型项目中，如果因为修改一个小文件就需要全量构建，这样构建速度必然会非常慢。为了解决这个问题，ci-task-runner 会对比 Git 或 Svn 的提交记录，只构建有差异的文件。
Medium and large project needs full dose building if a little file has changed, in this way the building speed will be very slow. For sloving this problem, ci-task-runner diff commit logs of Git or Svn and building changed file.

2\. **并行构建**：
2\. **Parallel Building**:

如果有多个任务需要执行，ci-task-runner 会根据当前服务器 CPU 核心的数量启动新的进程，以多进程并行运行的方式加快任务完成。
When multiple tasks need run, ci-task-runner will run a new process according to current server's CPU quantities, using mutiprocess parallel building to finish tasks quickly.

## 安装
## Installation

```shell
npm install ci-task-runner@1.0.0-beta -g
```

## 入门
## Basic Usage

ci-task-runner 的任务都是在 JSON 配置文件定义的，在项目中新建一个 `.ci-task-runner.json` 配置，范例：
Ci-task-runner's configuration file type is JSON, mkdir a new `.ci-task-runner.json`, for example:

```json
{
  "tasks": ["mod1", "mod2", "mod3"],
  "cache": ".ci-task-runner-cache.json",
  "repository": "git",
  "program": "cd ${taskPath} && webpack --color"
}
```

然后在项目目录运行命令即可执行 `.ci-task-runner.json` 定义的任务：
Run `.ci-task-runner.json`:

```shell
ci-task-runner
```

上述例子中：仓库中的 mod1、mod2、mod3 目录有变更则会依次执行 `cd ${taskPath} && webpack --color`。
Above-mentioned: mod1、mod2、mod3 will run `cd ${taskPath} && webpack --color` ordered by catelogue changed.

通过入门教程可以看到，ci-task-runner 的任务概念与其他任务运行器最大的不同是：每一个任务都是基于代码仓库中的文件或文件夹。
According basic usage, the most different ci-task-runnder with other task management: every task base on code repository's file or folder.

> 在服务器上可以使用 CI 工具启动 ci-task-runner，参考： [持续集成](#持续集成)。
> Using CI tools run ci-task-runner in server-side, reference: [持续集成](#持续集成).

## 配置
## Configuration

### `tasks`

任务目标列表。目标可以是仓库中的任意目录或文件。
Task target list, target is any file or folder in repository.

简写形式：`{string[]}`
Abrreviation: `{string[]}`

```json
{
  "tasks": ["mod1", "mod2", "mod3"]
}
```

进阶形式：`{Object[]}`
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

1. [`dependencies`](#dependencies) 与 [`program`](#program) 会继承顶层的配置，也可以覆盖它们
1. [`dependencies`](#dependencies) and [`program`](#program) will inherit the top configuration，or cover it.
2. [`tasks`](#tasks) 支持配置并行任务，参考 [多进程并行任务](#多进程并行任务)
2. [`tasks`](#tasks) support configure parallel tasks，reference: [多进程并行任务](#多进程并行任务).

### `cache`

ci-task-runner 缓存文件写入路径，用来保存上一次任务的信息。默认为：`.ci-task-runner-cache.json`

> 请在代码仓库库中忽略 `.ci-task-runner-cache.json`。

### `dependencies`

任务目标外部依赖列表。如果任务目标依赖了目录外的库，可以在此手动指定依赖，这样外部库的变更也可以触发任务运行。

> ci-task-runner 使用 Git 或 Svn 来实现变更检测，所以其路径必须已经受版本管理。

### `repository`

设置仓库的类型。支持 git 与 svn。

### `parallel`

设置最大并行进程数。默认值为 `require('os').cpus().length`。
Setting the most parallel progress quantities. Default: `require('os').cpus().length`.

### `program`

执行任务的程序配置。
Running task's configuration.

简写形式：`{string}`
Abrreviation: `{string}`

```json
{
  "program": "cd ${taskPath} && node build.js"
}
```

进阶形式：`{Object}`
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

设置执行的命令。
Setting start command.

> 程序会将 `${options.cwd}/node_modules/.bin` 与 `${process.cwd()}/node_modules/.bin` 加入到环境变量 `PATH` 中，因此可以像 `npm scripts` 一样运行安装在本地的命令。
> program will put `${options.cwd}/node_modules/.bin` and `${process.cwd()}/node_modules/.bin` in environment variable `PATH`, like `npm scripts` run command on local. 

#### `program.options`

进程配置。参考：[child_process.exec](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback)。
Progress configuration. Reference: [child_process.exec](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback).

> `program.options` 中的 `timeout` 字段生效后会终止进程，并且抛出错误。这点和 `child_process.exec` 不一样，它只抛出错误。
> `timeout` in `program.options` will terminate progress, and throw error. It's different with `child_process.exec`, it only throw error.

#### 变量
#### Variable

`program` 支持的字符串变量：
`program` supporting string variable.

* `${taskName}` 任务名称
* `${taskPath}` 任务目标绝对路径
* `${taskDirname}` 等同于 `path.diranme(taskPath)`，[详情](https://nodejs.org/api/path.html#path_path_dirname_path)
* `${taskName}` task name
* `${taskPath}` task target absolute path
* `${taskDirname}` equal with `path.diranme(taskPath)`，[detail](https://nodejs.org/api/path.html#path_path_dirname_path)

## 配置范例
## Example

### 多进程并行任务
### Mutiprocess Parallel Tasks

如果任务之间没有依赖，可以开启多进程运行任务，这样能够充分利用多核 CPU 加速运行。
If tasks have no dependencies in each other, it can open mutiprocess run task, then take full advantage of Multi-core CPU accelerating running.

tasks 最外层的任务名是串行运行，如果遇到数组则会并行运行：
Tasks outside task name is serial run, if array will parallel run:

```json
{
  "tasks": ["dll", ["mod1", "mod2", "mod3"]],
  "cache": "dist/.ci-task-runner-cache.json",
  "repository": "git",
  "program": "cd ${taskPath} && webpack --color"
}
```

上述例子中：当 dll 构建完成后，mod1、mod2、mod3 会以多线程的方式并行构建。
Above-mentioned: when dll has build, mod1、mod2、mod3 will parallel building by multi-thread.

### 依赖变更触发构建
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

上述例子中：当 dll 和 package.json 变更后，无论其他任务目标是否有修改都会被强制构建。
Above-mentioned: when dll and package.json has changed, whatever other task's target has changed or not it will be forced to building.

### 自动更新 Npm 包
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

上述例子中：当 package.json 变更后，则会执行 `npm install` 安装项目依赖，让项目保持最新。
Above-mentioned: when package.json has changed, it will run `npm install` to install dependencies to keep project up to date.

## 持续集成
## Continuous integration

使用 CI 工具来在服务器上运行 ci-task-runner。
Using CI tool to run ci-task-runner on server-site.

**相关工具：**
**About:**

* gitlab: gitlab-ci
* github: travis
* Jenkins

CI 工具配置请参考相应的文档。
CI configuration can refer to relative API.

> Webpack 遇到错误没退出的问题解决方案：[Webpack configuration.bail](http://webpack.github.io/docs/configuration.html#bail)
> Webpack throw error but didn't exit: [Webpack configuration.bail](http://webpack.github.io/docs/configuration.html#bail)

[npm-image]: https://img.shields.io/npm/v/ci-task-runner.svg
[npm-url]: https://npmjs.org/package/ci-task-runner
[node-version-image]: https://img.shields.io/node/v/ci-task-runner.svg
[node-version-url]: http://nodejs.org/download/
[downloads-image]: https://img.shields.io/npm/dm/ci-task-runner.svg
[downloads-url]: https://npmjs.org/package/ci-task-runner
[travis-ci-image]: https://travis-ci.org/aui/ci-task-runner.svg?branch=master
[travis-ci-url]: https://travis-ci.org/aui/ci-task-runner
