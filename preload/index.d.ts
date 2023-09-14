import { ElectronAPI } from "@electron-toolkit/preload";
import { log } from "../app/logger";
import type { api as Api } from "./index";
declare global {
  interface Window {
    electron: ElectronAPI;
    api: typeof Api;
  }
}
