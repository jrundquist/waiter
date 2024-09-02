import { State } from "@/app/state";
import { log } from "@/app/logger";
import { Doc, PDFOptions, PTS_PER_INCH } from "./pdf_doc";
import {
  ElementType,
  SceneHeading,
  ScriptElement,
  Action,
  Character,
  Dialogue,
  Parenthetical,
  Transition,
} from "@/state/elements/elements";

const DRAW_DEBUG = false;

const DEFAULT_FONT_SIZE = 12;
const defaultOptions: PDFOptions = {
  skipTitlePage: false,
  margins: {
    top: 1 * PTS_PER_INCH,
    bottom: 1 * PTS_PER_INCH,
    left: 1.5 * PTS_PER_INCH - 4,
    right: 1 * PTS_PER_INCH,
    hardMargin: 0.75 * PTS_PER_INCH,
  },
};

export async function exportPDF(
  state: State,
  fileName: string,
  options: Partial<PDFOptions> = {}
): Promise<boolean> {
  const opts = { ...defaultOptions, ...options };
  log.info(`Exporting PDF: ${fileName}`);

  const doc = new Doc(opts);

  await doc.addFonts();

  createTitlePage(doc, state);

  // Title page is optionally added, either way there is now a blank page for
  // content.

  createContentPages(doc, state);

  try {
    await doc.save(fileName);
    return true;
  } catch (e) {
    log.error("Failed to save PDF", e);
    return false;
  }
}

function createTitlePage(doc: Doc, state: State) {
  const title = state.scriptTitle ?? "Untitled Script";
  const credit = state.scriptCredit ?? "";
  const authors = state.scriptAuthors ?? "";
  const date = state.scriptDraftDate ?? "";
  const contact = state.scriptContact ?? "";

  doc.setDocumentProperties({
    title,
    author: authors,
  });

  if (doc.options.skipTitlePage) {
    return;
  }
  const heightSubMargin = doc.pageHeight - doc.options.margins.top - doc.options.margins.bottom;
  const widthSubMargin = doc.pageWidth - doc.options.margins.hardMargin * 2;

  const titlePos = heightSubMargin / 2 + DEFAULT_FONT_SIZE;
  const bottomLine = doc.pageHeight - doc.options.margins.bottom;

  const titleText = {
    text: title.toUpperCase(),
    underline: true,
  };
  doc.setFontStyle(titleText);
  const titleTextSplit = doc.splitTextToSize(titleText.text, widthSubMargin);
  const titleDims = doc.getTextDimensions(titleText.text, {
    maxWidth: widthSubMargin,
  });

  let y = titlePos;

  for (let i = 0; i < titleTextSplit.length; i++) {
    doc.justifyText(
      {
        ...titleText,
        text: titleTextSplit[titleTextSplit.length - i - 1],
      },
      "center",
      titlePos - i * (titleDims.h / titleTextSplit.length)
    );
  }

  doc.justifyText(credit, "center", (y += DEFAULT_FONT_SIZE * 4));

  doc.justifyText(authors, "center", (y += 2 * DEFAULT_FONT_SIZE));

  doc.justifyText(date, "hard-right", bottomLine);

  const contactText = { text: contact };
  doc.setFontStyle(contactText);
  const dims = doc.getTextDimensions(contactText.text, {
    maxWidth: doc.pageWidth / 2 - doc.options.margins.hardMargin,
  });
  doc.justifyText(contactText, "hard-left", bottomLine - dims.h + doc.getFontSize());

  doc.addPage();
}

function printScene(doc: Doc, posY: number, el: SceneHeading) {
  return () => {
    doc.justifyText(
      {
        text: `${el.sceneNumber}`,
        bold: true,
      },
      "hard-left",
      posY
    );
    doc.justifyText({ text: el.content, bold: true }, "left", posY);
    doc.justifyText({ text: `${el.sceneNumber}`, bold: true }, "hard-right", posY);
  };
}

function printActionLinesAt(doc: Doc, lines: string[], posY: number) {
  return () => {
    for (const line of lines) {
      doc.justifyText({ text: line }, "left", posY);
      posY += doc.lineHeight;
    }
  };
}

