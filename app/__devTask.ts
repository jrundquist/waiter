import { BrowserWindow, ipcMain } from "electron";
// import eventBus from "./eventBus";
import { IPCEvents } from "@/ipc/events";

// Tasks that are only run in development on app startup.
export const runDevTask = (mainWindow: BrowserWindow | undefined): void => {
  mainWindow?.webContents.on("did-finish-load", () => {
    // ipcMain.emit("import:pdf", {}, "/Users/jrundquist/Downloads/sample-06.pdf");
    // ipcMain.emit("import:pdf", {}, "/Users/jrundquist/Downloads/sample-06_beat.pdf");
    ipcMain.emit(
      IPCEvents.DO_OPEN_PDF,
      {
        reply: (evt: string, payload: any) => {
          mainWindow?.webContents.send(evt, payload);
        },
      },
      "/Users/jrundquist/Downloads/sample-06_scene.pdf"
    );
    // eventBus.emit("open", "/Users/jrundquist/Desktop/simple.wai");
    // eventBus.emit("open", "/Users/jrundquist/Desktop/HauntedMemories.wai");
    // ipcMain.emit("import:pdf", {}, "/Users/jrundquist/Downloads/HauntedMemories.pdf");
    // mainWindow?.minimize();
  });
};
