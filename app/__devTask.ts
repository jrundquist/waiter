import { ipcMain } from "electron";

// Tasks that are only run in development on app startup.
export const runDevTask = (): void => {
  ipcMain.emit("import:pdf", "/Users/jrundquist/Downloads/sample-06_beat.pdf");
};