function printCharacterLine(doc: Doc, el: Character, posY: number) {
  const characterPos = doc.options.margins.left + 2 * PTS_PER_INCH;

  return () => {
    doc.renderText({ text: el.content }, characterPos, posY);
  };
}

function printParentheticalLines(doc: Doc, lines: string[], posY: number) {
  const PARENTHETICAL_INDENT = doc.options.margins.hardMargin + Math.ceil(PTS_PER_INCH * 2.25);

  return () => {
    for (let i = 0; i < lines.length; i++) {
      doc.renderText(
        { text: lines[i] },
        PARENTHETICAL_INDENT + (i > 0 ? doc.getFontSize() * 0.8 : 0),
        posY
      );
      posY += doc.lineHeight;
    }
  };
}

function printDialogLines(doc: Doc, lines: string[], posY: number) {
  const indent = doc.options.margins.hardMargin + PTS_PER_INCH * 1.75 + doc.getFontSize() * 0.2;

  return () => {
    for (const line of lines) {
      doc.renderText({ text: line }, indent, posY);
      posY += doc.lineHeight;
    }
  };
}

function printContinuation(doc: Doc, posY: number, text: string) {
  return () => {
    doc.renderText({ text }, PTS_PER_INCH * 3.25, posY);
  };
}

function printTransitionAt(doc: Doc, el: Transition, posY: number) {
  return () => {
    doc.justifyText({ text: el.content, italics: true }, "right", posY);
  };
}

