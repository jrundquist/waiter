import { app, dialog } from "electron";
import fs from "fs";
import { State } from "./state";

export async function loadFile(fileName: string) {
  try {
    const fileContents = fs.readFileSync(fileName, "utf8");
    const { state } = JSON.parse(fileContents);

    app.addRecentDocument(fileName);

    return {
      ...state,
      scriptFile: fileName,
    };
  } catch (e) {
    dialog.showErrorBox("Error", "An error ocurred reading the file :" + (e as Error).message);
  }
}

export function saveState(fileName: string, state: State): boolean {
  try {
    fs.writeFileSync(fileName, JSON.stringify({ state: { ...state, scriptFile: undefined } }));
  } catch (e) {
    dialog.showErrorBox("Error", "An error ocurred reading the file :" + (e as Error).message);
    return false;
  }
  return true;
}
