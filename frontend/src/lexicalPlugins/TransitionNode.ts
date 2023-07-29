import {
  $createParagraphNode,
  EditorConfig,
  ElementNode,
  NodeKey,
  RangeSelection,
} from "lexical";
import * as utils from "@lexical/utils";
import { $isLineNode, LineNodeType } from "./LineNode";

export class TransitionNode extends ElementNode {
  /** @internal */
  static getType() {
    return "transition";
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  static clone(node: TransitionNode): TransitionNode {
    return new TransitionNode(node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("span");
    utils.addClassNamesToElement(element, "transition");
    return element;
  }

  updateDOM(prevNode: TransitionNode, dom: HTMLElement, config: EditorConfig) {
    return false;
  }

  insertNewAfter(selection: RangeSelection, restoreSelection = true) {
    const newElement = $createParagraphNode();
    const direction = this.getDirection();
    newElement.setDirection(direction);
    this.getParent()!.insertAfter(newElement, restoreSelection);
    return newElement;
  }

  collapseAtStart() {
    console.log("collapseAtStart");
    // move the selection to the parent
    const parent = this.getParent();
    if (!parent) {
      return false;
    }
    if ($isLineNode(parent)) {
      if (parent.isForced()) {
        // First remove on empty unforces the line.
        parent.setForced(false);
        return true;
      } else {
        parent.setElementType(LineNodeType.None);
      }
    }
    this.remove();
    parent.select();
    return true;
  }

  extractWithChild() {
    return true;
  }
}

export function $isTransitionNode(node: unknown) {
  return node instanceof TransitionNode;
}

export function $createTransitionNode(): TransitionNode {
  return new TransitionNode();
}
