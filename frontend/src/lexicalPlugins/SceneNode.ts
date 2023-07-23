import { EditorConfig, TextNode, NodeKey } from "lexical";

export class SceneNode extends TextNode {
  /** @internal */
  static getType() {
    return "scene";
  }

  constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  static clone(node: SceneNode): SceneNode {
    return new SceneNode(node.__text, node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.classList.add("scene");
    return element;
  }
}

export function $isSceneNode(node: unknown) {
  return node instanceof SceneNode;
}

export function $createSceneNode(scene: string): SceneNode {
  // return new SceneNode();
  return new SceneNode(scene);
}
