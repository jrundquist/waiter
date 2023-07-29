import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ExampleTheme } from "@/components/ExampleTheme";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";
import {
  MarkdownShortcutPlugin,
  DEFAULT_TRANSFORMERS as TRANSFORMERS,
} from "@lexical/react/LexicalMarkdownShortcutPlugin";
import TreeViewPlugin from "@/lexicalPlugins/TreeViewPlugin";
import LexicalHorizontalRuleNode from "@lexical/react/LexicalHorizontalRuleNode";

import { ScriptFormatPlugin } from "@/lexicalPlugins/ScriptFormatPlugin";
import { CharacterNode } from "@/lexicalPlugins/CharacterNode";
import { ParentheticalNode } from "@/lexicalPlugins/ParentheticalNode";
import { SceneNode } from "@/lexicalPlugins/SceneNode";
import { DialogNode } from "@/lexicalPlugins/DialogNode";
import { ParagraphNode } from "lexical";
import { LineNode } from "@/lexicalPlugins/LineNode";
import { ForcedTypeNode } from "@/lexicalPlugins/ForcedTypeNode";

const useStyles = makeStyles((theme: Theme) => ({
  editorContainer: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "row",
    backgroundColor: "slategrey",
    alignItems: "flex-start",
    justifyContent: "center",
    overflow: "scroll",
  },
  editorInner: {
    marginTop: "1rem",
    maxWidth: "700px",
    width: "100%",
    minHeight: "80vh",
    backgroundColor: "white",
    position: "relative",
  },

  editorInput: {
    // width: "100%",
    // height: "100%",
    padding: "1rem",
    outline: "none",
  },
}));

export function Editor(): React.FunctionComponentElement<{}> {
  const classes = useStyles();

  const editorConfig: Parameters<typeof LexicalComposer>[0]["initialConfig"] = {
    // The editor theme
    theme: ExampleTheme,

    namespace: "editor",

    // Handling of errors during update
    onError(error: any) {
      throw error;
    },
    // Any custom nodes go here
    nodes: [
      CharacterNode,
      ParentheticalNode,
      SceneNode,
      DialogNode,
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
      ForcedTypeNode,
      LineNode,
      LexicalHorizontalRuleNode.HorizontalRuleNode,
      {
        replace: ParagraphNode,
        with: (node: ParagraphNode) => {
          return new LineNode();
        },
      },
    ],
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className={classes.editorContainer}>
        <div className={classes.editorInner}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable className={classes.editorInput} />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <ScriptFormatPlugin />
          <TreeViewPlugin />
          <AutoFocusPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
}
