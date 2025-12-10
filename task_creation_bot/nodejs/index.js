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
 * @param {string} content - Task title
 * @param {string} chatId - Chat ID
 * @param {string} messageId - Message ID
 * @param {string|null} assigneeOpenId - Optional: The open_id of the user to assign the task to
 */
async function createTaskFromMessage(content, chatId, messageId, assigneeOpenId = null) {
  try {
    const taskTitle = (content || '').trim();
    if (!taskTitle) {
      return { success: false, message: '任务标题不能为空 / Task title cannot be empty' };
    }

    console.log(`📝 Creating task: "${taskTitle}"${assigneeOpenId ? ` for user: ${assigneeOpenId}` : ''}`);

    // Build task data
    const taskData = {
      summary: taskTitle,
      description: `Task from message\nMessage ID: ${messageId}`,
    };

    // If assignee is specified, add them as a task member
    if (assigneeOpenId) {
      taskData.members = [
        {
          id: assigneeOpenId,
          type: 'user',
          role: 'assignee',
        },
      ];
    }

    // Use `due.timestamp` as required by the API (seconds)
    const response = await client.task.v2.task.create({
      params: { user_id_type: 'open_id' },
      data: taskData,
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
      const sender = data?.sender || {};
      const messageId = message.message_id;
      const chatId = message.chat_id;
      const contentRaw = message.content || '';
      const mentions = message.mentions || []; // @提到的用户列表

      // 获取发送者的 open_id
      const senderOpenId = sender.sender_id?.open_id;

      console.log('\n📬 Received message', { messageId, chatId, contentRaw });
      console.log('📍 Sender:', JSON.stringify(sender, null, 2));
      console.log('📍 Mentions:', JSON.stringify(mentions, null, 2));

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

      // 确定任务执行人：优先使用 @提到的第一个非机器人用户，否则使用发送者
      // mentions 中会包含 @机器人 自己，需要过滤掉
      let assigneeOpenId = null;
      let assigneeName = null;
      
      // 查找被 @ 的用户（排除机器人自己，机器人的 id.user_id 通常与 APP_ID 相关）
      const mentionedUser = mentions.find((m) => m.id?.open_id && m.id?.open_id !== baseConfig.appId);
      if (mentionedUser) {
        assigneeOpenId = mentionedUser.id?.open_id;
        assigneeName = mentionedUser.name;
        console.log(`📌 Task will be assigned to: ${assigneeName} (${assigneeOpenId})`);
      } else if (senderOpenId) {
        // 如果没有 @ 其他用户，任务分配给发送者自己
        assigneeOpenId = senderOpenId;
        assigneeName = '您';
        console.log(`📌 Task will be assigned to sender: ${senderOpenId}`);
      }

      console.log('Task request detected:', taskTitle);
      const result = await createTaskFromMessage(taskTitle, chatId, messageId, assigneeOpenId);

      const replyText = result.success
        ? `✅ 成功创建任务："${taskTitle}"${assigneeName ? `\n👤 执行人：${assigneeName}` : ''}`
        : `❌ 创建任务失败：${typeof result.message === 'string' ? result.message : JSON.stringify(result.message)}`;

      // Reply to the original message if message_id is available; otherwise send a new message to the chat.
      try {
        if (messageId) {
          await client.im.v1.message.reply({
            path: { message_id: messageId },
            data: {
              content: JSON.stringify({ text: replyText }),
              msg_type: 'text',
            },
          });
        } else if (chatId) {
          await client.im.v1.message.create({
            params: { receive_id_type: 'chat_id' },
            data: {
              receive_id: chatId,
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
