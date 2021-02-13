const { ipcMain, screen, app, BrowserWindow } = require('electron');
const path = require('path');
var FileManager = require("./utils/FileManager");

var windowConfig = new FileManager({
  configName: 'user-preferences',
  defaults: {
    windowBounds: { width: 1000, height: 600 },
    windowLocation: { x: 0, y: 0 }
  }
});


var wallpaperWindow = null;

require('electron-reload')(__dirname, {
  electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron')
});

if (require('electron-squirrel-startup')) {
  app.quit();
}
var shoulQuit = app.requestSingleInstanceLock();

const createWindow = (w, h, x, y) => {

  win32 = (process.platform === "win32");

  setupMonitors();

  const mainWindow = new BrowserWindow({
    x: x, y: y,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    },
    width: w, height: h,
    title: "Twitch Wallpaper", minWidth: 800, minHeight: 600,
    maxWidth: 1280, maxHeight: 720, fullscreenable: false, fullscreenWindowTitle: false, fullscreen: false,
    maximizable: false,
    titleBarStyle: "hidden", frame: false, transparent: true,
    hasShadow: true, thickFrame: true
  });

  mainWindow.loadURL("file://" + __dirname + "/index.html");

  mainWindow.on('move', function () {
    var nX = mainWindow.getPosition()[0];
    var nY = mainWindow.getPosition()[1];
    windowConfig.set('windowLocation', { x: nX, y: nY });
  });

  mainWindow.on('resize', function () {
    var _a = mainWindow.getBounds();
    var width = _a.width;
    var height = _a.height;
    windowConfig.set('windowBounds', { width, height });
  });

  mainWindow.webContents.openDevTools();
};


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

if (!shoulQuit) {
  app.quit();
} else {
  app.on('second-instance', (e, comd, workDir) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  })

  app.on('ready', () => {
    let { width, height } = windowConfig.get('windowBounds');
    let { x, y } = windowConfig.get('windowLocation');

    createWindow(width, height, x, y)
  })


  function setupMonitors() {
    let displays = screen.getAllDisplays()

    var m = displays[1];

    wallpaperWindow = new BrowserWindow({
      transparent: true,
      frame: false,
      focusable: false,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true
      }
    });

    wallpaperWindow.webContents.openDevTools();

    wallpaperWindow.loadURL(`file://${__dirname}/background/wallpaper.html`)

    wallpaperWindow.webContents.on('did-finish-load', function () {
      const { width, height } = m.size
      const { x, y } = m.bounds
      wallpaperWindow.setPosition(x, y);
      wallpaperWindow.setSize(width, height);
      wallpaperWindow.setIgnoreMouseEvents(true);



      wallpaperWindow.show();
      setTimeout(() => {
        wallpaperWindow.focus();
        setupIPC();
      }, 200);
    });

    wallpaperWindow.on('closed', function () {
      wallpaperWindow = null
    });
  }

}


function setupIPC() {
  ipcMain.on('add:chat', (event, json) => {
    wallpaperWindow.webContents.send("add:chat", json);
  })
}