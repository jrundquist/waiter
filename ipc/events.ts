export enum IPCEvents {
  // Log Actions
  LOG_ERROR = "browserLog:error",
  LOG_WARN = "browserLog:warn",
  LOG_INFO = "browserLog:info",
  LOG_DEBUG = "browserLog:debug",

  // App Actions
  APP_GET_WINDOW_TITLE = "app:get-window-title",
  APP_WINDOW_TITLE_CHANGED = "app:window-title-changed",
  SET_WINDOW_OPTIONS = "window:set-menu-options",

  // Menu Actions
  SETTINGS_OPEN = "settings:open",
  FILE_OPEN_DIALOG = "file:open_dialog",

  DO_OPEN_PDF = "pdf:open",
  OPEN_FILE = "file:open",

  // Editor actions
  SET_SCREEN_ELEMENTS = "script:set-elements",
  CLEAR_SCREEN_ELEMENTS = "script:clear-elements",
  SCREEN_ELEMENTS_CHANGE_TO_BACKEND = "script:elements-change-to-backend",

  FIND = "editor:find",
}
