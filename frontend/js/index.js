import { isLoggedIn } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const userIcon = document.getElementById('user-icon');

    if (isLoggedIn()) {
        userIcon.style.display = 'block';
    } else {
        userIcon.style.display = 'none';
    }
}); 