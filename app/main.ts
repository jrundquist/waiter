import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { BrowserWindow, IpcMainEvent, Menu, app, dialog, ipcMain, shell } from "electron";
import fs from "fs";
import { join } from "path";
import { runDevTask } from "./__devTask";
import eventBus from "./eventBus";
import { exportToFinalDraft } from "./exporter/finalDraft";
import { init as initImporter } from "./importer";
import { ScriptElement } from "./importer/elements";
import { loadFile, saveState } from "./loader";
import { browserLog, browserLogPath, log, logPath } from "./logger";
import { CreateTemplateOptionsType, createTemplate } from "./menu";
import { State, initialState, reducer } from "./state";

// Keep a global reference of the window object, if you don't, the window will
//   be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | undefined;
let settingsWindow: BrowserWindow | undefined;
let settingsWindowCreated = false;
let menuOptions: CreateTemplateOptionsType | undefined;

let appState: State = initialState;
let isReady = false;

const defaultWebPrefs = {
  devTools: process.argv.some((arg) => arg === "--enable-dev-tools") || is.dev,
  spellcheck: true,
  // https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/platform/runtime_enabled_features.json5
  enableBlinkFeatures: [].join(","),
  contextIsolation: true,
  sandbox: false,
};

function createWindow(): void {
  // Create the browser window.
  log.info("Creating main window");
  browserLog.info("Creating main window");
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 780,
    minWidth: 840,
    minHeight: 580,
    show: true,
    titleBarStyle: "default",
    webPreferences: {
      ...defaultWebPrefs,
      preload: join(__dirname, "../preload/index.js"),
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();

    if (is.dev && process.env["OPEN_DEV_TOOLS"]) {
      mainWindow?.webContents.openDevTools({ mode: "detach" });
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow.webContents.on("did-finish-load", () => {
    for (const path of openQueue) {
      eventBus.emit("open", path);
    }
    openQueue = [];
  });

  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });
}

function showWindow() {
  if (!mainWindow) {
    return;
  }

  // Using focus() instead of show() seems to be important on Windows when our window
  //   has been docked using Aero Snap/Snap Assist. A full .show() call here will cause
  //   the window to reposition:
  //   https://github.com/signalapp/Signal-Desktop/issues/1429
  if (mainWindow.isVisible()) {
    mainWindow.focus();
  } else {
    mainWindow.show();
  }
}

function setupMenu(options?: Partial<CreateTemplateOptionsType>) {
  const { platform } = process;
  menuOptions = {
    // options
    development: is.dev,
    devTools: defaultWebPrefs.devTools,
    includeSetup: false,
    isProduction: !is.dev,
    platform,

    // actions
    newAction: () => {
      if (appState.isDirty) {
        const res = dialog.showMessageBoxSync(mainWindow!, {
          type: "question",
          buttons: ["Yes", "No"],
          title: "Confirm",
          message: "Unsaved changes will be lost. Are you sure you want to continue?",
        });
        if (res === 1) {
          return;
        }
      }
    },
    openAction: () => {
      if (appState.isDirty) {
        const res = dialog.showMessageBoxSync(mainWindow!, {
          type: "question",
          buttons: ["Yes", "No"],
          title: "Confirm",
          message: "Unsaved changes will be lost. Are you sure you want to continue?",
        });
        if (res === 1) {
          return;
        }
      }
      const file = dialog.showOpenDialogSync({
        properties: ["openFile"],
        filters: [{ name: "Waiter Files", extensions: ["wai"] }],
      });
      if (file !== undefined && file.length > 0) {
        eventBus.emit("open", file[0]);
      }
    },

    saveAction: (saveAs: boolean = false) => {
      if (appState.scriptFile && !saveAs) {
        eventBus.emit("state:save", appState.scriptFile);
        return;
      }
      const pathName = dialog.showSaveDialogSync({
        title: "Save Script",
        filters: [{ name: "Waiter Files", extensions: ["wai"] }],
      });

      if (pathName === undefined) {
        return;
      }
      eventBus.emit("state:save", pathName);
    },

    showAbout: () => {
      console.log("showAbout");
    },
    showKeyboardShortcuts: () => {
      console.log("showKeyboardShortcuts");
    },
    showDebugLog: () => {
      eventBus.emit("show-logs");
    },
    showSettings: () => {
      console.log("showSettings");
      // trigger IPC event
      ipcMain.emit("show-settings");
    },
    importPdfAction: () => {
      dialog
        .showOpenDialog({
          properties: ["openFile"],
          filters: [{ name: "PDF", extensions: ["pdf"] }],
        })
        .then((result) => {
          ipcMain.emit(
            "import:pdf",
            {
              reply: (channel: string, ...args: any[]) =>
                mainWindow?.webContents.send(channel, ...args),
            },
            result.filePaths[0]
          );
        });
    },
    exportFinalDraft: () => {
      let pathName = dialog.showSaveDialogSync({
        title: "Export to Final Draft",
        filters: [{ name: "Final Draft", extensions: ["fdx"] }],
      });

      if (pathName === undefined) {
        return;
      } else if (!pathName.endsWith(".fdx")) {
        pathName = `${pathName}.fdx`;
      }

      const content = exportToFinalDraft(appState.scriptElements);
      fs.writeFileSync(pathName, content);
    },
    showWindow,

    reloadWindow: () => {
      if (!mainWindow) {
        return;
      }
      mainWindow.reload();
    },
    // overrides
    ...options,
  };
  const template = createTemplate(menuOptions);
  const menu = Menu.buildFromTemplate(template);

  Menu.setApplicationMenu(menu);

  mainWindow?.webContents.send("window:set-menu-options", {
    development: menuOptions.development,
    devTools: menuOptions.devTools,
    isProduction: menuOptions.isProduction,
    platform: menuOptions.platform,
  });
}

