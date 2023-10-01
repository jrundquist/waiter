import type { api as SettingsApi, exposedAs } from "./settingsApi";
declare global {
  interface Window {
    [exposedAs]: typeof SettingsApi;
  }
}
