import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";
import { app } from "electron";

// Function to get the correct path based on the environment
function getAssetPath(...paths: string[]): string {
  const p = path.join(app.isPackaged ? process.resourcesPath : "", ...paths);
  return p;
}

export const PTS_PER_INCH = 72;

const FONTS = {
  normal: getAssetPath("assets", "fonts", "CourierPrime", "CourierPrime-Regular.ttf"),
  bold: getAssetPath("assets", "fonts", "CourierPrime", "CourierPrime-Bold.ttf"),
  italics: getAssetPath("assets", "fonts", "CourierPrime", "CourierPrime-Italic.ttf"),
  bolditalics: getAssetPath("assets", "fonts", "CourierPrime", "CourierPrime-BoldItalic.ttf"),
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
  includeSceneNumbers: boolean;
  pageHeader: string;
  watermark: string;
  watermarkSize: number;
  watermarkOrientation: "horizontal" | "45" | "vertical";
}

export class Doc {
  private readonly pdf: jsPDF;
  readonly options: PDFOptions;

  constructor(options: PDFOptions) {
    this.options = options;
    this.pdf = new jsPDF({
      compress: true,
      orientation: "p",
      format: "letter",
      unit: "pt",
      putOnlyUsedFonts: true,
    });
    this.pdf.setLineHeightFactor(1);
  }

  addPage() {
    this.pdf.addPage();
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
        this.pageWidth - this.options.margins.hardMargin - dims.w - 2,
        this.options.margins.hardMargin - 5
      );
    }
  }

  renderWatermark() {
    const doc = this.pdf;
    doc.saveGraphicsState();
    doc.setGState(doc.GState({ opacity: 0.1 }));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(this.options.watermarkSize);

    const dims = doc.getTextDimensions(this.options.watermark, {
      fontSize: this.options.watermarkSize,
      maxWidth: 1e5,
    });
    const angle =
      this.options.watermarkOrientation === "vertical"
        ? 90
        : this.options.watermarkOrientation === "45"
          ? 45
          : 0;

    const rad = (angle * Math.PI) / 180; // Convert angle to radians

    // Calculate rotated bounding box dimensions
    const rotatedWidth = dims.w * Math.abs(Math.cos(rad)) + dims.h * Math.abs(Math.sin(rad));
    const rotatedHeight = dims.w * Math.abs(Math.sin(rad)) + dims.h * Math.abs(Math.cos(rad));

    doc.text(
      this.options.watermark,
      (this.pageWidth - (rotatedWidth - dims.w)) / 2,
      (this.pageHeight + rotatedHeight) / 2,
      {
        align: "center",
        baseline: "bottom",
        angle,
      }
    );
    doc.restoreGraphicsState();
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

  get lineHeight() {
    return this.pdf.getLineHeight();
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
    align: "left" | "center" | "right" | "hard-left" | "hard-right" | "character",
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
      default:
        x = 0;
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

  splitTextToSize(text: string, maxWidth: number): string[] {
    return this.pdf.splitTextToSize(text, maxWidth);
  }

  getFontSize() {
    return this.pdf.getFontSize();
  }

  getPageCount() {
    return this.pdf.getNumberOfPages();
  }

  showMargins() {
    const doc = this.pdf;
    const pageMargins = this.options.margins;
    doc.setLineWidth(0.2);
    const drawColor = doc.getDrawColor();
    doc.setDrawColor(0, 255, 0);
    // Draw lines for each margin
    doc.line(pageMargins.left, 0, pageMargins.left, doc.internal.pageSize.height);
    doc.line(
      doc.internal.pageSize.width - pageMargins.right,
      0,
      doc.internal.pageSize.width - pageMargins.right,
      doc.internal.pageSize.height
    );
    doc.line(0, pageMargins.top, doc.internal.pageSize.width, pageMargins.top);
    doc.line(
      0,
      doc.internal.pageSize.height - pageMargins.bottom,
      doc.internal.pageSize.width,
      doc.internal.pageSize.height - pageMargins.bottom
    );
    doc.setDrawColor(255, 0, 0);
    doc.setLineWidth(0.1);
    // Draw lines for the hard margins
    doc.line(pageMargins.hardMargin, 0, pageMargins.hardMargin, doc.internal.pageSize.height);
    doc.line(
      doc.internal.pageSize.width - pageMargins.hardMargin,
      0,
      doc.internal.pageSize.width - pageMargins.hardMargin,
      doc.internal.pageSize.height
    );

    doc.line(0, pageMargins.hardMargin, doc.internal.pageSize.width, pageMargins.hardMargin);
    doc.line(
      0,
      doc.internal.pageSize.height - pageMargins.hardMargin,
      doc.internal.pageSize.width,
      doc.internal.pageSize.height - pageMargins.hardMargin
    );

    doc.setDrawColor(drawColor);
  }

  showGrid() {
    const doc = this.pdf;
    for (let x = 0; x < doc.internal.pageSize.width; x += 10) {
      if (x % 100 == 0) {
        doc.setLineWidth(0.5);
      } else {
        doc.setLineWidth(0.1);
      }
      doc.line(x, 0, x, doc.internal.pageSize.height);
    }
    for (let y = 0; y < doc.internal.pageSize.height; y += 10) {
      if (y % 100 == 0) {
        doc.setLineWidth(0.5);
      } else {
        doc.setLineWidth(0.1);
      }
      doc.line(0, y, doc.internal.pageSize.width, y);
    }
  }

  drawXAt(x: number, y: number, size: number = 5, color: [number, number, number] = [255, 0, 0]) {
    this.pdf.setDrawColor(...color);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(x - size, y - size, x + size, y + size);
    this.pdf.line(x - size, y + size, x + size, y - size);
  }

  showLineHeight() {
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.1);
    for (
      let y = this.options.margins.top;
      y < this.pageHeight - this.options.margins.bottom;
      y += this.lineHeight
    ) {
      this.pdf.text(`${y.toFixed(2)}`, 2, y);
      this.pdf.line(0, y, this.pageWidth, y);
    }
  }

  async save(fileName: string) {
    await this.pdf.save(fileName, { returnPromise: true });
  }

  async output() {
    return this.pdf.output("arraybuffer");
  }
}