let openQueue: string[] = [];
app.on("open-file", (event, path) => {
  event.preventDefault();
  openQueue.push(path);
  if (!mainWindow && isReady) {
    createWindow();
  } else {
    eventBus.emit("open", path);
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Mark the app as ready
  isReady = true;

  // Set app user model id for windows
  electronApp.setAppUserModelId("com.jrundquist");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  setupMenu();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  initImporter();

  createWindow();

  if (is.dev) {
    runDevTask(mainWindow);
  }
});

ipcMain.on("file:open", (_: IpcMainEvent, file: string | undefined) => {
  if (file) {
    eventBus.emit("open", file);
  } else {
    menuOptions?.openAction();
  }
});

ipcMain.on("script:reset", () => {
  mainWindow?.webContents.send("script:reset");
});

eventBus.on("bus:script:set-elements", (elements: ScriptElement[]) => {
  appState = reducer(appState, { type: "state:set-elements", payload: elements });
  console.log({ appState });
  mainWindow?.webContents.send("script:set-elements", elements);
});

ipcMain.on("show-settings", () => {
  if (!settingsWindowCreated) {
    openSettings();
  } else {
    console.log({ settingsWindow });
    settingsWindow?.show();
  }
});

eventBus.on("open", (file: string) => {
  loadFile(file).then((state) => {
    appState = state;
    appState.scriptFile = file;
    mainWindow?.setTitle(`Waiter - ${appState.scriptName ?? "Untitled"}`);
    mainWindow?.webContents.send("script:set-elements", appState.scriptElements);
    mainWindow?.show();

    const fdxFile = file.replace(".wai", ".fdx");
    const content = exportToFinalDraft(appState.scriptElements);
    console.log({ content });
    console.log(fdxFile);
    fs.writeFileSync(fdxFile, content);
  });
});

eventBus.on("state:save", (file: string) => {
  console.log("state:save", file);
  if (saveState(file, appState)) {
    appState = reducer(appState, { type: "state:saved", file });
    mainWindow?.setTitle(`Waiter - ${appState.scriptName ?? "Untitled"}`);
  }
});

eventBus.on("show-logs", () => {
  shell.openExternal(`file://${logPath}`);
  shell.openExternal(`file://${browserLogPath}`);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function openSettings() {
  settingsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    titleBarStyle: "default",
    webPreferences: {
      ...defaultWebPrefs,
      preload: join(__dirname, "../preload/index.js"),
    },
  });

  settingsWindow.loadFile(join(__dirname, "../renderer/settings.html"));
  settingsWindow.on("ready-to-show", () => {
    settingsWindow?.show();
  });
  settingsWindow.on("closed", () => {
    settingsWindowCreated = false;
  });
  settingsWindow.on("show", () => {
    settingsWindow?.focus();
  });
  settingsWindowCreated = true;
}
