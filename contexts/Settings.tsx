/// <reference types="../preload/settings" />
import React from "react";
import type { Settings } from "@/state/prefs";

interface SettingsContextType {
  currenntSettings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
}

const SettingsContext = React.createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [currenntSettings, setCurrenntSettings] = React.useState<Settings>(
    window.settingsApi.getCurrentSettings()
  );

  React.useEffect(() => {
    const sub = window.settingsApi.subscribeToSettings((settings) => {
      setCurrenntSettings(settings);
    });
    return () => {
      sub.unsubscribe();
    };
  }, [setCurrenntSettings]);

  return (
    <SettingsContext.Provider
      value={{
        currenntSettings,
        updateSettings: window.settingsApi.updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = React.useContext(SettingsContext);
  if (context === undefined || context === null) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export const useCurrentSettings = () => {
  const { currenntSettings } = useSettings();
  return currenntSettings;
};

export const useUpdateSettings = () => {
  const { updateSettings } = useSettings();
  return updateSettings;
};
