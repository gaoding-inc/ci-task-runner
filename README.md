# git-webpack

基于 git 的 webpack 多进程调度器，加速现有构建流程。

* 基于 `·git commit` 按需进行构建任务调度
* 支持按模块目录、多 webpack 实例进行构建
* 支持多线程调度 webpack 实例
* 对现有构建配置无侵入

## 安装

```bash
npm install git-webpack -g
```

## 使用

使用 cd 命令切换到项目目录，运行：

```
git-webpack --init
```

运行上述命令后，会生成模块演示目录以及配置文件 git-webpack.json：

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

