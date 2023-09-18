import { $createTextNode, $getRoot, EditorState, LexicalEditor, TextNode } from "lexical";
import { $isLineNode, LineNode } from "../LineNode";

const MAX_RESULTS = 100;

export declare interface SearchParams {
  searchString: string;
}

export class FindController {
  private lastState: EditorState | null = null;

  private highlightedText: TextNode[] = [];

  constructor(
    private editor: LexicalEditor,
    private setHighlightRects: (rects: DOMRect[]) => void
  ) {}

  private replaceMatchesWithNewNodes(params: SearchParams) {
    return () => {
      let reaminingResults = MAX_RESULTS;
      this.highlightedText = [];
      const strLength = params.searchString.length;
      const regex = new RegExp(params.searchString, "gi");
      const children = $getRoot().getChildren();
      for (const child of children) {
        if (!$isLineNode(child)) continue;
        const lineNode: LineNode = child;
        const text = lineNode.getTextContent();

        const indexes: number[] = [];
        let result: RegExpExecArray | null;
        while ((result = regex.exec(text)) && indexes.length < reaminingResults--)
          indexes.push(result.index);

        if (!indexes.length) continue;
        const insertPoint = lineNode.getLastChild();
        console.log({ insertPoint });
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
    };
  }

  private async measureHighlightRects() {
    return new Promise<DOMRect[]>((resolve) => {
      this.editor.getEditorState().read(() => {
        const rects: DOMRect[] = [];
        for (const highlight of this.highlightedText) {
          const el: HTMLSpanElement | null = this.editor.getElementByKey(highlight.getKey());
          if (el) {
            const rect = el.getBoundingClientRect();
            const sumRect = new DOMRect(rect.left, rect.top, rect.width, rect.height);
            rects.push(sumRect);
          }
        }
        this.setHighlightRects(rects);
        resolve(rects);
      });
    });
  }

  public handleSearch = (params: SearchParams) => {
    // Save the editor state before the search, since we will be modifying the
    // editor state to highlight the search results.
    this.lastState = this.editor.getEditorState();

    this.setHighlightRects([]);
    if (params.searchString.length <= 0) return;

    // We should not be able to edit the editor while searching.
    this.editor.setEditable(false);

    // Replace all matches with new text nodes.
    this.editor.update(this.replaceMatchesWithNewNodes(params), {
      onUpdate: () => {
        // Measure the rects of the new text nodes.
        this.measureHighlightRects().then(() => {
          // Restore the editor state to it's pre-search state
          this.editor.setEditorState(this.lastState!);
        });
      },
    });
  };
}
