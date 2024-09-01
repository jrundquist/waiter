import { State } from "@/app/state";
import { log } from "@/app/logger";
import { Doc, PDFOptions } from "./pdf_doc";
import { ElementType, SceneHeading, ScriptElement } from "@/state/elements/elements";

const PTS_PER_INCH = 72;
const DEFAULT_FONT_SIZE = 12;
const defaultOptions: PDFOptions = {
  skipTitlePage: false,
  margins: {
    top: 1 * PTS_PER_INCH,
    bottom: 1 * PTS_PER_INCH,
    left: 1.5 * PTS_PER_INCH,
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
    text: title,
    underline: true,
  };
  doc.setFontStyle(titleText);
  const titleTextSplit = doc.splitTextToSize(titleText.text, widthSubMargin);
  const titleDims = doc.getTextDimensions(titleText.text, {
    maxWidth: widthSubMargin,
  });

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

  let y = titlePos;

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

function createContentPages(doc: Doc, state: State) {
  doc.justifyText("Content", "center", doc.options.margins.hardMargin);
  const elements = state.scriptElements;

  const LINE_HEIGHT = DEFAULT_FONT_SIZE;
  const DOC_HEIGHT = doc.pageHeight - doc.options.margins.top - doc.options.margins.bottom;
  const DOC_TOP = doc.options.margins.top + LINE_HEIGHT;

  let el: ScriptElement | undefined;
  let posY = DOC_TOP;

  while ((el = elements.shift()) !== undefined) {
    const pageInstructions: Array<() => void> = [];

    switch (el.type) {
      case ElementType.SceneHeading: {
        pageInstructions.push(printScene(doc, posY, el as SceneHeading));
        posY += DEFAULT_FONT_SIZE * 2;
        break;
      }
      default:
        break;
    }

    if (posY > DOC_HEIGHT) {
      doc.addPage();
      posY = DOC_TOP;
    }

    // Execute the instructions for the current element
    pageInstructions.map((instruction) => instruction());
  }
}
