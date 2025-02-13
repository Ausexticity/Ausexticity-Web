import { isLoggedIn } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userIcon = document.getElementById('user-icon');

    if (await isLoggedIn()) {
        userIcon.style.display = 'block';
    } else {
        userIcon.style.display = 'none';
    }
}); 