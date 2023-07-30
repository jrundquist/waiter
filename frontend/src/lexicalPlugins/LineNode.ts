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
import {
  $createForcedTypeNode,
  $isForcedTypeNode,
  findForcedTypeNode,
} from "./ForcedTypeNode";
import {
  CHARACTER_PATTERN,
  PARENTHETICAL_PATTERN,
  SCENE_HEADER_PATTERN,
  TRANSITION_PATTERN,
} from "./FountainRegex";
import { $createSceneNode } from "./SceneNode";
import { $createTransitionNode } from "./TransitionNode";
import { $createParentheticalNode } from "./ParentheticalNode";
import { $createDialogNode } from "./DialogNode";
import { $createActionNode } from "./ActionNode";

export enum LineNodeType {
  None = "none",
  Action = "action",
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
    // TODO: These need to all change to use a regex, to look for the forced
    // node in the start, replacing the character with the ForcedTypeNode, and
    // then changing the node type to the right type.
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

    console.log("checking for forced type", this.getTextContent());
    // Action starts with an exclamation mark.
    if (
      this.getTextContent().startsWith("!") &&
      this.getElementType() !== LineNodeType.Action
    ) {
      console.log("forcing action");

      if (this.getElementType() === LineNodeType.None) {
        if (this.getChildAtIndex(0) === anchorNode) {
          console.log("from start");
          const node = $createActionNode();
          const forceNode = $createForcedTypeNode("!");
          node.append(forceNode);
          anchorNode.replace(node);
        } else {
          const node = $createActionNode();
          const [mark, content] =
            this.getChildAtIndex(0)!.splitText(anchorOffset);
          mark.remove();
          const forcedNode = $createForcedTypeNode("!");
          node.append(forcedNode);
          forcedNode.select(anchorOffset, anchorOffset);
          node.append(content);
          this.clear();
          this.append(node);
        }
        this.setElementType(LineNodeType.Action);
        this.setForced(true);
        return true;
      }

      if (this.isForced()) {
        console.log("already forced");

        // Remove existing forced type node.
        const forcedNode = findForcedTypeNode(this);
        if (forcedNode) {
          const text = forcedNode.getTextContent();
          console.log({ forcedNode, text });
          forcedNode.replace($createTextNode(text));
        }
      } else {
        console.log("not forced");
        this.insertAfter($createForcedTypeNode("!"));
        // Create new character node with forced type.
      }

      // anchorNode.replace($createForcedTypeNode("!"));

      this.changeTo(LineNodeType.Action);
      this.setElementType(LineNodeType.Action);
    }

    // Not handled.
    return false;
  }

  checkForImpliedType(anchorNode: LexicalNode, anchorOffset: number): boolean {
    if (this.isForced()) {
      return false;
    }

    // Some types can be changes as the text content changes.
    // Examples include:
    // - Dialog changing to a parenthetical if it starts with a (.
    // - Character changing to a transition if ends in a TO:.
    if (this.getElementType() !== LineNodeType.None) {
      // Parentheticals can only be initiated from a dialog line.
      if (
        this.getElementType() === LineNodeType.Dialog &&
        this.getTextContent().match(PARENTHETICAL_PATTERN)
      ) {
        return this.changeTo(LineNodeType.Parenthetical);
      }

      // Transitions should only be initiated from a character line.
      if (
        this.getElementType() === LineNodeType.Character &&
        this.getTextContent().match(TRANSITION_PATTERN)
      ) {
        return this.changeTo(LineNodeType.Transition);
      }

      // return false;
    }

    const type = this.getElementType();

    if (
      $isTextNode(anchorNode) &&
      this.getTextContent().match(SCENE_HEADER_PATTERN) &&
      type !== LineNodeType.Scene
    ) {
      this.changeTo(LineNodeType.Scene);
      return true;
    }

    if (
      $isTextNode(anchorNode) &&
      this.getTextContent().match(CHARACTER_PATTERN) &&
      (type == LineNodeType.None || type === LineNodeType.Action)
    ) {
      this.changeTo(LineNodeType.Character);
      return true;
    }

    if (
      $isTextNode(anchorNode) &&
      this.getTextContentSize() > 0 &&
      type === LineNodeType.None
    ) {
      const node = $createActionNode();
      const nameNode = $createTextNode(anchorNode.getTextContent());
      node.append(nameNode);
      anchorNode.replace(node);
      this.setElementType(LineNodeType.Action);
      return true;
    }

    // Not handled.
    return false;
  }

  checkForLostType(anchorNode: LexicalNode, anchorOffset: number): boolean {
    // Forced nodes cant lose their type.
    if (this.isForced()) {
      if (findForcedTypeNode(this) === null) {
        this.setForced(false);
        return true;
      }
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
      !this.getTextContent().match(CHARACTER_PATTERN)
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

    // Parenthetical no longer matches, returns to dialog
    if (
      this.getElementType() === LineNodeType.Parenthetical &&
      !this.getTextContent().match(PARENTHETICAL_PATTERN)
    ) {
      this.changeTo(LineNodeType.Dialog);
      return true;
    }

    // Empty action is no longer an action...
    if (
      this.getElementType() === LineNodeType.Action &&
      this.getTextContentSize() === 0
    ) {
      reset();
      return true;
    }

    return false;
  }

  changeTo(type: LineNodeType): boolean {
    switch (type) {
      case LineNodeType.Scene:
        this.setElementType(LineNodeType.Scene);
        this.getChildAtIndex(0)!.replace($createSceneNode(), true);
        return true;
      case LineNodeType.Transition:
        if (this.getElementType() === LineNodeType.Character) {
          this.setElementType(LineNodeType.Transition);
          this.getChildAtIndex(0)!.replace($createTransitionNode(), true);
          return true;
        }
        return false;
      case LineNodeType.Character:
        this.setElementType(LineNodeType.Character);
        this.getChildAtIndex(0)!.replace($createCharacterNode(), true);
        return true;
      case LineNodeType.Parenthetical:
        if (this.getElementType() === LineNodeType.Dialog) {
          this.setElementType(LineNodeType.Parenthetical);
          this.getChildAtIndex(0)!.replace($createParentheticalNode(), true);
          return true;
        }
      case LineNodeType.Dialog:
        this.setElementType(LineNodeType.Dialog);
        this.getChildAtIndex(0)!.replace($createDialogNode(), true);
        return true;
      case LineNodeType.Action:
        this.setElementType(LineNodeType.Action);
        if (this.getChildrenSize() > 0) {
          this.getChildAtIndex(0)!.replace($createActionNode(), true);
        } else {
          this.append($createActionNode());
        }
        return true;
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
