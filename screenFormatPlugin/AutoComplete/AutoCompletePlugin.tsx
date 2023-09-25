/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GridSelection, NodeKey, NodeSelection, RangeSelection } from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isAtNodeEnd } from "@lexical/selection";
import { mergeRegister, $findMatchingParent } from "@lexical/utils";
import {
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_TAB_COMMAND,
} from "lexical";
import { useCallback, useEffect } from "react";

import { useSharedAutocompleteContext } from "./AutoCompleteContext";
import { $createAutocompleteNode, AutocompleteNode } from "./AutoCompleteNode";
import { addSwipeRightListener } from "@utils/swipe";
import { useScriptDetails } from "@contexts/ScriptDetails";
import { $isLineNode, LineNode, LineNodeType } from "../LineNode";

type SearchPromise = {
  dismiss: () => void;
  promise: Promise<null | string>;
};

export const uuid = Math.random()
  .toString(36)
  .replace(/[^a-z]+/g, "")
  .substr(0, 5);

// TODO lookup should be custom
function $search(
  selection: null | RangeSelection | NodeSelection | GridSelection
): [boolean, string] {
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return [false, ""];
  }
  const node = selection.getNodes()[0];

  const lineNode = $findMatchingParent(node, $isLineNode) as LineNode | null;
  if (lineNode === null) {
    return [false, ""];
  }
  const type = lineNode.getElementType();
  const anchor = selection.anchor;
  // Check siblings?
  if (!$isTextNode(node) || !node.isSimpleText() || !$isAtNodeEnd(anchor)) {
    return [false, ""];
  }
  const text = node.getTextContent();
  console.log({ type, text });
  if (type === LineNodeType.Character) {
    return [true, node.getTextContent()];
  }

  const word: string[] = [];
  let i = node.getTextContentSize();
  let c: string;
  while (i-- && i >= 0 && (c = text[i]) !== " ") {
    word.push(c);
  }
  if (word.length === 0) {
    return [false, ""];
  }
  const result: [boolean, string] = [true, word.reverse().join("")];
  return result;
}

// TODO query should be custom
function useQuery(): (searchText: string) => SearchPromise {
  const scriptDetails = useScriptDetails();

  return useCallback(
    (searchText: string) => {
      const dismiss = () => {};
      const promise: Promise<null | string> = new Promise((resolve) => {
        console.time("query");
        const match = scriptDetails?.characters.find(
          (character) => character.startsWith(searchText) ?? null
        );
        if (match === undefined) {
          console.timeEnd("query");
          return resolve(null);
        }
        const autocompleteChunk = match.substring(searchText.length);
        if (autocompleteChunk === "") {
          console.timeEnd("query");
          return resolve(null);
        }
        console.timeEnd("query");
        return resolve(autocompleteChunk);
      });

      // TODO cache result

      return {
        dismiss,
        promise,
      };
    },
    [scriptDetails?.characters]
  );
}

export default function AutocompletePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [, setSuggestion] = useSharedAutocompleteContext();
  const query = useQuery();

  useEffect(() => {
    let autocompleteNodeKey: null | NodeKey = null;
    let lastMatch: null | string = null;
    let lastSuggestion: null | string = null;
    let searchPromise: null | SearchPromise = null;
    function $clearSuggestion() {
      const autocompleteNode =
        autocompleteNodeKey !== null ? $getNodeByKey(autocompleteNodeKey) : null;
      if (autocompleteNode !== null && autocompleteNode.isAttached()) {
        autocompleteNode.remove();
        autocompleteNodeKey = null;
      }
      if (searchPromise !== null) {
        searchPromise.dismiss();
        searchPromise = null;
      }
      lastMatch = null;
      lastSuggestion = null;
      setSuggestion(null);
    }
    function updateAsyncSuggestion(refSearchPromise: SearchPromise, newSuggestion: null | string) {
      if (searchPromise !== refSearchPromise || newSuggestion === null) {
        // Outdated or no suggestion
        return;
      }
      editor.update(
        () => {
          const selection = $getSelection();
          const [hasMatch, match] = $search(selection);
          if (!hasMatch || match !== lastMatch || !$isRangeSelection(selection)) {
            // Outdated
            return;
          }
          const selectionCopy = selection.clone();
          const node = $createAutocompleteNode(uuid);
          autocompleteNodeKey = node.getKey();
          selection.insertNodes([node]);
          $setSelection(selectionCopy);
          lastSuggestion = newSuggestion;
          setSuggestion(newSuggestion);
        },
        { tag: "history-merge" }
      );
    }

    function handleAutocompleteNodeTransform(node: AutocompleteNode) {
      const key = node.getKey();
      if (node.__uuid === uuid && key !== autocompleteNodeKey) {
        // Max one Autocomplete node per session
        $clearSuggestion();
      }
    }
    function handleUpdate() {
      editor.update(() => {
        const selection = $getSelection();
        const [hasMatch, match] = $search(selection);
        if (!hasMatch) {
          $clearSuggestion();
          return;
        }
        if (match === lastMatch) {
          return;
        }
        $clearSuggestion();
        searchPromise = query(match);
        searchPromise.promise
          .then((newSuggestion) => {
            if (searchPromise !== null) {
              updateAsyncSuggestion(searchPromise, newSuggestion);
            }
          })
          .catch((e) => {
            console.error(e);
          });
        lastMatch = match;
      });
    }
    function $handleAutocompleteAccept(): boolean {
      if (lastSuggestion === null || autocompleteNodeKey === null) {
        return false;
      }
      const autocompleteNode = $getNodeByKey(autocompleteNodeKey);
      if (autocompleteNode === null) {
        return false;
      }
      const textNode = $createTextNode(lastSuggestion);
      autocompleteNode.replace(textNode);
      textNode.selectNext();
      $clearSuggestion();
      return true;
    }
    function $handleKeypressAcceptCommand(e: Event) {
      if ($handleAutocompleteAccept()) {
        e.preventDefault();
        return true;
      }
      return false;
    }
    function $handleSwipeRight(_force: number, e: TouchEvent) {
      editor.update(() => {
        if ($handleAutocompleteAccept()) {
          e.preventDefault();
        }
      });
    }
    function unmountSuggestion() {
      editor.update(() => {
        $clearSuggestion();
      });
    }

    const rootElem = editor.getRootElement();

    return mergeRegister(
      editor.registerNodeTransform(AutocompleteNode, handleAutocompleteNodeTransform),
      editor.registerUpdateListener(handleUpdate),
      editor.registerCommand(KEY_TAB_COMMAND, $handleKeypressAcceptCommand, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        $handleKeypressAcceptCommand,
        COMMAND_PRIORITY_LOW
      ),
      ...(rootElem !== null ? [addSwipeRightListener(rootElem, $handleSwipeRight)] : []),
      unmountSuggestion
    );
  }, [editor, query, setSuggestion]);

  return null;
}
