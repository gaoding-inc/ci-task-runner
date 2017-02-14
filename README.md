# ci-task-runner

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][travis-ci-image]][travis-ci-url]

支持增量与多进程的构建任务调度器，大幅度提升 CI 服务器构建速度。

## 特性

* 标准：基于 Git 或 Svn 提交记录按需构建
* 快速：利用多核 CPU 多进程并行加速构建
* 灵活：兼容 Webpack、Gulp、Grunt 等构建程序
* 简单：采用语义化的 JSON 文件来描述项目

## 适用场景

1. 前端项目云构建、[持续集成](#持续集成)
2. 多个模块需要单独构建的中大型项目

## 安装

```shell
npm install ci-task-runner -g
```

## 使用

1\. 切换到项目目录，运行：

```shell
ci-task-runner --init
```

程序会在当前目录生成配置文件：.ci-task-runner.json。

2\. 运行 ci-task-runner

```shell
ci-task-runner
```

> 在服务器上可以使用 CI 工具启动 ci-task-runner，参考： [持续集成](#持续集成)。

## 配置

.ci-task-runner.json 文件范例：

```json
{
  "tasks": ["mod1", "mod2", "mod3"],
  "cache": "dist/.ci-task-runner-cache.json",
  "repository": "git",
  "program": "cd ${taskPath} && webpack --color"
}
```

上述例子中：mod1、mod2、mod3 有变更会执行目录中的 webpack.config.js。

### `tasks`

任务目标列表。目标可以是目录名或文件名。

简写形式：`{string[]}`

```json
{
  "tasks": ["mod1", "mod2", "mod3"]
}
```

对象形式：`{Object[]}`

```json
{
  "tasks": [
      "mod1",
      "mod2",
      {
          "name": "mod3",
          "dependencies": ["common/v1"],
          "program": "cd ${taskPath} && gulp"
      },
      ["mod4", "mod5"]
  ]
}
```

1. [`dependencies`](#dependencies) 与 [`program`](#program) 会继承顶层的配置
2. `tasks` 支持配置并行任务，参考 [多进程并行构建](#多进程并行构建)

### `cache`

ci-task-runner 缓存文件保存路径。

> 请在版本库中忽略 `cache` 的文件路径。

### `dependencies`

任务目标外部依赖列表。如果任务目标依赖了目录外的库，可以在此手动指定依赖，这样外部库的更新也可以触发任务构建。

> ci-task-runner 使用 Git 或 Svn 来实现变更检测，所以其路径必须已经受版本管理。如果想监控 node_modules 的变更，可以指定：`"dependencies": ["package.json"]`。

### `repository`

设置仓库的类型。支持 git 与 svn。

### `parallel`

设置最大并行进程数。默认值为 `require('os').cpus().length`。

### `program`

构建器配置。

简写形式：`{string}`

```json
{
  "program": "cd ${taskPath} && node build.js"
}
```

对象形式：`{Object}`

```json
{
  "program": {
    "command": "node build.js",
    "options": {
      "timeout": 360000
    }
  }
}
```

#### `program.command`

设置执行的构建命令。

> 程序会将 `${taskName}/node_modules/.bin` 与 `node_modules/.bin` 加入到环境变量 `PATH` 中。

#### `program.options`

构建器进程配置。构建器会在子进程中运行，在这里设置进程的选项。参考：[child_process.exec](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback)。

> `program.options` 中的 `timeout` 字段生效后会终止进程，并且抛出错误。这点和 `child_process.exec` 不一样，它只抛出错误。

#### 变量

`program` 支持的字符串变量：

* `${taskName}` 任务名称
* `${taskPath}` 任务目标绝对路径
* `${taskDirname}` 等同于 `path.diranme(taskPath)`，[详情](https://nodejs.org/api/path.html#path_path_dirname_path)

## 配置范例

### 多进程并行构建

如果任务之间没有依赖，可以开启多进程构建，这样能够充分利用多核 CPU 加速构建。

tasks 最外层的任务名是串行运行，如果遇到数组则会并行运行：

```json
{
  "tasks": ["dll", ["mod1", "mod2", "mod3"]],
  "cache": "dist/.ci-task-runner-cache.json",
  "repository": "git",
  "program": "cd ${taskPath} && webpack --color"
}
```

上述例子中：当 dll 构建完成后，mod1、mod2、mod3 会以多线程的方式并行构建。

### 依赖变更触发构建

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

### 自动更新 Npm 包

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

## 持续集成

使用 CI 工具来在服务器上运行 ci-task-runner。

<img src="https://cloud.githubusercontent.com/assets/1791748/21080792/470338c8-bff3-11e6-92bd-42f420b8bb8b.png" alt="持续集成架构图" width="654">

> Webpack 遇到编译错误没有退出的问题参考：[Webpack configuration.bail](http://webpack.github.io/docs/configuration.html#bail)

**相关工具：**

* gitlab: gitlab-ci
* github: travis

CI 工具配置请参考相应的文档。

[npm-image]: https://img.shields.io/npm/v/ci-task-runner.svg
[npm-url]: https://npmjs.org/package/ci-task-runner
[node-version-image]: https://img.shields.io/node/v/ci-task-runner.svg
[node-version-url]: http://nodejs.org/download/
[downloads-image]: https://img.shields.io/npm/dm/ci-task-runner.svg
[downloads-url]: https://npmjs.org/package/ci-task-runner
[travis-ci-image]: https://travis-ci.org/aui/ci-task-runner.svg?branch=master
[travis-ci-url]: https://travis-ci.org/aui/ci-task-runner
