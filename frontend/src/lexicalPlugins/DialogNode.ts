import {
  $isLineBreakNode,
  EditorConfig,
  ElementNode,
  NodeKey,
  RangeSelection,
} from "lexical";
import * as utils from "@lexical/utils";
import { $createLineNode, LineNodeType } from "./LineNode";

const EXIT_ON_ENTER = true;

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
    // Double new line means we should return back to the scene
    if (
      EXIT_ON_ENTER ||
      $isLineBreakNode(this.getChildAtIndex(this.getChildrenSize() - 1))
    ) {
      // Remove the trailing dialog linebreak, replacing it with an empty line.
      if ($isLineBreakNode(this.getLastChild())) {
        this.getLastChild()!.remove();
      }
      const lineBreak = $createLineNode(LineNodeType.None);
      const newLine = $createLineNode(LineNodeType.None);
      // Swap the order so they are inserted in the correct order.
      this.getParent()!.insertAfter(newLine, restoreSelection);
      this.getParent()!.insertAfter(lineBreak, false);
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
