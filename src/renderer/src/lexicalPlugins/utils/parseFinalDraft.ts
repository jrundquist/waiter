import { $createLineNode, LineNode, LineNodeType } from "../LineNode";
import { $createLineBreakNode, $createTextNode, $getRoot, TextNode } from "lexical";
import { SceneNode } from "../SceneNode";
import { DialogNode } from "../DialogNode";

export function parseFinalDraft(text: string) {
  const p = new DOMParser();
  const parsed = p.parseFromString(`${text}`, "text/xml");

  const fdNode = parsed.querySelector("FinalDraft");
  if (!fdNode) {
    throw new Error("Invalid Final Draft XML");
  }
  const content = fdNode.querySelector("Content");
  if (!content) {
    throw new Error("Invalid Final Draft XML - missing Content node");
  }
  const elements = [...fdNode?.querySelectorAll("Content > Paragraph")];

  const transformedNodes: LineNode[] = [];
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const line = elementToLineNode(element);
    const prevType = getElementType(elements[i - 1]);
    const type = line?.getElementType();
    if (line === null) {
      continue;
    }
    if (type === LineNodeType.Parenthetical || type === LineNodeType.Character) {
      transformedNodes.push(line);
    } else if (type === LineNodeType.Dialog && prevType === LineNodeType.Dialog) {
      // Merege this dialog with the previous one.
      const prevDialog = transformedNodes[transformedNodes.length - 2];
      const dialogEl = prevDialog.getFirstChild() as DialogNode;
      dialogEl.append(...(line.getFirstChild()?.getChildren() ?? []));
    } else {
      transformedNodes.push(line);
      transformedNodes.push($createLineNode(LineNodeType.None));
    }
  }

  const finalizedNodes = transformedNodes.filter<LineNode>(
    (node): node is LineNode => node !== null
  );

  $getRoot().clear();
  $getRoot().append(...finalizedNodes);
}

function getElementType(element: Element | undefined): LineNodeType | null {
  if (!element) {
    return null;
  }
  let type = LineNodeType.None;
  if (!element.getAttribute("Type")) {
    console.warn("Unknown token type", element);
    return null;
  }
  switch (element.getAttribute("Type")) {
    case "Scene Heading":
      type = LineNodeType.Scene;
      break;
    case "Action":
      type = LineNodeType.Action;
      break;
    case "Character":
      type = LineNodeType.Character;
      break;
    case "Dialogue":
      type = LineNodeType.Dialog;
      break;
    case "Parenthetical":
      type = LineNodeType.Parenthetical;
      break;
    case "Transition":
      type = LineNodeType.Transition;
      break;
    case "Lyric":
      type = LineNodeType.Lyric;
      break;
    case "dialogue_begin":
    case "dialogue_end":
      return null;
    default:
      console.warn("Unknown token type", element.getAttribute("Type"));
      type = LineNodeType.Action;
      if (element.textContent === undefined || element.textContent === "") {
        return null;
      }
  }
  return type;
}

function elementToLineNode(element: Element): LineNode | null {
  const type = getElementType(element);
  if (type === null || type === LineNodeType.None) {
    return null;
  }

  const node = new LineNode(LineNodeType.None);
  const textNodes = parsedTextNodes(element);
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
    const sceneNumber = element.getAttribute("Number");
    if (sceneNumber) {
      (node.getFirstChild()! as unknown as SceneNode).setSceneNumber(sceneNumber);
    }
  }

  return node;
}

function parsedTextNodes(lineElement: Element): TextNode[] {
  const nodes = [...lineElement.querySelectorAll(":scope > Text")];

  return nodes.flatMap((node: Element): TextNode[] => {
    if (node.textContent === undefined) {
      return [];
    }
    const textNode = $createTextNode(node.textContent ?? "");
    const style = node.hasAttribute("Style") ? node.getAttribute("Style") : "";
    if (style?.match(/Bold/)) {
      textNode.toggleFormat("bold");
    }
    if (style?.match(/Italic/)) {
      textNode.toggleFormat("italic");
    }
    return [textNode];
  });
}
