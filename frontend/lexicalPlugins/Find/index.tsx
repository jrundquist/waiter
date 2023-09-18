import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Theme } from "@mui/material";
import { makeStyles, useTheme } from "@mui/styles";
import React from "react";
import { useState } from "react";
import ReactDOM from "react-dom";
import { FindController } from "./controller";

const useStyles = makeStyles(() => ({
  findRoot: {
    position: "fixed",
    top: 0,
    right: 100,
    width: 300,
    height: 50,
    background: "white",
  },
}));

export const Find = () => {
  const classes = useStyles();
  const [editor] = useLexicalComposerContext();
  // Note: The script will wipe out all existing styles so we save the editor state
  const [highlightRects, setHighlightRects] = useState<DOMRect[]>([]); // [start, end, start, end, ...
  const [searchValue, setSearchValue] = useState<string>("");
  const searchFieldRef = React.useRef<HTMLInputElement>(null);

  const findController = React.useMemo<FindController>(() => {
    return new FindController(editor, setHighlightRects);
  }, [editor, setHighlightRects]);

  const updateSearch = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const searchString = e.target.value;
      setSearchValue(searchString);
      findController.handleSearch({ searchString });
    },
    [findController]
  );

  const theme = useTheme() as Theme;

  const content = (
    <>
      {highlightRects.map((rect, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            background: theme.palette.primary.main,
            opacity: 0.5,
          }}
        />
      ))}
      <div id="find-root" className={classes.findRoot}>
        <input
          type="text"
          placeholder="Search"
          onChange={updateSearch}
          ref={searchFieldRef}
          value={searchValue}
        />
        <button>Highlight Search</button>
      </div>
    </>
  );
  return ReactDOM.createPortal(content, document.body!);
};

export default Find;
