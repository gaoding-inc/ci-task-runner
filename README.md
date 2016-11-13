# git-webpack

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][travis-ci-image]][travis-ci-url]

基于 git 的 Webpack 多进程调度器，充分利用多核 CPU 加速现有构建流程。

* 基于 `·git commit` 按需进行构建任务调度
* 支持按模块目录、多 Webpack 实例进行构建
* 支持多线程调度 Webpack 实例
* 无需修改现有 Webpack 构建配置

## 安装

```bash
npm install git-webpack -g
```

## 使用

1\. 切换到 git 项目目录

```bash
cd you-project
```

2\. 生成配置

```bash
git-webpack --init
```

3\. 运行 git-webpack

```bash
git-webpack
```

## 配置

git-webpack.json

```javascript
{   
    "modules": ["git-webpack-module-example"],
    "assets": "dist/assets.json",
    "dependencies": ["package.json"],
    "parallel": 2,
    "env": {
        "GIT_WEBPACK": "1"
    }
}
```

路径相对于 git-webpack.json 文件。

### `modules`

设置要编译的模块目录列表。如果发生修改则会运行目录中的 webpack.config.js，`modules` 支持字符串于对象形式：

```javascript 
"modules": [
    "mod1",
    "mod2",
    {
        "name": "mod3",
        "dependencies": ["common/v1"]
    }
]
```

### `assets`

设置构建后文件索引表输出路径。设置 `null` 则不输出。

### `dependencies`

设置公共依赖的目录或文件。无论模块目录是否有变更，`dependencies` 都会触发所属模块强制编译；顶层 `dependencies` 变更会触发所有模块编译。

### `parallel`

git-webpack 可以多进程调度 Webpack，这里可以设置进程并行数。

### `env`

设置环境变量。

## 最佳实践

### 持续集成

使用 CI 工具来在服务器上运行 git-webpack，前端构建、发布都将无须人工干预。

* 分支推送即自动触发构建
* 异步构建，不打断工作流
* 确保构建后的版本稳定
* 更好的权限控制

相关工具：

* gitlab: gitlab-ci
* github: travis

如果没有条件采用服务器构建，可以考虑本地 git hooks 来运行 git-webpack。

### 使用 npm scripts

编辑 package.json，添加 npm scripts

```javascript
"scripts": {
  "build": "git-webpack --parallel 4",
  "deploy": "npm run build && npm run cdn",
  "cdn": "echo 'publish...'"
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

`npm run` 会优先使用本地模块，这样无须全局安装命令行工具。



[npm-image]: https://img.shields.io/npm/v/git-webpack.svg
[npm-url]: https://npmjs.org/package/git-webpack
[node-version-image]: https://img.shields.io/node/v/git-webpack.svg
[node-version-url]: http://nodejs.org/download/
[downloads-image]: https://img.shields.io/npm/dm/git-webpack.svg
[downloads-url]: https://npmjs.org/package/git-webpack
[travis-ci-image]: https://travis-ci.org/aui/git-webpack.svg?branch=master
[travis-ci-url]: https://travis-ci.org/aui/git-webpack