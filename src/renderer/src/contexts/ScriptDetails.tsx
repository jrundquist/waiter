import { $isLineNode, LineNode, LineNodeType } from "@renderer/lexicalPlugins/LineNode";
import { SceneNode } from "@renderer/lexicalPlugins/SceneNode";
import { ClearableWeakMap } from "@renderer/lexicalPlugins/utils/clearableWeakMap";
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

export const ScriptDetailsProvider: React.FunctionComponent<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [characters, setCharacters] = React.useState<string[]>([]);
  const [sceneContent, setSceneContent] = React.useState<Map<string, string>>(new Map());

  const buildScript = React.useCallback(
    (editorState: EditorState, rootNode: RootNode) => {
      editorState.read(() => {
        const lineNodes = rootNode.getChildren().filter($isLineNode);
        const characters = lineNodes
          .filter((lineNode) => {
            return lineNode.getElementType() === LineNodeType.Character;
          })
          .reduce((acc, lineNode) => {
            const character = lineNode.getTextContent().replace(/^@/g, "").trim();
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

        type SceneAccType = {
          currentSceneKey: null | string;
          sceneMap: Map<string, string[]>;
        };
        const { sceneMap } = lineNodes.reduce<SceneAccType>(
          (acc: SceneAccType, lineNode: LineNode) => {
            if (lineNode.getElementType() !== LineNodeType.Scene && acc.currentSceneKey === null) {
              return acc;
            }
            if (lineNode.getElementType() === LineNodeType.Scene) {
              const sceneNode = lineNode.getFirstChild()! as SceneNode;
              const sceneText = sceneNode.getTextContent().trim().replace(/^\./, "").toUpperCase();
              const sceneNumber = sceneNode.getSceneNumber() || `~${acc.sceneMap.size + 1}~`;
              const sceneKey = `${sceneNumber} - ${sceneText}`;
              acc.currentSceneKey = sceneKey;
              if (!acc.sceneMap.has(sceneKey)) {
                acc.sceneMap.set(sceneKey, []);
              }
              return acc;
            }
            if (acc.currentSceneKey !== null) {
              acc.sceneMap.get(acc.currentSceneKey)!.push(lineNode.getTextContent());
            }
            return acc;
          },
          {
            currentSceneKey: null,
            sceneMap: new Map<string, string[]>(),
          } as SceneAccType
        );

        setSceneContent((prev: typeof sceneContent) => {
          function mapArray(map: Map<string, string[]>) {
            return Array.from(map.entries()).reduce(
              (acc: Map<string, string>, [key, val]: [string, string[]]) => {
                acc.set(key, val.join("\n").trim());
                return acc;
              },
              new Map<string, string>()
            );
          }
          // Check that the maps are different.
          if (prev.size !== sceneMap.size) {
            return mapArray(sceneMap);
          }
          for (const [key, val] of sceneMap.entries()) {
            if (!prev.has(key) || prev.get(key) !== val.join("\n").trim()) {
              return mapArray(sceneMap);
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

  React.useEffect(() => {
    console.log("sceneContent", sceneContent);
  }, [sceneContent]);

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
