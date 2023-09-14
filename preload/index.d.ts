import { ElectronAPI } from "@electron-toolkit/preload";
import type { api as Api } from "./index";
declare global {
  interface Window {
    electron: ElectronAPI;
    api: typeof Api;
  }
}
