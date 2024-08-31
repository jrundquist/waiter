import { isString } from "lodash";
import type { MenuItemConstructorOptions } from "electron";
import eventBus from "./eventBus";

export type MenuListType = Array<MenuItemConstructorOptions>;

export type MenuOptionsType = Readonly<{
  development: boolean;
  devTools: boolean;
  includeSetup: boolean;
  isProduction: boolean;
  platform: string;
}>;

export type MenuActionsType = Readonly<{
  showAbout: () => unknown;
  showDebugLog: () => unknown;
  showScriptDebugWindow: () => unknown;
  showKeyboardShortcuts: () => unknown;
  showSettings: () => unknown;
  showWindow: () => unknown;
  importPdfAction: () => void;
  importFinalDraft: () => void;
  newAction: () => void;
  openAction: () => void;
  saveAction: (saveAs?: boolean) => void;
  exportFinalDraft: () => void;
  reloadWindow: () => void;
  numberScenes: () => void;
  clearSceneNumbers: () => void;
}>;

export type MenuActionType = keyof MenuActionsType;
export type CreateTemplateOptionsType = MenuOptionsType & MenuActionsType;

export const createTemplate = (options: CreateTemplateOptionsType): MenuListType => {
  if (!isString(options.platform)) {
    throw new TypeError("`options.platform` must be a string");
  }

  const {
    devTools,
    platform,
    showAbout,
    showDebugLog,
    showKeyboardShortcuts,
    showSettings,
    importPdfAction,
    importFinalDraft,
    newAction,
    openAction,
    saveAction,
    exportFinalDraft,
    reloadWindow,
  } = options;

  const template: MenuListType = [
    {
      label: "&File",
      submenu: [
        {
          label: "New",
          accelerator: "CmdOrCtrl+N",
          click: newAction,
        },
        {
          label: "Open",
          accelerator: "CmdOrCtrl+O",
          click: openAction,
        },
        {
          label: "Open Recent",
          role: "recentDocuments",
          submenu: [
            {
              label: "Clear Recent",
              role: "clearRecentDocuments",
            },
          ],
        },
        {
          type: "separator",
        },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => saveAction(),
        },
        {
          label: "Save As",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => saveAction(true),
        },
        {
          type: "separator",
        },
        {
          label: "Settings",
          accelerator: "CommandOrControl+,",
          click: showSettings,
        },
        {
          type: "separator",
        },
        {
          label: "Import",
          submenu: [
            {
              label: "Import from PDF",
              click: importPdfAction,
            },
            {
              label: "Import from Final Draft",
              click: importFinalDraft,
            },
          ],
        },
        {
          label: "Export",
          submenu: [
            {
              label: "Export to Final Draft",
              click: exportFinalDraft,
            },
          ],
        },
        {
          type: "separator",
        },
        {
          role: "quit",
          label: "&Quit",
        },
      ],
    },
    {
      label: "&Edit",
      submenu: [
        {
          role: "undo",
          label: "Undo",
        },
        {
          role: "redo",
          label: "Redo",
        },
        {
          type: "separator",
        },
        {
          role: "cut",
          label: "Cut",
        },
        {
          role: "copy",
          label: "Copy",
        },
        {
          role: "paste",
          label: "Paste",
        },
        {
          role: "delete",
          label: "Delete",
        },
        {
          role: "selectAll",
          label: "Select All",
        },
        {
          type: "separator",
        },
        {
          label: "Find",
          accelerator: "CmdOrCtrl+F",
          click: () => {
            eventBus.emit("find");
          },
        },
      ],
    },
    {
      label: "&Screenplay",
      submenu: [
        {
          label: "Number Scenes",
          click: options.numberScenes,
        },
        {
          label: "Clear Scene Numbers",
          click: options.clearSceneNumbers,
        },
      ],
    },
    {
      label: "&View",
      submenu: [
        {
          role: "resetZoom",
          label: "Reset Zoom",
        },
        {
          accelerator: "CmdOrCtrl+=",
          role: "zoomIn",
          label: "Zoom In",
        },
        {
          accelerator: "CmdOrCtrl+-",
          role: "zoomOut",
          label: "Zoom Out",
        },
        {
          type: "separator",
        },
        {
          role: "togglefullscreen",
          label: "Toggle Fullscreen",
        },
        {
          type: "separator",
        },
        {
          label: "Debug Log",
          click: showDebugLog,
        },
        {
          label: "Show Script Debug Window",
          click: options.showScriptDebugWindow,
        },
        {
          label: "Refresh",
          accelerator: "CmdOrCtrl+R",
          click: reloadWindow,
        },
        ...(devTools
          ? [
              {
                type: "separator" as const,
              },
              {
                role: "toggleDevTools" as const,
                label: "Toggle Developer Tools",
              },
            ]
          : []),
        ...(devTools && platform !== "linux"
          ? [
              {
                label: "Force Update",
                click: () => {},
              },
            ]
          : []),
      ],
    },
    {
      label: "&Window",
      role: "window",
      submenu: [
        {
          role: "minimize",
          label: "Minimize",
        },
      ],
    },
    {
      label: "Help",
      role: "help",
      submenu: [
        {
          label: "Keyboard Shortcuts",
          accelerator: "CmdOrCtrl+/",
          click: showKeyboardShortcuts,
        },
        {
          label: "About",
          click: showAbout,
        },
      ],
    },
  ];

  if (platform === "darwin") {
    return updateForMac(template, options);
  }

  return template;
};

