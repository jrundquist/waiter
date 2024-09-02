import { Action, ElementType, ScriptElement } from "../state/elements/elements";
import { ScriptMetadata } from "../state/scriptMetadata";
import path from "node:path";
import crypto from "node:crypto";

export interface State {
  savedHash: string;
  currentHash: string;

  scriptElements: ScriptElement[];
  scriptName: string | null;
  scriptRevision: number;
  lastSaved: Date | null;
  scriptFile: string | null;
  scriptMetadata?: ScriptMetadata;

  scriptTitle: string | null;
  scriptCredit: string | null;
  scriptAuthors: string | null;
  scriptSource: string | null;
  scriptDraftDate: string | null;
  scriptContact: string | null;
  scriptRights: string | null;
}

export type New = {
  type: "state:new";
};

export type Loaded = {
  type: "state:loaded";
};

export type SetElements = {
  type: "state:set-elements";
  payload: ScriptElement[];
};

export type Saved = {
  type: "state:saved";
  file: string;
};

export type SetScriptTitle = {
  type: "state:set-script-title";
  payload: {
    title: string;
    credit: string;
    authors: string;
    source: string;
    contact: string;
    date: string;
  };
};

export type StateAction = SetElements | Saved | New | Loaded | SetScriptTitle;

export const initialState: State = {
  savedHash: "",
  currentHash: "",

  scriptElements: [{ type: "action", content: "" } as Action],
  scriptName: null,
  scriptRevision: 0,
  lastSaved: null,
  scriptFile: null,

  scriptTitle: "",
  scriptCredit: "",
  scriptAuthors: "",
  scriptSource: "",
  scriptDraftDate: "",
  scriptContact: "",
  scriptRights: "",
};
initialState.scriptMetadata = computeMetadata(initialState.scriptElements);
initialState.currentHash = hashState(initialState);
initialState.savedHash = initialState.currentHash;

function hashState(state: State): string {
  const hash = crypto.createHash("sha256");
  hash.update(
    [
      state.scriptTitle,
      state.scriptCredit,
      state.scriptAuthors,
      state.scriptSource,
      state.scriptDraftDate,
      state.scriptContact,
      state.scriptRights,
      state.scriptElements
        .map((el) => {
          return JSON.stringify(el, null, 2).split("\n").sort().join(" ");
        })
        .join("-"),
    ].join(" ")
  );
  return hash.digest("hex");
}

// Reducer

export const reducer = (state: State, action: StateAction): State => {
  let newState = state;
  switch (action.type) {
    case "state:new":
      newState = {
        ...initialState,
      };
      break;
    case "state:set-elements":
      newState = {
        ...state,
        scriptElements: action.payload,
        scriptMetadata: computeMetadata(action.payload),
      };
      newState.currentHash = hashState(newState);
      break;
    case "state:saved": {
      const scriptName =
        state.scriptName ?? path.basename(action.file).replace(path.extname(action.file), "");
      newState = {
        ...state,
        scriptName,
        scriptRevision: state.scriptRevision + 1,
        lastSaved: new Date(),
        scriptFile: action.file,
      };
      newState.currentHash = hashState(newState);
      newState.savedHash = newState.currentHash;
      break;
    }
    case "state:loaded": {
      newState = {
        ...state,
      };
      newState.currentHash = hashState(newState);
      newState.savedHash = newState.currentHash;
      break;
    }
    case "state:set-script-title":
      newState = {
        ...state,
        scriptTitle: action.payload.title,
        scriptCredit: action.payload.credit,
        scriptAuthors: action.payload.authors,
        scriptSource: action.payload.source,
        scriptDraftDate: action.payload.date,
        scriptContact: action.payload.contact,
      };
      newState.currentHash = hashState(newState);
      break;
    default:
      break;
  }
  return newState;
};

function computeMetadata(elements: ScriptElement[]): ScriptMetadata {
  const characters = new Set<string>();
  const locations = new Set<string>();
  elements.forEach((element) => {
    if (element.type === ElementType.Character) {
      characters.add(element.content.trim());
    } else if (element.type == ElementType.SceneHeading) {
      locations.add(element.content);
    }
  });
  return {
    characters: Array.from(characters),
    locations: Array.from(locations),
  };
}
