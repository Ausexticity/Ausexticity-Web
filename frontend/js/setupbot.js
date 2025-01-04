import { sendChatRequest } from './auth.js';
import { chatHistoryManager } from './chat_history.js';

(async () => {
    // 獲取所有聊天記錄
    await chatHistoryManager.loadFromCloud();
    const allHistory = await chatHistoryManager.getAllHistory();
    console.log(allHistory);
    // 將聊天記錄轉換為 ChatSDK 所需的格式
    let historyMessages = allHistory.length > 0 ? allHistory.map(msg => ({
        code: msg.is_bot ? 'markdown' : 'text',
        data: {
            text: msg.message,
            createdAt: msg.timestamp,
        },
        position: msg.is_bot ? 'left' : 'right',
    })) : [{
        code: 'text',
        data: {
            text: '智能助理為您服務，請問有什麼可以幫您？',
            createdAt: new Date().getTime(),
            position: 'left',
        },
    }];


    const bot = new ChatSDK({
        config: {
            locale: 'en-US',
            lang: 'en-US',
            navbar: {
                title: 'Ausexticity AI',
            },
            robot: {
                avatar: 'images/header_logo.svg',
            },
            messages: historyMessages,
            placeholder: '輸入問題...',
            showTyping: true,
            footer: {
                bottomTip: 'Ausexticity AI 僅供資訊查詢，醫學診斷請洽專業醫師',
            },
        },
        requests: {
            send: async function (msg) {
                if (msg.type === 'text' || msg.code === 'text') {
                    try {

                        // 獲取最近上下文
                        const context = chatHistoryManager.getRecentContext();

                        // 發送請求並獲取回應，傳遞上下文
                        const response = await sendChatRequest(msg.content.text, context);

                        if (response) {
                            // 儲存機器人回應並儲存使用者訊息
                            await chatHistoryManager.addMessage(msg.content.text, false);
                            await chatHistoryManager.addMessage(response, true);

                            return {
                                success: true,
                                data: {
                                    text: response,
                                },
                            };
                        }
                    } catch (error) {
                        console.error('呼叫 sendChatRequest 時發生錯誤:', error);
                        return {
                            success: false,
                            error: '無法獲取回應，請稍後再試。',
                        };
                    }
                }
            },
        },
        handlers: {
            parseResponse: function (res, requestType) {
                if (requestType === 'send' && res.success) {
                    return {
                        code: 'markdown',
                        data: {
                            content: res.data.text,
                            streamEnd: true,
                        },
                    };
                } else if (requestType === 'send' && !res.success) {
                    return {
                        code: 'text',
                        data: {
                            text: res.error,
                        },
                    };
                }
                return res;
            },
        },
    });

    // 初始化時載入歷史記錄並運行聊天機器人
    bot.run();
})();
