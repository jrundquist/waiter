import {
  EditorConfig,
  $applyNodeReplacement,
  ElementNode,
  RangeSelection,
  $createParagraphNode,
  SerializedElementNode,
  Spread,
  DOMConversionMap,
} from "lexical";
import * as utils from "@lexical/utils";
import { didSplitNode } from "./utils/didSplitNode";
import { $createDialogNode } from "./DialogNode";
import { $createLineNode, LineNodeType } from "./LineNode";

type SerializedParentheticalNode = Spread<
  {
    type: "parenthetical";
  },
  SerializedElementNode
>;

export class ParentheticalNode extends ElementNode {
  /** @internal */
  static getType() {
    return "parenthetical";
  }

  constructor(key?: string) {
    super(key);
  }

  static clone(node: ParentheticalNode) {
    return new ParentheticalNode(node.__key);
  }

  createDOM(_config: EditorConfig) {
    const element = document.createElement("span");
    utils.addClassNamesToElement(element, "parenthetical");
    return element;
  }

  updateDOM(_prevNode: ParentheticalNode, _dom: HTMLElement, _config: EditorConfig) {
    return false;
  }

  exportJSON(): SerializedParentheticalNode {
    const json = super.exportJSON() as SerializedParentheticalNode;
    json.type = "parenthetical";
    json.version = 1;
    return json;
  }

  static importJSON(_serializedNode: SerializedParentheticalNode): ParentheticalNode {
    const node = $createParentheticalNode();
    return node;
  }

  static importDOM(): DOMConversionMap | null {
    function isParantheticalSpan(node: HTMLElement): boolean {
      return node.classList.contains("parenthetical");
    }

    function convertParentheticalSpan(_el: HTMLElement) {
      const node = $createParentheticalNode();
      return {
        node,
      };
    }

    return {
      span: (node) => {
        if (isParantheticalSpan(node as HTMLElement)) {
          return {
            conversion: convertParentheticalSpan,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  insertNewAfter(selection: RangeSelection, _restoreSelection = true) {
    if (didSplitNode(selection)) {
      // We're in the middle of the line, so a linebreak should be inserted.
      selection.anchor.getNode()!.splitText(selection.anchor.offset);
      return null;
    }
    const lineNode = $createLineNode(LineNodeType.Dialog);
    const dialogNode = $createDialogNode();
    lineNode.append(dialogNode);
    const direction = this.getDirection();
    lineNode.setDirection(direction);
    this.getParent()!.insertAfter(lineNode, false);
    dialogNode.select();
    return lineNode;
  }

  collapseAtStart() {
    const newElement = !this.isEmpty() ? $createParentheticalNode() : $createParagraphNode();
    const children = this.getChildren();
    children.forEach((child) => newElement.append(child));
    this.replace(newElement);
    return true;
  }

  extractWithChild() {
    return true;
  }
}

export function $isParentheticalNode(node: unknown) {
  return node instanceof ParentheticalNode;
}

export function $createParentheticalNode(): ParentheticalNode {
  // return new ParentheticalNode();
  return $applyNodeReplacement(new ParentheticalNode());
}
