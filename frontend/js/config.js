const config = {
    development: {
        API_BASE_URL: 'http://127.0.0.1:8000'
    },
    production: {
        API_BASE_URL: 'https://api.ausexticity.com'
    }
};

// 根據域名判斷環境
const environment = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'development' : 'production';
export const API_BASE_URL = config[environment].API_BASE_URL;