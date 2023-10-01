import { IpcRendererEvent, ipcRenderer } from "electron";
import type { Settings } from "@/state/prefs";
import { IPCEvents } from "../ipc/events";

export const exposedAs = "settingsApi";
export const api = {
  getCurrentSettings(): Settings {
    return ipcRenderer.sendSync(IPCEvents.SETTINGS_GET_SETTINGS);
  },
  subscribeToSettings(callback: (settings: Settings) => void) {
    const cb = (_: IpcRendererEvent, settings: unknown) => {
      callback(settings as Settings);
    };
    ipcRenderer.on(IPCEvents.SETTINGS_SETTINGS_CHANGED, cb);
    return {
      unsubscribe: () => ipcRenderer.removeListener(IPCEvents.SETTINGS_SETTINGS_CHANGED, cb),
    };
  },
  updateSettings(settings: Partial<Settings>) {
    ipcRenderer.send(IPCEvents.SETTINGS_UPDATE_SETTINGS, settings);
  },
};
