import { app, BrowserWindow, nativeImage } from "electron";
import * as path from "path";
import * as url from "url";
import os from "os";

let mainWindow: Electron.BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 880,
    icon: nativeImage.createFromPath(
      os.platform() === "win32"
        ? path.join(app.getAppPath(), "./dist/assets/AppIcon.ico")
        : path.join(app.getAppPath(), "./dist/assets/AppIcon.icns")
    ),
    title: "Base Checkin Station",
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      enableRemoteModule: true,
    },
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL(`http://localhost:4000`);
  } else {
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
}

app.on("ready", createWindow);
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
app.allowRendererProcessReuse = true;
