import {
  $createParagraphNode,
  EditorConfig,
  ElementNode,
  NodeKey,
  RangeSelection,
} from "lexical";
import * as utils from "@lexical/utils";

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

  insertNewAfter(selection: RangeSelection, restoreSelection = true) {
    const newElement = $createParagraphNode();
    // const anchorOffet = selection ? selection.anchor.offset : 0;
    // const newElement: LexicalNode =
    //   anchorOffet > 0 && anchorOffet < this.getTextContentSize()
    //     ? $createSceneNode()
    //     : $createParagraphNode();
    const direction = this.getDirection();
    newElement.setDirection(direction);
    this.getParent()!.insertAfter(newElement, restoreSelection);
    return newElement;
  }
}

export function $isSceneNode(node: unknown) {
  return node instanceof SceneNode;
}

export function $createSceneNode(): SceneNode {
  return new SceneNode();
}
