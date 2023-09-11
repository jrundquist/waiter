import { IpcMainEvent, ipcMain } from "electron";
import { importPdf } from "./pdf";

let isInit = false;

export const init = (): void => {
  if (isInit) {
    return;
  }
  isInit = true;

  ipcMain.on("import:pdf", (_: IpcMainEvent, ...args: any[]) => {
    console.log("[IPC] import:pdf - ", args);
    const pdfFile = args[0];
    if (typeof pdfFile !== "string") {
      return;
    }
    importPdf(pdfFile);
  });
};
