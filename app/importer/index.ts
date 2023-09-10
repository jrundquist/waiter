import { dialog, ipcMain } from "electron";
import { getDocument, PDFDocumentProxy } from "pdfjs-dist";
import { TextItem } from "pdfjs-dist/types/src/display/api";

let isInit = false;

function roughlyEqual(a: number, b: number, epsilon = 0.001): boolean {
  return Math.abs(a - b) < epsilon;
}

function loadPage(doc: PDFDocumentProxy, pageNumber: number): Promise<void> {
  return doc.getPage(pageNumber).then(async (page) => {
    console.log(`Page ${pageNumber} loaded`);
    const tokenizedText = await page.getTextContent();
    const isTextItem = (item: any): item is TextItem => {
      return item.str !== undefined;
    };
    console.log({ i: tokenizedText.items });
    const pageText = tokenizedText.items.filter(isTextItem).map((token) => {
      const { str } = token;

      console.log(token);

      if (token.hasEOL) {
        return `${str}\n`;
      }
      return str;
    });
  });
}

export const init = (): void => {
  if (isInit) {
    return;
  }
  isInit = true;

  ipcMain.on("import:pdf", (...args: any[]) => {
    const pdfFile = args[0];
    if (typeof pdfFile !== "string") {
      return;
    }

    console.log("import:pdf", pdfFile);
    getDocument(pdfFile)
      .promise.then((doc: PDFDocumentProxy) => {
        console.log("doc", doc);
        const numPages = doc.numPages;
        console.log("# Document Loaded");
        console.log("Number of Pages: " + numPages);

        const pageLoaders: Promise<void>[] = [];
        for (let i = 1; i <= numPages; i++) {
          pageLoaders.push(loadPage(doc, i));
        }
        return Promise.all(pageLoaders).catch((err) => {
          dialog.showErrorBox("Failed to Parse PDF", err.message);
        });
      })
      .catch((err: Error) => {
        console.error("err", err);
        dialog.showErrorBox("Failed to Import PDF", err.message);
      });
  });
};
