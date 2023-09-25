/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Spread } from "lexical";

import { DecoratorNode, EditorConfig, NodeKey, SerializedLexicalNode } from "lexical";

import { useSharedAutocompleteContext } from "./AutoCompleteContext";
import { uuid as UUID } from "./AutoCompletePlugin";
import { makeStyles } from 'tss-react/mui';
import { Theme } from "@mui/material";

declare global {
  interface Navigator {
    userAgentData?: {
      mobile: boolean;
    };
  }
}

export type SerializedAutocompleteNode = Spread<
  {
    uuid: string;
  },
  SerializedLexicalNode
>;

export class AutocompleteNode extends DecoratorNode<JSX.Element | null> {
  // TODO add comment
  __uuid: string;

  static clone(node: AutocompleteNode): AutocompleteNode {
    return new AutocompleteNode(node.__uuid, node.__key);
  }

  static getType(): "autocomplete" {
    return "autocomplete";
  }

  static importJSON(serializedNode: SerializedAutocompleteNode): AutocompleteNode {
    const node = $createAutocompleteNode(serializedNode.uuid);
    return node;
  }

  exportJSON(): SerializedAutocompleteNode {
    return {
      ...super.exportJSON(),
      type: "autocomplete",
      uuid: this.__uuid,
      version: 1,
    };
  }

  constructor(uuid: string, key?: NodeKey) {
    super(key);
    this.__uuid = uuid;
  }

  updateDOM(_prevNode: unknown, _dom: HTMLElement, _config: EditorConfig): boolean {
    return false;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    return document.createElement("span");
  }

  decorate(): JSX.Element | null {
    if (this.__uuid !== UUID) {
      return null;
    }
    return <AutocompleteComponent />;
  }
}

export function $createAutocompleteNode(uuid: string): AutocompleteNode {
  return new AutocompleteNode(uuid);
}

const useStyles = makeStyles()((theme: Theme) => ({
  autocomplete: {
    color: theme.palette.primary.main,
    opacity: 0.5,
  },
  tab: {
    display: "inline-block",
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.grey[800],
    borderRadius: "4px",
    padding: "0 4px",
    fontSize: "10px",
  },
}));

function AutocompleteComponent(): JSX.Element {
  const { classes } = useStyles();
  const [suggestion] = useSharedAutocompleteContext();
  // TODO Move to theme
  return (
    <span className={classes.autocomplete} spellCheck="false">
      {suggestion}
    </span>
  );
}
