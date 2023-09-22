/// <reference types="../preload/index" />
import { useEffect } from "react";
import "./App.css";
// import { EventsOn, EventsOff } from "@runtime/runtime";
import { Editor } from "@components/Editor";

// import { DarkLightToggle } from "@/renderer/components/DarkLightToggle";
import { makeStyles } from "tss-react/mui";

import { Theme } from "@mui/material";
import { ScriptDetailsProvider } from "@contexts/ScriptDetails";
import TitleBar from "./components/Titlebar";

const useStyles = makeStyles()((theme: Theme) => ({
  root: {
    color: theme.palette.text.primary,
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
  },
  content: {
    position: "fixed",
    height: "calc(100vh - env(titlebar-area-height, var(--fallback-title-bar-height)))",
    top: "calc(0px + env(titlebar-area-height, var(--fallback-title-bar-height)))",
    overflow: "scroll",
    width: "100vw",
  },
}));

function App() {
  useEffect(() => {
    window.api.log.info("App.tsx: App mounted", { window });
    return () => {
      window.api.log.info("App.tsx: App unmounted");
    };
  }, []);

  const { classes } = useStyles();
  return (
    <ScriptDetailsProvider>
      <div className={classes.root}>
        <TitleBar />
        <div className={classes.content}>
          <Editor />
        </div>
      </div>
    </ScriptDetailsProvider>
  );
}

export default App;
