import { BrowserWindow } from "electron";
// import eventBus from "./eventBus";
import { log } from "./logger";

// Tasks that are only run in development on app startup.
export const runDevTask = (mainWindow: BrowserWindow | undefined): void => {
  // mainWindow?.close();

  // const file = fs.readFileSync("/Users/jrundquist/Desktop/Scripts/The Haunting of Mercy Hill.wai", {
  //   encoding: "utf-8",
  // });

  // const loadedState = JSON.parse(file);
  // exportPDF(loadedState.state, "/Users/jrundquist/Desktop/demo.pdf", {})
  //   .then((result) => {
  //     result && log.info("PDF Exported");
  //     !result && log.error("PDF Export Failed");
  //   })
  //   .catch((e) => {
  //     log.error("PDF Export Failed", e);
  //   });

  mainWindow?.webContents.on("did-finish-load", () => {
    log.info("did-finish-load");

    // mainWindow?.minimize();
  });
};
