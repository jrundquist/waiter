import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      doThing: () => void;
      importPdf: (path: string) => void;
    };
  }
}
