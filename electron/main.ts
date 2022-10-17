import { app, BrowserWindow, nativeImage, Menu, Tray } from "electron";
import * as path from "path";
import * as url from "url";
import os from "os";
import { getAllDevicesObj } from "../src/store/devices";
const log = require('electron-log');
const fs = require("fs");

let mainWindow: Electron.BrowserWindow | null;
let tray = null;
app.setLoginItemSettings({
  openAsHidden: true,
  path: app.getPath('exe')
});

let isQuiting = false;
let eventUsage: any = undefined;

app.commandLine.appendSwitch('js-flags', '--max-old-space-size=3072')

const gotTheLock = app.requestSingleInstanceLock();

app.on('before-quit', function () {
  isQuiting = true;
});
app.commandLine.appendSwitch('ignore-certificate-errors');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: process.env.NODE_ENV === "development" ? 1280 : 800,
    height: 880,
    icon: nativeImage.createFromPath(
      os.platform() === "win32"
        ? path.join(app.getAppPath(), "./dist/assets/AppIcon.ico")
        : path.join(app.getAppPath(), "./dist/assets/AppIcon.icns")
    ),
    title: "Base Checkin Client v3",
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.on('close', e => {
    if (!isQuiting) {
      e.preventDefault();
      mainWindow?.hide();
      e.returnValue = false;
    }
  });

  // check save file location exists
  if (!fs.existsSync('C://checkin-data')) {
    fs.mkdir('C://checkin-data', () => {

    })
  }


  tray = new Tray(path.join(app.getAppPath(), "./dist/assets/AppIcon.ico"));
  var contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click:  function(){
        mainWindow?.show();
    } },
    { label: 'Quit', click:  function(){
        mainWindow?.destroy();
        eventUsage && clearInterval(eventUsage);
        app.quit();
    }}
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow?.show();
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL(`http://localhost:4000`);
    mainWindow.openDevTools();
  } else {
    // mainWindow.setMenu(null);
    // mainWindow.openDevTools();
    mainWindow.loadURL(
      url.format({
        pathname: path.join(app.getAppPath(), "./dist/renderer/index.html"),
        protocol: "file:",
        slashes: true,
      })
    );
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe')
  })
}


function logBytes(x: any) {
  log.info(x[0], x[1] / (1000.0*1000), "MB")
}

function logUsage() {
  log.info("[MEMORY USAGE]");
// out  of memory
  if (typeof process === "undefined") {
    log.info('CANNOT GET PROCESS');
    window.location.reload();
  }
// get memory usage
  try {
    Object.entries(process?.memoryUsage()).map(logBytes)
  } catch (e) {
    log.error("[ERROR HEART BEAT]")
  }
}

if (!gotTheLock) {
  eventUsage && clearInterval(eventUsage)
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance
    // Do the stuff, for example, focus the window
    if (mainWindow) {
      if (mainWindow.isMinimized()) {mainWindow.restore()
      }
      mainWindow.show();
      mainWindow.focus()
    }
  });

  app.on("ready", createWindow);

  // log usage
  eventUsage = setInterval(() => {
    logUsage();
  }, 5 * 60 * 1000);
}
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
app.allowRendererProcessReuse = true;


// handle error

process.on('uncaughtException', function (err) {
  console.log('uncaughtException ', err);
  log.error('Uncaught Exception ' + err.message);
});
process.on('uncaughtExceptionMonitor', function (err) {
  console.log('uncaughtExceptionMonitor ', err);
  log.error('Uncaught Exception Monitor ' + err.message);
});
process.on('unhandledRejection', function (err) {
  console.log('unhandledRejection ', err);
  log.error('Uncaught Rejection ' + err);
});

process.on('SIGTERM', function(err) {
  console.log('sigterm',err)
  log.error('Sigterm',err)
  app.relaunch({args: []});
  app.exit(0);
});

app.on("renderer-process-crashed", event => {
  log.error("renderer-process-crashed " + event.currentTarget);
  app.relaunch();
  mainWindow?.webContents?.reload()
});
