import { jsPDF } from "jspdf";
import { Margins } from "./pdf";

export function showMargins(doc: jsPDF, pageMargins: Margins) {
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

export function printGrid(doc: jsPDF) {
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
