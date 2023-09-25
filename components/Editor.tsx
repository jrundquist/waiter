import { EditorDropTarget } from "@components/EditorDropTarget";
import { EditorHotkeys } from "@components/EditorHotkeys";
import { ExampleTheme } from "@components/ExampleTheme";
import Find from "@components/Find/Find";
import { FindContext } from "@contexts/Find";
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
import useTheme from "@mui/material/styles/useTheme";
import { SharedAutocompleteContext } from "@screenFormatPlugin/AutoComplete/AutoCompleteContext";
import { AutocompleteNode } from "@screenFormatPlugin/AutoComplete/AutoCompleteNode";
import AutocompletePlugin from "@screenFormatPlugin/AutoComplete/AutoCompletePlugin";
import { SCRIPT_NODES, ScriptFormatPlugin } from "@screenFormatPlugin/ScriptFormatPlugin";
import TreeViewPlugin from "@screenFormatPlugin/TreeViewPlugin";
import * as React from "react";
import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles()((theme: Theme) => ({
  editorPaper: {
    width: "816px", // 8.5in (1/96in per pixel)
    minHeight: "1056px", // 11in
    fontSize: "14px",
    backgroundColor:
      theme.palette.mode === "dark"
        ? theme.palette.action.disabledBackground
        : theme.palette.common.white,
    position: "relative",
  },

  editorContent: {
    // padding instead of margin to preserve click area
    padding: "96px 96px 96px 144px", // 1in, 1in, 1in, 1.5in
    outline: "none",
    color: theme.palette.text.secondary,
  },
}));

export function Editor(): React.FunctionComponentElement<{}> {
  const { classes } = useStyles();

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
      AutocompleteNode,
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

        {`.line[data-page]::before {`}
        {`  border-top-color: ${palette.text.disabled};`}
        {`}`}
      </style>
      <LexicalComposer initialConfig={editorConfig}>
        <FindContext>
          <SharedAutocompleteContext>
            <AutocompletePlugin />
            <EditorHotkeys />
            <EditorDropTarget>
              <div className={classes.editorPaper}>
                <RichTextPlugin
                  contentEditable={<ContentEditable className={classes.editorContent} />}
                  placeholder={null}
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                <ScriptFormatPlugin />
                <TreeViewPlugin />
                <AutoFocusPlugin />
                <HistoryPlugin />
                <Find />
              </div>
            </EditorDropTarget>
          </SharedAutocompleteContext>
        </FindContext>
      </LexicalComposer>
    </>
  );
}
