import { API_BASE_URL } from './config.js';

const CHAT_HISTORY_KEY = 'chat_history';
const MAX_CONTEXT_MESSAGES = 8;

class ChatHistoryManager {
    constructor() {
        this.loadLocalHistory();
    }

    // 載入本地歷史記錄
    loadLocalHistory() {
        const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
        this.history = savedHistory ? JSON.parse(savedHistory) : [];
    }

    // 儲存到本地
    saveLocalHistory() {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(this.history));
    }

    // 新增訊息
    async addMessage(message, isBot = false) {
        const newMessage = {
            message,
            is_bot: isBot,
            timestamp: new Date().toISOString()
        };

        this.history.push(newMessage);
        this.saveLocalHistory();

        // 同步到雲端
        await this.syncToCloud(newMessage);
    }

    // 同步到雲端
    async syncToCloud(message) {
        const idToken = localStorage.getItem('idToken');
        if (!idToken) return;

        try {
            console.log('同步到雲端的訊息:', message);
            const response = await fetch(`${API_BASE_URL}/chat/history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify(message)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('同步聊天記錄失敗:', errorData);
            }
        } catch (error) {
            console.error('同步聊天記錄失敗:', error);
        }
    }

    // 從雲端載入歷史記錄
    async loadFromCloud() {
        const idToken = localStorage.getItem('idToken');
        if (!idToken) return;

        try {
            const response = await fetch(`${API_BASE_URL}/chat/history`, {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            const data = await response.json();
            console.log('從雲端載入的歷史記錄:', data);
            this.history = data.messages || [];
            this.saveLocalHistory();
        } catch (error) {
            console.error('載入雲端聊天記錄失敗:', error);
        }
    }

    // 獲取最近的上下文
    getRecentContext() {
        return this.history.slice(-MAX_CONTEXT_MESSAGES);
    }

    getAllHistory() {
        return this.history;
    }

    // 清除歷史記錄
    async clearHistory() {
        this.history = [];
        this.saveLocalHistory();
        // 可以添加清除雲端記錄的功能
    }
}

export const chatHistoryManager = new ChatHistoryManager(); 