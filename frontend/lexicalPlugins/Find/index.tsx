import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Theme } from "@mui/material";
import { makeStyles, useTheme } from "@mui/styles";
import React from "react";
import { useState } from "react";
import ReactDOM from "react-dom";
import { FindController } from "./controller";
import { $getRoot } from "lexical";

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
  const [isShowing, setIsShowing] = React.useState(false);
  const [atResult, setAtResult] = React.useState(0);

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

  React.useEffect(() => {
    return window.api.listenForFind(() => {
      if (!isShowing) {
        setIsShowing(true);
      }
      if (searchFieldRef.current) {
        console.log("searchFieldRef.current.focus();");
        setTimeout(() => {
          searchFieldRef.current?.focus();
        }, 0);
      } else {
        console.error("searchFieldRef.current is null");
      }

      if (searchValue) {
        findController.handleSearch({ searchString: searchValue });
        if (atResult !== findController.resultIndex) {
          setAtResult(findController.resultIndex);
        }
      }
    });
  }, [atResult, isShowing, searchFieldRef, searchValue, findController]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        findController.moveToNextResult();
        setAtResult(findController.resultIndex);
      }
      if (e.key === "Escape") {
        searchFieldRef.current?.blur();
        setIsShowing(false);
      }
    },
    [searchFieldRef, findController]
  );

  const content = React.useMemo(
    () => (
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
              border: index === atResult ? "1px solid black" : "",
              opacity: 0.5,
            }}
          />
        ))}
        <div id="find-root" className={classes.findRoot} hidden={!isShowing}>
          <input
            type="text"
            placeholder="Search"
            onChange={updateSearch}
            onKeyDown={handleKeyDown}
            ref={searchFieldRef}
            value={searchValue}
          />
          <span>
            {atResult}/{findController.resultCount}
          </span>
        </div>
      </>
    ),
    [isShowing, highlightRects, findController.resultCount, atResult]
  );

  return ReactDOM.createPortal(content, document.body!);
};

export default Find;
