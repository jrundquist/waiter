import { IpcMainEvent, ipcMain } from "electron";
import { importPdf } from "./pdf";
import eventBus from "../eventBus";
import { IPCEvents } from "@/ipc/events";

let isInit = false;

export const init = (): void => {
  if (isInit) {
    return;
  }
  isInit = true;

  ipcMain.on(IPCEvents.DO_OPEN_PDF, (event: IpcMainEvent, pdfFile: string) => {
    importPdf(pdfFile).then((elements) => {
      eventBus.emit("bus:script:set-elements", elements);
      event.reply(IPCEvents.SET_SCREEN_ELEMENTS, elements);
    });
  });
};
