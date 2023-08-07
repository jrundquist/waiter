import {
  DOMConversionMap,
  EditorConfig,
  ElementNode,
  NodeKey,
  RangeSelection,
  SerializedElementNode,
  Spread,
} from "lexical";
import * as utils from "@lexical/utils";
import { $createLineNode, $isLineNode, LineNodeType } from "./LineNode";

type SerializedLyricNode = Spread<
  {
    type: "lyric";
  },
  SerializedElementNode
>;

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

  exportJSON(): SerializedLyricNode {
    const json = super.exportJSON() as SerializedLyricNode;
    json.type = "lyric";
    json.version = 1;
    return json;
  }

  static importJSON(serializedNode: SerializedLyricNode): LyricNode {
    const node = $createLyricNode();
    return node;
  }

  static importDOM(): DOMConversionMap | null {
    function isCharacterSpan(node: HTMLElement): boolean {
      return node.classList.contains("lyric");
    }

    function convertLyricSpan(el: HTMLElement) {
      const node = $createLyricNode();
      return {
        node,
      };
    }

    return {
      span: (node) => {
        if (isCharacterSpan(node as HTMLElement)) {
          return {
            conversion: convertLyricSpan,
            priority: 1,
          };
        }
        return null;
      },
    };
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
