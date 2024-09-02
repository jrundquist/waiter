import { makeStyles } from "tss-react/mui";

import { Theme } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";

import React, { useEffect } from "react";
import { IPCEvents } from "@/ipc/events";
import { useCurrentSettings, useUpdateSettings } from "@/contexts/Settings";

const useStyles = makeStyles()((theme: Theme) => ({
  root: {
    backgroundColor:
      theme.palette.mode === "dark" ? theme.palette.grey[850] : theme.palette.grey[300],
    width: "100vw",
    position: "fixed",
    bottom: "0",
    height: "var(--bottom-bar-height)",
    fontSize: "12px",
    borderTop: `1px solid ${theme.palette.divider}`,
    display: "flex",
    alignItems: "center",
    flexDirection: "row",

    "& > *": {},
  },
  dirtyMarker: {
    display: "flex",
    width: "2.5rem",
    transition: "background-color 0.5s, color 0.5s",
    textAlign: "center",
    justifyContent: "center",

    "&.saved": {
      backgroundColor: theme.palette.primary.dark,
      color: theme.palette.primary.contrastText,
    },
    "&.unsaved, &": {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
    },
  },

  left: {
    marginLeft: "auto",
  },

  // This is a hack to prevent the window from being dragged
  noDrag: {
    ["-webkit-app-region"]: "no-drag",
  },
}));

export function BottomBar({}): React.FunctionComponentElement<{}> {
  const { classes } = useStyles();

  const [saved, setSaved] = React.useState(true);

  useEffect(() => {
    return window.api.subscribeTo(IPCEvents.DIRTY_STATE_CHANGE, (_, isDirty) => {
      console.log("!New State", isDirty);
      // setSaved(!state.isDirty);
      setSaved(!isDirty);
    });
  }, [setSaved]);

  const settings = useCurrentSettings();
  const updateSettings = useUpdateSettings();

  const updateZoom = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateSettings({ zoom: parseFloat(e.target.value) });
    },
    [updateSettings]
  );

  return (
    <div className={classes.root}>
      <div className={`${classes.dirtyMarker} ${saved ? "saved" : "unsaved"}`}>
        <CheckIcon />
      </div>

      <div className={classes.left}>
        <input
          type="range"
          min={1}
          max={1.6}
          step={0.1}
          value={settings.zoom}
          onChange={updateZoom}
        />
      </div>
    </div>
  );
}
