import { ScriptElement } from "./importer/elements";
import path from "node:path";

export interface State {
  scriptElements: ScriptElement[];
  scriptName: string | null;
  scriptRevision: number;
  lastSaved: Date | null;
  scriptFile: string | null;
  isDirty: boolean;
}

export type SetElements = {
  type: "state:set-elements";
  payload: ScriptElement[];
};

export type Saved = {
  type: "state:saved";
  file: string;
};

export type StateAction = SetElements | Saved;

export const initialState: State = {
  scriptElements: [],
  scriptName: null,
  scriptRevision: 0,
  lastSaved: null,
  scriptFile: null,
  isDirty: false,
};

export const reducer = (state: State, action: StateAction): State => {
  switch (action.type) {
    case "state:set-elements":
      return {
        ...state,
        scriptElements: action.payload,
        isDirty: true,
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
    default:
      return state;
  }
};
