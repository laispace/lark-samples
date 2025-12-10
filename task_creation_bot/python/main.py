import lark_oapi as lark
from lark_oapi.api.im.v1 import *
from lark_oapi.api.task.v2 import *
import json
import os
from datetime import datetime, timedelta

# 创建 Lark 客户端
# Create Lark client
client = lark.Client(
    app_id=os.environ.get("APP_ID"),
    app_secret=os.environ.get("APP_SECRET"),
    domain=os.environ.get("BASE_DOMAIN", "https://open.feishu.cn"),
)

def create_task_from_message(task_title: str, chat_id: str, message_id: str) -> dict:
    """
    根据消息内容创建任务
    Create a task based on message content
    
    Args:
        task_title: 任务标题 / Task title
        chat_id: 会话ID / Chat ID
        message_id: 消息ID / Message ID
        
    Returns:
        dict: 任务创建结果 / Task creation result
    """
    try:
        # 验证任务标题
        # Validate task title
        if not task_title or not task_title.strip():
            return {
                "success": False,
                "message": "任务标题不能为空 / Task title cannot be empty"
            }
        
        # 设置任务截止时间（24小时后）
        # Set task due time (24 hours later)
        due_time = datetime.utcnow() + timedelta(days=1)
        due_time_str = due_time.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # 调用飞书任务 API 创建任务
        # Call Lark Task API to create task
        # https://open.feishu.cn/document/server-docs/task-v2/task/create
        request = CreateTaskRequest.builder()\
            .request_body(
                CreateTaskRequestBody.builder()\
                    .summary(task_title)\
                    .description(f"来自消息的任务 / Task from message\n消息ID / Message ID: {message_id}")\
                    .due(
                        TaskDue.builder()\
                            .time(due_time_str)\
                            .build()
                    )\
                    .build()
            ).build()
        
        response = client.task.v2.task.create(request)
        
        if response.success():
            task_id = response.data.task.id if response.data and response.data.task else None
            return {
                "success": True,
                "message": f"✅ 任务创建成功 / Task created successfully\n任务: {task_title}",
                "task_id": task_id
            }
        else:
            return {
                "success": False,
                "message": f"❌ 创建任务失败 / Failed to create task: {response.msg}"
            }
            
    except Exception as error:
        print(f"创建任务失败 / Failed to create task: {str(error)}")
        return {
            "success": False,
            "message": f"❌ 创建任务失败 / Failed to create task: {str(error)}"
        }

# 注册接收消息事件，处理接收到的消息。
# Register event handler to handle received messages.
# https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/events/receive
def do_p2_im_message_receive_v1(data: P2ImMessageReceiveV1) -> None:
    res_content = ""
    task_result = None
    
    try:
        if data.event.message.message_type == "text":
            message_content = json.loads(data.event.message.content)
            text = message_content.get("text", "")
            
            # 检查消息是否包含任务创建指令
            # Check if message contains task creation instruction
            if "创建任务:" in text or "create task:" in text.lower():
                # 提取任务标题
                # Extract task title
                if "创建任务:" in text:
                    task_title = text.split("创建任务:")[1].strip()
                else:
                    task_title = text.split("create task:")[1].strip()
                
                # 创建任务
                # Create task
                task_result = create_task_from_message(
                    task_title,
                    data.event.message.chat_id,
                    data.event.message.message_id
                )
                res_content = task_result["message"]
            else:
                res_content = f"收到消息: {text}\n\n💡 提示: 发送 \"创建任务: [任务标题]\" 来创建任务\nTip: Send \"create task: [task title]\" to create a task"
        else:
            res_content = "只支持文本消息 / Only text messages are supported"
            
    except Exception as error:
        print(f"处理消息失败 / Error processing message: {str(error)}")
        res_content = "处理消息失败，请发送文本消息 / Failed to process message, please send text message"

    content = json.dumps({"text": res_content})

    try:
        if data.event.message.chat_type == "p2p":
            request = (
                CreateMessageRequest.builder()
                .receive_id_type("chat_id")
                .request_body(
                    CreateMessageRequestBody.builder()
                    .receive_id(data.event.message.chat_id)
                    .msg_type("text")
                    .content(content)
                    .build()
                )
                .build()
            )
            # 使用OpenAPI发送消息
            # Use send OpenAPI to send messages
            # https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create
            response = client.im.v1.message.create(request)

            if not response.success():
                raise Exception(
                    f"client.im.v1.message.create failed, code: {response.code}, msg: {response.msg}, log_id: {response.get_log_id()}"
                )
        else:
            request: ReplyMessageRequest = (
                ReplyMessageRequest.builder()
                .message_id(data.event.message.message_id)
                .request_body(
                    ReplyMessageRequestBody.builder()
                    .msg_type("text")
                    .content(content)
                    .build()
                )
                .build()
            )
            # 使用OpenAPI回复消息
            # Use send OpenAPI to reply messages
            # https://open.feishu.cn/document/server-docs/im-v1/message/reply
            response = client.im.v1.message.reply(request)

            if not response.success():
                raise Exception(
                    f"client.im.v1.message.reply failed, code: {response.code}, msg: {response.msg}, log_id: {response.get_log_id()}"
                )
    except Exception as error:
        print(f"发送消息失败 / Failed to send message: {str(error)}")


# 注册事件处理器
# Register event handler
event_handler = lark.EventDispatcherHandler.builder() \
    .register_p2_im_message_receive_v1_handler(do_p2_im_message_receive_v1) \
    .build()

# 启动飞书WebSocket客户端
# Start Lark WebSocket client
ws_client = lark.WSClient(
    app_id=os.environ.get("APP_ID"),
    app_secret=os.environ.get("APP_SECRET"),
    domain=os.environ.get("BASE_DOMAIN", "https://open.feishu.cn"),
    event_handler=event_handler,
)

if __name__ == "__main__":
    print("任务创建机器人已启动 / Task creation bot started...")
    ws_client.start()
