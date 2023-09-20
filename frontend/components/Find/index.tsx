import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Theme } from "@mui/material";
import { makeStyles, useTheme } from "@mui/styles";
import React from "react";
import { useState } from "react";
import ReactDOM from "react-dom";
import { FindController } from "./controller";

const useStyles = makeStyles((theme: Theme) => ({
  findRoot: {
    position: "fixed",
    top: 0,
    right: 150,
    width: 250,
    padding: "10px",
    background: "white",
    border: "3px solid grey",
    borderTop: "none",
    display: "flex",
    flexDirection: "row",
  },

  input: {
    width: 150,
    border: "none",
    "&:focus": {
      outline: "none",
    },
  },

  inputContainer: {
    "&:focus-within": {
      borderColor: theme.palette.secondary.main,
    },
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 5,
    paddingRight: 10,
    border: "1px solid grey",
    borderRadius: "5px",
  },
  resultCount: {
    color: "rgba(0,0,0,.5)",
    fontSize: "0.9rem",
    fontFamily: "Helvetica, sans-serif",
    width: 61,
    textAlign: "right",
  },

  hidden: {
    display: "none",
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
  const [resultCount, setResultCount] = React.useState<number | null>(null);
  const [currentResultIndex, setCurrentResultIndex] = React.useState<number | null>(null);

  const findController = React.useMemo<FindController>(() => {
    return new FindController(editor, { setHighlightRects, setResultCount, setCurrentResultIndex });
  }, [editor, setHighlightRects, setResultCount, setCurrentResultIndex]);

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
        setIsShowing(false);
        searchFieldRef.current?.blur();
      }
    },
    [searchFieldRef, findController]
  );

  const content = React.useMemo(
    () => (
      <>
        {isShowing &&
          highlightRects.map((rect, index) => (
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
        <div id="find-root" className={[classes.findRoot, !isShowing && classes.hidden].join(" ")}>
          <div className={classes.inputContainer}>
            <input
              type="text"
              placeholder="Find..."
              onChange={updateSearch}
              onKeyDown={handleKeyDown}
              ref={searchFieldRef}
              value={searchValue}
              className={classes.input}
            />
            <div className={classes.resultCount}>
              {resultCount !== null &&
                `${(currentResultIndex ?? 0) + resultCount > 0 ? 1 : 0} of ${resultCount}`}
            </div>
          </div>
          <div>
            <button>Aa</button>
          </div>
        </div>
      </>
    ),
    [isShowing, highlightRects, findController.resultCount, atResult]
  );

  return ReactDOM.createPortal(content, document.body!);
};

export default Find;
