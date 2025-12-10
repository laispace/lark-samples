# 任务创建机器人 / Task Creation Bot

一个功能完整的飞书任务创建机器人，支持多种编程语言实现。

A fully-featured Lark task creation bot with implementations in multiple programming languages.

## 概览 / Overview

这个项目展示了如何构建一个飞书机器人，能够：
- 🤖 接收用户消息
- 🎯 识别任务创建指令
- 📝 自动创建飞书任务
- 💬 向用户反馈执行结果

This project demonstrates how to build a Lark bot that can:
- 🤖 Receive user messages
- 🎯 Recognize task creation instructions
- 📝 Automatically create Lark tasks
- 💬 Provide feedback to users

## 工作流程 / Workflow

```
用户发送消息 / User sends message
    ↓
机器人接收消息事件 / Bot receives message event
    ↓
检查消息格式 / Check message format
    ↓
是否包含"创建任务:"? / Contains "create task:"?
    ├─ 是 / Yes → 提取任务标题 / Extract task title
    │              ↓
    │              调用任务API / Call Task API
    │              ↓
    │              回复成功消息 / Reply success message
    │
    └─ 否 / No  → 回复提示信息 / Reply with instructions
```

## 支持的实现 / Supported Implementations

| 语言 / Language | 文档 / Documentation | 启动命令 / Start Command |
|---|---|---|
| **Node.js** | [nodejs-setup.md](nodejs/nodejs-setup.md) | `APP_ID=xxx APP_SECRET=xxx ./nodejs/bootstrap.sh` |
| **Python** | [python-setup.md](python/python-setup.md) | `APP_ID=xxx APP_SECRET=xxx ./python/bootstrap.sh` |
| **Go** | [go-setup.md](go/go-setup.md) | `APP_ID=xxx APP_SECRET=xxx ./go/bootstrap.sh` |

## 快速开始 / Quick Start

### 前置要求 / Prerequisites

1. 一个飞书应用账号 / A Lark application account
2. 获取应用的 AppID 和 AppSecret
3. 配置相应的权限和事件订阅

### 使用示例 / Usage Example

#### Node.js
```bash
cd nodejs
APP_ID=your_app_id APP_SECRET=your_app_secret ./bootstrap.sh
```

#### Python
```bash
cd python
APP_ID=your_app_id APP_SECRET=your_app_secret ./bootstrap.sh
```

#### Go
```bash
cd go
APP_ID=your_app_id APP_SECRET=your_app_secret ./bootstrap.sh
```

## 消息格式 / Message Format

### 创建任务 / Create Task

**中文 / Chinese:**
```
创建任务: 完成项目文档
```

**English:**
```
create task: Complete project documentation
```

### 示例 / Examples

| 消息 / Message | 结果 / Result |
|---|---|
| `创建任务: 修复登录bug` | 创建标题为"修复登录bug"的任务 |
| `create task: Review pull requests` | Creates task titled "Review pull requests" |
| `Hello bot` | 机器人回复并提示如何创建任务 |

## 应用配置 / Application Configuration

### 所需权限 / Required Permissions

- `im:message` - 接收和发送消息 / Receive and send messages
- `task:task:write` - 创建和修改任务 / Create and modify tasks
- `task:task:read` - 读取任务 / Read tasks

### 事件订阅 / Event Subscription

订阅以下事件 / Subscribe to the following events:
- `im.message.receive_v1` - 接收消息事件 / Message reception event

## 核心功能 / Core Features

### 1. 消息接收 / Message Reception
```javascript
// Node.js 示例
'im.message.receive_v1': async (data) => {
  const { message: { content, message_type } } = data;
  // 处理消息
}
```

### 2. 消息解析 / Message Parsing
```javascript
// 解析文本内容并检查是否包含创建任务指令
if (text.includes('创建任务:')) {
  const taskTitle = text.split('创建任务:')[1].trim();
}
```

### 3. 任务创建 / Task Creation
```javascript
// 调用飞书任务 API
await client.task.v2.task.create({
  data: {
    summary: taskTitle,
    description: '任务描述',
    due: { time: '2024-12-11T10:30:00Z' }
  }
});
```

### 4. 用户反馈 / User Feedback
```javascript
// 向用户发送执行结果
await client.im.v1.message.create({
  data: {
    receive_id: chat_id,
    msg_type: 'text',
    content: JSON.stringify({ text: '✅ 任务创建成功' })
  }
});
```

## API 参考 / API Reference

### 消息事件 / Message Event
- **事件类型 / Event Type:** `im.message.receive_v1`
- **文档 / Documentation:** https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/events/receive

