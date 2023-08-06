import { $isLineNode, LineNode, LineNodeType } from "@/lexicalPlugins/LineNode";
import { ClearableWeakMap } from "@/lexicalPlugins/utils/clearableWeakMap";
import { EditorState, RootNode } from "lexical";
import * as React from "react";

const ScriptDetailsContext = React.createContext<null | {
  buildScript: (
    editorState: EditorState,
    rootNode: RootNode,
    lineNodeToEl: ClearableWeakMap<LineNode, HTMLElement>
  ) => void;
  characters: string[];
}>(null);

export const ScriptDetailsProvider: React.FunctionComponent<
  React.PropsWithChildren<{}>
> = ({ children }) => {
  const [characters, setCharacters] = React.useState<string[]>([]);

  const buildScript = React.useCallback(
    (
      editorState: EditorState,
      rootNode: RootNode,
      lineNodeToEl: ClearableWeakMap<LineNode, HTMLElement>
    ) => {
      editorState.read(() => {
        const lineNodes = rootNode.getChildren().filter($isLineNode);

        const characters = lineNodes
          .filter((lineNode) => {
            return lineNode.getElementType() === LineNodeType.Character;
          })
          .reduce((acc, lineNode) => {
            const character = lineNode
              .getTextContent()
              .replace(/^@/g, "")
              .trim();
            if (character) {
              acc.add(character);
            }
            return acc;
          }, new Set<string>());
        setCharacters((prev: string[]) => {
          // Check that the arrays are different.
          if (prev.length !== characters.size) {
            return Array.from(characters);
          }
          for (let i = 0; i < prev.length; i++) {
            if (!characters.has(prev[i])) {
              return Array.from(characters);
            }
          }
          return prev;
        });
      });
    },
    [setCharacters]
  );

  React.useEffect(() => {
    console.log("characters", characters);
  }, [characters]);

  return (
    <ScriptDetailsContext.Provider
      value={{
        buildScript,
        characters,
      }}
    >
      {children}
    </ScriptDetailsContext.Provider>
  );
};

export function useScriptDetails() {
  return React.useContext(ScriptDetailsContext);
}
