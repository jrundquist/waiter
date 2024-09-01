import { State } from "@/app/state";
import { log } from "@/app/logger";
import { jsPDF } from "jspdf";
import { showMargins, printGrid } from "./pdf_debug_utils";
import fs from "fs";

const PTS_PER_INCH = 72;
const DEFAULT_FONT_SIZE = 12;

const FONTS = {
  normal: "assets/fonts/CourierPrime/CourierPrime-Regular.ttf",
  bold: "assets/fonts/CourierPrime/CourierPrime-Bold.ttf",
  italics: "assets/fonts/CourierPrime/CourierPrime-Italic.ttf",
  bolditalics: "assets/fonts/CourierPrime/CourierPrime-BoldItalic.ttf",
};

export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
  hardMargin: number;
}

interface Text {
  text: string;
  underline?: boolean;
  bold?: boolean;
  italics?: boolean;
  size?: number;
}

export interface PDFOptions {
  skipTitlePage: boolean;
  margins: Margins;
}

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

class Doc {
  private readonly pdf: jsPDF;
  readonly options: PDFOptions;

  constructor(options: PDFOptions) {
    this.options = options;
    this.pdf = new jsPDF({
      compress: true,
      orientation: "portrait",
      format: "letter",
      unit: "pt",
      putOnlyUsedFonts: true,
    });
  }

  addPage() {
    this.pdf.addPage();
    showMargins(this.pdf, this.options.margins);
    this.renderPageNumber();
  }

  renderPageNumber(forced = false) {
    let page = this.pdf.getCurrentPageInfo().pageNumber;
    if (!this.options.skipTitlePage) {
      page--;
    }
    if (page > 1 || forced) {
      this.pdf.setFont("CourierPrime", "normal");
      this.pdf.setFontSize(12);
      this.pdf.setDrawColor(40, 40, 40);
      const dims = this.pdf.getTextDimensions(`${page}.`, { maxWidth: this.pageWidth });
      this.pdf.text(
        `${page}.`,
        this.pageWidth - this.options.margins.hardMargin - dims.w,
        this.options.margins.hardMargin
      );
    }
  }

  setDocumentProperties({ title, author }: { title: string; author: string }) {
    this.pdf.setDocumentProperties({
      title,
      author,
    });
  }

  async addFonts() {
    for (const [fontType, fileName] of Object.entries(FONTS)) {
      const myFont = fs.readFileSync(fileName, {
        encoding: "latin1",
      });

      // add the font to jsPDF
      this.pdf.addFileToVFS(fileName, myFont);
      this.pdf.addFont(fileName, "CourierPrime", fontType);
      this.pdf.setFont("CourierPrime", "normal");
    }
  }

  get pageWidth() {
    return this.pdf.internal.pageSize.width;
  }

  get pageHeight() {
    return this.pdf.internal.pageSize.height;
  }

  setFontStyle(text: Text) {
    let format = "";
    if (text.bold) {
      format += "bold";
    }
    if (text.italics) {
      format += "italics";
    }
    if (format === "") {
      format = "normal";
    }
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setFontSize(text.size ?? 12);
    this.pdf.setFont("CourierPrime", format);
  }

  justifyText(
    text: Text | string,
    align: "left" | "center" | "right" | "hard-left" | "hard-right",
    y: number
  ) {
    if (typeof text === "string") {
      text = { text } as Text;
    }

    this.setFontStyle(text);
    const textWidth = this.pdf.getTextWidth(text.text);

    let x = 0;
    switch (align) {
      case "left":
        x = this.options.margins.left;
        break;
      case "center":
        x = this.pdf.internal.pageSize.width / 2 - textWidth / 2;
        break;
      case "right":
        x = this.pdf.internal.pageSize.width - textWidth - this.options.margins.right;
        break;
      case "hard-left":
        x = this.options.margins.hardMargin;
        break;
      case "hard-right":
        x = this.pdf.internal.pageSize.width - textWidth - this.options.margins.hardMargin;
        break;
    }
    this.renderText(text, x, y);
  }

  renderText(text: Text, x: number, y: number) {
    this.setFontStyle(text);
    this.pdf.text(text.text, x, y);

    if (text.underline) {
      const textWidth = this.pdf.getTextWidth(text.text);
      this.pdf.setLineWidth(0.5);
      this.pdf.line(x, y + 2, x + textWidth, y + 2);
    }
  }

  getTextDimensions(text: string, options: { maxWidth: number }) {
    return this.pdf.getTextDimensions(text, options);
  }

  getFontSize() {
    return this.pdf.getFontSize();
  }

  showMargins() {
    showMargins(this.pdf, this.options.margins);
  }

  showGrid() {
    printGrid(this.pdf);
  }

  async save(fileName: string) {
    await this.pdf.save(fileName, { returnPromise: true });
  }
}

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

  doc.addPage();
  doc.addPage(); // 2

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
  const titleTextSplit = doc.pdf.splitTextToSize(title, widthSubMargin);
  const titleDims = doc.pdf.getTextDimensions(titleTextSplit, {
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
}
