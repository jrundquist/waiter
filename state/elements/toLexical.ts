import { RootNode, TextNode } from "lexical";
import { ElementType, ScriptElement } from "./elements";
import { LineNode, LineNodeType } from "@/frontend/lexicalPlugins/LineNode";
import { SceneNode } from "@/frontend/lexicalPlugins/SceneNode";
import { ActionNode } from "@/frontend/lexicalPlugins/ActionNode";
import { CharacterNode } from "@/frontend/lexicalPlugins/CharacterNode";
import { DialogNode } from "@/frontend/lexicalPlugins/DialogNode";
import { ParentheticalNode } from "@/frontend/lexicalPlugins/ParentheticalNode";
import { TransitionNode } from "@/frontend/lexicalPlugins/TransitionNode";
import _ from "lodash";

(window as any)._ = _;

export function toLexical(scriptElements: ScriptElement[], rootNode: RootNode) {
  for (const node of scriptElements) {
    switch (node.type) {
      // Scene Headings
      case ElementType.SceneHeading: {
        const lineNode = new LineNode();
        const sceneNode = new SceneNode(node.sceneNumber);
        sceneNode.append(new TextNode(node.content));
        lineNode.append(sceneNode);
        lineNode.setElementType(LineNodeType.Scene);
        if (lineNode.wouldRequireForce()) {
          lineNode.setForcedWithMarker();
        }
        rootNode.append(lineNode);
        sceneNode.setSceneNumber(node.sceneNumber);
        rootNode.append(new LineNode());
        break;
      }
      // Actions
      case ElementType.Action: {
        const lineNode = new LineNode();
        const actionNode = new ActionNode();
        actionNode.append(new TextNode(node.content));
        lineNode.append(actionNode);
        lineNode.setElementType(LineNodeType.Action);
        if (lineNode.wouldRequireForce()) {
          lineNode.setForcedWithMarker();
        }
        rootNode.append(lineNode);
        rootNode.append(new LineNode());
        break;
      }
      // Characters
      case ElementType.Character: {
        const lineNode = new LineNode();
        const characterNode = new CharacterNode();
        const charName = node.content.replace(/\(cont'd\)/i, "").trim();
        if (charName === "(MORE)") {
          break;
        }
        characterNode.append(new TextNode(charName));
        lineNode.append(characterNode);
        lineNode.setElementType(LineNodeType.Character);
        if (lineNode.wouldRequireForce()) {
          lineNode.setForcedWithMarker();
        }
        rootNode.append(lineNode);
        break;
      }
      // Dialog
      case ElementType.Dialogue: {
        const lineNode = new LineNode();
        const dialogNode = new DialogNode();
        dialogNode.append(new TextNode(node.content));
        lineNode.append(dialogNode);
        lineNode.setElementType(LineNodeType.Dialog);
        if (lineNode.wouldRequireForce()) {
          lineNode.setForcedWithMarker();
        }
        rootNode.append(lineNode);
        rootNode.append(new LineNode());
        break;
      }

      // Parentheticals
      case ElementType.Parenthetical: {
        const lineNode = new LineNode();
        const parentheticalNode = new ParentheticalNode();
        parentheticalNode.append(new TextNode(node.content));
        lineNode.append(parentheticalNode);
        lineNode.setElementType(LineNodeType.Parenthetical);
        if (lineNode.wouldRequireForce()) {
          lineNode.setForcedWithMarker();
        }
        rootNode.append(lineNode);
        break;
      }

      // Transitions
      case ElementType.Transition: {
        const lineNode = new LineNode();
        const transitionNode = new TransitionNode();
        transitionNode.append(new TextNode(node.content));
        lineNode.append(transitionNode);
        lineNode.setElementType(LineNodeType.Transition);
        if (lineNode.wouldRequireForce()) {
          lineNode.setForcedWithMarker();
        }
        rootNode.append(lineNode);
        rootNode.append(new LineNode());
        break;
      }

      default:
        break;
    }
  }
}
