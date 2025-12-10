```javascript
import * as Lark from '@larksuiteoapi/node-sdk';

/**
 * 配置应用基础信息和请求域名。
 * App base information and request domain name.
 */
const baseConfig = {
  // 应用的 AppID, 你可以在开发者后台获取。 AppID of the application, you can get it in the developer console.
  appId: process.env.APP_ID,
  // 应用的 AppSecret，你可以在开发者后台获取。 AppSecret of the application, you can get it in the developer console.
  appSecret: process.env.APP_SECRET,
  // 请求域名，如：https://open.feishu.cn。 Request domain name, such as https://open.feishu.cn.
  domain: process.env.BASE_DOMAIN || 'https://open.feishu.cn',
};

/**
 * 创建 LarkClient 对象，用于请求OpenAPI, 并创建 LarkWSClient 对象，用于使用长连接接收事件。
 * Create LarkClient object for requesting OpenAPI, and create LarkWSClient object for receiving events using long connection.
 */
const client = new Lark.Client(baseConfig);
const wsClient = new Lark.WSClient(baseConfig);

/**
 * 根据消息内容创建任务
 * Create a task based on message content
 * 
 * 消息格式: "创建任务: 任务标题"
 * Message format: "创建任务: 任务标题"
 * 
 * @param {string} content 消息内容 / Message content
 * @param {string} chatId 会话ID / Chat ID
 * @param {string} messageId 消息ID / Message ID
 * @returns {Promise<Object>} 任务创建结果 / Task creation result
 */
async function createTaskFromMessage(content, chatId, messageId) {
  try {
    // 从消息中提取任务标题
    // Extract task title from message
    const taskTitle = content.trim();

    if (!taskTitle) {
      return {
        success: false,
        message: '任务标题不能为空 / Task title cannot be empty',
      };
    }

    /**
     * 调用飞书任务API创建任务
     * Call Lark Task API to create task
     * API文档: https://open.feishu.cn/document/server-docs/task-v2/task/create
     */
    const response = await client.task.v2.task.create({
      data: {
        summary: taskTitle,
        description: `来自消息的任务 / Task from message\n消息ID / Message ID: ${messageId}`,
        due: {
          time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 设置为明天 / Set to tomorrow
        },
      },
    });

    return {
      success: true,
      message: `✅ 任务创建成功 / Task created successfully\n任务: ${taskTitle}`,
      taskId: response.data?.task?.id,
    };
  } catch (error) {
    console.error('创建任务失败 / Failed to create task:', error);
    return {
      success: false,
      message: `❌ 创建任务失败 / Failed to create task: ${error.message}`,
    };
  }
}

/**
 * 注册事件处理器。
 * Register event handler.
 */
const eventDispatcher = new Lark.EventDispatcher({}).register({
  /**
   * 注册接收消息事件，处理接收到的消息。
   * Register event handler to handle received messages.
   * https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/events/receive
   */
  'im.message.receive_v1': async (data) => {
    const {
      message: { chat_id, content, message_type, chat_type, message_id },
    } = data;

    console.log('收到消息 / Received message:', { chat_type, message_type });

    let responseText = '';
    let taskResult = null;

    try {
      if (message_type !== 'text') {
        responseText = '只支持文本消息 / Only text messages are supported';
      } else {
        const messageContent = JSON.parse(content);
        const text = messageContent.text;

        // 检查消息是否以"创建任务:"开头
        // Check if message starts with "创建任务:" or "create task:"
        if (text.toLowerCase().includes('创建任务:') || text.toLowerCase().includes('create task:')) {
          let taskTitle = text;

          // 提取任务标题
          // Extract task title
          if (text.includes('创建任务:')) {
            taskTitle = text.split('创建任务:')[1].trim();
          } else if (text.includes('create task:')) {
            taskTitle = text.split('create task:')[1].trim();
          }

          // 创建任务
          // Create task
          taskResult = await createTaskFromMessage(taskTitle, chat_id, message_id);
          responseText = taskResult.message;
        } else {
          responseText = `收到消息: ${text}\n\n💡 提示: 发送 "创建任务: [任务标题]" 来创建任务\nTip: Send "create task: [task title]" to create a task`;
        }
      }
    } catch (error) {
      console.error('处理消息失败 / Error processing message:', error);
      responseText = '处理消息失败，请发送文本消息 / Failed to process message, please send text message';
    }

    try {
      if (chat_type === 'p2p') {
        /**
         * 使用SDK调用发送消息接口。 Use SDK to call send message interface.
         * https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create
         */
        await client.im.v1.message.create({
          params: {
            receive_id_type: 'chat_id', // 消息接收者的 ID 类型，设置为会话ID。 ID type of the message receiver, set to chat ID.
          },
          data: {
            receive_id: chat_id, // 消息接收者的 ID 为消息发送的会话ID。 ID of the message receiver is the chat ID of the message sending.
            content: JSON.stringify({ text: responseText }),
            msg_type: 'text', // 设置消息类型为文本消息。 Set message type to text message.
          },
        });
      } else {
        /**
         * 使用SDK调用回复消息接口。 Use SDK to call reply message interface.
         * https://open.feishu.cn/document/server-docs/im-v1/message/reply
         */
        await client.im.v1.message.reply({
          path: {
            message_id: message_id, // 要回复的消息 ID。 Message ID to reply.
          },
          data: {
            content: JSON.stringify({ text: responseText }),
            msg_type: 'text', // 设置消息类型为文本消息。 Set message type to text message.
          },
        });
      }
    } catch (error) {
      console.error('发送消息失败 / Failed to send message:', error);
    }
  },
});

/**
 * 启动长连接，并注册事件处理器。
 * Start long connection and register event handler.
 */
wsClient.start({ eventDispatcher });

console.log('任务创建机器人已启动 / Task creation bot started...');
```
