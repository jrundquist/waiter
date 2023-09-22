import { ScriptElement } from "../state/elements/elements";
import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";

// Custom APIs for renderer
export const api = {
  importPdf: (path: string): void => {
    ipcRenderer.send("import:pdf", path);
  },
  isDev(): boolean {
    return process.env.NODE_ENV === "development";
  },
  openFile: (file: string | undefined = undefined) => {
    ipcRenderer.send("file:open", file);
  },
  listenForFind: (callback: (...args: any[]) => void): (() => void) => {
    ipcRenderer.on("find", callback);
    return () => ipcRenderer.removeListener("find", callback);
  },
  listenForReset: (callback: (...args: any[]) => void): (() => void) => {
    ipcRenderer.on("script:reset", callback);
    return () => ipcRenderer.removeListener("script:reset", callback);
  },
  listenForScriptElements: (callback: (elements: ScriptElement[]) => void) => {
    const cb = (_: IpcRendererEvent, elements: ScriptElement[]) => {
      callback(elements);
    };
    ipcRenderer.on("script:set-elements", cb);
    return () => ipcRenderer.removeListener("script:set-elements", cb);
  },
  broadcastNewScriptContent: (els: ScriptElement[]) => {
    ipcRenderer.send("script:content-from-browser", els);
  },
  subscribeToTitleChanges: (callback: (title: string) => void) => {
    const cb = (_: IpcRendererEvent, title: string) => {
      callback(title);
    };
    debugger;
    ipcRenderer.on("app:window-title-changed", cb);
    return () => {
      ipcRenderer.removeListener("app:window-title-changed", cb);
    };
  },
  getCurrentTitle: () => {
    return ipcRenderer.invoke("app:get-window-title");
  },
  log: {
    debug: (message: string, ...args: any[]) => {
      console.debug(message, ...args);
      try {
        ipcRenderer.send("browserLog:debug", message, ...args);
      } catch (e) {
        console.warn("failed to send log", e);
      }
    },
    error: (message: string, ...args: any[]) => {
      console.error(message, ...args);
      try {
        ipcRenderer.send("browserLog:error", message, ...args);
      } catch (e) {
        console.warn("failed to send log", e);
      }
    },
    info: (message: string, ...args: any[]) => {
      console.info(message, ...args);
      try {
        ipcRenderer.send("browserLog:info", message, ...args);
      } catch (e) {
        console.warn("failed to send log", e);
      }
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(message, ...args);
      try {
        ipcRenderer.send("browserLog:warn", message, ...args);
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
