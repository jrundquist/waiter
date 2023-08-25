import { Fountain, Token } from "fountain-js";
import { $createLineNode, LineNode, LineNodeType } from "../LineNode";
import { $createLineBreakNode, $createTextNode, $getRoot, TextNode } from "lexical";
import { SceneNode } from "../SceneNode";

const COMMENT_REGEX = /\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*/g;

function removeComments(text: string) {
  return text.replace(COMMENT_REGEX, "").trim();
}

function parseToFoundtainTokens(text: string): Token[] | null {
  const fountain = new Fountain();
  const output = fountain.parse(removeComments(text), true);
  return output.tokens !== undefined ? output.tokens : null;
}

export function parseFountain(text: string) {
  const tokens = parseToFoundtainTokens(text);

  const transformedNodes = (tokens ?? [])
    .flatMap<LineNode | null>((token) => {
      const line = tokenToLineNode(token);
      const type = line?.getElementType();
      if (type === LineNodeType.Parenthetical || type === LineNodeType.Character) {
        return [line];
      } else if (line !== null) {
        return [line, $createLineNode(LineNodeType.None)];
      }
      return [];
    })
    .filter<LineNode>((node): node is LineNode => node !== null);

  $getRoot().clear();
  $getRoot().append(...transformedNodes);
}

function tokenToLineNode(token: Token): LineNode | null {
  let type = LineNodeType.None;
  switch (token.type) {
    case "scene_heading":
      type = LineNodeType.Scene;
      break;
    case "action":
      type = LineNodeType.Action;
      break;
    case "character":
      type = LineNodeType.Character;
      break;
    case "dialogue":
      type = LineNodeType.Dialog;
      break;
    case "parenthetical":
      type = LineNodeType.Parenthetical;
      break;
    case "transition":
      type = LineNodeType.Transition;
      break;
    case "lyrics":
      debugger;
      type = LineNodeType.Lyric;
      break;
    case "dialogue_begin":
    case "dialogue_end":
      return null;
    default:
      console.warn("Unknown token type", token.type);
      type = LineNodeType.Action;
      if (token.text === undefined || token.text === "") {
        return null;
      }
  }

  const node = new LineNode(LineNodeType.None);
  const textNodes = parsedTextNodes(token.text ?? "");
  node.append(...textNodes);
  if (type == LineNodeType.Dialog) {
    node.append($createLineBreakNode());
  }
  // TODO: Find a way to do this without changing the type.
  // Parentheticals can only be change FROM dialog types, so let's change it to dialog
  if (type === LineNodeType.Parenthetical) {
    node.setElementType(LineNodeType.Dialog);
  }
  node.changeTo(type);
  if (node.impliedType() !== type) {
    node.setForcedWithMarker();
  }

  if (type === LineNodeType.Scene) {
    (node.getFirstChild() as unknown as SceneNode)!.setSceneNumber(token.scene_number ?? null);
  }

  return node;
}

function parsedTextNodes(rawText: string): TextNode[] {
  const text = rawText.replaceAll("<br />", "\n");
  if (text.match(/>/)) {
    const p = new DOMParser();
    const parsed = p.parseFromString(`<p>${text}</p>`, "text/xml");
    return [...parsed.firstChild!.childNodes].map((node): TextNode => {
      const textNode = $createTextNode(node.textContent ?? "");
      const list = (node as HTMLSpanElement).classList;
      if (list) {
        if (list.contains("bold")) {
          textNode.toggleFormat("bold");
        }
        if (list.contains("italic")) {
          textNode.toggleFormat("italic");
        }
      }
      return textNode;
    });
  } else {
    return [$createTextNode(text)];
  }
}
