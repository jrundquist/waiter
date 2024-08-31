import {
  ElementType,
  ScriptElement,
  SceneHeading,
  Action,
  Character,
  Parenthetical,
  Dialogue,
  DualDialogue,
  Transition,
} from "../../state/elements/elements";
import { State } from "@/app/state";
import { log } from "../logger";

function isUpperCase(str: string): boolean {
  return str === str.toUpperCase();
}

class Document {
  private lines: string[] = [];

  private prevElement: ScriptElement | null = null;

  clear() {
    this.lines = [];
  }

  prevLine() {
    return this.lines[this.lines.length - 1];
  }

  appendToPrevLine(text: string) {
    this.lines[this.lines.length - 1] += text;
  }

  ensureEmptyLine() {
    if (this.prevLine() !== "") {
      this.addLine("");
    }
  }

  setBlock(prevElement: ScriptElement | null) {
    this.prevElement = prevElement;
  }

  getPrevBlockType(): ElementType | null {
    if (this.prevElement) {
      return this.prevElement.type;
    }
    return null;
  }

  addLine(line: string) {
    this.lines.push(line);
  }

  end(): string {
    return this.lines.join("\n");
  }
}

function addSceneHeading(doc: Document, sceneHeading: SceneHeading): void {
  doc.ensureEmptyLine();
  let line = "";
  if (sceneHeading.content.match(/^INT\.|EXT\./)) {
    line += sceneHeading.content;
  } else {
    line += `.${sceneHeading.content}`;
  }
  if (sceneHeading.sceneNumber) {
    line += ` #${sceneHeading.sceneNumber}#`;
  }
  doc.addLine(line);
}

function addCharacter(doc: Document, character: Character): void {
  doc.ensureEmptyLine();
  if (character.content.match(/[a-z\(\)]/)) {
    doc.addLine(`@${character.content}`);
  }
  doc.addLine(character.content);
}

function addParenthetical(doc: Document, parenthetical: Parenthetical): void {
  doc.setBlock(parenthetical);
  doc.addLine(`${parenthetical.content}`);
}

function addDialogue(doc: Document, dialogue: Dialogue): void {
  doc.addLine(dialogue.content);
}

function addDualDialogue(doc: Document, dualDialogue: DualDialogue): void {
  addCharacter(doc, dualDialogue.firstCharacter);
  for (const content of dualDialogue.firstContent) {
    if (content.type === ElementType.Dialogue) {
      addDialogue(doc, content);
    } else if (content.type === ElementType.Parenthetical) {
      addParenthetical(doc, content);
    }
  }

  addCharacter(doc, dualDialogue.secondCharacter);
  doc.appendToPrevLine(" ^");
  for (const content of dualDialogue.secondContent) {
    if (content.type === ElementType.Dialogue) {
      addDialogue(doc, content);
    } else if (content.type === ElementType.Parenthetical) {
      addParenthetical(doc, content);
    }
  }
}

function addAction(doc: Document, action: Action): void {
  doc.ensureEmptyLine();
  if (action.content == "" || action.content.toLocaleUpperCase() === action.content) {
    doc.addLine(`!${action.content}`);
  } else {
    doc.addLine(action.content);
  }
}

function addTransition(doc: Document, transition: Transition): void {
  doc.addLine("");
  if (transition.content.match(/TO:$/) && isUpperCase(transition.content)) {
    doc.addLine(transition.content);
  } else {
    doc.addLine(`>${transition.content}`);
  }
  doc.addLine("");
}

export function exportToFountain(state: State): string {
  const content: ScriptElement[] = state.scriptElements;

  const document = new Document();

  if (state.scriptTitle) {
    document.addLine(`Title: ${state.scriptTitle}`);
  }
  if (state.scriptCredit) {
    document.addLine(`Credit: ${state.scriptCredit}`);
  }
  if (state.scriptAuthor) {
    document.addLine(`Author: ${state.scriptAuthor}`);
  }
  if (state.scriptSource) {
    document.addLine(`Source: ${state.scriptSource}`);
  }
  if (state.scriptDraftDate) {
    document.addLine(`Draft Date: ${state.scriptDraftDate}`);
  }
  if (state.scriptContact) {
    document.addLine(`Contact: ${state.scriptContact}`);
  }
  if (state.scriptRights) {
    document.addLine(`Rights: ${state.scriptRights}`);
  }

  for (const element of content) {
    switch (element.type) {
      case ElementType.SceneHeading:
        addSceneHeading(document, element);
        break;
      case ElementType.Transition:
        addTransition(document, element);
        break;
      case ElementType.Action:
        addAction(document, element);
        break;
      case ElementType.Character:
        addCharacter(document, element);
        break;
      case ElementType.Dialogue:
        addDialogue(document, element);
        break;
      case ElementType.Parenthetical:
        addParenthetical(document, element);
        break;
      case ElementType.DualDialogue:
        addDualDialogue(document, element);
      default:
        log.warn(`Unknown element type: ${element.type}`);
    }
  }
  return document.end();
}
