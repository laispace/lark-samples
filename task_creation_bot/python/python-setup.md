# 任务创建机器人 - Python 实现 / Task Creation Bot - Python Implementation

## 简介 / Introduction

这是飞书任务创建机器人的 Python 版本实现。

This is the Python implementation of the Lark task creation bot.

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

```python
def create_task_from_message(task_title: str, chat_id: str, message_id: str) -> dict:
    # 调用飞书任务 API
    request = CreateTaskRequest.builder()\
        .request_body(
            CreateTaskRequestBody.builder()\
                .summary(task_title)\
                .due(TaskDue.builder().time(due_time_str).build())\
                .build()
        ).build()
    
    response = client.task.v2.task.create(request)
```

### 消息处理 / Message Handler

```python
def do_p2_im_message_receive_v1(data: P2ImMessageReceiveV1) -> None:
    # 识别"创建任务:"指令
    if "创建任务:" in text or "create task:" in text.lower():
        # 创建任务
        task_result = create_task_from_message(task_title, ...)
```

## 详细文档 / Full Documentation

请查看 [nodejs-setup.md](../nodejs/nodejs-setup.md) 了解完整的功能和 API 文档说明。
