const { ipcRenderer } = require('electron');

const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const btnLoginFacebook = document.getElementById('btnLoginFacebook');
const tokenInput = document.getElementById('tokenInput');
const logArea = document.getElementById('logArea');
const statusBadge = document.getElementById('statusBadge');

// Load saved token if any
const savedToken = localStorage.getItem('lyhu_bot_token');
if (savedToken) {
    tokenInput.value = savedToken;
}

function appendLog(message) {
    const p = document.createElement('div');
    // Basic formatting for time
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    p.textContent = `[${time}] ${message}`;
    
    // Auto-scroll
    const isScrolledToBottom = logArea.scrollHeight - logArea.clientHeight <= logArea.scrollTop + 10;
    
    // Clear initial empty state
    if (logArea.innerHTML.includes('Chưa kết nối')) {
        logArea.innerHTML = '';
    }
    
    logArea.appendChild(p);
    
    if (isScrolledToBottom) {
        logArea.scrollTop = logArea.scrollHeight;
    }
}

btnStart.addEventListener('click', () => {
    const token = tokenInput.value.trim();
    if (!token) {
        alert("Vui lòng nhập Mã Kích Hoạt (Token)!");
        return;
    }

    // Save token
    localStorage.setItem('lyhu_bot_token', token);

    // Update UI
    btnStart.classList.add('hidden');
    btnStop.classList.remove('hidden');
    tokenInput.disabled = true;
    tokenInput.classList.add('bg-slate-100', 'text-slate-500');
    
    statusBadge.textContent = 'ONLINE';
    statusBadge.classList.replace('bg-slate-100', 'bg-green-100');
    statusBadge.classList.replace('text-slate-500', 'text-green-700');

    logArea.innerHTML = '';
    appendLog('Đang kết nối vào hệ thống với tư cách Bot Worker...');

    // Send to main process
    ipcRenderer.send('start-bot', token);
});

btnStop.addEventListener('click', () => {
    // Update UI
    btnStop.classList.add('hidden');
    btnStart.classList.remove('hidden');
    tokenInput.disabled = false;
    tokenInput.classList.remove('bg-slate-100', 'text-slate-500');

    statusBadge.textContent = 'OFFLINE';
    statusBadge.classList.replace('bg-green-100', 'bg-slate-100');
    statusBadge.classList.replace('text-green-700', 'text-slate-500');

    // Send to main process
    ipcRenderer.send('stop-bot');
});

btnLoginFacebook.addEventListener('click', () => {
    appendLog('Đang mở Trình duyệt Tàng hình để bạn đăng nhập Facebook...');
    btnLoginFacebook.disabled = true;
    btnLoginFacebook.classList.add('opacity-50');
    
    ipcRenderer.send('open-login');
});

// Receive logs from Main process
ipcRenderer.on('bot-log', (event, message) => {
    appendLog(message);
});

ipcRenderer.on('login-closed', () => {
    appendLog('Đã đóng Trình duyệt. Bạn có thể bắt đầu Kết Nối Bot.');
    btnLoginFacebook.disabled = false;
    btnLoginFacebook.classList.remove('opacity-50');
});
