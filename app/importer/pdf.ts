import { CHARACTER_PATTERN, SCENE_HEADER_PATTERN } from "@/frontend/lexicalPlugins/FountainRegex";
import { most } from "@/utils/most";
import { roughlyEqual } from "@/utils/roughlyEqual";
import { dialog } from "electron";
import { getDocument, PDFDocumentProxy } from "pdfjs-dist";
import { TextContent, TextItem } from "pdfjs-dist/types/src/display/api";
import { ElementType, type ScriptElement } from "../../state/elements/elements";
import { log } from "../logger";
// import eventBus from "../eventBus";

enum TokenType {
  UNKNOWN = "unknown",
  Action = "action",
  Character = "character",
  Dialogue = "dialogue",
  Parenthetical = "parenthetical",
  SceneNumber = "scene_number",
  SceneHeading = "scene_heading",
  Transition = "transition",
  PageNumber = "page_number",
  DualDialogueFirstChar = "dual_dialogue_char_1",
  DualDialogueFirstDialogue = "dual_dialogue_dia_1",
  DualDialogueSecondChar = "dual_dialogue_char_2",
  DualDialogueSecondDialogue = "dual_dialogue_dia_2",
}

interface PageContents {
  pageNumber: number;
  width: number;
  height: number;
  content: TextContent;
}

interface ParsedElement {
  type: TokenType;
  content: string;
  items: TextItem[];
  canMergeUp: boolean;
  meta?: {
    sceneNumber?: string;
  };
}

interface PositionInfo {
  leftEdgePos: number;
  sceneNumPos: number | null;
  characterStartPos: number | null;
  dialogueStartPos: number | null;
  parentheticalStartPos: number | null;
  transitionEndPos: number | null;
  pageNumberEndPos: number | null;
}

const isTextItem = (item: any): item is TextItem => {
  return item.str !== undefined;
};

function createHinter(posInfo: PositionInfo): (line: TextItem) => TokenType {
  return (line: TextItem): TokenType => {
    const [x] = [line.transform[4], line.transform[5]];
    const width = line.width;
    const endPos = Math.round(x + width);

    if (roughlyEqual(x, posInfo.sceneNumPos ?? 0, 2)) {
      return TokenType.SceneNumber;
    }

    if (roughlyEqual(x, posInfo.characterStartPos ?? 0, 2)) {
      return TokenType.Character;
    }

    if (roughlyEqual(x, posInfo.dialogueStartPos ?? 0, 2)) {
      return TokenType.Dialogue;
    }

    if (roughlyEqual(x, posInfo.parentheticalStartPos ?? 0, 2)) {
      return TokenType.Parenthetical;
    }

    if (roughlyEqual(endPos, posInfo.transitionEndPos ?? 0, 2)) {
      return TokenType.Transition;
    }

    if (roughlyEqual(x, posInfo.leftEdgePos, 6)) {
      return TokenType.Action;
    }

    if (roughlyEqual(endPos, posInfo.pageNumberEndPos ?? 0, 10) && line.str.match(/[0-9]+\.?$/)) {
      return TokenType.PageNumber;
    }

    return TokenType.UNKNOWN;
  };
}

