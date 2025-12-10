package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	lark "github.com/larksuite/oapi-sdk-go/v3"
	larkcore "github.com/larksuite/oapi-sdk-go/v3/core"
	"github.com/larksuite/oapi-sdk-go/v3/event/dispatcher"
	larkim "github.com/larksuite/oapi-sdk-go/v3/service/im/v1"
	larktask "github.com/larksuite/oapi-sdk-go/v3/service/task/v2"
	larkws "github.com/larksuite/oapi-sdk-go/v3/ws"
)

func main() {
	appID := os.Getenv("APP_ID")
	appSecret := os.Getenv("APP_SECRET")

	/**
	 * 创建 LarkClient 对象，用于请求OpenAPI。
	 * Create LarkClient object for requesting OpenAPI
	 */
	client := lark.NewClient(appID, appSecret)

	/**
	 * 注册事件处理器。
	 * Register event handler.
	 */
	eventHandler := dispatcher.NewEventDispatcher("", "").
		/**
		 * 注册接收消息事件，处理接收到的消息。
		 * Register event handler to handle received messages.
		 * https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/events/receive
		 */
		OnP2MessageReceiveV1(func(ctx context.Context, event *larkim.P2MessageReceiveV1) error {
			fmt.Printf("[OnP2MessageReceiveV1 access], data: %s\n", larkcore.Prettify(event))
			
			/**
			 * 解析用户发送的消息。
			 * Parse the message sent by the user.
			 */
			var respContent map[string]string
			err := json.Unmarshal([]byte(*event.Event.Message.Content), &respContent)
			
			/**
			 * 检查消息类型是否为文本
			 * Check if the message type is text
			 */
			if err != nil || *event.Event.Message.MessageType != "text" {
				respContent = map[string]string{
					"text": "解析消息失败，请发送文本消息\nparse message failed, please send text message",
				}
			} else {
				/**
				 * 处理消息并检查是否需要创建任务
				 * Process message and check if task creation is needed
				 */
				messageText := respContent["text"]
				
				// 检查消息是否包含任务创建指令
				// Check if message contains task creation instruction
				if strings.Contains(messageText, "创建任务:") || strings.Contains(strings.ToLower(messageText), "create task:") {
					// 提取任务标题
					// Extract task title
					var taskTitle string
					if strings.Contains(messageText, "创建任务:") {
						parts := strings.Split(messageText, "创建任务:")
						if len(parts) > 1 {
							taskTitle = strings.TrimSpace(parts[1])
						}
					} else {
						parts := strings.Split(strings.ToLower(messageText), "create task:")
						if len(parts) > 1 {
							taskTitle = strings.TrimSpace(messageText[len("create task:"):])
						}
					}
					
					// 创建任务
					// Create task
					taskResult := createTaskFromMessage(ctx, client, taskTitle, *event.Event.Message.ChatID, *event.Event.Message.MessageID)
					respContent = map[string]string{
						"text": taskResult,
					}
				} else {
					// 提示用户如何创建任务
					// Prompt user how to create task
					respContent = map[string]string{
						"text": fmt.Sprintf("收到消息: %s\n\n💡 提示: 发送 \"创建任务: [任务标题]\" 来创建任务\nTip: Send \"create task: [task title]\" to create a task", messageText),
					}
				}
			}

			/**
			 * 使用SDK调用发送消息接口。
			 * Use SDK to call send message interface.
			 * https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create
			 */
			req := larkim.NewCreateMessageReqBuilder().
				ReceiveIdType("chat_id").
				Body(larkim.NewCreateMessageReqBodyBuilder().
					ReceiveId(*event.Event.Message.ChatID).
					MsgType("text").
					Content(larkcore.MarshalJSON(respContent)).
					Build()).
				Build()

			resp, err := client.Im.V1.Message.Create(ctx, req)
			if err != nil {
				fmt.Printf("send message error, error: %s\n", err)
				return err
			}
			if !resp.Success() {
				fmt.Printf("send message failed, code: %d, msg: %s, log_id: %s\n", resp.Code, resp.Msg, resp.LogID)
				return fmt.Errorf("send message failed")
			}

			return nil
		}).
		OnGroupMessageReceiveV1(func(ctx context.Context, event *larkim.GroupMessageReceiveV1) error {
			fmt.Printf("[OnGroupMessageReceiveV1 access], data: %s\n", larkcore.Prettify(event))
			
			var respContent map[string]string
			err := json.Unmarshal([]byte(*event.Event.Message.Content), &respContent)
			
			if err != nil || *event.Event.Message.MessageType != "text" {
				respContent = map[string]string{
					"text": "解析消息失败，请发送文本消息\nparse message failed, please send text message",
				}
			} else {
				messageText := respContent["text"]
				
				// 检查消息是否包含任务创建指令
				// Check if message contains task creation instruction
				if strings.Contains(messageText, "创建任务:") || strings.Contains(strings.ToLower(messageText), "create task:") {
					// 提取任务标题
					// Extract task title
					var taskTitle string
					if strings.Contains(messageText, "创建任务:") {
						parts := strings.Split(messageText, "创建任务:")
						if len(parts) > 1 {
							taskTitle = strings.TrimSpace(parts[1])
						}
					} else {
						parts := strings.Split(strings.ToLower(messageText), "create task:")
						if len(parts) > 1 {
							taskTitle = strings.TrimSpace(messageText[len("create task:"):])
						}
					}
					
					// 创建任务
					// Create task
					taskResult := createTaskFromMessage(ctx, client, taskTitle, *event.Event.Message.ChatID, *event.Event.Message.MessageID)
					respContent = map[string]string{
						"text": taskResult,
					}
				} else {
					respContent = map[string]string{
						"text": fmt.Sprintf("收到消息: %s\n\n💡 提示: 发送 \"创建任务: [任务标题]\" 来创建任务\nTip: Send \"create task: [task title]\" to create a task", messageText),
					}
				}
			}

			/**
			 * 使用SDK调用回复消息接口。
			 * Use SDK to call reply message interface.
			 * https://open.feishu.cn/document/server-docs/im-v1/message/reply
			 */
			req := larkim.NewReplyMessageReqBuilder().
				MessageId(*event.Event.Message.MessageID).
				Body(larkim.NewReplyMessageReqBodyBuilder().
					MsgType("text").
					Content(larkcore.MarshalJSON(respContent)).
					Build()).
				Build()

			resp, err := client.Im.V1.Message.Reply(ctx, req)
			if err != nil {
				fmt.Printf("reply message error, error: %s\n", err)
				return err
			}
			if !resp.Success() {
				fmt.Printf("reply message failed, code: %d, msg: %s, log_id: %s\n", resp.Code, resp.Msg, resp.LogID)
				return fmt.Errorf("reply message failed")
			}

			return nil
		})

	/**
	 * 启动飞书WebSocket客户端
	 * Start Lark WebSocket client
	 */
	wsClient := larkws.NewClient(appID, appSecret, larkws.WithEventHandler(eventHandler))

	err := wsClient.Start(context.Background())
	if err != nil {
		panic(err)
	}
}

