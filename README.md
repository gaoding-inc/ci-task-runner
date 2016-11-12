# git-webpack

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][travis-ci-image]][travis-ci-url]

基于 git 的 Webpack 多进程调度器，利用多核 CPU 加速现有构建流程。

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

2\. 创建配置

```bash
git-webpack --init
```

3\. 运行 git-webpack

```bash
git-webpack
```

## 配置

```javascript
{   
    // 要编译的模块目录列表。如果发生修改则会运行目录中的 webpack.config.js
    "modules": ["git-webpack-module-example"],
    // 构建后文件索引表输出路径
    "assets": "dist/assets.json",
    // 模块依赖的公共模块目录或文件，如果发生变更将会强制编译所有 `modules`
    "dependencies": ["package.json"],
    // 最大 Webpack 进程限制
    "parallel": 2
}
```

## 最佳实践

### 使用 npm scripts

编辑 package.json，添加 npm scripts

```javascript
  "scripts": {
    "build": "git-webpack",
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

### 前端持续集成

使用 CI 工具来运行 git-webpack，优点：

* 代码提交可以自动进行构建
* 异步构建，不打断工作流
* 确保构建后的版本稳定
* 更好的权限控制

相关工具：

* gitlab: gitlab-ci
* github: travis



[npm-image]: https://img.shields.io/npm/v/git-webpack.svg
[npm-url]: https://npmjs.org/package/git-webpack
[node-version-image]: https://img.shields.io/node/v/git-webpack.svg
[node-version-url]: http://nodejs.org/download/
[downloads-image]: https://img.shields.io/npm/dm/git-webpack.svg
[downloads-url]: https://npmjs.org/package/git-webpack
[travis-ci-image]: https://travis-ci.org/aui/git-webpack.svg?branch=master
[travis-ci-url]: https://travis-ci.org/aui/git-webpack