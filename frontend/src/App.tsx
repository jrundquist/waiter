import { useEffect } from "react";
import "./App.css";
import { EventsOn, EventsOff } from "@runtime/runtime";
// import { Editor } from "./components/Editor";
import { Toolbar } from "@components/Toolbar";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ExampleTheme } from "./components/ExampleTheme";
import CreateIcon from "@mui/icons-material/Create";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";
import TreeViewPlugin from "./lexicalPlugins/TreeViewPlugin";

import { ScriptFormatPlugin } from "./lexicalPlugins/ScriptFormatPlugin";
import { CharacterNode } from "./lexicalPlugins/CharacterNode";
import { ParentheticalNode } from "./lexicalPlugins/ParentheticalNode";
import { SceneNode } from "./lexicalPlugins/SceneNode";
import { DialogNode } from "./lexicalPlugins/DialogNode";

const useStyles = makeStyles((theme: Theme) => ({
  editorContainer: {
    width: "100vw",
    height: "75vh",
    display: "flex",
    flexDirection: "row",
    backgroundColor: "blue",
    alignItems: "center",
    justifyContent: "center",
  },
  editorInner: {
    maxWidth: "700px",
    width: "100%",
    height: "75vh",
    backgroundColor: "white",
    position: "relative",
  },

  editorInput: {
    width: "100%",
    height: "100%",
    padding: "1rem",
    outline: "none",
  },
}));

const usePlaceholerStyles = makeStyles((theme: Theme) => ({
  placeholder: {
    color: "#999",
    overflow: "hidden",
    textOverflow: "ellipsis",
    top: "30%",
    left: "50%",
    fontSize: "15px",
    userSelect: "none",
    display: "inline-block",
    pointerEvents: "none",
    position: "absolute",
  },
}));
function Placeholder() {
  const classes = usePlaceholerStyles();
  return (
    <div className={classes.placeholder}>
      <CreateIcon />
    </div>
  );
}

function App() {
  useEffect(() => {
    EventsOn("file:open", (file) => {
      console.log("file:open", file);
    });
    return () => {
      EventsOff("file:open");
    };
  }, []);

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
    ],
  };

  return (
    <div id="App">
      <Toolbar />
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
            {/* <MarkdownShortcutPlugin transformers={TRANSFORMERS} /> */}
            <ScriptFormatPlugin />
            <TreeViewPlugin />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}

export default App;