function updateForMac(template: MenuListType, options: CreateTemplateOptionsType): MenuListType {
  const { showAbout, showSettings, showWindow } = options;

  // Remove About item and separator from Help menu, since they're in the app menu
  const aboutMenu = template.find((m) => m.role === "help")!;
  if (Array.isArray(aboutMenu.submenu)) {
    // aboutMenu.submenu.pop();
    // aboutMenu.submenu.pop();
  } else {
    throw new Error("updateForMac: help.submenu was not an array!");
  }

  // Remove preferences, separator, and quit from the File menu, since they're
  // in the app menu
  const fileMenu = template.find((m) => m.label === "&File")!;
  if (Array.isArray(fileMenu.submenu)) {
    // And insert "close".
    fileMenu.submenu.push(
      {
        type: "separator",
      },
      {
        label: "Close",
        accelerator: "CmdOrCtrl+W",
        role: "close",
      }
    );
  } else {
    throw new Error("updateForMac: fileMenu.submenu was not an array!");
  }

  // Add the OSX-specific Signal Desktop menu at the far left
  template.unshift({
    label: "Waiter" as const,
    submenu: [
      {
        label: "About Waiter",
        click: showAbout,
      },
      {
        type: "separator",
      },
      {
        label: "Settings",
        accelerator: "CommandOrControl+,",
        click: showSettings,
      },
      {
        type: "separator",
      },
      {
        label: "Services",
        role: "services",
      },
      {
        type: "separator",
      },
      {
        label: "Hide Waiter",
        role: "hide",
      },
      {
        label: "Hide Others",
        role: "hideOthers",
      },
      {
        label: "Show All",
        role: "unhide",
      },
      {
        type: "separator",
      },
      {
        label: "Quit Waiter",
        role: "quit",
      },
    ],
  });

  const editMenu = template.find((m) => m.label === "&Edit")!;
  if (Array.isArray(editMenu.submenu)) {
    editMenu.submenu.push(
      {
        type: "separator",
      },
      {
        label: "Speech",
        submenu: [
          {
            role: "startSpeaking",
            label: "Start Speaking",
          },
          {
            role: "stopSpeaking",
            label: "Stop Speaking",
          },
        ],
      }
    );
  } else {
    throw new Error("updateForMac: edit.submenu was not an array!");
  }

  // Replace Window menu
  // eslint-disable-next-line no-param-reassign
  template.find((m) => m.role === "window")!.submenu = [
    {
      label: "Minimize",
      accelerator: "CmdOrCtrl+M",
      role: "minimize",
    },
    {
      label: "Zoom",
      role: "zoom",
    },
    {
      label: "Show Window",
      accelerator: "CmdOrCtrl+Shift+0",
      click: showWindow,
    },
    {
      type: "separator",
    },
    {
      role: "front",
      label: "Bring All to Front",
    },
    {
      label: "Random Window Title",
      click: () => {
        eventBus.emit("bus:window:set-title", "Random Window Title" + Math.random());
      },
      accelerator: "CmdOrCtrl+Shift+R",
    },
  ];

  return template;
}
