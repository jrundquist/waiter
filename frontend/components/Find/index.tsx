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
    minWidth: 250,
    padding: "10px",
    background: theme.palette.background.paper,
    border: "3px solid grey",
    borderTop: "none",
    display: "flex",
    flexDirection: "row",
    color: theme.palette.text.secondary,
  },

  input: {
    width: 150,
    border: "none",
    color: theme.palette.text.secondary,
    background: "transparent",
    "&:focus": {
      outline: "none",
    },
  },

  inputContainer: {
    "&:focus-within": {
      borderColor: theme.palette.primary.main,
    },
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 5,
    paddingRight: 10,
    border: "1px solid grey",
    borderRadius: "5px",
    color: theme.palette.text.secondary,
  },
  resultCount: {
    fontSize: "0.9rem",
    fontFamily: "Helvetica, sans-serif",
    width: 61,
    textAlign: "right",
    color: theme.palette.text.secondary,
  },

  toggle: {
    display: "block",
    background: theme.palette.background.paper,
    cursor: "pointer",
    padding: 3,
    marginLeft: 4,
    border: "1px solid rgba(0,0,0,0)",
    borderRadius: 3,
    userSelect: "none",
    color: theme.palette.text.primary,
    "&:hover": {
      background:
        theme.palette.mode === "light" ? theme.palette.grey[100] : theme.palette.grey[800],
      border: "1px solid black",
    },
    '&[data-set="true"]': {
      border: "1px solid black",
      background: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
    },
    '&[data-set="true"]:hover': {
      background: theme.palette.primary.light,
    },
  },

  hidden: {
    display: "none",
  },
}));

export const Find = () => {
  const theme = useTheme() as Theme;
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

  const [matchCase, setMatchCase] = React.useState<boolean>(false);
  const toggleMatchCase = React.useCallback(() => {
    setMatchCase(!matchCase);
  }, [matchCase, setMatchCase]);

  const findController = React.useMemo<FindController>(() => {
    return new FindController(editor, { setHighlightRects, setResultCount, setCurrentResultIndex });
  }, [editor, setHighlightRects, setResultCount, setCurrentResultIndex]);

  const updateSearch = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target.value);
    },
    [findController, matchCase]
  );

  // When params change, update the search.
  React.useEffect(() => {
    findController.handleSearch({ searchString: searchValue, matchCase });
  }, [searchValue, matchCase, findController]);

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
        findController.handleSearch({
          searchString: searchValue,
          matchCase,
        });
      }
    });
  }, [atResult, isShowing, searchFieldRef, searchValue, matchCase, findController]);

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

  const content = (
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
              background: theme.palette.primary.contrastText,
              border:
                index === atResult
                  ? `1px solid ${theme.palette.secondary.main}`
                  : `1px solid ${theme.palette.primary.main}`,
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
            {resultCount === null
              ? null
              : `${(currentResultIndex ?? 0) + ((resultCount ?? 0) > 0 ? 1 : 0)} of ${resultCount}`}
          </div>
        </div>
        <div>
          <div
            className={classes.toggle}
            data-set={matchCase}
            onClick={toggleMatchCase}
            title="Match Case"
          >
            Aa
          </div>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(content, document.body!);
};

export default Find;
