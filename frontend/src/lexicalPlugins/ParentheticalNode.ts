import {
  EditorConfig,
  $applyNodeReplacement,
  ElementNode,
  LexicalEditor,
  SerializedLexicalNode,
  SerializedElementNode,
  RangeSelection,
  $createParagraphNode,
  LexicalNode,
  ParagraphNode,
} from "lexical";
import * as richText from "@lexical/rich-text";
import * as utils from "@lexical/utils";

type SerializedParentheticalNode =
  SerializedElementNode<SerializedLexicalNode> & {
    text: string;
    type: "parenthetical";
    version: number;
  };

export class ParentheticalNode extends ElementNode {
  /** @internal */
  static getType() {
    return "parenthetical";
  }

  constructor(key?: string) {
    super(key);
  }

  static clone(node: ParentheticalNode) {
    return new ParentheticalNode(node.__key);
  }

  createDOM(config: EditorConfig) {
    const element = document.createElement("div");
    utils.addClassNamesToElement(element, "parenthetical");
    return element;
  }

  updateDOM(
    prevNode: ParentheticalNode,
    dom: HTMLElement,
    config: EditorConfig
  ) {
    return false;
  }

  insertNewAfter(selection: RangeSelection, restoreSelection = true) {
    const anchorOffet = selection ? selection.anchor.offset : 0;
    const newElement: LexicalNode =
      anchorOffet > 0 && anchorOffet < this.getTextContentSize()
        ? $createParentheticalNode()
        : $createParagraphNode();
    const direction = this.getDirection();
    newElement.setDirection(direction);
    this.insertAfter(newElement, restoreSelection);
    return newElement;
  }

  collapseAtStart() {
    const newElement = !this.isEmpty()
      ? $createParentheticalNode()
      : $createParagraphNode();
    const children = this.getChildren();
    children.forEach((child) => newElement.append(child));
    this.replace(newElement);
    return true;
  }

  extractWithChild() {
    return true;
  }
}

export function $isParentheticalNode(node: unknown) {
  return node instanceof ParentheticalNode;
}

export function $createParentheticalNode(): ParentheticalNode {
  // return new ParentheticalNode();
  return $applyNodeReplacement(new ParentheticalNode());
}