### 创建任务 / Create Task
- **Endpoint:** `POST /open-apis/task/v2/tasks`
- **文档 / Documentation:** https://open.feishu.cn/document/server-docs/task-v2/task/create

### 发送消息 / Send Message
- **Endpoint:** `POST /open-apis/im/v1/messages`
- **文档 / Documentation:** https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create

## 项目结构 / Project Structure

```
task_creation_bot/
├── nodejs/              # Node.js 实现
│   ├── index.js
│   ├── package.json
│   ├── bootstrap.sh
│   ├── bootstrap.bat
│   ├── README.md
│   └── nodejs-setup.md
├── python/              # Python 实现
│   ├── main.py
│   ├── requirements.txt
│   ├── bootstrap.sh
│   ├── bootstrap.bat
│   └── python-setup.md
├── go/                  # Go 实现
│   ├── main.go
│   ├── go.mod
│   ├── bootstrap.sh
│   ├── bootstrap.bat
│   └── go-setup.md
└── README.md            # 本文档
```

## 扩展功能 / Advanced Features

### 添加优先级支持 / Add Priority Support
```javascript
// 识别优先级关键字
const isPriority = text.includes('紧急') || text.includes('urgent');
const priority = isPriority ? 'high' : 'medium';
```

### 添加分配功能 / Add Assignment
```javascript
// 从消息中提取@用户信息
const assignee = text.match(/@(\w+)/)?.[1];
```

### 添加标签支持 / Add Tags
```javascript
// 从消息中提取标签
const tags = text.match(/#(\w+)/g) || [];
```

### 多人创建 / Multiple Task Creation
```javascript
// 支持一次创建多个任务
const tasks = text.split('\n').filter(line => line.includes('创建任务:'));
for (const taskLine of tasks) {
  const title = taskLine.split('创建任务:')[1].trim();
  await createTask(title);
}
```

## 故障排除 / Troubleshooting

### 问题: 机器人未收到消息
**Problem:** Bot doesn't receive messages

**原因 / Cause:**
- 事件订阅未正确配置 / Event subscription not properly configured
- WebSocket 连接断开 / WebSocket connection dropped

**解决方案 / Solution:**
1. 检查飞书开发者后台的事件订阅配置 / Check event subscription in Lark developer console
2. 重启机器人 / Restart the bot
3. 查看控制台日志 / Check console logs

### 问题: 任务创建失败
**Problem:** Task creation fails

**原因 / Cause:**
- 缺少 `task:task:write` 权限 / Missing `task:task:write` permission
- AppID 或 AppSecret 错误 / Incorrect AppID or AppSecret
- 飞书 API 服务不可用 / Lark API service unavailable

**解决方案 / Solution:**
1. 验证应用权限配置 / Verify application permissions
2. 检查环境变量 / Check environment variables
3. 查看错误日志获取详细信息 / Check error logs for details

### 问题: 消息无法发送
**Problem:** Cannot send reply message

**原因 / Cause:**
- 缺少 `im:message` 权限 / Missing `im:message` permission
- 网络连接问题 / Network connection issue

**解决方案 / Solution:**
1. 确保应用有 `im:message` 权限 / Ensure app has `im:message` permission
2. 检查网络连接 / Check network connection
3. 检查接收者 ID 是否正确 / Verify recipient ID is correct

## 性能优化建议 / Performance Tips

1. **并发处理 / Concurrent Processing:**
   - 使用异步/await 处理多个消息
   - Use async/await to handle multiple messages concurrently

2. **错误处理 / Error Handling:**
   - 为所有 API 调用添加重试机制
   - Add retry mechanism for all API calls

3. **日志记录 / Logging:**
   - 记录所有重要事件 / Log all important events
   - 便于调试和监控 / Facilitate debugging and monitoring

4. **缓存 / Caching:**
   - 缓存用户信息和权限 / Cache user info and permissions
   - 减少 API 调用 / Reduce API calls

## 参考资源 / References

- [飞书开发者文档](https://open.feishu.cn/document/)
- [飞书 Open API SDK - Node.js](https://github.com/larksuite/node-sdk)
- [飞书 Open API SDK - Python](https://github.com/larksuite/python-sdk)
- [飞书 Open API SDK - Go](https://github.com/larksuite/oapi-sdk-go)
- [任务 API 文档](https://open.feishu.cn/document/server-docs/task-v2/task/create)
- [消息 API 文档](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create)

## 许可证 / License

MIT License

## 贡献 / Contributing

欢迎提交 Issue 和 Pull Request / Contributions are welcome!

---

**更新时间 / Last Updated:** 2024-12-10  
**版本 / Version:** 1.0.0
