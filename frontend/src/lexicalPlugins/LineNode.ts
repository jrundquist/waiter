import {
  $createTextNode,
  $isTextNode,
  EditorConfig,
  ElementNode,
  LexicalNode,
  ParagraphNode,
} from "lexical";
import * as utils from "@lexical/utils";
import { $createCharacterNode } from "./CharacterNode";
import { $createForcedTypeNode } from "./ForcedTypeNode";
import { SCENE_HEADER_PATTERN, TRANSITION_PATTERN } from "./FountainRegex";
import { $createSceneNode } from "./SceneNode";
import { $createTransitionNode } from "./TransitionNode";

export enum LineNodeType {
  None = "none",
  Character = "character",
  Parenthetical = "parenthetical",
  Dialog = "dialog",
  Scene = "scene",
  Transition = "transition",
}

export class LineNode extends ParagraphNode {
  static getType() {
    return "line";
  }

  static clone(node: LineNode): LineNode {
    return new LineNode(node.__elementType, node.__forced, node.__key);
  }

  __elementType: LineNodeType = LineNodeType.None;
  __forced: boolean = false;

  constructor(
    type: LineNodeType = LineNodeType.None,
    forced: boolean = false,
    key?: string
  ) {
    super(key);
    this.__elementType = type;
    this.__forced = forced;
  }

  getType() {
    return `${LineNode.getType()} [${this.__elementType}${
      this.__forced ? "*" : ""
    }]`;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom: HTMLParagraphElement = super.createDOM(
      config
    ) as HTMLParagraphElement;
    dom.style.backgroundColor = "rgb(240, 240, 240)";
    return dom;
  }

  updateDOM(
    prevNode: LineNode,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config);
    if (prevNode.__elementType !== this.__elementType) {
      utils.removeClassNamesFromElement(dom, `el-${prevNode.__elementType}`);
      utils.addClassNamesToElement(dom, `el-${this.__elementType}`);
    }
    return isUpdated;
  }

  setElementType(type: LineNodeType) {
    // getWritable() creates a clone of the node
    // if needed, to ensure we don't try and mutate
    // a stale version of this node.
    const self = this.getWritable();
    self.__elementType = type;
  }

  getElementType() {
    // getLatest() ensures we are getting the most
    // up-to-date value from the EditorState.
    const self = this.getLatest();
    return self.__elementType;
  }

  isForced() {
    const self = this.getLatest();
    return self.__forced;
  }

  setForced(forced: boolean) {
    const self = this.getWritable();
    self.__forced = forced;
  }

  canMergeWith(node: ElementNode): boolean {
    return (
      node instanceof LineNode &&
      this.getElementType() === node.getElementType()
    );
  }

  checkForForcedType(anchorNode: LexicalNode, anchorOffset: number): boolean {
    if (
      this.getTextContent() === "@" &&
      this.getElementType() !== LineNodeType.Character
    ) {
      // Create new character node with forced type.
      const node = $createCharacterNode();
      const forceNode = $createForcedTypeNode("@");
      node.append(forceNode);
      anchorNode.replace(node);
      this.setElementType(LineNodeType.Character);
      this.setForced(true);
      return true;
    }

    // Scenes start with a period.
    if (
      this.getTextContent() === "." &&
      this.getElementType() !== LineNodeType.Scene
    ) {
      // Create new character node with forced type.
      const node = $createSceneNode();
      const forceNode = $createForcedTypeNode(".");
      node.append(forceNode);
      anchorNode.replace(node);
      this.setElementType(LineNodeType.Scene);
      this.setForced(true);
    }

    // Scenes start with a period.
    if (
      this.getTextContent() === ">" &&
      this.getElementType() !== LineNodeType.Transition
    ) {
      // Create new character node with forced type.
      const node = $createTransitionNode();
      const forceNode = $createForcedTypeNode(">");
      node.append(forceNode);
      anchorNode.replace(node);
      this.setElementType(LineNodeType.Transition);
      this.setForced(true);
    }

    // Not handled.
    return false;
  }

  checkForImpliedType(anchorNode: LexicalNode, anchorOffset: number): boolean {
    // Safe guard against changing the type of an already typed line. This
    // should only happen when the line is forced, which happens via
    // checkForForcedType().
    if (this.getElementType() !== LineNodeType.None) {
      // Overwrite some types...
      if (
        this.getElementType() === LineNodeType.Character &&
        this.getTextContent().match(TRANSITION_PATTERN)
      ) {
        return this.changeTo(LineNodeType.Transition);
      }
      return false;
    }

    console.log({
      content: this.getTextContent(),
      match: this.getTextContent().match(SCENE_HEADER_PATTERN),
    });

    if (
      $isTextNode(anchorNode) &&
      this.getTextContent().match(SCENE_HEADER_PATTERN)
    ) {
      this.setElementType(LineNodeType.Scene);
      return true;
    }

    if (
      $isTextNode(anchorNode) &&
      this.getTextContent().match(/^[A-Z0-9\s\_\-\(\)]{3,}$/)
    ) {
      const node = $createCharacterNode();
      const nameNode = $createTextNode(anchorNode.getTextContent());
      node.append(nameNode);
      anchorNode.replace(node);
      this.setElementType(LineNodeType.Character);
      return true;
    }

    // Not handled.
    return false;
  }

  checkForLostType(anchorNode: LexicalNode, anchorOffset: number): boolean {
    // Forced nodes cant lose their type.
    if (this.isForced()) {
      return false;
    }

    const reset = () => {
      const node = $createTextNode(this.getTextContent());
      this.clear();
      this.append(node);
      node.selectNext();
      this.setElementType(LineNodeType.None);
    };

    // Non-forced character nodes can be lost if they no longer contain all caps
    // text.
    if (
      this.getElementType() === LineNodeType.Character &&
      this.getTextContent().match(/[a-z]/)
    ) {
      reset();
      return true;
    }

    // Scene heading no longer matches.
    if (
      this.getElementType() === LineNodeType.Scene &&
      !this.getTextContent().match(SCENE_HEADER_PATTERN)
    ) {
      reset();
      return true;
    }

    // Transition no longer matches.
    if (
      this.getElementType() === LineNodeType.Transition &&
      !this.getTextContent().match(TRANSITION_PATTERN)
    ) {
      reset();
      return true;
    }

    return false;
  }

  changeTo(type: LineNodeType): boolean {
    if (this.isForced()) {
      return false;
    }

    switch (type) {
      case LineNodeType.Transition:
        if (this.getElementType() === LineNodeType.Character) {
          this.setElementType(LineNodeType.Transition);
          this.getChildAtIndex(0)!.replace($createTransitionNode(), true);
          return true;
        }
        return false;
      default:
        console.log("changeTo not implemented", type);
    }
    return false;
  }
}

export function $isLineNode(node: unknown): node is LineNode {
  return node instanceof LineNode;
}

export function $createLineNode(type: LineNodeType): LineNode {
  return new LineNode(type);
}
