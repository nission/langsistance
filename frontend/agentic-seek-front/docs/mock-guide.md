# Mock功能使用指南

## 概述

本项目集成了Mock Service Worker (MSW)来提供接口mock功能，方便在开发和测试环境中模拟后端API响应，而无需实际运行后端服务。

## 启用Mock功能

Mock功能可以通过环境变量控制：

1. **开发环境**：在`.env.development`文件中设置`REACT_APP_MOCK_API=true`来启用mock功能
2. **测试环境**：在`.env.test`文件中设置`REACT_APP_MOCK_API_FORCE=true`来强制启用mock功能

## Mock数据

所有mock数据都定义在`src/mocks/handlers.js`文件中，包括以下接口的模拟响应：

- `/latest_answer` - 获取最新答案
- `/health` - 健康检查
- `/stop` - 停止处理
- `/query` - 查询接口
- `/query_public_knowledge` - 查询公开知识
- `/query_public_tools` - 查询公开工具
- `/copy_knowledge` - 复制知识

## 自定义Mock数据

要自定义mock数据，可以修改`src/mocks/handlers.js`文件中的相应处理程序。每个处理程序都定义了请求URL和响应数据。

例如，修改`/latest_answer`接口的mock数据：

```javascript
http.get('/latest_answer', () => {
  return HttpResponse.json({
    answer: "这是自定义的mock回答",
    reasoning: "这是自定义的推理过程",
    agent_name: "CustomMockAgent",
    status: "已完成",
    uid: "custom-mock-uid"
  })
})
```

## 禁用Mock功能

要禁用mock功能，可以：

1. 在`.env.development`文件中将`REACT_APP_MOCK_API`设置为`false`或删除该变量
2. 确保后端服务正在运行并可访问

## 测试Mock功能

可以使用`src/mocks/test-mock.js`文件中的测试函数来验证mock功能是否正常工作。该文件包含了一些基本的API测试用例。

## 注意事项

1. Mock功能仅在开发和测试环境中使用，生产环境中不会启用
2. 当mock功能启用时，所有匹配的API请求都会被拦截并返回mock数据
3. 可以根据需要添加新的mock接口或修改现有接口的响应数据