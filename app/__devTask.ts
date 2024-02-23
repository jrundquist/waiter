import { BrowserWindow, ipcMain } from "electron";
// import eventBus from "./eventBus";
import { IPCEvents } from "@/ipc/events";
import { log } from "./logger";

// Tasks that are only run in development on app startup.
export const runDevTask = (mainWindow: BrowserWindow | undefined): void => {
  mainWindow?.webContents.on("did-finish-load", () => {
    log.info("did-finish-load");
    // ipcMain.emit("import:pdf", {}, "/Users/jrundquist/Downloads/sample-06.pdf");
    // ipcMain.emit("import:pdf", {}, "/Users/jrundquist/Downloads/sample-06_beat.pdf");
    // ipcMain.emit(
    //   IPCEvents.DO_OPEN_PDF,
    //   {
    //     reply: (evt: string, payload: any) => {
    //       mainWindow?.webContents.send(evt, payload);
    //     },
    //   },
    //   "/Users/jrundquist/Desktop/sample-06_scene.pdf"
    // );
    // ipcMain.emit(IPCEvents.SETTINGS_OPEN);
    // eventBus.emit("open", "/Users/jrundquist/Desktop/simple.wai");
    // eventBus.emit("open", "/Users/jrundquist/Desktop/HauntedMemories.wai");
    ipcMain.emit(
      IPCEvents.DO_OPEN_PDF,
      {
        reply: () => {},
      },
      "/Users/jrundquist/Desktop/CTScript03.31.2014.pdf"
    );
    // mainWindow?.minimize();
  });
};
