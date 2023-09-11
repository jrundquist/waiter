import { ScriptElement } from "@/app/importer/elements";
import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";

// Custom APIs for renderer
const api = {
  importPdf: (path: string): void => {
    ipcRenderer.send("import:pdf", path);
  },
  isDev(): boolean {
    return process.env.NODE_ENV === "development";
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
