import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Theme } from "@mui/material";
import { makeStyles } from 'tss-react/mui';
import React from "react";
import { useState } from "react";
import ReactDOM from "react-dom";
import { FindController } from "./controller";
import { ResultDecorators } from "./ResultDecorators";

const useStyles = makeStyles()((theme: Theme) => ({
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
    minWidth: 20,
    textAlign: "center",
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
  const { classes } = useStyles();

  const [editor] = useLexicalComposerContext();
  // Note: The script will wipe out all existing styles so we save the editor state
  const [highlightRects, setHighlightRects] = useState<DOMRect[]>([]); // [start, end, start, end, ...
  const [searchValue, setSearchValue] = useState<string>("");
  const searchFieldRef = React.useRef<HTMLInputElement>(null);
  const [isShowing, setIsShowing] = React.useState(false);
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

  const performSearch = React.useCallback(() => {
    findController.handleSearch({ searchString: searchValue, matchCase });
  }, [searchValue, matchCase, findController]);

  // When params change, update the search.
  React.useEffect(() => {
    if (isShowing) {
      performSearch();
    }
  }, [performSearch, isShowing]);

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

      if (findController.isCurrentlySearching) {
        findController.moveToNextResult();
      }
    });
  }, [isShowing, searchFieldRef, searchValue, matchCase, findController]);

  React.useEffect(() => {
    return editor.registerTextContentListener((text: string) => {
      if (isShowing && findController.isCurrentlySearching && findController.searchText !== text) {
        // Update the search
        performSearch();
      }
    });
  }, [findController, isShowing, performSearch]);

  const closeFind = React.useCallback(() => {
    setIsShowing(false);
    findController.clearSearch();
    searchFieldRef.current?.blur();
    editor.focus();
  }, [setIsShowing, searchFieldRef]);

  const moveToNext = React.useCallback(() => {
    findController.moveToNextResult();
  }, [findController]);

  const moveToPrevious = React.useCallback(() => {
    findController.moveToPreviousResult();
  }, [findController]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        moveToNext();
      }
      if (e.key === "Escape") {
        closeFind();
      }
    },
    [closeFind, moveToNext]
  );

  const content = (
    <>
      {isShowing ? (
        <ResultDecorators rects={highlightRects} selected={currentResultIndex ?? 0} />
      ) : null}
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
        <div style={{ display: "flex" }}>
          <div className={classes.toggle} onClick={moveToPrevious} title="Previous Result">
            &and;
          </div>
          <div className={classes.toggle} onClick={moveToNext} title="Next Result (⌘F)">
            &or;
          </div>
          <div
            className={classes.toggle}
            data-set={matchCase}
            onClick={toggleMatchCase}
            title="Match Case"
          >
            Aa
          </div>
          <div className={classes.toggle} onClick={closeFind} title="Close Find [Esc]">
            &#10006;
          </div>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(content, document.body!);
};

export default Find;
