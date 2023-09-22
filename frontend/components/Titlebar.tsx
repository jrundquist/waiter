import { makeStyles } from "tss-react/mui";

import { Theme } from "@mui/material";
import React from "react";

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
  firtBlock: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingRight: 10,
    width: "calc(var(--side-size) - env(titlebar-area-x, 0px))",
  },
}));

export function TitleBar() {
  const { classes } = useStyles();

  const [title, setTitle] = React.useState("");

  const getTitlePromise = React.useMemo<Promise<string>>(window.api.getCurrentTitle, []);
  React.useEffect(() => {
    getTitlePromise.then(setTitle);
  }, [getTitlePromise]);

  React.useEffect(() => {
    return window.api.subscribeToTitleChanges(setTitle);
  }, [setTitle]);

  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <div className={`${classes.sideBlock} ${classes.firtBlock}`}></div>
        <div className={classes.centeredTitle}>{title}</div>
        <div className={classes.sideBlock}>
          <div>[settings?]</div>
        </div>
      </div>
    </div>
  );
}

export default TitleBar;