// Create content pages
function createContentPages(doc: Doc, state: State) {
  DRAW_DEBUG && doc.showMargins();
  DRAW_DEBUG && doc.showLineHeight();

  doc.setFontStyle({ text: "", size: DEFAULT_FONT_SIZE });
  const elements = state.scriptElements;

  const LINE_HEIGHT = doc.lineHeight;
  const DOC_TOP = doc.options.margins.top + LINE_HEIGHT;
  const DOC_BOTTOM = doc.pageHeight - doc.options.margins.bottom;

  const MAX_ACTION_WIDTH =
    doc.pageWidth - doc.options.margins.left - doc.options.margins.hardMargin;
  const MAX_DIALOG_WIDTH = PTS_PER_INCH * 3.5;

  const MAX_PAREN_WIDTH = PTS_PER_INCH * 3 - DEFAULT_FONT_SIZE;

  let el: ScriptElement | undefined;
  let posY = DOC_TOP;

  interface Instruction {
    do: () => void;
    el: ScriptElement;
    startAt: number;
  }

  const pageInstructions: Instruction[] = [];

  while ((el = elements.shift()) !== undefined) {
    if (el === undefined) {
      break;
    }

    DRAW_DEBUG && doc.drawXAt(doc.options.margins.left, posY);

    // Render each element
    switch (el.type) {
      case ElementType.SceneHeading: {
        pageInstructions.push({
          do: printScene(doc, posY, el as SceneHeading),
          el,
          startAt: posY,
        });
        posY += doc.lineHeight * 2;
        break;
      }

      case ElementType.Transition: {
        const transition = el as Transition;
        pageInstructions.push({
          do: printTransitionAt(doc, transition, posY),
          el,
          startAt: posY,
        });
        posY += doc.lineHeight * 2;
        break;
      }

      case ElementType.Action: {
        const action = el as Action;

        // const totalH = doc.getTextDimensions(action.content, { maxWidth: MAX_ACTION_WIDTH }).h;
        const lines = doc.splitTextToSize(action.content, MAX_ACTION_WIDTH);

        pageInstructions.push({
          do: printActionLinesAt(doc, lines, posY),
          el,
          startAt: posY,
        });
        posY += (lines.length + 2) * doc.lineHeight;
        break;
      }

      case ElementType.Character: {
        const char = el as Character;

        if (
          pageInstructions.length !== 0 &&
          pageInstructions[pageInstructions.length - 1].el.type === ElementType.Action
        ) {
          // If the last element was an action, we need to remove a line break
          posY -= doc.lineHeight;
        }

        pageInstructions.push({
          do: printCharacterLine(doc, char, posY),
          el,
          startAt: posY,
        });
        posY += doc.lineHeight;
        break;
      }

      case ElementType.Parenthetical: {
        const par = el as Parenthetical;
        // Split the lines, and add a space to the beginning of each line after the first
        const lines = doc
          .splitTextToSize(par.content.replace(/^\(/, "").replace(/\)$/, ""), MAX_PAREN_WIDTH)
          .map((line, index, arr) => {
            line = line.trim();
            if (index === 0) {
              line = `(${line}`;
            }
            if (index === arr.length - 1) {
              line = `${line})`;
            }
            return line;
          });

        pageInstructions.push({
          do: printParentheticalLines(doc, lines, posY),
          el,
          startAt: posY,
        });
        posY += doc.lineHeight * lines.length;

        break;
      }

      case ElementType.Dialogue: {
        const dialog = el as Dialogue;
        // const totalH = doc.getTextDimensions(dialog.content, {
        //   maxWidth: MAX_DIALOG_WIDTH,
        // }).h;
        const lines = doc.splitTextToSize(dialog.content, MAX_DIALOG_WIDTH);

        pageInstructions.push({
          do: printDialogLines(doc, lines, posY),
          el,
          startAt: posY,
        });
        posY += (lines.length + 1) * doc.lineHeight;
        break;
      }
      default:
        break;
    }

    // Draw where the next element would go.
    DRAW_DEBUG && doc.drawXAt(doc.options.margins.left, posY, 4, [0, 0, 255]);

    // Handle Overflow
    if (posY > DOC_BOTTOM) {
      // Check that we broke past the end, and if so, adjust by adding a new page,
      // and ajdusting the instruction set for the offending elements and those
      // that need to be pulled along.

      const docHardMargin = doc.pageHeight - doc.options.margins.hardMargin;
      const pastHardMargin = posY > docHardMargin;
      const lastEl = pageInstructions[pageInstructions.length - 1].el.type;

      if (pastHardMargin && lastEl === ElementType.Dialogue) {
        const dialogInstructions = pageInstructions.pop()!;
        const dialog = dialogInstructions.el as Dialogue;
        let posY = dialogInstructions?.startAt;

        const lines = doc.splitTextToSize(dialog.content, MAX_DIALOG_WIDTH);

        const bttomMinusOneLine =
          doc.pageHeight -
          doc.options.margins.hardMargin -
          (posY - docHardMargin > doc.lineHeight ? doc.lineHeight : 0);

        let i = 0;
        while (posY < bttomMinusOneLine && i < lines.length - 1) {
          pageInstructions.push({
            do: printDialogLines(doc, [lines[i]], posY),
            el: dialog,
            startAt: posY,
          });
          posY += doc.lineHeight;
          i++;
        }

        // Not all lines fit, so print a continuation tag
        if (i <= lines.length) {
          pageInstructions.push({
            do: printContinuation(doc, posY, "(MORE)"),
            el: dialog,
            startAt: posY,
          });
        }

        elements.unshift({
          type: ElementType.Dialogue,
          content: lines.slice(i).join(" "),
        });

        /// Look back in pageInstructions for the last character
        let char: Character | undefined;
        for (let i = pageInstructions.length - 1; i >= 0; i--) {
          if (pageInstructions[i].el.type === ElementType.Character) {
            char = pageInstructions[i].el as Character;
            break;
          }
        }

        elements.unshift({
          type: ElementType.Character,
          content: `${char?.content} (CONT'D)`,
        } as Character);

        // Split this dialogue element into two parts with a (MORE) tag at the end
      }

      if (lastEl === ElementType.Parenthetical) {
        while (true) {
          const lastEl = pageInstructions.pop()!.el;
          elements.unshift(lastEl);
          if (lastEl.type === ElementType.Character) {
            break;
          }
        }
      }

      if (lastEl === ElementType.Character) {
        const lastEl = pageInstructions.pop()!.el;
        elements.unshift(lastEl);
      }

      // Execute the instructions for the current element
      do {
        pageInstructions.shift()?.do();
      } while (pageInstructions.length != 0);

      doc.addPage();

      DRAW_DEBUG && doc.showMargins();
      DRAW_DEBUG && doc.showLineHeight();

      posY = DOC_TOP;
    }
  }

  // Execute the final instructions for the current element
  do {
    pageInstructions.shift()?.do();
  } while (pageInstructions.length != 0);
}
