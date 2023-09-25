import { useHotkeys } from "react-hotkeys-hook";
import * as React from "react";
import {
  RESET_WITH_FOUNTAIN_FILE,
  RESET_WITH_FINALDRAFT_FILE,
} from "../screenFormatPlugin/ScriptFormatPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export const EditorHotkeys: React.FunctionComponent<{}> = () => {
  const [editor] = useLexicalComposerContext();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const onOpenHotkey = React.useCallback(() => {
    window.api.openFile();
  }, [inputRef]);
  const onOpen = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.toLocaleLowerCase().endsWith(".fountain")) {
        editor.dispatchCommand(RESET_WITH_FOUNTAIN_FILE, file);
      } else if (file.name.toLocaleLowerCase().endsWith(".fdx")) {
        editor.dispatchCommand(RESET_WITH_FINALDRAFT_FILE, file);
      }
    }
  }, []);

  useHotkeys(
    "mod+o",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      onOpenHotkey();
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
    [onOpenHotkey]
  );

  return (
    <div style={{ visibility: "hidden", display: "none" }}>
      <input ref={inputRef} type="file" onChange={onOpen} accept=".fdx,.fountain" />
    </div>
  );
};
