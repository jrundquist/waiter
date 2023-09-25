import { ScriptElement } from "../state/elements/elements";
import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";
import { IPCEvents } from "../ipc/events";

// Custom APIs for renderer
export const api = {
  importPdf: (path: string): void => {
    ipcRenderer.send(IPCEvents.DO_OPEN_PDF, path);
  },
  isDev(): boolean {
    return process.env.NODE_ENV === "development";
  },
  openFile: (file: string | undefined = undefined) => {
    ipcRenderer.send(IPCEvents.OPEN_FILE, file);
  },
  openSettings: () => {
    ipcRenderer.send(IPCEvents.SETTINGS_OPEN);
  },
  listenForFind: (callback: (...args: any[]) => void): (() => void) => {
    ipcRenderer.on(IPCEvents.FIND, callback);
    return () => ipcRenderer.removeListener(IPCEvents.FIND, callback);
  },
  listenForReset: (callback: (...args: any[]) => void): (() => void) => {
    ipcRenderer.on(IPCEvents.CLEAR_SCREEN_ELEMENTS, callback);
    return () => ipcRenderer.removeListener(IPCEvents.CLEAR_SCREEN_ELEMENTS, callback);
  },
  listenForScriptElements: (callback: (elements: ScriptElement[]) => void) => {
    const cb = (_: IpcRendererEvent, elements: ScriptElement[]) => {
      callback(elements);
    };
    ipcRenderer.on(IPCEvents.SET_SCREEN_ELEMENTS, cb);
    return () => ipcRenderer.removeListener(IPCEvents.SET_SCREEN_ELEMENTS, cb);
  },
  broadcastNewScriptContent: (els: ScriptElement[]) => {
    ipcRenderer.send(IPCEvents.SCREEN_ELEMENTS_CHANGE_TO_BACKEND, els);
  },
  subscribeToTitleChanges: (callback: (title: string) => void) => {
    const cb = (_: IpcRendererEvent, title: string) => {
      callback(title);
    };
    ipcRenderer.on(IPCEvents.APP_WINDOW_TITLE_CHANGED, cb);
    return () => {
      ipcRenderer.removeListener(IPCEvents.APP_WINDOW_TITLE_CHANGED, cb);
    };
  },
  getCurrentTitle: () => {
    return ipcRenderer.invoke(IPCEvents.APP_GET_WINDOW_TITLE);
  },
  log: {
    debug: (message: string, ...args: any[]) => {
      console.debug(message, ...args);
      try {
        ipcRenderer.send(IPCEvents.LOG_DEBUG, message, ...args);
      } catch (e) {
        console.warn("failed to send log", e);
      }
    },
    error: (message: string, ...args: any[]) => {
      console.error(message, ...args);
      try {
        ipcRenderer.send(IPCEvents.LOG_ERROR, message, ...args);
      } catch (e) {
        console.warn("failed to send log", e);
      }
    },
    info: (message: string, ...args: any[]) => {
      console.info(message, ...args);
      try {
        ipcRenderer.send(IPCEvents.LOG_INFO, message, ...args);
      } catch (e) {
        console.warn("failed to send log", e);
      }
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(message, ...args);
      try {
        ipcRenderer.send(IPCEvents.LOG_WARN, message, ...args);
      } catch (e) {
        console.warn("failed to send log", e);
      }
    },
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    // contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  // window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
