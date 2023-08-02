import {
  SCRIPT_NODES,
  ScriptFormatPlugin,
} from "@/lexicalPlugins/ScriptFormatPlugin";
import TreeViewPlugin from "@/lexicalPlugins/TreeViewPlugin";
import { EditorDropTarget } from "@components/EditorDropTarget";
import { ExampleTheme } from "@components/ExampleTheme";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import LexicalHorizontalRuleNode from "@lexical/react/LexicalHorizontalRuleNode";
import {
  MarkdownShortcutPlugin,
  DEFAULT_TRANSFORMERS as TRANSFORMERS,
} from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { Theme } from "@mui/material";
import { makeStyles, useTheme } from "@mui/styles";
import * as React from "react";
import { EditorHotkeys } from "./EditorHotkeys";

const useStyles = makeStyles((theme: Theme) => ({
  editorInner: {
    width: "808px",
    minHeight: "100%",
    backgroundColor:
      theme.palette.mode === "dark"
        ? theme.palette.action.disabledBackground
        : theme.palette.common.white,
    position: "relative",
  },

  editorInput: {
    padding: "4rem 6rem 1rem 7rem",
    width: "568px",
    outline: "none",
    color: theme.palette.text.secondary,
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
      LexicalHorizontalRuleNode.HorizontalRuleNode,
      ...SCRIPT_NODES,
    ],
  };

  const { palette } = useTheme() as Theme;

  return (
    <>
      <style>
        {`::selection {`}
        {`  background-color: ${
          palette.mode === "dark" ? palette.grey[400] : palette.primary.main
        };`}
        {`  color: ${palette.primary.contrastText};`}
        {`}`}

        {`.forced {`}
        {`  color: ${palette.secondary.main};`}
        {`}`}
      </style>
      <LexicalComposer initialConfig={editorConfig}>
        <EditorHotkeys />
        <EditorDropTarget>
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
            <HistoryPlugin />
          </div>
        </EditorDropTarget>
      </LexicalComposer>
    </>
  );
}
