// Copyright 2017 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import type { MenuItemConstructorOptions } from "electron";

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
  showKeyboardShortcuts: () => unknown;
  showSettings: () => unknown;
  showWindow: () => unknown;
  importPdfAction: () => void;
  newAction: () => void;
  openAction: () => void;
  saveAction: (saveAs?: boolean) => void;
}>;

export type MenuActionType = keyof MenuActionsType;
