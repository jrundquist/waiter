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
import { $createLineNode, LineNodeType } from "./LineNode";
import { didSplitNode } from "./utils/didSplitNode";

const EXTRA_LINE_BREAK = true;

export type SceneNumber = string | null;

type SerializedSceneNode = Spread<
  {
    type: "scene";
    number: SceneNumber;
  },
  SerializedElementNode
>;

export class SceneNode extends ElementNode {
  /** @internal */
  static getType() {
    return "scene";
  }

  static clone(node: SceneNode): SceneNode {
    return new SceneNode(node.__number, node.__key);
  }

  private __number: SceneNumber = null;

  constructor(number: SceneNumber = null, key?: NodeKey) {
    super(key);
    this.__number = number;
  }

  getType() {
    const sceneNumber = this.getSceneNumber();
    if (!sceneNumber) {
      return SceneNode.getType();
    }
    return `${SceneNode.getType()} #${sceneNumber}#`;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("span");
    utils.addClassNamesToElement(element, "scene");
    element.setAttribute("data-scene-number", this.getSceneNumber() ?? "");
    return element;
  }

  setSceneNumber(number: SceneNumber) {
    const self = this.getWritable();
    self.__number = number;
  }

  getSceneNumber() {
    const self = this.getLatest();
    return self.__number;
  }

  updateDOM(prevNode: SceneNode, dom: HTMLElement, config: EditorConfig) {
    if (dom.getAttribute("data-scene-number") !== this.getSceneNumber()) {
      dom.setAttribute("data-scene-number", this.getSceneNumber() ?? "");
    }
    return false;
  }

  exportJSON(): SerializedSceneNode {
    const json = super.exportJSON() as SerializedSceneNode;
    json.type = "scene";
    json.version = 1;
    json.number = this.getSceneNumber();
    return json;
  }

  static importJSON(serializedNode: SerializedSceneNode): SceneNode {
    const node = $createSceneNode();
    node.setSceneNumber(serializedNode.number);
    return node;
  }

  static importDOM(element: HTMLElement): DOMConversionMap | null {
    function isSceneSpan(node: HTMLElement): boolean {
      return node.classList.contains("scene");
    }

    function convertLineElement(el: HTMLElement) {
      const node = $createSceneNode();
      if (el.hasAttribute("data-scene-number")) {
        node.__number = el.getAttribute("data-scene-number")!;
      }
      return {
        node,
      };
    }

    return {
      span: (node) => {
        if (isSceneSpan(node as HTMLElement)) {
          return {
            conversion: convertLineElement,
            priority: 1,
          };
        }
        return null;
      },
    };
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

export function $isSceneNode(node: unknown): node is SceneNode {
  return node instanceof SceneNode;
}

export function $createSceneNode(): SceneNode {
  return new SceneNode();
}
