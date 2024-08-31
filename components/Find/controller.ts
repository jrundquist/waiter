import {
  $createTextNode,
  $getRoot,
  $getSelection,
  $getTextContent,
  $isRangeSelection,
  $setSelection,
  LexicalEditor,
  TextNode,
} from "lexical";
import { $getNearestNodeOfType } from "@lexical/utils";
import { $isLineNode, LineNode } from "../../screenFormatPlugin/LineNode";

const MAX_RESULTS = 100;

export declare interface SearchParams {
  searchString: string;
  matchCase: boolean;
}

type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

export class FindController {
  currentResultIndex;
  private highlightedText: TextNode[] = [];
  private lastSearchParams: SearchParams | null = null;

  public resultIndex = 0;

  private setHighlightRects: StateSetter<DOMRect[]>;
  private setResultCount: StateSetter<number | null>;
  private setCurrentResultIndex: StateSetter<number | null>;

  public searchText: string | null = null;

  constructor(
    private editor: LexicalEditor,
    setters: {
      setHighlightRects: StateSetter<DOMRect[]>;
      setResultCount: StateSetter<number | null>;
      setCurrentResultIndex: StateSetter<number | null>;
    }
  ) {
    this.setHighlightRects = setters.setHighlightRects;
    this.setResultCount = setters.setResultCount;
    this.setCurrentResultIndex = setters.setCurrentResultIndex;
  }

  get isCurrentlySearching() {
    return this.lastSearchParams?.searchString && this.lastSearchParams?.searchString.length > 0;
  }

  private get resultCount() {
    return this.highlightedText.length;
  }

  private replaceMatchesWithNewNodes(params: SearchParams) {
    return () => {
      let reaminingResults = MAX_RESULTS;
      this.highlightedText = [];
      const strLength = params.searchString.length;
      const regex = new RegExp(
        params.searchString.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
        params.matchCase ? "g" : "gi"
      );
      const children = $getRoot().getChildren();

      const selection = this.editor.getEditorState().read($getSelection);
      let nearestLineNode: LineNode | null = null;
      if ($isRangeSelection(selection)) {
        nearestLineNode = $getNearestNodeOfType(selection.anchor.getNode(), LineNode);
      }

      let shiftPoint = 0;
      for (const child of children) {
        if (!$isLineNode(child)) continue;
        const lineNode: LineNode = child;
        if (child === nearestLineNode) {
          shiftPoint = this.highlightedText.length;
        }
        const text = lineNode.getTextContent();

        const indexes: number[] = [];
        let result: RegExpExecArray | null;
        while ((result = regex.exec(text)) && indexes.length < reaminingResults--)
          indexes.push(result.index);

        if (!indexes.length) continue;
        const insertPoint = lineNode.getLastChild();
        if (!insertPoint) continue;

        if (lineNode.getChildrenSize() > 1) {
          for (let i = lineNode.getChildrenSize() - 1; i >= 0; i--) {
            lineNode.removeChildAtIndex(i);
          }
        }
        insertPoint.clear();

        const chunks: number[] = [];
        if (indexes[0] !== 0) chunks.push(0);
        for (const index of indexes) chunks.push(index, index + strLength);
        if (chunks.at(-1) !== text.length) chunks.push(text.length);

        for (let i = 0; i < chunks.length - 1; i++) {
          const start = chunks[i];
          const end = chunks[i + 1];
          const txt = text.substring(start, end);
          const textNode = $createTextNode(txt);
          // Prevent neighboring text nodes from being merged together.
          textNode.setMode("token");
          if (indexes.includes(chunks[i])) {
            this.highlightedText.push(textNode as TextNode);
          }
          insertPoint.append(textNode);
        }
      }

      // Re-order the highlighted text so that the nearest match is first,
      // wrapping around if necessary.
      while (shiftPoint > 0) {
        this.highlightedText.push(this.highlightedText.shift() as TextNode);
        shiftPoint--;
      }

      this.setResultCount(this.resultCount);
    };
  }

  private async measureHighlightRects() {
    const scrollEl = this.editor.getRootElement()!.parentElement!.parentElement!;
    return new Promise<DOMRect[]>((resolve) => {
      this.editor.getEditorState().read(() => {
        const rects: DOMRect[] = [];
        for (const highlight of this.highlightedText) {
          const el: HTMLSpanElement | null = this.editor.getElementByKey(highlight.getKey());
          if (el) {
            const rect = el.getBoundingClientRect();
            const sumRect = new DOMRect(
              rect.left + scrollEl.scrollLeft,
              rect.top + scrollEl.scrollTop,
              rect.width,
              rect.height
            );
            rects.push(sumRect);
          }
        }
        this.setHighlightRects(rects);
        resolve(rects);
      });
    });
  }

  public handleSearch = (params: SearchParams) => {
    this.clearSearch();
    this.lastSearchParams = params;

    // Save the editor state before the search, since we will be modifying the
    // editor state to highlight the search results.
    const lastState = this.editor.getEditorState();
    // Save the current selection so we can restore it after the search.
    const selection = lastState.read($getSelection);

    const focusedEl = document.activeElement;

    this.setHighlightRects([]);
    if (params.searchString.length <= 0) {
      this.clearSearch();
      return;
    }

    // We should not be able to edit the editor while searching.
    this.editor.setEditable(false);
    this.searchText = lastState.read($getTextContent);

    // Replace all matches with new text nodes.
    this.editor.update(this.replaceMatchesWithNewNodes(params), {
      onUpdate: () => {
        // Measure the rects of the new text nodes.
        this.measureHighlightRects().then(() => {
          // Restore the editor state to it's pre-search state
          this.editor.setEditorState(lastState);
          this.editor.setEditable(true);
          // Restore the selection

          if (focusedEl === this.editor.getRootElement()) {
            this.editor.focus(() => {
              $setSelection(selection);
            });
          } else if (focusedEl) {
            (focusedEl as HTMLElement).focus();
          }
        });
      },
    });
  };

  public clearSearch() {
    this.lastSearchParams = null;
    this.resultIndex = 0;
    this.highlightedText = [];
    this.setCurrentResultIndex(null);
    this.setResultCount(null);
    this.setHighlightRects([]);
  }

  public moveToNextResult = () => {
    if (!this.isCurrentlySearching) {
      return this.setCurrentResultIndex(null);
    }
    const i = this.resultIndex;
    this.resultIndex = (i + 1) % this.resultCount;
    this.setCurrentResultIndex(this.resultIndex);
  };

  public moveToPreviousResult = () => {
    if (!this.isCurrentlySearching) {
      return this.setCurrentResultIndex(null);
    }
    if (this.resultIndex-- === 0) {
      this.resultIndex = this.resultCount - 1;
    }
    this.setCurrentResultIndex(this.resultIndex);
  };
}
