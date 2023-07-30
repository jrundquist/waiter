import {
  $createLineBreakNode,
  $isLineBreakNode,
  EditorConfig,
  ElementNode,
  NodeKey,
  RangeSelection,
} from "lexical";
import * as utils from "@lexical/utils";
import { $createLineNode, LineNodeType } from "./LineNode";
import { didSplitNode } from "./didSplitNode";

const EXIT_NODE_ON_ENTER = true;
const INSERT_EXTRA_LINE_BREAK = true;

export class DialogNode extends ElementNode {
  /** @internal */
  static getType() {
    return "dialog";
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  static clone(node: DialogNode): DialogNode {
    return new DialogNode(node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("span");
    utils.addClassNamesToElement(element, "dialog");
    return element;
  }

  updateDOM(prevNode: DialogNode, dom: HTMLElement, config: EditorConfig) {
    return false;
  }

  insertNewAfter(selection: RangeSelection, restoreSelection = true) {
    if (didSplitNode(selection)) {
      // We're in the middle of the line, so a linebreak should be inserted.
      selection.anchor.getNode()!.splitText(selection.anchor.offset);
      return null;
    }
    // Double new line means we should return back to the scene
    if (
      EXIT_NODE_ON_ENTER ||
      $isLineBreakNode(this.getChildAtIndex(this.getChildrenSize() - 1))
    ) {
      const newLine = $createLineNode(LineNodeType.None);
      // Swap the order so they are inserted in the correct order.
      this.getParent()!.insertAfter(newLine, restoreSelection);
      if (INSERT_EXTRA_LINE_BREAK) {
        this.getLastChild()?.insertAfter($createLineBreakNode(), false);
      }
      return newLine;
    }

    if (this.isEmpty()) {
      // If the dialog is empty, we should insert a new line.
      const newLine = $createLineNode(LineNodeType.None);
      this.getParent()!.insertAfter(newLine, false);
      return newLine;
    }

    return null;
  }

  extractWithChild() {
    return true;
  }
}

export function $isDialogNode(node: unknown) {
  return node instanceof DialogNode;
}

export function $createDialogNode(): DialogNode {
  // return new DialogNode();
  return new DialogNode();
}
