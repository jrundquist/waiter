/// <reference types="../../preload/index" />
import * as React from "react";
import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";

import {
  RESET_WITH_FINALDRAFT_FILE,
  RESET_WITH_FOUNTAIN_FILE,
} from "@renderer/lexicalPlugins/ScriptFormatPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

const useStyles = makeStyles((theme: Theme) => ({
  editorContainer: {
    width: "100vw",
    height: "100%",
    display: "flex",
    flexDirection: "row",
    backgroundColor:
      theme.palette.mode === "dark" ? theme.palette.background.default : theme.palette.grey[300],
    caretColor: theme.palette.primary.main,
    caretShape: "block",
    alignItems: "flex-start",
    justifyContent: "center",
    overflow: "scroll",
  },
  dragging: {
    filter: "blur(4px) hue-rotate(180deg)",
  },
}));

interface Props {}

export const EditorDropTarget: React.FC<React.PropsWithChildren<Props>> = ({ children }) => {
  const classes = useStyles();
  const [editor] = useLexicalComposerContext();
  const [isDragging, setIsDragging] = React.useState<boolean>(false);

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const droppedItem = e.dataTransfer?.items[0] ?? null;
      if (!droppedItem) {
        return;
      }
      if (droppedItem.kind === "file") {
        const file = droppedItem.getAsFile()!;
        console.log({ file });
        if (file.name.toLocaleLowerCase().endsWith(".fountain")) {
          editor.dispatchCommand(RESET_WITH_FOUNTAIN_FILE, file);
        } else if (file.name.toLocaleLowerCase().endsWith(".fdx")) {
          editor.dispatchCommand(RESET_WITH_FINALDRAFT_FILE, file);
        } else if (file.name.toLocaleLowerCase().endsWith(".pdf")) {
          console.log("importing pdf", file.path);
          window.api.importPdf(file.path);
        } else if (file.name.toLocaleLowerCase().endsWith(".wai")) {
          window.api.openFile(file.path);
        }
      }
      setIsDragging(false);
    },
    [editor, setIsDragging]
  );

  const handleOver = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },
    [setIsDragging]
  );

  const handleOut = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    [setIsDragging]
  );

  return (
    <div
      className={classes.editorContainer + (isDragging ? ` ${classes.dragging}` : "")}
      onDrop={handleDrop}
      onDragEnter={handleOver}
      onDragOver={handleOver}
      onDragExit={handleOut}
      onDragEnd={handleOut}
    >
      {children}
    </div>
  );
};
