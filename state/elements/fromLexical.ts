import { LexicalNode } from "lexical";
import { ElementType, ScriptElement } from "./elements";
import { $isLineNode, LineNodeType } from "@/frontend/lexicalPlugins/LineNode";
import { $isSceneNode, SceneNode } from "@/frontend/lexicalPlugins/SceneNode";
import { $isActionNode, ActionNode } from "@/frontend/lexicalPlugins/ActionNode";
import { $isCharacterNode, CharacterNode } from "@/frontend/lexicalPlugins/CharacterNode";
import { $isTransitionNode, TransitionNode } from "@/frontend/lexicalPlugins/TransitionNode";
import { $isForcedTypeNode } from "@/frontend/lexicalPlugins/ForcedTypeNode";
import {
  $isParentheticalNode,
  ParentheticalNode,
} from "@/frontend/lexicalPlugins/ParentheticalNode";

export function fromLexical(rootChildren: LexicalNode[]): ScriptElement[] {
  const lineNodes = rootChildren.filter($isLineNode);
  const elements: ScriptElement[] = [];
  for (const line of lineNodes) {
    const lineType = line.getElementType();
    switch (lineType) {
      case LineNodeType.Scene: {
        const sceneNode = line.getChildren().find($isSceneNode) as SceneNode;
        const sceneNumber = `${sceneNode?.getSceneNumber() ?? ""}`.trim();
        const content = sceneNode
          .getChildren()
          .filter((n) => !$isForcedTypeNode(n))
          .map((n) => n.getTextContent())
          .join(" ");
        elements.push({
          type: ElementType.SceneHeading,
          content,
          sceneNumber,
        });
        break;
      }

      case LineNodeType.Action: {
        const node = line.getChildren().find($isActionNode) as ActionNode;
        const content = node
          .getChildren()
          .filter((n) => !$isForcedTypeNode(n))
          .map((n) => n.getTextContent())
          .join(" ");
        elements.push({
          type: ElementType.Action,
          content,
        });
        break;
      }

      case LineNodeType.Character: {
        const node = line.getChildren().find($isCharacterNode) as CharacterNode;
        const content = node
          .getChildren()
          .filter((n) => !$isForcedTypeNode(n))
          .map((n) => n.getTextContent())
          .join(" ");
        elements.push({
          type: ElementType.Character,
          content: content,
        });
        break;
      }

      case LineNodeType.Dialog: {
        elements.push({
          type: ElementType.Dialogue,
          content: line.getTextContent(),
        });
        break;
      }

      case LineNodeType.Parenthetical: {
        const node = line.getChildren().find($isParentheticalNode) as ParentheticalNode;
        elements.push({
          type: ElementType.Parenthetical,
          content: node.getTextContent(),
        });
        break;
      }

      case LineNodeType.Transition: {
        const node = line.getChildren().find($isTransitionNode) as TransitionNode;
        const content = node
          .getChildren()
          .filter((n) => !$isForcedTypeNode(n))
          .map((n) => n.getTextContent())
          .join(" ");
        elements.push({
          type: ElementType.Transition,
          content,
        });
        break;
      }

      case LineNodeType.None: {
        // Nothing to do.
        break;
      }

      default: {
        console.log("Unknown line type: ", lineType);
      }
    }
  }
  return elements;
}
