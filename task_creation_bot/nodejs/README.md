# 任务创建机器人 / Task Creation Bot

一个快速上手的飞书任务创建机器人示例，展示如何集成飞书消息 API 和任务 API。

A quick-start Lark task creation bot example demonstrating how to integrate Lark message API and task API.

## 效果演示 / Demo

- 📬 用户向机器人发送消息: `创建任务: 完成项目文档`
- ✅ 机器人自动创建一个飞书任务
- 💬 机器人回复用户创建成功

## 快速开始 / Quick Start

### 环境要求 / Requirements

- Node.js 14+
- npm 或 yarn

### 启动步骤 / Steps

**macOS/Linux:**
```bash
APP_ID=<app_id> APP_SECRET=<app_secret> ./bootstrap.sh
```

**Windows:**
```cmd
set APP_ID=<app_id>&set APP_SECRET=<app_secret>&bootstrap.bat
```

### 获取 APP_ID 和 APP_SECRET

1. 访问 [飞书开发者后台](https://open.feishu.cn/app)
2. 创建新应用或使用现有应用
3. 在 "凭证与基本信息" 页面获取 AppID 和 AppSecret
4. 配置机器人的事件订阅
5. 订阅 `im.message.receive_v1` 事件
6. 获得所需权限: `im:message`, `task:task:write`, `task:task:read`

## 主要功能 / Main Features

### 1. 接收消息 / Message Reception
```javascript
'im.message.receive_v1': async (data) => {
  // 接收用户消息 / Receive user messages
}
```

### 2. 智能识别 / Intelligent Recognition
```javascript
if (text.includes('创建任务:')) {
  // 识别任务创建指令 / Recognize task creation command
}
```

### 3. 创建任务 / Task Creation
```javascript
await client.task.v2.task.create({
  data: {
    summary: taskTitle,      // 任务标题
    description: '...',      // 任务描述
    due: { time: '...' }     // 截止时间
  }
})
```

### 4. 反馈回复 / Feedback Reply
```javascript
await client.im.v1.message.create({
  // 向用户回复消息 / Reply to user
})
```

## 消息格式 / Message Format

### 创建任务 / Create Task

**中文:**
```
创建任务: 任务标题
```

**English:**
```
create task: task title
```

### 示例 / Examples

```
创建任务: 完成项目文档
create task: Review pull requests
创建任务: 修复登录页面bug
```

## API 集成 / API Integration

### 消息 API / Message API
- **事件:** `im.message.receive_v1` - 接收消息
- **接口:** `POST /open-apis/im/v1/messages` - 发送消息

### 任务 API / Task API  
- **接口:** `POST /open-apis/task/v2/tasks` - 创建任务
- **文档:** https://open.feishu.cn/document/server-docs/task-v2/task/create

## 扩展示例 / Extension Examples

### 添加任务优先级 / Add Task Priority
```javascript
// 识别优先级关键字
if (text.includes('urgent') || text.includes('紧急')) {
  // 设置高优先级
  priority = 'high';
}
```

### 添加分配人 / Add Assignee
```javascript
// 从消息中提取分配人
const assigneeMatch = text.match(/@(\w+)/);
if (assigneeMatch) {
  // 分配任务给指定用户
  assignees = [assigneeMatch[1]];
}
```

### 添加任务标签 / Add Task Tags
```javascript
// 从消息中提取标签
const tags = text.match(/#(\w+)/g) || [];
// 为任务添加标签
```

## 项目结构 / Project Structure

```
task_creation_bot/nodejs/
├── index.js              # 主应用文件
├── package.json          # 项目依赖配置
├── bootstrap.sh          # Linux/macOS 启动脚本
├── bootstrap.bat         # Windows 启动脚本
├── README.md             # 项目说明（英文）
└── nodejs-setup.md       # 项目说明（中文+详细）
```

## 环境变量 / Environment Variables

| 变量 / Variable | 说明 / Description | 默认值 / Default |
|---|---|---|
| `APP_ID` | 飞书应用 ID / Lark App ID | - |
| `APP_SECRET` | 飞书应用密钥 / Lark App Secret | - |
| `BASE_DOMAIN` | 飞书 API 域名 / Lark API Domain | `https://open.feishu.cn` |

## 权限要求 / Required Permissions

| 权限 / Permission | 说明 / Description |
|---|---|
| `im:message` | 接收和发送消息 / Receive and send messages |
| `task:task:write` | 创建和修改任务 / Create and modify tasks |
| `task:task:read` | 读取任务 / Read tasks |

## 常见问题 / FAQ

**Q: 如何修改任务的截止时间?**
A: 修改代码中的 `due.time` 字段。当前设置为发送消息后 24 小时。

**Q: 如何将任务分配给特定用户?**
A: 在 `createTaskFromMessage` 函数中添加 `assignees` 字段并填入用户 ID。

**Q: 如何添加更多的消息类型支持?**
A: 在 `eventDispatcher.register` 中添加新的事件处理器。

## 参考资源 / References

- [飞书开发者文档](https://open.feishu.cn/document/)
- [消息 API](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create)
- [任务 API](https://open.feishu.cn/document/server-docs/task-v2/task/create)
- [Node SDK](https://github.com/larksuite/node-sdk)

---

**License:** MIT  
**Version:** 1.0.0
