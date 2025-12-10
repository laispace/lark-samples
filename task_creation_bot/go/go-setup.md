# 任务创建机器人 - Go 实现 / Task Creation Bot - Go Implementation

## 简介 / Introduction

这是飞书任务创建机器人的 Go 语言版本实现。

This is the Go implementation of the Lark task creation bot.

## 快速开始 / Quick Start

### macOS/Linux:
```bash
APP_ID=<app_id> APP_SECRET=<app_secret> ./bootstrap.sh
```

### Windows:
```cmd
set APP_ID=<app_id>&set APP_SECRET=<app_secret>&bootstrap.bat
```

## 功能 / Features

- 🤖 接收消息并自动创建任务 / Receive messages and automatically create tasks
- 💬 支持私聊和群组 / Support for direct messages and group chats
- ✅ 任务创建成功提示 / Success notification after task creation
- 📅 自动设置24小时后的任务截止时间 / Automatically set task due time to 24 hours later

## 主要代码 / Main Code

### 任务创建函数 / Task Creation Function

```go
func createTaskFromMessage(ctx context.Context, client *lark.Client, taskTitle string, chatID string, messageID string) string {
    req := larktask.NewCreateTaskReqBuilder().
        Body(larktask.NewCreateTaskReqBodyBuilder().
            Summary(taskTitle).
            Due(larktask.NewTaskDueBuilder().
                Time(time.Now().Add(24*time.Hour).Format(time.RFC3339)).
                Build()).
            Build()).
        Build()
    
    resp, err := client.Task.V2.Task.Create(ctx, req)
    // ...
}
```

### 消息处理 / Message Handler

```go
OnP2MessageReceiveV1(func(ctx context.Context, event *larkim.P2MessageReceiveV1) error {
    // 识别"创建任务:"指令
    if strings.Contains(messageText, "创建任务:") {
        taskResult := createTaskFromMessage(ctx, client, taskTitle, ...)
    }
})
```

## 详细文档 / Full Documentation

请查看 [nodejs-setup.md](../nodejs/nodejs-setup.md) 了解完整的功能和 API 文档说明。
