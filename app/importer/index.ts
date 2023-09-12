import { IpcMainEvent, ipcMain } from "electron";
import { importPdf } from "./pdf";
import eventBus from "../eventBus";

let isInit = false;

export const init = (): void => {
  if (isInit) {
    return;
  }
  isInit = true;

  ipcMain.on("import:pdf", (event: IpcMainEvent, pdfFile: string) => {
    importPdf(pdfFile).then((elements) => {
      eventBus.emit("bus:script:set-elements", elements);
      event.reply("script:set-elements", elements);
    });
  });
};
