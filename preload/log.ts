import { IPCEvents } from "@/ipc/events";
import { ipcRenderer } from "electron";

export const log = {
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
};
