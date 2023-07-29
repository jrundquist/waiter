import { useEffect } from "react";
import {
  CharacterNode,
  $createCharacterNode,
  $isCharacterNode,
} from "./CharacterNode";
import {
  Klass,
  LexicalEditor,
  TextNode,
  LexicalNode,
  ElementNode,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $isRootOrShadowRoot,
  $createTextNode,
} from "lexical";
import { $isCodeNode } from "@lexical/code";
import * as richText from "@lexical/rich-text";
import {
  $createParentheticalNode,
  $isParentheticalNode,
  ParentheticalNode,
} from "./ParentheticalNode";
import { $createSceneNode, $isSceneNode, SceneNode } from "./SceneNode";
import { $createDialogNode, $isDialogNode, DialogNode } from "./DialogNode";
import { $createForcedTypeNode, $isForcedTypeNode } from "./ForcedTypeNode";
import { $isLineNode, LineNode, LineNodeType } from "./LineNode";

export type Transformer =
  | ElementTransformer
  | TextMatchTransformer
  | LineMatch
  | TextMatchAfterTransformer;
export type LineMatch = Readonly<{
  dependencies: Array<Klass<LexicalNode>>;
  export: (
    node: LexicalNode,
    exportChildren: (node: ElementNode) => string
  ) => string | null;
  regexp: RegExp;
  replace: (parentNode: ElementNode, match: RegExpMatchArray) => boolean;
  restore: (parentNode: ElementNode) => boolean;
  type: "line-match";
}>;
export type ElementTransformer = Readonly<{
  dependencies: Array<Klass<LexicalNode>>;
  export: (
    node: LexicalNode,
    traverseChildren: (node: ElementNode) => string
  ) => string | null;
  regExp: RegExp;
  replace: (
    parentNode: ElementNode,
    children: Array<LexicalNode>,
    match: Array<string>,
    isImport: boolean
  ) => boolean;
  type: "element";
}>;

type TextMatch = {
  dependencies: Array<Klass<LexicalNode>>;
  export: (
    node: LexicalNode,
    exportChildren: (node: ElementNode) => string,
    exportFormat: (node: TextNode, textContent: string) => string
  ) => string | null;
  importRegExp: RegExp;
  regExp: RegExp;
  replace: (node: TextNode, match: RegExpMatchArray) => boolean;
  shouldReplace: (node: LexicalNode) => boolean;
};

export type TextMatchTransformer = Readonly<
  TextMatch & {
    triggers: string[];
    type: "text-match";
  }
>;

export type TextMatchAfterTransformer = Readonly<
  TextMatch & {
    type: "text-match-after";
  }
>;

const createBlockNode = (createNode: (args: string[]) => ElementNode) => {
  return (
    parentNode: ElementNode,
    children: Array<LexicalNode>,
    match: Array<string>
  ): boolean => {
    const node = createNode(match);
    node.append(...children);
    parentNode.replace(node);
    node.select(0, 0);
    return true;
  };
}; // Amount of spaces that define indentation level

