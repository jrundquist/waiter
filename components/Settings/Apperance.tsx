import React from "react";
import Box from "@mui/material/Box";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { ColorThemeValues } from "@/state/prefs";
import ToggleButton from "@mui/material/ToggleButton";
import { useCurrentSettings, useUpdateSettings } from "@/contexts/Settings";

export const Apperance: React.FC<{}> = ({}) => {
  const currentSettings = useCurrentSettings();
  const updateSettings = useUpdateSettings();
  const [theme, setTheme] = React.useState(currentSettings.colorTheme);

  React.useEffect(() => {
    setTheme(currentSettings.colorTheme);
  }, [currentSettings]);

  const handleColorThemeChange = React.useCallback(
    (_: React.MouseEvent<HTMLElement>, newAlignment: ColorThemeValues) => {
      updateSettings({ colorTheme: newAlignment });
    },
    [updateSettings]
  );

  return (
    <Box>
      <ToggleButtonGroup
        value={theme}
        exclusive
        onChange={handleColorThemeChange}
        aria-label="color theme"
      >
        <ToggleButton
          value={"light" as ColorThemeValues}
          aria-label="light theme"
          disabled={theme === "light"}
        >
          Light
        </ToggleButton>
        <ToggleButton
          value={"dark" as ColorThemeValues}
          aria-label="dark theme"
          disabled={theme === "dark"}
        >
          Dark
        </ToggleButton>
        <ToggleButton
          value={"system" as ColorThemeValues}
          aria-label="system theme"
          disabled={theme === "system"}
        >
          System
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};
