/// <reference types="../preload/index" />
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";

const container = document.getElementById("root");

const root = createRoot(container!);

const ThemeWrapper: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const systemPrefersDark = useMediaQuery("(prefers-color-scheme: dark)");
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
          mode: systemPrefersDark ? "dark" : "light",
          primary: {
            main: "#00c8ff",
          },
          secondary: {
            main: "#ff3d00",
          },
        },
      }),
    [systemPrefersDark]
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

root.render(
  <React.StrictMode>
    <ThemeWrapper>
      {/* <CssBaseline enableColorScheme /> */}
      <App />
    </ThemeWrapper>
  </React.StrictMode>
);
