import { ElementType, ScriptElement } from "../state/elements/elements";
import { ScriptMetadata } from "../state/scriptMetadata";
import path from "node:path";

export interface State {
  scriptElements: ScriptElement[];
  scriptName: string | null;
  scriptRevision: number;
  lastSaved: Date | null;
  scriptFile: string | null;
  isDirty: boolean;
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

export type StateAction = SetElements | Saved | New | SetScriptTitle;

export const initialState: State = {
  scriptElements: [],
  scriptName: null,
  scriptRevision: 0,
  lastSaved: null,
  scriptFile: null,
  isDirty: false,

  scriptTitle: null,
  scriptCredit: null,
  scriptAuthors: null,
  scriptSource: null,
  scriptDraftDate: null,
  scriptContact: null,
  scriptRights: null,
};

export const reducer = (state: State, action: StateAction): State => {
  switch (action.type) {
    case "state:new":
      return {
        ...initialState,
        lastSaved: null,
        scriptFile: null,
        isDirty: false,
      };
    case "state:set-elements":
      return {
        ...state,
        scriptElements: action.payload,
        isDirty: true,
        scriptMetadata: computeMetadata(action.payload),
      };
    case "state:saved":
      const scriptName =
        state.scriptName ?? path.basename(action.file).replace(path.extname(action.file), "");
      return {
        ...state,
        scriptName,
        scriptRevision: state.scriptRevision + 1,
        lastSaved: new Date(),
        scriptFile: action.file,
        isDirty: false,
      };
    case "state:set-script-title":
      return {
        ...state,
        scriptTitle: action.payload.title,
        scriptCredit: action.payload.credit,
        scriptAuthors: action.payload.authors,
        scriptSource: action.payload.source,
        scriptDraftDate: action.payload.date,
        scriptContact: action.payload.contact,
      };
    default:
      return state;
  }
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
  console.log({
    characters: Array.from(characters),
    locations: Array.from(locations),
  });
  return {
    characters: Array.from(characters),
    locations: Array.from(locations),
  };
}
