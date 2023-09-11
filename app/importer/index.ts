import { IpcMainEvent, ipcMain } from "electron";
import { importPdf } from "./pdf";

let isInit = false;

export const init = (): void => {
  if (isInit) {
    return;
  }
  isInit = true;

  ipcMain.on("import:pdf", (event: IpcMainEvent, pdfFile: string) => {
    importPdf(pdfFile).then((elements) => {
      event.reply("script:set-elements", elements);
    });
  });
};
