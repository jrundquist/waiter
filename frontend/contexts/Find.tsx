import React from "react";
import { FindController } from "../components/Find/controller";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

interface FindContextType {
  findController: FindController;
  searchValue: string;
  setSearchValue: React.Dispatch<React.SetStateAction<string>>;
  isShowing: boolean;
  setIsShowing: React.Dispatch<React.SetStateAction<boolean>>;
  resultCount: number | null;
  currentResultIndex: number | null;
  matchCase: boolean;
  toggleMatchCase: () => void;
  performSearch: () => void;
  highlightRects: DOMRect[];
}

const FindStateContext = React.createContext<FindContextType | null>(null);

export const FindContext: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [editor] = useLexicalComposerContext();

  // Note: The script will wipe out all existing styles so we save the editor state
  const [highlightRects, setHighlightRects] = React.useState<DOMRect[]>([]); // [start, end, start, end, ...
  const [searchValue, setSearchValue] = React.useState<string>("");
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

  const performSearch = React.useCallback(() => {
    findController.handleSearch({ searchString: searchValue, matchCase });
  }, [searchValue, matchCase, findController]);

  return (
    <FindStateContext.Provider
      value={{
        findController,
        searchValue,
        setSearchValue,
        isShowing,
        setIsShowing,
        resultCount,
        currentResultIndex,
        matchCase,
        toggleMatchCase,
        performSearch,
        highlightRects,
      }}
    >
      {children}
    </FindStateContext.Provider>
  );
};

export const useFindContext = () => {
  const context = React.useContext(FindStateContext);
  if (context === undefined || context === null) {
    throw new Error("useFindContext must be used within a FindContext");
  }
  return context;
};

export const useFindController = () => {
  const context = useFindContext();
  return context.findController;
};

export const useFindSetSearchValue = () => {
  const context = useFindContext();
  return context.setSearchValue;
};
