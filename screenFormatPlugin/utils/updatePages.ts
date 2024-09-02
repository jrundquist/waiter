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
    const nodes = $getRoot().getChildren().filter($isLineNode);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const el = lineNodeToEl.get(node);
      if (!el) {
        continue;
      }
      el.removeAttribute("data-page");
      const height = node.getMeasureHeight() ?? 0;
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
      remainingHeight = CONTENT_HEIGHT - height;
      currentPage++;

      // Move the current node, and any that should come with it to the new page.

      let elToMove = el;
      let nodeToMove = node;
      let nodeMoved = false;

      do {
        nodeMoved = false;
        const prevNode = nodeToMove.getPreviousSibling() as LineNode;
        if (!prevNode || !lineNodeToEl.has(prevNode)) {
          break;
        }
        const isDialog =
          node.getElementType() === LineNodeType.Dialog &&
          [LineNodeType.Character, LineNodeType.Parenthetical].includes(prevNode.getElementType());

        const firstBlockInScene = prevNode.getElementType() === LineNodeType.Scene;

        const isEmptyAction =
          prevNode.getElementType() === LineNodeType.None && prevNode.getTextContent() === "";

        const sceneBeforeAction =
          isEmptyAction &&
          (prevNode.getPreviousSibling() as LineNode)?.getElementType() === LineNodeType.Scene;

        if (currentPage === 2) {
          console.log({
            prevNode,
            txt: prevNode.getTextContent(),
            isDialog,
            firstBlockInScene,
            sceneBeforeAction,
          });
        }

        if (isDialog || firstBlockInScene || sceneBeforeAction) {
          nodeMoved = true;
          nodeToMove = prevNode;

          if (sceneBeforeAction) {
            nodeToMove = prevNode.getPreviousSibling() as LineNode;
          }
          elToMove = lineNodeToEl.get(nodeToMove)!;
        }
      } while (nodeMoved);

      nodeToMove.setPage(currentPage);
      elToMove.setAttribute("data-page", `${currentPage}.`);
    }

    // const updateEnd = performance.now();
    // console.log("Time to update pages: ", updateEnd - updateStart);
    // console.log({ totalPages: currentPage });
  });
}

let execTimeout: ReturnType<typeof setTimeout> | null = null;

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
