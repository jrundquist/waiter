import { makeStyles } from "tss-react/mui";

import { Theme } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

import { useEffect, useState, useMemo, useCallback } from "react";
import { IPCEvents } from "@/ipc/events";

const useStyles = makeStyles()((theme: Theme) => ({
  root: {
    backgroundColor:
      theme.palette.mode === "dark" ? theme.palette.primary.dark : theme.palette.primary.main,
    ["-webkit-app-region"]: "drag",
    width: "100vw",
    position: "fixed",
    top: "env(titlebar-area-y, 0)",
    paddingLeft: "env(titlebar-area-x, 0)",
    height: "env(titlebar-area-height, var(--fallback-title-bar-height))",
  },
  noDrag: {
    ["-webkit-app-region"]: "no-drag",
  },

  content: {
    color: theme.palette.text.primary,
    height: "calc(100%)",
    display: "flex",
    width: "calc(100% - env(titlebar-area-x, 0px))",
    alignItems: "center",
    ["--side-size"]: "300px",
  },

  centeredTitle: {
    textAlign: "center",
    flexGrow: 1,
    userSelect: "none",
  },

  sideBlock: {
    width: "var(--side-size)",
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingRight: 10,
    "& > *": {
      ["-webkit-app-region"]: "no-drag",
      userSelect: "none",
    },
  },
  marker: {
    alignItems: "center",
  },
  firtBlock: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingRight: 10,
    width: "calc(var(--side-size) - env(titlebar-area-x, 0px))",
  },
  settingsButton: {
    cursor: "pointer",
  },
}));

export function TitleBar() {
  const { classes } = useStyles();

  const [title, setTitle] = useState("Untitled");
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    return window.api.subscribeTo(IPCEvents.DIRTY_STATE_CHANGE, (_, isDirty) => {
      setSaved(!isDirty);
    });
  }, [setSaved]);
  const getTitlePromise = useMemo<Promise<string>>(window.api.getCurrentTitle, []);
  useEffect(() => {
    getTitlePromise.then((title) => {
      setTitle(title.replace(/\*+/g, ""));
    });
  }, [getTitlePromise]);

  useEffect(() => {
    return window.api.subscribeToTitleChanges((title) => {
      setTitle(title.replace(/\*+/g, ""));
    });
  }, [setTitle]);

  const openSettings = useCallback(() => {
    window.api.openSettings();
  }, []);

  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <div className={`${classes.sideBlock} ${classes.firtBlock}`}></div>
        <div className={classes.centeredTitle}>
          {title}
          {saved ? "\u00A0" : "*"}
        </div>
        <div className={classes.sideBlock}>
          <div onClick={openSettings} className={classes.settingsButton}>
            <SettingsIcon />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TitleBar;
