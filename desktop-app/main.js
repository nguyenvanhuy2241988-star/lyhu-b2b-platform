const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { startBotWorker, stopBotWorker } = require('./worker');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // Simplest way to allow requires in renderer for an internal tool
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    autoHideMenuBar: true
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Communication with UI
ipcMain.on('start-bot', (event, token) => {
  console.log("Starting bot with token:", token);
  startBotWorker(token, (logMessage) => {
    // Send logs to the UI
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bot-log', logMessage);
    }
  });
});

ipcMain.on('stop-bot', (event) => {
  console.log("Stopping bot");
  stopBotWorker();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('bot-log', '[System] Bot Worker stopped.');
  }
});

ipcMain.on('open-login', async (event) => {
  try {
    const { launchBrowser } = require('./scripts/marketing/setup_browser');
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto('https://www.facebook.com');
    
    browser.on('disconnected', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('login-closed');
      }
    });
  } catch (error) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bot-log', `[Lỗi] Không thể mở trình duyệt: ${error.message}`);
      mainWindow.webContents.send('login-closed');
    }
  }
});
