// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const log = require('electron-log');
const path = require('node:path');
const { loadStartggCredentials, saveStartggCredentials } = require('./modules/startgg-credential-manager');
const { setTimeout } = require('node:timers/promises');

const { dxmateApiBaseUrl } = require('./config/dxmate-api-config.json');

let mainWindow;
let startggSigninWindow;
let startggSignupWindow;

let startggCredentials = {};

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  ipcMain.handle('sign-in-with-startgg', () => {
    log.info('Received sign-in-with-startgg event');

    // Create start.gg sign-in window.
    startggSigninWindow = new BrowserWindow({ width: 800, height: 600 });

    // Access start.gg sign-in URL.
    startggSigninWindow.loadURL(dxmateApiBaseUrl + '/startgg/authorize');

    // Wait on callback URL.
    startggSigninWindow.webContents.on('did-navigate', (event, url) => {
      log.info('Navigated to:', url);

      if (url.startsWith(dxmateApiBaseUrl + '/startgg/authorize/callback')) {

        startggSigninWindow.webContents.on('did-finish-load', async () => {
          // Read the string displayed on the window.
          const result = await startggSigninWindow.webContents.executeJavaScript(`
              document.querySelector('body').textContent;
          `);

          log.info('start.gg sign-in result:', result);

          // Close start.gg sign-in window.
          startggSigninWindow.close();

          const startggTokenData = JSON.parse(result);
          log.info('Retrieved start.gg token data:', startggTokenData);

          if (!startggTokenData.access_token || !startggTokenData.refresh_token) {
            log.error('start.gg Access Token or Refresh Token was not found.');
            return dialog.showErrorBox('Error', 'Access Token or Refresh Token was not found.');
          }

          try {
            // Save start.gg credentials.
            await saveStartggCredentials(startggTokenData.access_token, startggTokenData.refresh_token);
            log.info('Retrieved start.gg credentials.');
          } catch (e) {
            log.error(e);
            return dialog.showErrorBox('Error', e.message);
          }

          // Copy to startggCredentials.
          startggCredentials = {
            accessToken: startggTokenData.access_token,
            refreshToken: startggTokenData.refresh_token
          };
        });
      }
    });
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'pages/loading/loading.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
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

// Execute main process.
(async () => {
  log.info('Started main process.');

  try {
    // Load start.gg credentials.
    startggCredentials = await loadStartggCredentials();
    log.info('Loaded startgg credentials:', startggCredentials);
  } catch (e) {
    log.error(e);
    return dialog.showErrorBox('Error', e.message);
  }

  if (!startggCredentials) {
    log.info('startgg credentials not found, so need to sign in with startgg.');

    // Load startgg login page.
    mainWindow.loadFile(path.join(__dirname, 'pages/startgg-login/startgg-login.html'));

    mainWindow.webContents.on('did-finish-load', () => { log.info('Loaded startgg login page.') });

    // Wait until startgg login completes.
    while (!startggCredentials) {
      log.info('Waiting for start.gg sign-in to complete.');

      // Wait 5 sec.
      await setTimeout(5000);
    }
  }

  log.info('startgg credentials found.');

  // Get DXMATE player data.
})();