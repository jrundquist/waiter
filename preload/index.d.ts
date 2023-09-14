import { ElectronAPI } from "@electron-toolkit/preload";
import { log } from "../app/logger";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      doThing: () => void;
      importPdf: (path: string) => void;
      isDev: () => boolean;
      openFile: (file?: string) => void;
      listenForReset: (callback: (...args: any[]) => void) => () => void;
      listenForScriptElements: (callback: (...args: any[]) => void) => () => void;
      log: {
        debug: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
      };
    };
  }
}
