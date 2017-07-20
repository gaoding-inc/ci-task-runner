## v1.0.4

1. 修复日志太多可能产生的溢出问题 [#11](https://github.com/huanleguang/ci-task-runner/issues/11)

## v1.0.3

1. 修复子进程意外退出后的错误信息显示

## v1.0.2

1. 修复运行 `npm` 命令可能报 “Maximum call stack size exceeded” 问题

## v1.0.1

1. 使用 `npm-run-path` 来设置环境变量，避免跨平台 bug
2. `options.cache` 如果没有设置，则在 node_modules/.cache/ci-task-runner 中添加缓存
