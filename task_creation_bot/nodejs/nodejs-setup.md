# 任务创建机器人 / Task Creation Bot

## 简介 / Introduction

这是一个飞书任务创建机器人，用户可以发送消息给机器人，机器人会自动创建相应的飞书任务。

This is a Lark task creation bot that automatically creates Lark tasks based on user messages.

## 功能 / Features

- 🤖 接收消息并自动创建任务 / Receive messages and automatically create tasks
- 💬 支持私聊和群组 / Support for direct messages and group chats
- ✅ 任务创建成功提示 / Success notification after task creation
- 📅 自动设置24小时后的任务截止时间 / Automatically set task due time to 24 hours later

## 使用方法 / Usage

### 启动机器人 / Start the bot

#### macOS/Linux:
```bash
APP_ID=<your_app_id> APP_SECRET=<your_app_secret> ./bootstrap.sh
```

#### Windows:
```cmd
set APP_ID=<your_app_id>
set APP_SECRET=<your_app_secret>
bootstrap.bat
```

### 创建任务 / Create tasks

向机器人发送以下格式的消息:

Send messages to the bot in the following format:

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
| `创建任务: 修复登录bug` | 创建一个标题为"修复登录bug"的任务 / Creates a task titled "Fix login bug" |
| `create task: Review code` | 创建一个标题为"Review code"的任务 / Creates a task titled "Review code" |
| `hello` | 机器人回复并提示如何创建任务 / Bot replies with instructions on how to create tasks |

## 必要权限 / Required Permissions

- `im:message` - 接收和发送消息 / Receive and send messages
- `task:task:write` - 创建任务 / Create tasks
- `task:task:read` - 读取任务 / Read tasks

## 任务创建 API / Task Creation API

机器人使用以下 API 创建任务:

The bot uses the following API to create tasks:

**Endpoint:** `POST /open-apis/task/v2/tasks`

**Documentation:** https://open.feishu.cn/document/server-docs/task-v2/task/create

### 请求参数 / Request Parameters

```json
{
  "summary": "任务标题",
  "description": "任务描述 (可选)",
  "due": {
    "time": "2024-12-11T10:30:00Z"
  }
}
```

### 返回示例 / Response Example

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "task": {
      "id": "task_id_xxx",
      "summary": "完成项目文档",
      "status": "todo",
      ...
    }
  }
}
```

## 代码结构 / Code Structure

```
task_creation_bot/nodejs/
├── index.js              # 主程序 / Main application
├── package.json          # 项目配置 / Project configuration
├── bootstrap.sh          # Linux/macOS启动脚本 / Linux/macOS startup script
├── bootstrap.bat         # Windows启动脚本 / Windows startup script
└── nodejs-setup.md       # 本文档 / This documentation
```

## 核心代码逻辑 / Core Logic

### 1. 消息接收 / Message Reception

机器人通过 WebSocket 连接接收飞书消息事件:
The bot receives Lark message events through WebSocket connection:

```javascript
'im.message.receive_v1': async (data) => {
  // 处理消息 / Process message
}
```

### 2. 任务识别 / Task Recognition

检查消息是否包含任务创建指令:
Check if message contains task creation instruction:

```javascript
if (text.includes('创建任务:') || text.includes('create task:')) {
  // 创建任务 / Create task
}
```

### 3. 任务创建 / Task Creation

调用飞书任务 API:
Call Lark Task API:

```javascript
await client.task.v2.task.create({
  data: {
    summary: taskTitle,
    description: '任务描述',
    due: { time: '...' }
  }
})
```

### 4. 回复消息 / Reply Message

向用户发送成功/失败信息:
Send success/failure message to user:

```javascript
await client.im.v1.message.create({
  // 消息内容 / Message content
})
```

## 故障排除 / Troubleshooting

### 问题: 任务创建失败 / Problem: Task creation failed

**可能原因 / Possible reasons:**
1. 应用未获得 `task:task:write` 权限 / App doesn't have `task:task:write` permission
2. AppID 或 AppSecret 配置错误 / AppID or AppSecret is incorrect
3. 飞书 API 服务不可用 / Lark API service is unavailable

**解决方案 / Solutions:**
1. 检查应用权限配置 / Check app permission configuration
2. 验证环境变量 / Verify environment variables
3. 查看错误日志 / Check error logs

### 问题: 机器人没有回复 / Problem: Bot doesn't reply

**可能原因 / Possible reasons:**
1. WebSocket 连接断开 / WebSocket connection dropped
2. 消息接收事件未正确注册 / Message reception event not properly registered

**解决方案 / Solutions:**
1. 检查网络连接 / Check network connection
2. 重启机器人 / Restart the bot
3. 查看控制台日志 / Check console logs

## 参考资源 / References

- [飞书开发文档](https://open.feishu.cn/document/)
- [任务 API 文档](https://open.feishu.cn/document/server-docs/task-v2/task/create)
- [消息 API 文档](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create)
- [Lark Node SDK](https://github.com/larksuite/node-sdk)

---

**Version:** 1.0.0  
**Last Updated:** 2024-12-10  
**License:** MIT
