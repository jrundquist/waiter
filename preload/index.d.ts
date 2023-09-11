import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      doThing: () => void;
      importPdf: (path: string) => void;
      isDev: () => boolean;
      listenForReset: (callback: (...args: any[]) => void) => () => void;
      listenForScriptElements: (callback: (...args: any[]) => void) => () => void;
    };
  }
}
