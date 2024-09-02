import React, { useEffect, useState } from "react";
import { Theme } from "@mui/material";
import { makeStyles } from "tss-react/mui";
import { PDFOptions } from "@/app/exporter/pdf_doc";

const useStyles = makeStyles()((theme: Theme) => ({
  underlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 99,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  dialog: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: theme.palette.background.paper,
    boxShadow: `0 0 10px ${theme.palette.common.black}`,
    border: `2px solid ${theme.palette.divider}`,
    borderRadius: 10,
    zIndex: 100,
    minWidth: 700,
    maxWidth: "80vw",
  },

  content: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    color: theme.palette.text.primary,
    flex: 1,
    width: "auto",
    transition: "width 2s ease-in",
  },

  preview: {
    flex: 1,
    marginRight: 20,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.palette.background.default,
    borderRadius: 5,
    border: `1px solid ${theme.palette.divider}`,
    minHeight: 550,
    aspectRatio: "8.5 / 11",
    "& > iframe": {
      width: "100%",
      height: "100%",
      border: "none",
      transition: "opacity .2s",
    },
  },

  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  col: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },

  label: {
    width: 100,
  },

  input: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 5,
    padding: 5,
    color: theme.palette.text.primary,
  },

  dialogButtons: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
    marginBottom: 0,
    marginTop: "auto",
    borderTop: `1px solid ${theme.palette.divider}`,
    paddingTop: 10,
  },

  buttonRow: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
    marginBottom: 0,
    marginTop: "auto",
    paddingTop: 20,
  },

  actionButton: {
    padding: "5px 10px",
    borderRadius: 5,
    border: `none`,
    cursor: "pointer",
    transition: "background-color 0.2s",
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },

  cancelButton: {
    padding: "5px 10px",
    borderRadius: 5,
    border: `none`,
    cursor: "pointer",
    transition: "background-color 0.2s",
    backgroundColor: theme.palette.grey[500],
    "&:hover": {
      backgroundColor: theme.palette.error.dark,
    },
    alignSelf: "flex-end",
    marginRight: "auto",
    marginLeft: 0,
  },

  sections: {
    display: "flex",
    flexDirection: "row",
    gap: 20,
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: 10,

    padding: 20,
    '&[data-section="main"]': {},

    '&[data-section="advanced"]': {
      backgroundColor: theme.palette.grey[theme.palette.mode === "dark" ? 900 : 200],
    },
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    borderBottom: `1px solid ${theme.palette.divider}`,
    marginBottom: 10,
    paddingBottom: 10,
  },

  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: "1.5rem",
    color: theme.palette.text.primary,
  },
}));

interface Props {
  open: boolean;
  onClose: () => void;
}

