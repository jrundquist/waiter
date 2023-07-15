import * as React from "react";
import { makeStyles } from "@mui/styles";
import { Toolbar as TB, IconButton, Theme } from "@mui/material";
import {
  FileOpen as FileOpenIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
} from "@mui/icons-material";
import { EventsEmit } from "@runtime/runtime";

const useStyles = makeStyles((theme: Theme) => ({
  toolbar: {
    zIndex: 9999,
    display: "flex",
    flexDirection: "row",
    width: "100vw",
    backgroundColor: "green",
  },
  button: {
    marginBottom: "1rem",
  },
}));

export const Toolbar = () => {
  const classes = useStyles();

  return (
    <div className={classes.toolbar}>
      <IconButton
        className={classes.button}
        aria-label="Open"
        onClick={() => {
          EventsEmit("file:openDialog");
        }}
      >
        <FileOpenIcon />
      </IconButton>
      <IconButton className={classes.button} aria-label="Undo">
        <UndoIcon />
      </IconButton>
      <IconButton className={classes.button} aria-label="Redo">
        <RedoIcon />
      </IconButton>
      <IconButton className={classes.button} aria-label="Bold">
        <FormatBoldIcon />
      </IconButton>
      <IconButton className={classes.button} aria-label="Italic">
        <FormatItalicIcon />
      </IconButton>
      <IconButton className={classes.button} aria-label="Underlined">
        <FormatUnderlinedIcon />
      </IconButton>
      {/* Add more icon buttons as needed */}
    </div>
  );
};
