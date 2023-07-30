import { EditorConfig, ElementNode, NodeKey, RangeSelection } from "lexical";
import * as utils from "@lexical/utils";
import { $createLineNode, $isLineNode, LineNodeType } from "./LineNode";
import { $createDialogNode } from "./DialogNode";

export class LyricNode extends ElementNode {
  constructor(key?: NodeKey) {
    super(key);
  }

  static getType(): string {
    return "lyric";
  }

  static clone(node: LyricNode): LyricNode {
    return new LyricNode(node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("span");
    utils.addClassNamesToElement(element, "lyric");
    return element;
  }

  updateDOM(prevNode: LyricNode, dom: HTMLElement, config: EditorConfig) {
    return false;
  }

  insertNewAfter(selection: RangeSelection, restoreSelection = true) {
    const lineNode = $createLineNode(LineNodeType.None);
    const direction = this.getDirection();
    lineNode.setDirection(direction);
    this.getParent()!.insertAfter(lineNode, false);
    return lineNode;
  }

  collapseAtStart() {
    // move the selection to the parent
    const parent = this.getParent();
    if (!parent) {
      return false;
    }
    if ($isLineNode(parent)) {
      parent.setElementType(LineNodeType.None);
    }
    this.remove();
    parent.select();
    return true;
  }

  extractWithChild() {
    return true;
  }
}

export function $isLyricNode(node: unknown) {
  return node instanceof LyricNode;
}

export function $createLyricNode() {
  return new LyricNode();
}
