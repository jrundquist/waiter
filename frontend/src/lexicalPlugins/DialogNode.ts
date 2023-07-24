import { EditorConfig, TextNode, NodeKey } from "lexical";

export class DialogNode extends TextNode {
  /** @internal */
  static getType() {
    return "dialog";
  }

  constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  static clone(node: DialogNode): DialogNode {
    return new DialogNode(node.__text, node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.classList.add("dialog");
    return element;
  }
}

export function $isDialogNode(node: unknown) {
  return node instanceof DialogNode;
}

export function $createDialogNode(scene: string): DialogNode {
  // return new DialogNode();
  return new DialogNode(scene);
}