export const PrintDialog: React.FC<Props> = ({ open, onClose }) => {
  const { classes } = useStyles();

  const [includeTitlePage, setIncludeTitlePage] = useState(true);
  const [includeSceneNumbers, setIncludeSceneNumbers] = useState(true);
  const [pageHeader, setPageHeader] = useState("");
  const [watermark, setWatermark] = useState("");
  const [watermarkOrientation, setWatermarkOrientation] = useState<
    "horizontal" | "45" | "vertical"
  >("horizontal");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);

  const [printerOptions, setPrinterOptions] = useState<{ id: string; value: string }[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string | undefined>(undefined);

  const previewRef = React.useRef<HTMLIFrameElement>(null);

  const printSettings: Partial<PDFOptions> = React.useMemo(
    () => ({
      skipTitlePage: !includeTitlePage,
      includeSceneNumbers,
      pageHeader,
      watermark,
      watermarkSize: 48,
      watermarkOrientation,
    }),
    [includeTitlePage, includeSceneNumbers, pageHeader, watermark, watermarkOrientation]
  );

  const handlePrint = React.useCallback(() => {
    console.log("Printing with settings:");
    window.api.print(printSettings, selectedPrinter).then((didPrint) => {
      if (didPrint) {
        onClose();
      }
    });
  }, [printSettings, selectedPrinter, onClose]);

  useEffect(() => {
    window.api.getPrinters().then((res) => {
      setPrinterOptions(res.printers.map((p) => ({ id: p.printer, value: p.description })));
      setSelectedPrinter(res.defaultPrinter);
    });
  }, [open]);

  const handleSavePDF = React.useCallback(() => {
    console.log("Printing with settings:");
    window.api.savePDF(printSettings).then((didSave) => {
      if (didSave) {
        onClose();
      }
    });
  }, [printSettings, onClose]);

  const handleEsc = React.useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, handleEsc]);

  useEffect(() => {
    if (!open) return;

    // Generate a PDF preview
    const start = performance.now();
    let previewUrl: string | null = null;
    setLoading(true);

    window.api.getPDFPreview(printSettings).then((result) => {
      console.log("PDF Preview Result:", result);
      console.log("PDF Preview took", performance.now() - start, "ms");

      const previewBlob = new Blob([result], { type: "application/pdf" });
      previewUrl = URL.createObjectURL(previewBlob);

      if (previewRef.current) {
        previewRef.current.src = `${previewUrl}#toolbar=0`; // Append #toolbar=0 to hide Chrome's PDF toolbar
        previewRef.current.width = "100%"; // Set desired width
        previewRef.current.height = "100%"; // Set desired height
        previewRef.current.onload = () => {
          setLoading(false);
        };
      }
    });

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [setLoading, open, printSettings]);

  if (!open) return null;

  return (
    <div className={classes.underlay}>
      <div className={classes.dialog}>
        <div className={classes.content}>
          <div className={classes.sections}>
            <div className={classes.section}>
              {/* This is where the PDF preview component would go */}
              <div className={classes.preview}>
                <iframe ref={previewRef} style={{ opacity: loading ? 0 : 100 }} />
              </div>
            </div>

            {/* This is the main print setup area */}
            <div className={classes.section} data-section="main">
              <h2>Print</h2>

              <div className={classes.row}>
                <label className={classes.label} htmlFor="printer">
                  Printer
                </label>
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className={classes.input}
                  id="printer"
                  disabled={printerOptions.length === 0}
                >
                  {printerOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.value}
                    </option>
                  ))}
                </select>
              </div>

              <div className={classes.row}>
                <input
                  id="includeTitle"
                  type="checkbox"
                  checked={includeTitlePage}
                  onChange={() => setIncludeTitlePage(!includeTitlePage)}
                />
                <label htmlFor="includeTitle">Include Title Page</label>
              </div>

              <div className={classes.row}>
                <input
                  id="includeNums"
                  type="checkbox"
                  checked={includeSceneNumbers}
                  onChange={() => setIncludeSceneNumbers(!includeSceneNumbers)}
                />
                <label htmlFor="includeNums">Scene Numbers</label>
              </div>

              {/* Action buttons */}
              <div className={classes.dialogButtons}>
                <div className={classes.col}>
                  <div className={classes.row}>
                    <input
                      id="adv"
                      type="checkbox"
                      checked={showAdvanced}
                      onChange={() => setShowAdvanced(!showAdvanced)}
                    />
                    <label htmlFor="adv">Show Advanced Settings</label>
                  </div>

                  <div className={classes.buttonRow}>
                    <button
                      className={classes.actionButton}
                      onClick={handlePrint}
                      disabled={printerOptions.length === 0}
                    >
                      Print
                    </button>
                    <button className={classes.actionButton} onClick={handleSavePDF}>
                      PDF
                    </button>
                    <button className={classes.cancelButton} onClick={onClose}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* This is the advanced settings */}
            {showAdvanced && (
              <div className={classes.section} data-section="advanced">
                <div className={classes.formGroup}>
                  <div className={classes.formTitle}>Page Header</div>
                  <div className={classes.row}>
                    <div className={classes.col}>
                      <input
                        type="text"
                        value={pageHeader}
                        onChange={(e) => setPageHeader(e.target.value)}
                        className={classes.input}
                      />
                    </div>
                  </div>
                </div>

                <div className={classes.formGroup}>
                  <div className={classes.formTitle}>Watermarking</div>
                  <div className={classes.row}>
                    <div className={classes.col}>
                      <label className={classes.label}>Watermark</label>
                      <input
                        type="text"
                        value={watermark}
                        onChange={(e) => setWatermark(e.target.value)}
                        className={classes.input}
                      />
                    </div>
                  </div>
                  <div className={classes.row}>
                    <label className={classes.label}>Orientation</label>
                    <select
                      value={watermarkOrientation}
                      onChange={(e) => setWatermarkOrientation(e.target.value as any)}
                      className={classes.input}
                    >
                      <option value="horizontal">Horizontal</option>
                      <option value="vertical">Vertical</option>
                      <option value="45">45</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
