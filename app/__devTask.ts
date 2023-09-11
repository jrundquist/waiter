import { BrowserWindow } from "electron";

// Tasks that are only run in development on app startup.
export const runDevTask = (mainWindow: BrowserWindow | undefined): void => {
  mainWindow?.webContents.on("did-finish-load", () => {
    // ipcMain.emit("import:pdf", "/Users/jrundquist/Downloads/sample-06.pdf");
    // ipcMain.emit("import:pdf", "/Users/jrundquist/Downloads/sample-06_beat.pdf");
    // ipcMain.emit("import:pdf", "/Users/jrundquist/Downloads/sample-06_scene.pdf");
    // ipcMain.emit("import:pdf", "/Users/jrundquist/Desktop/SCISSORS.pdf");
    // ipcMain.emit("import:pdf", "/Users/jrundquist/Downloads/HauntedMemories.pdf");
    // mainWindow?.minimize();
  });
};
