import { EditorConfig, ElementNode, NodeKey, RangeSelection } from "lexical";
import * as utils from "@lexical/utils";
import { $createLineNode, $isLineNode, LineNodeType } from "./LineNode";
import { $createDialogNode } from "./DialogNode";

export class ActionNode extends ElementNode {
  constructor(key?: NodeKey) {
    super(key);
  }

  static getType(): string {
    return "action";
  }

  static clone(node: ActionNode): ActionNode {
    return new ActionNode(node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("span");
    utils.addClassNamesToElement(element, "action");
    return element;
  }

  updateDOM(prevNode: ActionNode, dom: HTMLElement, config: EditorConfig) {
    return false;
  }

  insertNewAfter(selection: RangeSelection, restoreSelection = true) {
    const lineNode = $createLineNode(LineNodeType.Action);
    const direction = this.getDirection();
    lineNode.setDirection(direction);
    this.getParent()!.insertAfter(lineNode, false);
    return lineNode;
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

export function $isActionNode(node: unknown) {
  return node instanceof ActionNode;
}

export function $createActionNode() {
  return new ActionNode();
}
