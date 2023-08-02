import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import { usePreference } from "./hooks/preferences";

const container = document.getElementById("root");

const root = createRoot(container!);

const ThemeWrapper: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const systemPrefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [preferredDarkTheme] = usePreference<boolean>(
    "darkTheme",
    systemPrefersDark
  );

  console.log({ systemPrefersDark, preferredDarkTheme });

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: systemPrefersDark ? "dark" : "light",
          primary: {
            main: "#00c8ff",
          },
          secondary: {
            main: "#ff3700",
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
      <App />
    </ThemeWrapper>
  </React.StrictMode>
);
