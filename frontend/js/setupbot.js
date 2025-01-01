import { sendChatRequest } from './auth.js';



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
        messages: [
            {
                code: 'text',
                data: {
                    text: '智能助理為您服務，請問有什麼可以幫您？',
                },
            },
        ],
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
                    const response = await sendChatRequest(msg.content.text);
                    return {
                        success: true,
                        data: {
                            text: response,
                        },
                    };
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

bot.run();
