# git-webpack

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][travis-ci-image]][travis-ci-url]

这是一个 Webpack 任务管理器，支持增量构建与多进程构建，适用于前端持续集成系统中。

* 基于 Git Commit 进行增量构建
* 支持串行与多并行构建
* 支持开启多进程例用多核 CPU 加速构建
* 支持多 Webpack 实例进行构建
* 无侵入现有 Webpack 构建配置

## 安装

```bash
npm install git-webpack -g
```

## 使用

1\. 切换到 Git 项目目录

```bash
cd you-project
```

2\. 生成配置

```bash
git-webpack --init
```

会在当前目录创建 git-webpack.json 文件以及演示模块目录。

3\. 运行 git-webpack

```bash
git-webpack
```

## 配置

git-webpack.json 文件范例：

```javascript
{
  "modules": [],
  "librarys": ["package.json"],
  "assets": "dist/assets.json",
  "force": false,
  "builder": {
    "timeout": 60000,
    "cwd": "${moduleName}",
    "env": {
      "MODULE_NAME": "${moduleName}"
    },
    "execArgv": [],
    "silent": false,
    "name": "webpack",
    "launch": "${moduleName}/webpack.config.js"
  }
}
```

`modules` 与 `librarys` 是关键配置字段。它们之间的区别：

* `modules`：要构建的模块目录列表。只要模块目录文件变更，目录则会进行构建。
* `librarys`：模块目录外部依赖列表。只要外部依赖有变更，无论 `modules` 是否有变更，都会将会触发 `modules` 的构建。

### `modules`

设置要构建的模块目录列表。git-webpack 支持多个目录、项目进行集中构建，`module.name` 则是目录名，如果发生修改则会运行目录中的 webpack.config.js，`modules` 支持字符串与对象形式：

```javascript 
"modules": [
    "module1",
    "module2",
    {
        "name": "module3",
        "librarys": ["common/v1"],
        "builder": {}
    }
]
```

`librarys` 与 `builder` 会继承顶层的配置。`modules` 支持配置并行任务，参考 [多进程](#多进程)。

### `assets`

设置构建后文件索引表输出路径。构建任务结束后它会输出结果，以供其他程序调用。

### `librarys`

如果模块目录依赖了目录外的库，可以在此手动指定依赖，这样外部库更新也可以触发模块构建。

* `librarys` 使用 Git 来实现变更检测，所以其路径必须已经受 Git 管理。如果想监控 node_modules 的变更，可以指定：`"librarys": ["package.json"]`。
* `librarys` 路径相对于 git-webpack.json

### `force`

强制构建所有模块。

## `parallel`

设置最大并行进程数，默认值为 `require('os').cpus().length`

## `builder`

构建器配置（文档尚未完善，采用默认配置可运行）。

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

如果没有条件采用服务器构建，可以考虑本地 Git hooks 来运行 git-webpack。

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
