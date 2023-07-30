import {
  EditorConfig,
  ElementNode,
  NodeKey,
  RangeSelection,
  SerializedElementNode,
  Spread,
} from "lexical";
import * as utils from "@lexical/utils";
import { $createLineNode, LineNodeType } from "./LineNode";
import { didSplitNode } from "./utils/didSplitNode";

const EXTRA_LINE_BREAK = true;

type SerializedSceneNode = Spread<
  {
    type: "scene";
  },
  SerializedElementNode
>;

export class SceneNode extends ElementNode {
  /** @internal */
  static getType() {
    return "scene";
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  static clone(node: SceneNode): SceneNode {
    return new SceneNode(node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("span");
    utils.addClassNamesToElement(element, "scene");
    return element;
  }

  updateDOM(prevNode: SceneNode, dom: HTMLElement, config: EditorConfig) {
    return false;
  }

  exportJSON(): SerializedSceneNode {
    const json = super.exportJSON() as SerializedSceneNode;
    json.type = "scene";
    json.version = 1;
    return json;
  }

  static importJSON(serializedNode: SerializedSceneNode): SceneNode {
    const node = $createSceneNode();
    return node;
  }

  insertNewAfter(selection: RangeSelection, restoreSelection = true) {
    if (didSplitNode(selection)) {
      // We're in the middle of the line, so a linebreak should be inserted.
      selection.anchor.getNode()!.splitText(selection.anchor.offset);
      return null;
    }
    // Swap the order so they are inserted in the correct order.
    const node = $createLineNode(LineNodeType.None);
    this.getParent()!.insertAfter(node, restoreSelection);
    if (EXTRA_LINE_BREAK) {
      this.getParent()!.insertAfter($createLineNode(LineNodeType.None), false);
    }
    return node;
  }
}

export function $isSceneNode(node: unknown) {
  return node instanceof SceneNode;
}

export function $createSceneNode(): SceneNode {
  return new SceneNode();
}
