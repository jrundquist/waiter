import {
  EditorConfig,
  TextNode,
  NodeKey,
  ElementNode,
  Spread,
  SerializedTextNode,
  DOMConversionMap,
} from "lexical";

type SerializedForcedTypeNode = Spread<
  {
    type: "forcedType";
    char: Parameters<typeof $createForcedTypeNode>[0];
  },
  SerializedTextNode
>;

type ForcedOptions = "@" | "." | "!" | ">" | "~";

export class ForcedTypeNode extends TextNode {
  /** @internal */
  static getType() {
    return "forcedType";
  }

  constructor(char: string, key?: NodeKey) {
    super(`${char}`, key);
  }

  static clone(node: ForcedTypeNode): ForcedTypeNode {
    return new ForcedTypeNode(node.__text, node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.classList.add("forced");
    return element;
  }

  exportJSON(): SerializedForcedTypeNode {
    const json = super.exportJSON() as SerializedForcedTypeNode;
    json.type = "forcedType";
    json.char = this.__text as typeof json.char;
    json.version = 1;
    return json;
  }

  static importJSON(serializedNode: SerializedForcedTypeNode): ForcedTypeNode {
    const node = $createForcedTypeNode(serializedNode.char);
    node.setTextContent(serializedNode.text);
    return node;
  }

  static importDOM(): DOMConversionMap | null {
    function isForcedSpan(node: HTMLElement): boolean {
      return Boolean(
        node.classList.contains("forced") &&
          node.textContent?.match(/^[@.!>~]$/) !== null
      );
    }

    function convertForcedSpan(el: HTMLElement) {
      const node = $createForcedTypeNode(el.textContent as ForcedOptions);
      return {
        node,
      };
    }

    return {
      span: (node) => {
        if (isForcedSpan(node as HTMLElement)) {
          return {
            conversion: convertForcedSpan,
            priority: 1,
          };
        }
        return null;
      },
    };
  }
}

export function $isForcedTypeNode(node: unknown): node is ForcedTypeNode {
  return node instanceof ForcedTypeNode;
}

export function $createForcedTypeNode(marker: ForcedOptions): ForcedTypeNode {
  // return new ForcedTypeNode();
  const node = new ForcedTypeNode(marker);
  node.setMode("token");
  return node;
}

export function findForcedTypeNode(node: ElementNode): ForcedTypeNode | null {
  if ($isForcedTypeNode(node)) {
    return node;
  }
  if (!node.getChildrenSize) {
    return null;
  }
  for (let i = 0; i < node.getChildrenSize(); i++) {
    const child = node.getChildAtIndex(i);
    const result = findForcedTypeNode(child as ElementNode);
    if (result) {
      return result;
    }
  }
  return null;
}
