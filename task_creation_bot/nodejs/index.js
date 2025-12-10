import * as Lark from '@larksuiteoapi/node-sdk';

/**
 * Config from env
 */
const baseConfig = {
  appId: process.env.APP_ID,
  appSecret: process.env.APP_SECRET,
  domain: process.env.BASE_DOMAIN || 'https://open.feishu.cn',
};

const client = new Lark.Client(baseConfig);
const wsClient = new Lark.WSClient(baseConfig);

/**
 * Create a task based on message content
 */
async function createTaskFromMessage(content, chatId, messageId) {
  try {
    const taskTitle = (content || '').trim();
    if (!taskTitle) {
      return { success: false, message: '任务标题不能为空 / Task title cannot be empty' };
    }

    console.log(`📝 Creating task: "${taskTitle}"`);

    // due time: 24 hours later (seconds)
    const dueTimeSeconds = Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000);

    // Use `due.timestamp` as required by the API (seconds)
    const response = await client.task.v2.task.create({
      data: {
        summary: taskTitle,
        description: `Task from message\nMessage ID: ${messageId}`,
        due: {
          timestamp: dueTimeSeconds,
        },
      },
    });

    console.log('✅ Task created, response:', response?.data || response);
    return { success: true, message: '任务创建成功', taskId: response.data?.task?.id };
  } catch (error) {
    // Print detailed error info for debugging
    console.error('Failed to create task:', error.message || error);
    if (error.response && error.response.data) {
      console.error('API error response:', JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, message: error.response?.data || error.message || String(error) };
  }
}

/**
 * Event handling
 */
const eventDispatcher = new Lark.EventDispatcher({}).register({
  'im.message.receive_v1': async (data) => {
    try {
      const message = data?.message || {};
      const messageId = message.message_id;
      const chatId = message.chat_id;
      const contentRaw = message.content || '';

      console.log('\n📬 Received message', { messageId, chatId, contentRaw });

      // message.content is usually a JSON string like {"text":"..."}
      let text = '';
      try {
        const parsed = JSON.parse(contentRaw);
        text = parsed.text || '';
      } catch (e) {
        // fallback: use raw content
        text = contentRaw;
      }

      let taskTitle = null;
      if (text.includes('创建任务:')) {
        taskTitle = text.split('创建任务:')[1]?.trim();
      } else if (/create task:/i.test(text)) {
        taskTitle = text.split(/create task:/i)[1]?.trim();
      }

      if (!taskTitle) {
        console.log('No task creation instruction detected.');
        return;
      }

      console.log('Task request detected:', taskTitle);
      const result = await createTaskFromMessage(taskTitle, chatId, messageId);

      const replyText = result.success
        ? `✅ 成功为您创建了任务："${taskTitle}"`
        : `❌ 创建任务失败：${typeof result.message === 'string' ? result.message : JSON.stringify(result.message)}`;

      // Reply to the original message if message_id is available; otherwise send a new message to the chat.
      try {
        if (messageId) {
          await client.im.v1.message.reply({
            message_id: messageId,
            content: JSON.stringify({ text: replyText }),
            msg_type: 'text',
          });
        } else if (chatId) {
          await client.im.v1.message.create({
            data: {
              receive_id: chatId,
              receive_id_type: 'chat_id',
              content: JSON.stringify({ text: replyText }),
              msg_type: 'text',
            },
          });
        } else {
          console.warn('No message_id or chat_id available to reply to.');
        }
        console.log('Reply sent');
      } catch (sendErr) {
        console.error('Failed to send reply:', sendErr);
      }
    } catch (err) {
      console.error('Error handling event:', err);
    }
  },
});

wsClient.start({ eventDispatcher }).catch((err) => {
  console.error('Failed to start WebSocket client:', err);
});

console.log('🚀 Lark Task Creation Bot started');
console.log(`📍 Domain: ${baseConfig.domain}`);
console.log('⏳ Waiting for messages...');
