import { IpcMainEvent, app, ipcMain } from "electron";
import path from "path";
import { BehaviorSubject, distinctUntilChanged, scan } from "rxjs";
import fs from "fs";
import { log } from "@/app/logger";
import { IPCEvents } from "@/ipc/events";

export type ColorThemeValues = "light" | "dark" | "system";

export interface Settings {
  colorTheme: ColorThemeValues;
}

export const defaultSettings: Settings = {
  colorTheme: "system",
};

class PrefsService {
  static settingsFile = path.join(app.getPath("userData"), "settings.json");

  currentSettings: Settings = defaultSettings as Settings;
  private prefsBehaviorSubject$ = new BehaviorSubject<Partial<Settings>>(this.currentSettings);
  prefs$ = this.prefsBehaviorSubject$.pipe(
    scan((acc: Settings | Partial<Settings>, curr: Partial<Settings>) => ({
      ...acc,
      ...curr,
    })),
    distinctUntilChanged()
  );

  constructor() {
    log.info(`[PrefsService] Init [Settings File: ${PrefsService.settingsFile}`);
    if (fs.existsSync(PrefsService.settingsFile)) {
      log.info("[PrefsService] Settings file Found");
      const data = fs.readFileSync(PrefsService.settingsFile, "utf-8");
      this.prefsBehaviorSubject$.next(JSON.parse(data));
    }

    this.prefs$.subscribe((settings: Partial<Settings>) => {
      this.currentSettings = settings as Settings;
      fs.writeFile(PrefsService.settingsFile, JSON.stringify(settings), (err) => {
        if (err) {
          console.error(err);
        }
      });
    });
  }

  updateSettings(settings: Partial<Settings>) {
    this.prefsBehaviorSubject$.next(settings);
  }
}

const instance = new PrefsService();

ipcMain.on(IPCEvents.SETTINGS_GET_SETTINGS, (event: IpcMainEvent) => {
  event.returnValue = instance.currentSettings;
});

ipcMain.on(IPCEvents.SETTINGS_UPDATE_SETTINGS, (_: IpcMainEvent, settings: Partial<Settings>) => {
  instance.updateSettings(settings);
});

export default instance;