const TRANSFORMERS: Transformer[] = [
  {
    // Character nodes
    type: "text-match",
    regExp: /^@|(?!(:?EXT\.)|(:?INT\.))([A-Z0-9\s\_\-\(\)])+$/,
    triggers: ["\n", "@"],
    dependencies: [CharacterNode],
    importRegExp: /^(?!(:?EXT\.)|(:?INT\.))([A-Z0-9\s\_\-\(\)])+$/,
    export: (node: LexicalNode) => {
      if (!$isCharacterNode(node)) {
        return null;
      }
      return "" + node.getTextContent();
    },
    shouldReplace: (node) => {
      console.log("Testing if should replace", node);
      return !$isCharacterNode(node) && !$isSceneNode(node);
    },
    replace: (parentNode, match) => {
      const character = $createCharacterNode();

      if (parentNode.getNextSibling() == null) {
        parentNode.replace(character);
      } else {
        parentNode.insertBefore(character);
        parentNode.setTextContent("");
      }
      return true;
    },
  },
  {
    // Parentheticals
    type: "element",
    regExp: /^\($/,
    dependencies: [ParentheticalNode],
    export: (node: LexicalNode) => {
      return `(${node.getTextContent()})`;
    },
    replace: (parentNode, children) => {
      if (
        !$isParentheticalNode(parentNode) &&
        $isCharacterNode(parentNode.getPreviousSibling()?.getLastChild())
      ) {
        const node = $createParentheticalNode();
        node.append(...children);
        parentNode.replace(node);
        node.select(0, 0);
        return true;
      }
      return false;
    },
  },
  {
    // Scene nodes
    type: "text-match",
    regExp:
      /(^INT|^EXT|^EXT[\/\-]INT|^INT[\/-]EXT|^E\/I|^I\/E|^\.[A-Z0-9]+)[\s\.][^$]*/i,
    triggers: [".", " ", "T", "\n"],
    dependencies: [SceneNode],
    importRegExp: /^\.([A-Z0-9\s\_\-\(\)])+$/,
    export: (node: LexicalNode) => {
      return "." + node.getTextContent().toUpperCase();
    },
    shouldReplace: (node) => {
      return !$isSceneNode(node);
    },
    replace: (parentNode, match) => {
      const sceneName = `${parentNode.getTextContent()}`;
      const scene = $createSceneNode(sceneName);

      if (parentNode.getNextSibling() == null) {
        parentNode.replace(scene);
      } else {
        parentNode.insertBefore(scene);
        parentNode.setTextContent("");
        scene.selectNext();
      }
      return true;
    },
  },
  {
    // Dialog
    type: "text-match",
    regExp: /(^[^\!>\.].*)/i,
    triggers: [" ", "\n"],
    dependencies: [DialogNode],
    importRegExp: /(^[^\!>\.])/,
    export: (node: LexicalNode) => {
      return node.getTextContent().toUpperCase();
    },
    shouldReplace: (node) => {
      return (
        ($isCharacterNode(
          node.getParent()?.getPreviousSibling()?.getLastChild()
        ) ||
          $isParentheticalNode(node.getParent()?.getPreviousSibling()) ||
          $isDialogNode(
            node.getParent()?.getPreviousSibling()?.getLastChild()
          )) &&
        !$isCharacterNode(node) &&
        !$isParentheticalNode(node.getParent()) &&
        !$isDialogNode(node) &&
        !$isDialogNode(node.getParent())
      );
    },
    replace: (parentNode, match) => {
      const dialog = $createDialogNode();

      if (parentNode.getNextSibling() == null) {
        parentNode.replace(dialog);
      } else {
        parentNode.insertBefore(dialog);
        parentNode.setTextContent("");
        dialog.selectNext();
      }
      return true;
    },
  },

  {
    type: "element",
    dependencies: [richText.HeadingNode],
    regExp: /^(#{1,6})\s/,
    export: (node, exportChildren) => {
      if (!richText.$isHeadingNode(node)) {
        return null;
      }

      const level = Number(node.getTag().slice(1));
      return "#".repeat(level) + " " + exportChildren(node);
    },
    replace: createBlockNode((match) => {
      const tag = `h${match[1].length}` as richText.HeadingTagType;
      return richText.$createHeadingNode(tag);
    }),
  },
];

function transformersByType(transformers: Transformer[]) {
  const byType: {
    element?: ElementTransformer[];
    "text-match"?: TextMatchTransformer[];
  } = indexBy(transformers, (t) => t.type);
  return {
    element: byType.element || [],
    textMatch: byType["text-match"] || [],
  };
}

function indexBy<T>(list: T[], callback: (item: T) => string[] | string) {
  const index: Record<string, T[]> = {};
  for (const item of list) {
    let key = callback(item);
    if (!Array.isArray(key)) {
      key = [key];
    }
    for (const k of key) {
      if (index[k]) {
        index[k].push(item);
      } else {
        index[k] = [item];
      }
    }
  }
  return index;
}

function runElementTransformers(
  parentNode: ElementNode,
  anchorNode: TextNode,
  anchorOffset: number,
  elementTransformers: ElementTransformer[]
) {
  const grandParentNode = parentNode.getParent();

  if (
    !$isRootOrShadowRoot(grandParentNode) ||
    parentNode.getFirstChild() !== anchorNode
  ) {
    return false;
  }

  const textContent = anchorNode.getTextContent();
  // Checking for anchorOffset position to prevent any checks for cases when caret is too far
  // from a line start to be a part of block-level markdown trigger.
  //
  // TODO:
  // Can have a quick check if caret is close enough to the beginning of the string (e.g. offset less than 10-20)
  // since otherwise it won't be a markdown shortcut, but tables are exception

  // if (textContent[anchorOffset - 1] !== " ") {
  //   console.log('textContent[anchorOffset - 1] !== " "');
  //   return false;
  // }

  for (const { regExp, replace } of elementTransformers) {
    const match = textContent.match(regExp);
    console.log("Testing element transformer: ", {
      regExp,
      match,
      textContent,
    });

    if (match && match[0].length === anchorOffset) {
      const nextSiblings = anchorNode.getNextSiblings();
      const [leadingNode, remainderNode] = anchorNode.splitText(anchorOffset);
      leadingNode.remove();
      const siblings = remainderNode
        ? [remainderNode, ...nextSiblings]
        : nextSiblings;
      return replace(parentNode, siblings, match, false);
    }
  }

  return false;
}

function runTextMatchTransformers(
  anchorNode: TextNode,
  anchorOffset: number,
  transformersByTrigger: Record<string, TextMatchTransformer[]>
) {
  let textContent = anchorNode.getTextContent();
  const lastChar = textContent[anchorOffset - 1];
  if (lastChar == null || lastChar === undefined) return false;
  console.log("lastChar", `char(${lastChar.charCodeAt(0)}): "${lastChar}"`);
  const transformers = transformersByTrigger[lastChar];

  if (transformers == null) {
    return false;
  } // If typing in the middle of content, remove the tail to do
  // reg exp match up to a string end (caret position)

  return applyTextMatchTransformers(anchorNode, anchorOffset, transformers);
}

function applyTextMatchTransformers(
  anchorNode: TextNode,
  anchorOffset: number,
  transformers: (TextMatchTransformer | TextMatchAfterTransformer)[],
  nextNode: LexicalNode | null = null
) {
  let textContent = anchorNode.getTextContent();

  if (anchorOffset < textContent.length) {
    textContent = textContent.slice(0, anchorOffset);
  }

  for (const transformer of transformers) {
    const match = textContent.match(transformer.regExp);

    if (match === null) {
      continue;
    }

    console.log("MATCH WITH TRANSFORMER", { match, transformer });

    const startIndex = match.index || 0;
    const endIndex = startIndex + match[0].length;
    let replaceNode;

    if (!transformer.shouldReplace(anchorNode)) {
      continue;
    }

    if (startIndex === 0) {
      [replaceNode] = anchorNode.splitText(endIndex);
    } else {
      [, replaceNode] = anchorNode.splitText(startIndex, endIndex);
    }

    if (transformer.replace(replaceNode, match)) {
      return true;
    }
  }

  return false;
}

function useScriptFormatPlugin(
  editor: LexicalEditor,
  transformers: Transformer[] = TRANSFORMERS
) {
  useEffect(() => {
    const byType = transformersByType(transformers);
    // const textFormatTransformersIndex = indexBy(
    //   byType.textFormat,
    //   ({ tag }) => tag[tag.length - 1]
    // );
    const textMatchTransformersIndex = indexBy<TextMatchTransformer>(
      byType.textMatch,
      ({ triggers }) => triggers
    );

    for (const transformer of transformers) {
      const type = transformer.type;

      if (
        type === "element" ||
        type === "text-match" ||
        type === "text-match-after"
      ) {
        const dependencies = transformer.dependencies;

        for (const node of dependencies) {
          if (!editor.hasNode(node)) {
            {
              throw Error(
                `MarkdownShortcuts: missing dependency ${node.getType()} for transformer. Ensure node dependency is included in editor initial config.`
              );
            }
          }
        }
      }
    }

    const transform = (
      parentNode: ElementNode,
      anchorNode: TextNode,
      anchorOffset: number
    ) => {
      console.log("Running element transformers");
      if (
        runElementTransformers(
          parentNode,
          anchorNode,
          anchorOffset,
          byType.element
        )
      ) {
        return;
      }

      if (
        runTextMatchTransformers(
          anchorNode,
          anchorOffset,
          textMatchTransformersIndex
        )
      ) {
        return;
      }

      // runTextFormatTransformers(
      //   anchorNode,
      //   anchorOffset,
      //   textFormatTransformersIndex
      // );
    };

    let alreadyReplaced = false;
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

        // console.log({ selection, prevSelection });

        if (
          !$isRangeSelection(prevSelection) ||
          !$isRangeSelection(selection) ||
          !selection.isCollapsed()
        ) {
          console.info("selection change only");
          // This is simply the selection changing, not the content.
          return;
        }

        const anchorKey = selection.anchor.key;
        const anchorOffset = selection.anchor.offset;

        const prevAnchorKey = prevSelection.anchor.key;
        const prevAnchorOffset = prevSelection.anchor.offset;

        const anchorNode = editorState._nodeMap.get(anchorKey)!;
        const prevAnchorNode = prevEditorState._nodeMap.get(prevAnchorKey)!;

        const nextNodeLike = anchorNode!.isPrototypeOf(TextNode);
        if (
          false
          // (!$isTextNode(anchorNode) ||
          //   !dirtyLeaves.has(anchorKey) ||
          //   (anchorOffset !== 1 &&
          //     anchorOffset > prevSelection!.anchor.offset + 1))
        ) {
          console.log("something not a text node", !nextNodeLike);
          if (
            prevAnchorKey !== anchorKey &&
            $isTextNode(prevAnchorNode) &&
            !dirtyLeaves.has(prevAnchorKey)
          ) {
            console.log("prevAnchorKey !== anchorKey");
            editor.update(() => {
              console.log("Running on-enter transforms");
              console.log({ transformers: textMatchTransformersIndex["\n"] });
              // applyTextMatchTransformers(
              //   prevAnchorNode,
              //   prevAnchorOffset,
              //   textMatchTransformersIndex["\n"] || []
              // );
            });
          }
          return;
        }

        const findClosestLineNode = (
          node: LexicalNode | null
        ): LineNode | null => {
          if (node === null) return null;
          if ($isLineNode(node)) return node;
          return findClosestLineNode(node.getParent());
        };

        editor.update(() => {
          // Markdown is not available inside code
          if (anchorNode.hasFormat("code")) {
            return;
          }

          const parentNode = anchorNode.getParent();

          if (parentNode === null || $isCodeNode(parentNode)) {
            return;
          }

          if ($isLineNode(parentNode)) {
            if (
              anchorNode.getTextContent() === "@" &&
              !$isCharacterNode(anchorNode) &&
              parentNode.getElementType() !== LineNodeType.Character
            ) {
              const node = $createCharacterNode();
              const forceNode = $createForcedTypeNode("@");
              node.append(forceNode);
              anchorNode.replace(node);
              parentNode.setElementType(LineNodeType.Character);
              return;
            }
            if (
              anchorNode.getTextContent().match(/^[A-Z0-9\s\_\-\(\)]{3,}$/) &&
              $isTextNode(anchorNode) &&
              parentNode.getElementType() === LineNodeType.None
            ) {
              const node = $createCharacterNode();
              const nameNode = $createTextNode(anchorNode.getTextContent());
              node.append(nameNode);
              anchorNode.replace(node);
              parentNode.setElementType(LineNodeType.Character);
            }

            if (parentNode.getTextContent() === "") {
              const thisLine = findClosestLineNode(parentNode);
              if (!thisLine) return;
              const prevLine = thisLine.getPreviousSibling() as LineNode | null;

              console.log("empty line", {
                thisLine: thisLine.getElementType(),
                prevLine: prevLine?.getElementType(),
              });
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
