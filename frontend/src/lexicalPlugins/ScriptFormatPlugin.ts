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

export type Transformer =
  | ElementTransformer
  | TextMatchTransformer
  | TextMatchAfterTransformer;
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
    regExp: /^(?!(:?EXT\.)|(:?INT\.))([A-Z0-9\s\_\-\(\)])+$/,
    triggers: ["\n"],
    dependencies: [CharacterNode],
    importRegExp: /^(?!(:?EXT\.)|(:?INT\.))([A-Z0-9\s\_\-\(\)])+$/,
    export: (node: LexicalNode) => {
      if (!$isCharacterNode(node)) {
        return null;
      }
      return "" + node.getTextContent();
    },
    shouldReplace: (node) => {
      return !$isCharacterNode(node);
    },
    replace: (parentNode, match) => {
      const characterName = `${match[0]}`;
      const character = $createCharacterNode(characterName);

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
    triggers: [".", " ", "\n"],
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

function useEmoticons(
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
    return editor.registerUpdateListener(
      ({ tags, dirtyLeaves, editorState, prevEditorState }) => {
        // Ignore updates from undo/redo (as changes already calculated)
        if (tags.has("historic")) {
          return;
        } // If editor is still composing (i.e. backticks) we must wait before the user confirms the key

        if (editor.isComposing()) {
          return;
        }

        const selection = editorState.read($getSelection);
        const prevSelection = prevEditorState.read($getSelection);

        if (
          !$isRangeSelection(prevSelection) ||
          !$isRangeSelection(selection) ||
          !selection.isCollapsed()
        ) {
          return;
        }

        const anchorKey = selection.anchor.key;
        const anchorOffset = selection.anchor.offset;

        const prevAnchorKey = prevSelection.anchor.key;
        const prevAnchorOffset = prevSelection.anchor.offset;

        const anchorNode = editorState._nodeMap.get(anchorKey);
        const prevAnchorNode = prevEditorState._nodeMap.get(prevAnchorKey);

        if (
          !$isTextNode(anchorNode) ||
          !dirtyLeaves.has(anchorKey) ||
          (anchorOffset !== 1 && anchorOffset > prevSelection.anchor.offset + 1)
        ) {
          if (
            prevAnchorKey !== anchorKey &&
            $isTextNode(prevAnchorNode) &&
            !dirtyLeaves.has(prevAnchorKey)
          ) {
            editor.update(() => {
              console.log("Running on-enter transforms");
              console.log({ transformers: textMatchTransformersIndex["\n"] });
              applyTextMatchTransformers(
                prevAnchorNode,
                prevAnchorOffset,
                textMatchTransformersIndex["\n"] || []
              );
            });
          }
          return;
        }

        editor.update(() => {
          console.log("update triggered");

          // Markdown is not available inside code
          if (anchorNode.hasFormat("code")) {
            return;
          }

          const parentNode = anchorNode.getParent();

          if (parentNode === null || $isCodeNode(parentNode)) {
            return;
          }

          // Would try transforms
          transform(parentNode, anchorNode, selection.anchor.offset);
        });
      }
    );
  }, [editor]);
}

export function ScriptFormatPlugin() {
  const [editor] = useLexicalComposerContext();
  useEmoticons(editor);
  return null;
}
