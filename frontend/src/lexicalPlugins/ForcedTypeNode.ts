import { EditorConfig, TextNode, NodeKey } from "lexical";

export class ForcedTypeNode extends TextNode {
  /** @internal */
  static getType() {
    return "forcedType";
  }

  constructor(char: string, key?: NodeKey) {
    super(char, key);
  }

  static clone(node: ForcedTypeNode): ForcedTypeNode {
    return new ForcedTypeNode(node.__text, node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.classList.add("forced");
    return element;
  }
}

export function $isForcedTypeNode(node: unknown) {
  return node instanceof ForcedTypeNode;
}

export function $createForcedTypeNode(
  marker: "@" | "." | "!" | ">"
): ForcedTypeNode {
  // return new ForcedTypeNode();
  const node = new ForcedTypeNode(marker);
  node.setMode("token");
  return node;
}
