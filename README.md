# module-watcher

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][travis-ci-image]][travis-ci-url]

支持增量与多进程并行构建任务管理器。简单的说，它的职责：

1. 观察仓库的目录、文件变更
2. 调用指定程序来构建变更后的文件，如 Webpack、Gulp、Grunt 等

因此，它适合部署在 CI 服务器中，作为持续集成中的一部分。

## 特性

* 标准：支持 Git 或 Svn 仓库
* 快速：采用多进程并行构建
* 灵活：适配任意构建器
* 多例：支持为模块运行不同的构建实例
* 简单：采用 JSON 配置

## 安装

```bash
npm install module-watcher -g
```

## 使用

1\. 切换到项目目录，运行：

```bash
module-watcher --init
```

会在当前目录创建 module-watcher.json 文件以及演示模块目录（演示依赖 Webpack）。

2\. 运行 module-watcher

```bash
module-watcher
```

> 在服务器上可以使用 CI 工具启动 module-watcher，参考 [持续集成](#持续集成)

## 配置

module-watcher.json 文件范例：

```javascript
{
  "modules": ["mod1", "mod2"],
  "dependencies": ["package.json"],
  "assets": "dist/assets.json",
  "force": false,
  "repository": "git",
  "program": {
    "command": "webpack --color --config ${modulePath}/webpack.config.js",
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

### `modules`

设置要构建的模块目录列表。module-watcher 支持多个目录、项目进行集中构建，`module.name` 则是目录名，如果发生修改则会运行目录中的 webpack.config.js，`modules` 支持字符串与对象形式：

```javascript 
"modules": [
    "module1",
    "module2",
    {
        "name": "module3",
        "dependencies": ["common/v1"],
        "program": {}
    }
]
```

`dependencies` 与 `program` 会继承顶层的配置。`modules` 支持配置并行任务，参考 [多进程并行构建](#多进程并行构建)。

### `assets`

设置构建后文件索引表输出路径。构建任务结束后它会输出结果，以供其他程序调用。

### `dependencies`

如果模块目录依赖了目录外的库，可以在此手动指定依赖，这样外部库更新也可以触发模块构建。

* `dependencies` 使用 Git 来实现变更检测，所以其路径必须已经受 Git 管理。如果想监控 node_modules 的变更，可以指定：`"dependencies": ["package.json"]`。
* `dependencies` 路径相对于 module-watcher.json

### `force`

强制构建所有模块。

## `repository`

设置仓库的类型。支持 git 与 svn。

## `parallel`

设置最大并行进程数，默认值为 `require('os').cpus().length`。

## `program`

构建器配置。

### `program.command`

设置执行的构建命令。（程序会将 node_modules/.bin 会自动加入到环境变量 `PATH` 中）

### `program.options`

构建器进程配置。构建器会在子进程中运行，在这里设置进程的选项。

[child_process.exec 详情](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback)

### 变量

`program` 支持的字符串变量：

* `${moduleName}` 模块名
* `${modulePath}` 模块绝对路径
* `${moduleDirname}` 不同于 `${modulePath}`，它内部实现： `path.diranme(modulePath)`，[详情](https://nodejs.org/api/path.html#path_path_dirname_path)

## 多进程并行构建

如果模块之间没有依赖，可以开启多进程构建，这样能够充分利用多核 CPU 加速构建。

modules 最外层的模块名是串行运行，如果遇到数组则会并行运行：

```javascript
"modules": ["lib", ["module1", "module2", "module3"]],
"parallel": 8
```

上述例子中，当 lib 构建完成后，module1、module2、module3 会以多线程的方式并行构建。

> `parallel` 默认会设置为当前计算机 CPU 核心数。

## 集中管理所有编译结果

### Webpack

module-watcher 提供了 assets-webpack-plugin 插件，可以统一管理各个模块的资源输出。

```javascript
// webpack.config.js
var AssetsWebpackPlugin = require('module-watcher/plugin/assets-webpack-plugin');
module.exports = {
  //...
  plugins: [new AssetsWebpackPlugin()]
};
```

module-watcher 运行后，此插件会将输出的文件索引保存在 dist/assets.json 中，以便交给发布程序处理。

## Gulp、Grunt

Gulp、Grunt 需要手动输出资源索引（文档尚未完善）

## 持续集成

使用 CI 工具来在服务器上运行 module-watcher，前端构建、发布都将无须人工干预。

* 自动：分支推送即自动触发构建、测试、发布
* 异步：无需等待编译任务、无需中断编码工作
* 稳定：确保构建后的版本稳定，构建结果与 Git Commit 一一对应
* 安全：所有操作均受 Git 或 Svn 监控

相关工具：

* gitlab: gitlab-ci
* github: travis

（使用方法请查找第三方资料）

[npm-image]: https://img.shields.io/npm/v/module-watcher.svg
[npm-url]: https://npmjs.org/package/module-watcher
[node-version-image]: https://img.shields.io/node/v/module-watcher.svg
[node-version-url]: http://nodejs.org/download/
[downloads-image]: https://img.shields.io/npm/dm/module-watcher.svg
[downloads-url]: https://npmjs.org/package/module-watcher
[travis-ci-image]: https://travis-ci.org/aui/module-watcher.svg?branch=master
[travis-ci-url]: https://travis-ci.org/aui/module-watcher
