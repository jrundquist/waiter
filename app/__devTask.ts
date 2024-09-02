import { BrowserWindow } from "electron";
// import eventBus from "./eventBus";
import { log } from "./logger";
import fs from "fs";

import { exportPDF } from "@/app/exporter/pdf";

// Tasks that are only run in development on app startup.
export const runDevTask = (mainWindow: BrowserWindow | undefined): void => {
  mainWindow?.close();

  const file = fs.readFileSync("/Users/jrundquist/Desktop/The Haunting of Mercy Hill.wai", {
    encoding: "utf-8",
  });
  const loadedState = JSON.parse(file);
  exportPDF(loadedState.state, "/Users/jrundquist/Desktop/demo.pdf")
    .then((result) => {
      result && log.info("PDF Exported");
      !result && log.error("PDF Export Failed");
    })
    .catch((e) => {
      log.error("PDF Export Failed", e);
    });

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

    // ipcMain.emit(
    //   IPCEvents.DO_OPEN_FDX,
    //   {
    //     reply: () => {
    //     },
    //   },
    //   "/Users/jrundquist/Downloads/The Haunting of Mercy Hill.fdx"
    // );

    // ipcMain.emit(
    //   IPCEvents.OPEN_FILE,
    //   {
    //     reply: () => {},
    //   },
    //   "/Users/jrundquist/Desktop/The Haunting of Mercy Hill.wai"
    // );

    // setTimeout(() => {
    //   ipcMain.emit(IPCEvents._DEBUG_DIRECT_PRINT_PDF, {
    //     reply: () => {
    //       log.info("PDF printed");
    //     },
    //   });
    // }, 1000);

    // ipcMain.emit(
    //   IPCEvents.DO_OPEN_PDF,
    //   {
    //     reply: () => {},
    //   },
    //   "/Users/jrundquist/Downloads/The Haunting of Mercy Hill.pdf"
    // );

    // mainWindow?.minimize();
  });
};
