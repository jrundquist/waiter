import { $getRoot, LexicalEditor } from "lexical";
import { $isLineNode, LineNode, LineNodeType } from "../LineNode";
import { ClearableWeakMap } from "./clearableWeakMap";

const PPI = 96;
const FULL_PAGE = 11 * PPI;
const MARGIN_TOP = 1 * PPI;
const MARGIN_BOTTOM = 1 * PPI;
const CONTENT_HEIGHT = FULL_PAGE - MARGIN_TOP - MARGIN_BOTTOM * 0.5;

function _updatePages(
  editor: LexicalEditor,
  lineNodeToEl: ClearableWeakMap<LineNode, HTMLElement>
) {
  editor.update(() => {
    const updateStart = performance.now();

    let currentPage = 1;
    let remainingHeight = CONTENT_HEIGHT;

    // Walk the children of the root node, and assign a page number to each
    const children = $getRoot().getChildren();

    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if ($isLineNode(node)) {
        const el = lineNodeToEl.get(node);
        if (el !== undefined) {
          el.removeAttribute("data-page");
          const height = el.offsetHeight;
          if (height < remainingHeight) {
            // We're still in the same page
            remainingHeight -= height;
            continue;
          }
          // If this node is empty, we can ignore it.
          if (node.getTextContent() === "") {
            continue;
          }

          // We've run out of space on this page, so move to the next one.
          currentPage++;
          remainingHeight = CONTENT_HEIGHT - height;
          el.setAttribute("data-page", `${currentPage}.`);
          node.setPage(currentPage);

          // Lookback to see if we should move the previous node to the new page
          const prevNode = node.getPreviousSibling() as LineNode;
          if (
            (node.getElementType() === LineNodeType.Dialog &&
              prevNode.getElementType() === LineNodeType.Character) ||
            prevNode.getElementType() === LineNodeType.Scene
          ) {
            // move the previous el to the new page too.
            const prevEl = lineNodeToEl.get(prevNode);
            if (prevEl !== undefined) {
              prevNode.setPage(currentPage);
              prevEl.setAttribute("data-page", `${currentPage}.`);
              el.removeAttribute("data-page");
              remainingHeight -= prevEl.offsetHeight;
            }
          }
        }
      }
    }

    const updateEnd = performance.now();
    console.log("Time to update pages: ", updateEnd - updateStart);
    console.log({ totalPages: currentPage });
  });
}

let execTimeout = 0;

// export a debounced version of the function
export function updatePages(
  editor: LexicalEditor,
  lineNodeToEl: ClearableWeakMap<LineNode, HTMLElement>
) {
  if (execTimeout) {
    clearTimeout(execTimeout);
  }
  execTimeout = setTimeout(() => {
    _updatePages(editor, lineNodeToEl);
  }, 200);
}
