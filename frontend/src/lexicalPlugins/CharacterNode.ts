import {
  DOMConversionMap,
  EditorConfig,
  ElementNode,
  NodeKey,
  RangeSelection,
  SerializedElementNode,
  SerializedTextNode,
  Spread,
} from "lexical";
import * as utils from "@lexical/utils";
import { $createLineNode, $isLineNode, LineNodeType } from "./LineNode";
import { $createDialogNode } from "./DialogNode";

type SerializedCharacterNode = Spread<
  {
    type: "character";
    version: 1;
  },
  SerializedElementNode
>;

export class CharacterNode extends ElementNode {
  constructor(key?: NodeKey) {
    super(key);
  }

  static getType(): string {
    return "character";
  }

  static clone(node: CharacterNode): CharacterNode {
    return new CharacterNode(node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("span");
    utils.addClassNamesToElement(element, "character");
    return element;
  }

  updateDOM(prevNode: CharacterNode, dom: HTMLElement, config: EditorConfig) {
    return false;
  }

  exportJSON(): SerializedCharacterNode {
    const json = super.exportJSON() as SerializedCharacterNode;
    json.type = "character";
    json.version = 1;
    return json;
  }

  static importJSON(serializedNode: SerializedCharacterNode): CharacterNode {
    const node = $createCharacterNode();
    return node;
  }

  static importDOM(): DOMConversionMap | null {
    function isCharacterSpan(node: HTMLElement): boolean {
      return node.classList.contains("character");
    }

    function convertCharacterSpan(el: HTMLElement) {
      const node = $createCharacterNode();
      return {
        node,
      };
    }

    return {
      span: (node) => {
        if (isCharacterSpan(node as HTMLElement)) {
          return {
            conversion: convertCharacterSpan,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  insertNewAfter(selection: RangeSelection, restoreSelection = true) {
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

export function $isCharacterNode(node: unknown) {
  return node instanceof CharacterNode;
}

export function $createCharacterNode() {
  return new CharacterNode();
}
