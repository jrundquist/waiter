import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import { useCurrentSettings } from "./Settings";

export const ThemeWrapper: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const currentSettings = useCurrentSettings();
  const systemPrefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const mode = React.useMemo(() => {
    if (currentSettings.colorTheme === "system") {
      return systemPrefersDark ? "dark" : "light";
    }
    return currentSettings.colorTheme;
  }, [currentSettings, systemPrefersDark]);

  const theme = React.useMemo(
    () =>
      createTheme({
        components: {
          MuiCssBaseline: {
            styleOverrides: (themeParam) => ({
              p: {
                margin: 0,
              },
              body: {
                ...(themeParam.palette.mode === "dark"
                  ? {} // darkScrollbar()
                  : null),
                backgroundColor:
                  themeParam.palette.mode === "dark"
                    ? themeParam.palette.background.default
                    : themeParam.palette.grey[300],
              },
            }),
          },
        },
        palette: {
          mode,
          primary: {
            main: "#00c8ff",
          },
          secondary: {
            main: "#ff3d00",
          },
        },
      }),
    [mode]
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