function estimatePositions(pages: PageContents[]): PositionInfo {
  const positionBuckets = pages!.reduce((acc, page) => {
    return page.content.items
      .filter(isTextItem)
      .filter((token) => token.str.trim().length > 0)
      .reduce((a, token) => {
        const x = Math.round(token.transform[4]);
        a.has(x) ? a.set(x, [...a.get(x)!, token.str]) : a.set(x, [token.str]);
        return acc;
      }, acc);
  }, new Map<number, string[]>());

  const endPosBuckets = pages!.reduce((acc, page) => {
    return page.content.items
      .filter(isTextItem)
      .filter((token) => token.str.trim().length > 0)
      .reduce((a, token) => {
        const x = token.transform[4];
        const width = token.width;
        const endPos = Math.round(x + width);
        a.has(endPos) ? a.set(endPos, [...a.get(endPos)!, token.str]) : a.set(endPos, [token.str]);
        return acc;
      }, acc);
  }, new Map<number, string[]>());

  const sortedBuckets = [...positionBuckets.entries()]
    .sort((a, b) => {
      return b[1].length - a[1].length;
    })
    .map(([key, _]) => key);

  const sortedEndBuckets = [...endPosBuckets.entries()]
    .sort((a, b) => {
      return b[1].length - a[1].length;
    })
    .map(([key, _]) => key);

  // Determine the left edge of the page for content - this exclused the
  // left markings for scene headings.
  let leftEdgePos = sortedBuckets[0];
  for (let i = 0; i < sortedBuckets.length; i++) {
    const x = sortedBuckets[i];
    const hasSceneHeader = positionBuckets.get(x)?.some((line) => {
      return line.match(/^(INT|EXT|EST|INT\/EXT|EXT\/INT)\./) !== null;
    });
    if (hasSceneHeader) {
      leftEdgePos = x;
      break;
    }
  }

  // Determine if there are scene markings on the left side of the page.
  let sceneNumPos: number | null = null;
  for (let i = 0; i < sortedBuckets.length; i++) {
    const x = sortedBuckets[i];
    if (x <= leftEdgePos) {
      const looksLikeSceneNumbers = positionBuckets.get(x)?.every((line) => {
        return line.match(/^([0-9\A-Z\.\-]+)$/) !== null;
      });
      if (looksLikeSceneNumbers) {
        sceneNumPos = x;
        break;
      }
    }
  }

  // Determine the character start position
  let characterStartPos: number | null = null;
  for (let i = 0; i < sortedBuckets.length; i++) {
    const x = sortedBuckets[i];
    if (x > leftEdgePos) {
      const looksLikeCharacter = most(positionBuckets.get(x)!, (line) => {
        return line.match(CHARACTER_PATTERN) !== null;
      });
      if (looksLikeCharacter) {
        characterStartPos = x;
        break;
      }
    }
  }

  // Determine the dialogue start position
  let dialogueStartPos: number | null = null;
  for (let i = 0; i < sortedBuckets.length; i++) {
    const x = sortedBuckets[i];
    if (x > leftEdgePos && x < characterStartPos!) {
      const looksLikeDialogue = most(positionBuckets.get(x)!, (line) => {
        return line.match(/^[A-Za-z\s]+/) !== null;
      });
      if (looksLikeDialogue) {
        dialogueStartPos = x;
        break;
      }
    }
  }

  // Determine the parenthetical start position
  let parentheticalStartPos: number | null = null;
  for (let i = 0; i < sortedBuckets.length; i++) {
    const x = sortedBuckets[i];
    if (x > dialogueStartPos! && x < characterStartPos!) {
      const looksLikeParenthetical = most(positionBuckets.get(x)!, (line) => {
        return line.match(/^\(/) !== null;
      });
      if (looksLikeParenthetical) {
        parentheticalStartPos = x;
        break;
      }
    }
  }

  // Determine the transition end position (since they are right aligned)
  let transitionEndPos: number | null = null;
  for (let i = 0; i < sortedEndBuckets.length; i++) {
    const x = sortedEndBuckets[i];
    if (x > pages[0]!.width * 0.5) {
      const looksLikeTransition = most(endPosBuckets.get(x)!, (line) => {
        return line.match(/TO/) !== null;
      });
      if (looksLikeTransition) {
        transitionEndPos = x;
        break;
      }
    }
  }

  // Determine the page number end position (since they are right aligned)
  let pageNumberEndPos: number | null = null;
  for (let i = 0; i < sortedEndBuckets.length; i++) {
    const x = sortedEndBuckets[i];
    if (x > pages[0]!.width * 0.5) {
      const looksLikePageNumber = most(endPosBuckets.get(x)!, (line) => {
        return line.match(/^[0-9]+\.?$/) !== null;
      });
      if (looksLikePageNumber) {
        pageNumberEndPos = x;
        break;
      }
    }
  }

  return {
    leftEdgePos,
    sceneNumPos,
    characterStartPos,
    dialogueStartPos,
    parentheticalStartPos,
    transitionEndPos,
    pageNumberEndPos,
  };
}

function loadPage(doc: PDFDocumentProxy, pageNumber: number): Promise<PageContents> {
  return doc.getPage(pageNumber).then(async (page) => {
    const vp = page.getViewport({ scale: 1.0 });

    const pageWidth = vp.width;
    const pageHeight = vp.height;

    const tokenizedText = await page.getTextContent();
    return {
      pageNumber,
      width: pageWidth,
      height: pageHeight,
      content: tokenizedText,
    };
  });
}

export function importPdf(pdfFile: string): Promise<ScriptElement[]> {
  return getDocument(pdfFile)
    .promise.then((doc: PDFDocumentProxy) => {
      const numPages = doc.numPages;
      log.info("# Document Loaded");
      log.info("Number of Pages: " + numPages);

      const pageLoaders: Promise<PageContents>[] = [];
      for (let i = 1; i <= numPages; i++) {
        pageLoaders.push(loadPage(doc, i));
      }
      return Promise.all(pageLoaders).catch((err) => {
        log.error("Failed to Parse PDF. " + err.message);
        dialog.showErrorBox("Failed to Parse PDF", err.message);
      });
    })
    .catch((err: Error) => {
      log.error("Failed to Import PDF. " + err.message);
      dialog.showErrorBox("Failed to Import PDF.\n", err.message);
    })
    .then((pages) => {
      if (!pages) {
        throw new Error("Failed to load pages");
      }
      return [pages, estimatePositions(pages!)] as [PageContents[], PositionInfo];
    })
    .then(pagesToElementsList)
    .then(cleanupParsedElements)
    .then(mapToScriptElements);
}
function pagesToElementsList([pages, posInfo]: [PageContents[], PositionInfo]): ParsedElement[] {
  const hintAtTypeFromPos = createHinter(posInfo);

  let prevType = TokenType.UNKNOWN;
  let isInDualDialogue = false;
  let dualDialogueLineY = 0;
  let hasSeenFirstDialogue = false;
  let prevPositionY = 0;
  let isParentheticalOpen = false;

  const elements: ParsedElement[] = [];

  // Walk the pages, creating json that represents the page contents.
  for (let p = 0; p < pages.length; p++) {
    const page = pages[p];
    for (let i = 0; i < page.content.items.length; i++) {
      const item = page.content.items[i];
      if (!isTextItem(item)) {
        continue;
      }
      const [x, y] = [item.transform[4], item.transform[5]];
      if (isTextItem(item)) {
        let type: TokenType = hintAtTypeFromPos(item);

        let canMergeUp = true;

        // Switch Actions to Scene Headers
        if (
          (type === TokenType.Action && item.str.match(SCENE_HEADER_PATTERN)) ||
          prevType == TokenType.SceneNumber
        ) {
          type = TokenType.SceneHeading as TokenType;
        }

        // Dual Dialogue
        if (
          type === TokenType.UNKNOWN &&
          x > posInfo.leftEdgePos &&
          isInDualDialogue &&
          roughlyEqual(y, dualDialogueLineY, 2)
        ) {
          type = TokenType.DualDialogueSecondChar;
        } else if (
          type === TokenType.UNKNOWN &&
          x > posInfo.leftEdgePos &&
          x < (posInfo.characterStartPos ?? page.width * 0.5) &&
          item.str.match(CHARACTER_PATTERN)
        ) {
          isInDualDialogue = true;
          dualDialogueLineY = y;
          type = TokenType.DualDialogueFirstChar;
        } else if (
          (type === TokenType.Action || item.str.match(/^\(/)) &&
          isInDualDialogue &&
          (!hasSeenFirstDialogue || prevType == TokenType.DualDialogueFirstDialogue)
        ) {
          type = TokenType.DualDialogueFirstDialogue;
          hasSeenFirstDialogue = true;
        } else if (
          type === TokenType.UNKNOWN &&
          isInDualDialogue &&
          hasSeenFirstDialogue &&
          x > (posInfo.characterStartPos ?? page.width * 0.5)
        ) {
          type = TokenType.DualDialogueSecondDialogue;
        } else if (type !== TokenType.UNKNOWN && isInDualDialogue) {
          isInDualDialogue = false;
          hasSeenFirstDialogue = false;
          dualDialogueLineY = 0;
        }

        // Same line, probably the same type - just a continuation of the
        // text being split by the parser.
        if (type === TokenType.UNKNOWN && roughlyEqual(y, prevPositionY, 2)) {
          type = prevType;
        }

        if (type === TokenType.Parenthetical && item.str.match(/^\(/) && !item.str.match(/\)$/)) {
          isParentheticalOpen = true;
        }

        if (
          type === TokenType.UNKNOWN &&
          prevType === TokenType.Parenthetical &&
          isParentheticalOpen
        ) {
          type = TokenType.Parenthetical;
          if (item.str.match(/\)$/)) {
            isParentheticalOpen = false;
          }
        }
        if (type === TokenType.UNKNOWN) {
          // If we still don't know what this is, it's probably an action.
          type = TokenType.Action;
        }

        if (
          type === TokenType.Action &&
          prevType === TokenType.Action &&
          y <= prevPositionY - item.height * 1.5 // TODO: 1.5 is a good way to determine if we're on a new line, but it's not perfect.
        ) {
          // If we're on a new line, and the previous line was an action,
          // and there was a larger gap, then don't let this action merge,
          // we want it to be its own element.
          canMergeUp = false;
        }

        elements.push({
          type,
          content: item.str,
          items: [item],
          canMergeUp,
        });

        // Keep the previous type and position for the next iteration.
        prevType = type;
        prevPositionY = y;
      }
    }
  }

  return elements;
}

function cleanupParsedElements(elements: ParsedElement[]): ParsedElement[] {
  let prevElement = elements[0];

  const newElements: ParsedElement[] = [prevElement];
  for (let i = 1; i < elements.length; i++) {
    const element = elements[i];

    if (prevElement.type === TokenType.SceneHeading && element.type === TokenType.SceneNumber) {
      prevElement.meta = { sceneNumber: element.content };
      continue;
    }

    if (element.type === TokenType.SceneHeading && prevElement.type === TokenType.SceneNumber) {
      element.meta = { sceneNumber: prevElement.content };
    }

    if (element.type === TokenType.Character || element.type === TokenType.Parenthetical) {
      // Fix for (MORE) being classified as a character.
      // More should actually be removed as it is a meta decoration.
      if (element.content.trim().match(/^\(\s?MORE\s?\)$/i)) {
        continue;
      }
    }

    if (
      element.type === TokenType.Character &&
      element.content.match(/^(INT|EXT|EST|INT\/EXT|EXT\/INT)\.\s*/)
    ) {
      // Fix for scene headings being classified as characters
      element.type = TokenType.SceneHeading;
    }

    if (
      element.type === TokenType.Character ||
      element.type === TokenType.DualDialogueFirstChar ||
      element.type === TokenType.DualDialogueSecondChar
    ) {
      // Strip (cont'd) from character names
      element.content = element.content.replace(/\(\s?CONT[’']?D\s?\)\s*/i, "").trim();
    }

    if (element.type === prevElement.type && element.canMergeUp) {
      prevElement.content = `${prevElement.content} ${element.content.trimStart()}`.trim();
      prevElement.items.push(...element.items);

      // Fix for scene numbers appearing in scene headings.
      if (prevElement.type === TokenType.SceneHeading) {
        const match = prevElement.content.match(/^(\d[\w\d]*\.?)\s/);
        if (match) {
          prevElement.meta = { sceneNumber: match[1] };
          prevElement.content = prevElement.content.replace(match[0], "").trim();
        }
      }

      // Merged up, so don't add this element to the list.
      continue;
    }
    if (element.type === TokenType.PageNumber) {
      prevElement = element;
      // Don't add page numbers to the script.
      continue;
    }

    newElements.push(element);
    prevElement = element;
  }

  return newElements;
}

function mapToScriptElements(elements: ParsedElement[]): ScriptElement[] {
  const scriptElements = elements.map((element): ScriptElement => {
    switch (element.type) {
      case TokenType.SceneNumber:
        return {
          type: ElementType.SceneHeading,
          content: element.content,
          sceneNumber: element.content,
        };
      case TokenType.SceneHeading:
        return {
          type: ElementType.SceneHeading,
          content: element.content,
          sceneNumber: element.meta?.sceneNumber ?? "",
        };
      case TokenType.Action:
        return {
          type: ElementType.Action,
          content: element.content,
        };
      case TokenType.Character:
        return {
          type: ElementType.Character,
          content: element.content,
        };
      case TokenType.Dialogue:
        return {
          type: ElementType.Dialogue,
          content: element.content,
        };
      case TokenType.Parenthetical:
        return {
          type: ElementType.Parenthetical,
          content: element.content,
        };
      case TokenType.Transition:
        return {
          type: ElementType.Transition,
          content: element.content,
        };
      case TokenType.DualDialogueFirstChar:
      case TokenType.DualDialogueSecondChar:
        return {
          type: ElementType.Character,
          content: element.content,
        };
      case TokenType.DualDialogueFirstDialogue:
      case TokenType.DualDialogueSecondDialogue:
        return {
          type: ElementType.Dialogue,
          content: element.content,
        };
      default:
        return {
          type: ElementType.Action,
          content: element.content,
        };
    }
  });
  return scriptElements;
}