/**
 * createTaskFromMessage 根据消息内容创建任务
 * Create a task based on message content
 */
func createTaskFromMessage(ctx context.Context, client *lark.Client, taskTitle string, chatID string, messageID string) string {
	if taskTitle == "" {
		return "❌ 任务标题不能为空 / Task title cannot be empty"
	}

	/**
	 * 调用飞书任务 API 创建任务
	 * Call Lark Task API to create task
	 * API文档: https://open.feishu.cn/document/server-docs/task-v2/task/create
	 */
	req := larktask.NewCreateTaskReqBuilder().
		Body(larktask.NewCreateTaskReqBodyBuilder().
			Summary(taskTitle).
			Description(fmt.Sprintf("来自消息的任务 / Task from message\n消息ID / Message ID: %s", messageID)).
			Due(larktask.NewTaskDueBuilder().
				Time(time.Now().Add(24*time.Hour).Format(time.RFC3339)).
				Build()).
			Build()).
		Build()

	resp, err := client.Task.V2.Task.Create(ctx, req)
	if err != nil {
		fmt.Printf("create task error, error: %s\n", err)
		return fmt.Sprintf("❌ 创建任务失败 / Failed to create task: %s", err.Error())
	}

	if !resp.Success() {
		fmt.Printf("create task failed, code: %d, msg: %s, log_id: %s\n", resp.Code, resp.Msg, resp.LogID)
		return fmt.Sprintf("❌ 创建任务失败 / Failed to create task: %s", resp.Msg)
	}

	return fmt.Sprintf("✅ 任务创建成功 / Task created successfully\n任务: %s", taskTitle)
}
