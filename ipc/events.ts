export enum IPCEvents {
  // Log Actions
  LOG_ERROR = "browserLog:error",
  LOG_WARN = "browserLog:warn",
  LOG_INFO = "browserLog:info",
  LOG_DEBUG = "browserLog:debug",

  // DEBUG
  SHOW_SCRIPT_DEBUG_WINDOW = "debug:show-script-debug-window",
  _DEBUG_DIRECT_PRINT_PDF = "debug:direct-print-pdf",

  // App Actions
  APP_GET_STATE = "app:get-state",
  APP_GET_WINDOW_TITLE = "app:get-window-title",
  APP_WINDOW_TITLE_CHANGED = "app:window-title-changed",
  SET_WINDOW_OPTIONS = "window:set-menu-options",

  // Menu Actions
  SETTINGS_OPEN = "settings:open",
  FILE_OPEN_DIALOG = "file:open_dialog",

  EXPORT_PDF = "pdf:export",

  DO_OPEN_PDF = "pdf:open",
  DO_OPEN_FDX = "fdx:open",
  OPEN_FILE = "file:open",

  OPEN_TITLE_PAGE = "title-page:open",
  SAVE_TITLE_INFO = "title-page:save",

  // Settings API
  SETTINGS_GET_SETTINGS = "settings:get-settings",
  SETTINGS_UPDATE_SETTINGS = "settings:update-settings",
  SETTINGS_SETTINGS_CHANGED = "settings:settings-changed",

  // Editor actions
  SET_SCREEN_ELEMENTS = "script:set-elements",
  CLEAR_SCREEN_ELEMENTS = "script:clear-elements",
  SCREEN_ELEMENTS_CHANGE_TO_BACKEND = "script:elements-change-to-backend",

  FIND = "editor:find",
}
