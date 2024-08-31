import { ElementType, ScriptElement } from "../../state/elements/elements";
import { log } from "../logger";
import { JSDOM } from "jsdom";

const SKIP_IMPORT_FIRST_N_SCENES: number | false = false;
const STOP_IMPORT_AFTER_N_SCENES: number | false = false;

export async function importFinalDraft(fdxFile: string): Promise<ScriptElement[]> {
  log.debug("Importing Final Draft File: " + fdxFile);
  const script: ScriptElement[] = [];

  // Read the file, returning a promise of its contents.
  const start = performance.now();
  const { window } = await JSDOM.fromFile(fdxFile, {
    contentType: "text/xml",
  });
  const document = window.document;
  const delta = performance.now() - start;
  log.debug(`Parsed Final Draft file in ${delta}ms.`);
  // Check that this document is a Final Draft script.
  if (
    document.querySelector("FinalDraft") === null ||
    document
      .querySelector("FinalDraft")
      ?.getAttribute("DocumentType")
      ?.match(/Script/i) === null
  ) {
    log.error("Not a Final Draft script file.");
    throw new Error("Not a Final Draft script file.");
  }

  if (document.querySelector("Content") === null) {
    log.error("No content in Final Draft file.");
    throw new Error("No content in Final Draft file.");
  }

  let importElements = SKIP_IMPORT_FIRST_N_SCENES === false;
  let ignoreRemainingElements = false;
  let sceneNumber = 0;

  // Parse the document into script elements.
  document.querySelectorAll("Content").forEach((content) => {
    if (!content.querySelector("Paragraph")) return;
    content.querySelectorAll("Paragraph").forEach((paragraph) => {
      const text = Array.from(paragraph.querySelectorAll("Text"))
        .reduce((acc, text) => {
          return acc + text.textContent;
        }, "")
        .trim()
        .replaceAll(/\s+/g, " ");
      if (ignoreRemainingElements) return;

      const type = paragraph.getAttribute("Type")?.trim().toLocaleLowerCase();
      switch (type) {
        case "scene heading":
          sceneNumber++;
          if (SKIP_IMPORT_FIRST_N_SCENES !== false && sceneNumber > SKIP_IMPORT_FIRST_N_SCENES) {
            importElements = true;
          }
          // Stop importing after n scenes
          if (
            STOP_IMPORT_AFTER_N_SCENES !== false &&
            sceneNumber > STOP_IMPORT_AFTER_N_SCENES &&
            !ignoreRemainingElements
          ) {
            log.warn("Stopping import after " + STOP_IMPORT_AFTER_N_SCENES + " scenes.");
            ignoreRemainingElements = true;
            break;
          }
          importElements &&
            script.push({
              type: ElementType.SceneHeading,
              content: text,
              sceneNumber: paragraph.getAttribute("SceneNumber") ?? `${sceneNumber}`,
            });
          break;
        case "action":
          importElements &&
            script.push({
              type: ElementType.Action,
              content: text,
            });
          break;
        case "character":
          importElements &&
            script.push({
              type: ElementType.Character,
              content: text,
            });
          break;
        case "parenthetical":
          importElements &&
            script.push({
              type: ElementType.Parenthetical,
              content: text,
            });
          break;
        case "dialogue":
          importElements &&
            script.push({
              type: ElementType.Dialogue,
              content: text,
            });
          break;
        case "transition":
          importElements &&
            script.push({
              type: ElementType.Transition,
              content: text,
            });
          break;
        default:
          log.warn(
            `Unknown paragraph type: ${paragraph.getAttribute("Type")?.trim().toLocaleLowerCase()}`
          );
          log.warn(`Text: ${text}`);
          log.warn("Paragraph: ", paragraph);
          break;
      }
    });
  });

  return script;
}
