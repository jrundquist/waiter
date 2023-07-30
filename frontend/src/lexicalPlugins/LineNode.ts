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
import { $createForcedTypeNode, findForcedTypeNode } from "./ForcedTypeNode";
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
import { $createLyricNode } from "./LyricNode";

export enum LineNodeType {
  None = "none",
  Action = "action",
  Character = "character",
  Parenthetical = "parenthetical",
  Dialog = "dialog",
  Scene = "scene",
  Transition = "transition",
  Lyric = "lyric",
}

interface ForceConfig {
  character: Parameters<typeof $createForcedTypeNode>[0];
  type: LineNodeType;
  nodeCtr: () => ElementNode;
}

const FORCE_CONFIGS: ForceConfig[] = [
  {
    character: "@",
    type: LineNodeType.Character,
    nodeCtr: $createCharacterNode,
  },
  {
    character: ".",
    type: LineNodeType.Scene,
    nodeCtr: $createSceneNode,
  },
  {
    character: ">",
    type: LineNodeType.Transition,
    nodeCtr: $createTransitionNode,
  },
  {
    character: "!",
    type: LineNodeType.Action,
    nodeCtr: $createActionNode,
  },
  {
    character: "~",
    type: LineNodeType.Lyric,
    nodeCtr: $createLyricNode,
  },
];

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
    const currentType = this.getElementType();
    const anchorText = anchorNode.getTextContent();

    // For each FORCE_CONFIGS
    for (const config of FORCE_CONFIGS) {
      if (
        anchorText.startsWith(config.character) &&
        (currentType !== config.type || !this.isForced())
      ) {
        console.log(1);
        if (currentType === LineNodeType.None) {
          console.log(2);
          const node = config.nodeCtr();
          if (this.getChildAtIndex(0) === anchorNode) {
            console.log(3);
            const forceNode = $createForcedTypeNode(config.character);
            node.append(forceNode);
            anchorNode.replace(node);
          } else {
            console.log(4);
            const [mark, content] =
              this.getChildAtIndex(0)?.splitText(anchorOffset);
            mark.remove();
            const forcedNode = $createForcedTypeNode(config.character);
            node.append(forcedNode);
            forcedNode.select(anchorOffset, anchorOffset);
            node.append(content);
            this.clear();
            this.append(node);
          }
        } else {
          if (this.isForced()) {
            // Remove existing forced type node.
            const forcedNode = findForcedTypeNode(this);
            if (forcedNode) {
              const text = forcedNode.getTextContent();
              forcedNode.replace($createTextNode(text));
            }
          } else {
            anchorNode.insertBefore($createForcedTypeNode(config.character));
            const [mark] = anchorNode.splitText(anchorOffset);
            mark.remove();
          }
        }
        console.log(99);
        console.log({ config });
        this.changeTo(config.type);
        this.setForced(true);
        return true;
      }
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

    if (
      this.getElementType() === LineNodeType.Lyric &&
      !this.getTextContent().startsWith("~")
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
        this.setElementType(LineNodeType.Transition);
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
      case LineNodeType.Lyric:
        this.setElementType(LineNodeType.Lyric);
        if (this.getChildrenSize() > 0) {
          this.getChildAtIndex(0)!.replace($createLyricNode(), true);
        } else {
          this.append($createLyricNode());
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
