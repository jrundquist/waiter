export enum ElementType {
  SceneHeading = "sceneHeading",
  Action = "action",
  Character = "character",
  Dialogue = "dialogue",
  Parenthetical = "parenthetical",
  Transition = "transition",
  DualDialogue = "dualDialogue",
}

export type ScriptElement =
  | SceneHeading
  | Action
  | Character
  | Dialogue
  | Parenthetical
  | Transition
  | DualDialogue;

export declare interface SceneHeading {
  type: ElementType.SceneHeading;
  content: string;
  sceneNumber: string;
}

export declare interface Action {
  type: ElementType.Action;
  content: string;
}

export declare interface Character {
  type: ElementType.Character;
  content: string;
}

export declare interface Dialogue {
  type: ElementType.Dialogue;
  content: string;
}

export declare interface Parenthetical {
  type: ElementType.Parenthetical;
  content: string;
}

export declare interface Transition {
  type: ElementType.Transition;
  content: string;
}

export declare interface DualDialogue {
  type: ElementType.DualDialogue;
  firstCharacter: Character;
  firstContent: (Dialogue | Parenthetical)[];
  secondCharacter: Character;
  secondContent: (Dialogue | Parenthetical)[];
}
