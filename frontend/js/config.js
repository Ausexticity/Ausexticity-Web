const config = {
    development: {
        API_BASE_URL: 'http://localhost:8000'
    },
    production: {
        API_BASE_URL: 'https://eros-web-api.onrender.com'
    }
};

// 根據域名判斷環境
const environment = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'development' : 'production';
export const API_BASE_URL = config[environment].API_BASE_URL;