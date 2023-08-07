import { useEffect, useRef } from "react";
import {
  $getNearestNodeFromDOMNode,
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  Klass,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  ParagraphNode,
  TextNode,
  createCommand,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { $isLineNode, LineNode, LineNodeType } from "./LineNode";
import { $isSceneNode, SceneNode } from "./SceneNode";
import { CharacterNode } from "./CharacterNode";
import { TransitionNode } from "./TransitionNode";
import { ForcedTypeNode } from "./ForcedTypeNode";
import { DialogNode } from "./DialogNode";
import { ParentheticalNode } from "./ParentheticalNode";
import { ActionNode } from "./ActionNode";
import { LyricNode } from "./LyricNode";
import { parseFountain } from "./utils/parseFountain";
import { parseFinalDraft } from "./utils/parseFinalDraft";
import { ClearableWeakMap } from "./utils/clearableWeakMap";
import { updatePages } from "./utils/updatePages";
import { useScriptDetails } from "@/contexts/ScriptDetails";

export const RESET_WITH_FOUNTAIN_FILE: LexicalCommand<File> = createCommand(
  "RESET_WITH_FOUNTAIN_FILE"
);

export const RESET_WITH_FINALDRAFT_FILE: LexicalCommand<File> = createCommand(
  "RESET_WITH_FINALDRAFT_FILE"
);

type NodeList = (
  | Klass<LexicalNode>
  | {
      replace: Klass<LexicalNode>;
      with: <T extends new (...args: any) => any>(
        node: InstanceType<T>
      ) => LexicalNode;
    }
)[];

export const SCRIPT_NODES: NodeList = [
  LineNode,
  ForcedTypeNode,

  ActionNode,
  SceneNode,
  TransitionNode,
  CharacterNode,
  DialogNode,
  ParentheticalNode,
  LyricNode,

  {
    replace: ParagraphNode,
    with: (node: ParagraphNode) => {
      return new LineNode();
    },
  },
];

function updateLineNodes(
  lineNodeToEl: ClearableWeakMap<LineNode, HTMLElement>,
  editor: LexicalEditor
) {
  lineNodeToEl.clear();
  // For each line set the data-debug attribute to the dom elements offsetTop.
  for (const line of [...editor.getRootElement()!.querySelectorAll(".line")]) {
    const node = $getNearestNodeFromDOMNode(line as HTMLElement);
    if (node !== null && $isLineNode(node)) {
      lineNodeToEl.set(node, line as HTMLElement);
    }
  }
}

function useScriptFormatPlugin(editor: LexicalEditor) {
  const scriptDetails = useScriptDetails();

  useEffect(() => {
    editor.registerCommand(
      RESET_WITH_FOUNTAIN_FILE,
      (fountainFile: File) => {
        const reader = new FileReader();
        reader.onload = function (f) {
          const scriptText = f.target?.result as string | null;
          if (scriptText !== null) {
            editor.update(() => {
              parseFountain(scriptText);
            });

            // HACK to get around the fact these elements haven't been added to
            // the DOM yet.
            setTimeout(() => {
              editor.update(() => {
                updateLineNodes(lineNodeToEl, editor);
              });
              updatePages(editor, lineNodeToEl);
              editor.update(() => {
                scriptDetails?.buildScript(
                  editor.getEditorState(),
                  $getRoot(),
                  lineNodeToEl
                );
              });
            }, 0);
          }
        };
        reader.readAsText(fountainFile);
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    editor.registerCommand(
      RESET_WITH_FINALDRAFT_FILE,
      (draft: File) => {
        const reader = new FileReader();
        reader.onload = function (f) {
          const scriptText = f.target?.result as string | null;
          if (scriptText !== null) {
            editor.update(() => {
              parseFinalDraft(scriptText);
            });

            // HACK to get around the fact these elements haven't been added to
            // the DOM yet.
            setTimeout(() => {
              editor.update(() => {
                updateLineNodes(lineNodeToEl, editor);
              });
              updatePages(editor, lineNodeToEl);
              editor.update(() => {
                scriptDetails?.buildScript(
                  editor.getEditorState(),
                  $getRoot(),
                  lineNodeToEl
                );
              });
            }, 0);
          }
        };
        reader.readAsText(draft);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    const lineNodeToEl = new ClearableWeakMap<LineNode, HTMLElement>();

    const removeTextContentListener = editor.registerTextContentListener(() => {
      updatePages(editor, lineNodeToEl);
    });

    const removeSceneNumberWatcher = editor.registerNodeTransform(
      TextNode,
      (node) => {
        const parent = node.getParent();
        if (parent === null || !$isSceneNode(parent)) {
          return;
        }
        const match = node
          .getTextContent()
          .trim()
          .match(/#([0-9\-\_\.A-Za-z]+)#$/);
        if (match && match[1] !== parent.getSceneNumber()) {
          // Check for conflicts here.
          const existingScenes = $getRoot()
            .getChildren()
            .filter((n): n is LineNode => $isLineNode(n))
            .filter((n) => n.getElementType() === LineNodeType.Scene)
            .map((n) => n.getFirstChild() as unknown as SceneNode)
            .filter((n) => n !== parent) // We can't conflict with ourselves.
            .map((n: SceneNode) => n.getSceneNumber());
          let sceneNumber = match[1];
          while (existingScenes.includes(sceneNumber)) {
            sceneNumber = sceneNumber + ".A";
          }
          parent.setSceneNumber(sceneNumber);
        }
      }
    );

    const removeUpdateListener = editor.registerUpdateListener(
      ({ tags, dirtyLeaves, editorState, prevEditorState }) => {
        // console.log("update listener triggered");
        // Ignore updates from undo/redo (as changes already calculated)
        if (tags.has("historic")) {
          console.log("historic");
          return;
        }

        if (editor.isComposing()) {
          // The editor is currently in "composition" mode due to
          // receiving input through an IME, or 3P extension, for example.
          console.log("is composing");
          return;
        }

        const selection = editorState.read($getSelection);
        const prevSelection = prevEditorState.read($getSelection);

        if (
          !$isRangeSelection(prevSelection) ||
          !$isRangeSelection(selection) ||
          !selection.isCollapsed()
        ) {
          // This is simply the selection changing, not the content.
          return;
        }

        const anchorKey = selection.anchor.key;
        const anchorOffset = selection.anchor.offset;
        const anchorNode = editorState._nodeMap.get(anchorKey)!;

        const findClosestLineNode = (
          node: LexicalNode | null
        ): LineNode | null => {
          if (node === null) return null;
          if ($isLineNode(node)) return node;
          return findClosestLineNode(node.getParent());
        };

        editor.update(() => {
          const parentNode = anchorNode.getParent();
          if (parentNode === null) {
            // Shouldn't happen, as we'd be at the 'root' node.
            return;
          }

          const thisLine = findClosestLineNode(anchorNode);
          if (thisLine === null) {
            // Shouldn't happen, since the line node is the primary type.
            return;
          }

          // We want to reset any nodes to the None type if they can be, so that
          // the next passes will convert them to their proper type.
          if (
            thisLine.getElementType() !== LineNodeType.None &&
            thisLine.checkForLostType(anchorNode, anchorOffset)
          ) {
            return;
          }

          // Look for forcing characters.
          if (thisLine.checkForForcedType(anchorNode, anchorOffset)) {
            return;
          }

          if (
            // thisLine.getElementType() === LineNodeType.None &&
            thisLine.checkForImpliedType(anchorNode, anchorOffset)
          ) {
            return;
          }

          // TODO, maybe we can do this in a more efficient way, tracking the
          // last known height of this node, and if it hasn't changed, we may be
          // able to assume the hight of the document hasn't changed.
          updateLineNodes(lineNodeToEl, editor);
          scriptDetails?.buildScript(editorState, $getRoot(), lineNodeToEl);
        });
      }
    );

    return () => {
      removeTextContentListener();
      removeSceneNumberWatcher();
      removeUpdateListener();
    };
  }, [editor]);
}

export function ScriptFormatPlugin() {
  const [editor] = useLexicalComposerContext();
  useScriptFormatPlugin(editor);
  return null;
}
