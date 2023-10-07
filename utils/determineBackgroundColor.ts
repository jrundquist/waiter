import "@jxa/global-type";
import { run } from "@jxa/run";
import os from "os";
import Prefs from "@/state/prefs";

const DARK_COLOR = "#2E2E2E";
const LIGHT_COLOR = "#F8F8F8";

export async function determineBackgroundColor(): Promise<typeof DARK_COLOR | typeof LIGHT_COLOR> {
  switch (Prefs.currentSettings.colorTheme) {
    case "dark":
      console.log("dark");
      return DARK_COLOR;
    case "light":
      console.log("light");
      return LIGHT_COLOR;
    case "system":
      console.log("system");
      return await determineSystemBackgroundColor();
  }
}

async function determineSystemBackgroundColor(): Promise<typeof DARK_COLOR | typeof LIGHT_COLOR> {
  switch (os.platform()) {
    case "darwin":
      if (await macOSDarkMode()) {
        return DARK_COLOR;
      } else {
        return LIGHT_COLOR;
      }
    case "win32":
      return DARK_COLOR;
    case "linux":
      return DARK_COLOR;
    default:
      return DARK_COLOR;
  }
}

async function macOSDarkMode() {
  return await run<boolean>(() => {
    return (
      Application("System Events").appearancePreferences as unknown as { darkMode: () => boolean }
    ).darkMode();
  });
}
