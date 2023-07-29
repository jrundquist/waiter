import { EditorConfig, ElementNode, NodeKey } from "lexical";
import * as utils from "@lexical/utils";

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
