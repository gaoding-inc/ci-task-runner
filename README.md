# git-webpack

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][travis-ci-image]][travis-ci-url]

这是一个前端构建任务管理器，支持增量构建与多进程并行构建，适合在服务器中搭建前端持续集成系统。

* 基于 Git 与 Svn 进行增量构建
* 支持串行与多进程并行加速构建
* 支持 Webpack、Gulp、Grunt 等构建任务
* 简单，采用 JSON 配置

## 安装

```bash
npm install git-webpack -g
```

## 使用

1\. 切换到 Git 项目目录，运行：

```bash
git-webpack --init
```

会在当前目录创建 git-webpack.json 文件以及演示模块目录。

2\. 运行 git-webpack

```bash
git-webpack
```

## 配置

git-webpack.json 文件范例：

```javascript
{
  "modules": ["mod1", "mod2"],
  "dependencies": ["package.json"],
  "assets": "dist/assets.json",
  "force": false,
  "repository": "git",
  "builder": {
    "command": "webpack --config ${modulePath}/webpack.config.js",
    "options": {
      "cwd": "${modulePath}",
      "env": {
        "MODULE_NAME": "${moduleName}",
        "MODULE_PATH": "${modulePath}"
      },
      "timeout": 0
    }
  }
}
```

`modules` 与 `dependencies` 是关键配置字段。它们之间的区别：

* `modules`：要构建的模块目录列表。只要模块目录文件变更，目录则会进行构建。
* `dependencies`：模块目录外部依赖列表。只要外部依赖有变更，无论 `modules` 是否有变更，都会将会触发 `modules` 的构建。

### `modules`

设置要构建的模块目录列表。git-webpack 支持多个目录、项目进行集中构建，`module.name` 则是目录名，如果发生修改则会运行目录中的 webpack.config.js，`modules` 支持字符串与对象形式：

```javascript 
"modules": [
    "module1",
    "module2",
    {
        "name": "module3",
        "dependencies": ["common/v1"],
        "builder": {}
    }
]
```

`dependencies` 与 `builder` 会继承顶层的配置。`modules` 支持配置并行任务，参考 [多进程](#多进程)。

### `assets`

设置构建后文件索引表输出路径。构建任务结束后它会输出结果，以供其他程序调用。

### `dependencies`

如果模块目录依赖了目录外的库，可以在此手动指定依赖，这样外部库更新也可以触发模块构建。

* `dependencies` 使用 Git 来实现变更检测，所以其路径必须已经受 Git 管理。如果想监控 node_modules 的变更，可以指定：`"dependencies": ["package.json"]`。
* `dependencies` 路径相对于 git-webpack.json

### `force`

强制构建所有模块。

## `repository`

设置仓库的类型。支持 git 与 svn。

## `parallel`

设置最大并行进程数，默认值为 `require('os').cpus().length`

## `builder`

构建器配置。

### `builder.command`

构建命令。程序会将 node_modules/.bin 会自动加入到环境变量 `PATH` 中，优先使用本地模块。

## 多进程

如果模块之间没有依赖，可以开启多进程构建，这样能够充分利用多核 CPU 加速构建。

需要多进程构建的模块使用二维数组即可：

```javascript
"modules": ["lib", ["module1", "module2", "module3"]],
"parallel": 8
```

lib 构建完成后，module1、module2、module3 会并行构建。

> `parallel` 默认会设置为当前计算机 CPU 核心数。

## 最佳实践

### 持续集成

使用 CI 工具来在服务器上运行 git-webpack，前端构建、发布都将无须人工干预。

* 自动：分支推送即自动触发构建
* 异步：无需中断编码工作
* 稳定：确保构建后的版本稳定，构建结果与 Git Commit 一一对应
* 安全：可以指受保护的 git 分支进行构建、发布，构建前可以进行 `code view`

相关工具：

* gitlab: gitlab-ci
* github: travis

### 使用 npm scripts

* 集中管理项目所有脚本
* 管道式命令，支持串行与并行
* 智能路径，使得很多命令行工具无需全局安装

编辑 package.json，添加 npm scripts

```javascript
"scripts": {
  "build": "git-webpack --parallel 4",
  "cdn": "echo 'publish...'"
  "deploy": "npm run build && npm run cdn" 
}
```

使用 npm run 启动 git-webpack

```bash
npm run build
```

本地安装 git-webpack

```bash
npm install --save-dev git-webpack
```


[npm-image]: https://img.shields.io/npm/v/git-webpack.svg
[npm-url]: https://npmjs.org/package/git-webpack
[node-version-image]: https://img.shields.io/node/v/git-webpack.svg
[node-version-url]: http://nodejs.org/download/
[downloads-image]: https://img.shields.io/npm/dm/git-webpack.svg
[downloads-url]: https://npmjs.org/package/git-webpack
[travis-ci-image]: https://travis-ci.org/aui/git-webpack.svg?branch=master
[travis-ci-url]: https://travis-ci.org/aui/git-webpack
