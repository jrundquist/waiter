import { useEffect } from "react";
import { LexicalEditor, LexicalNode } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { $isLineNode, LineNode, LineNodeType } from "./LineNode";

function useScriptFormatPlugin(editor: LexicalEditor) {
  useEffect(() => {
    return editor.registerUpdateListener(
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

          if ($isLineNode(parentNode)) {
            // Look for forcing characters.
            if (thisLine.checkForForcedType(anchorNode, anchorOffset)) {
              return;
            }

            if (
              thisLine.getElementType() === LineNodeType.None &&
              thisLine.checkForImpliedType(anchorNode, anchorOffset)
            ) {
              return;
            }
          }
        });
      }
    );
  }, [editor]);
}

export function ScriptFormatPlugin() {
  const [editor] = useLexicalComposerContext();
  useScriptFormatPlugin(editor);
  return null;
}
