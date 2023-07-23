import { EditorConfig, TextNode, LexicalEditor, NodeKey } from "lexical";

export class CharacterNode extends TextNode {
  constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  static getType(): string {
    return "character";
  }

  static clone(node: CharacterNode): CharacterNode {
    return new CharacterNode(node.__text, node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.style.color = this.__color;
    element.classList.add("character");
    element.classList.add("character:" + this.safeName());
    return element;
  }

  private safeName() {
    return this.__text
      .replaceAll(/[^a-zA-Z0-9]/gi, "-")
      .replaceAll(/-+/g, "-")
      .toLocaleLowerCase();
  }
}

export function $isCharacterNode(node: unknown) {
  return node instanceof CharacterNode;
}

export function $createCharacterNode(characterName: string) {
  return new CharacterNode(characterName);
}
