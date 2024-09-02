/// <reference types="../preload/index" />
import { IPCEvents } from "@/ipc/events";
import { Editor } from "@components/Editor";
import TitleBar from "@components/Titlebar";
import { BottomBar } from "@components/BottomBar";
import { ScriptDetailsProvider } from "@contexts/ScriptDetails";
import { TitlePageDialog } from "@components/TitlePageDialog";
import { Theme } from "@mui/material";
import "@styles/App.css";
import { useEffect, useState, useMemo } from "react";
import { makeStyles } from "tss-react/mui";
import { State } from "@/app/state";
import { PrintDialog } from "@components/PrintDialog";

const useStyles = makeStyles()((theme: Theme) => ({
  root: {
    color: theme.palette.text.primary,
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
  },
  content: {
    position: "fixed",
    height:
      "calc(100vh - env(titlebar-area-height, var(--fallback-title-bar-height)) - var(--bottom-bar-height))",
    top: "calc(0px + env(titlebar-area-height, var(--fallback-title-bar-height)))",
    overflow: "scroll",
    width: "100vw",
  },
}));

export function App() {
  useEffect(() => {
    window.api.log.info("App.tsx: App mounted", { window });
    return () => {
      window.api.log.info("App.tsx: App unmounted");
    };
  }, []);

  const [stateCopy, setStateCopy] = useState<State | null>(null);

  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  useEffect(() => {
    return window.api.subscribeTo(IPCEvents.OPEN_TITLE_PAGE, () => {
      setTitleDialogOpen(true);
    });
  });

  useEffect(() => {
    return window.api.subscribeTo(IPCEvents.OPEN_PRINT_DIALOG, () => {
      setPrintDialogOpen(true);
    });
  });

  useEffect(() => {
    if (titleDialogOpen) {
      window.api.getCurrentState().then((state) => {
        console.log("state", state);
        setStateCopy(state);
      });
    }
  }, [titleDialogOpen]);

  const titleInfo = useMemo(() => {
    console.log("stateCopy", stateCopy);
    return {
      title: stateCopy?.scriptTitle ?? "",
      credit: stateCopy?.scriptCredit ?? "",
      authors: stateCopy?.scriptAuthors ?? "",
      source: stateCopy?.scriptSource ?? "",
      contact: stateCopy?.scriptContact ?? "",
      date: stateCopy?.scriptDraftDate ?? "",
    };
  }, [stateCopy]);

  const { classes } = useStyles();
  return (
    <ScriptDetailsProvider>
      <div className={classes.root}>
        <TitleBar />
        <div className={classes.content}>
          <Editor />
        </div>
        <TitlePageDialog
          open={titleDialogOpen}
          onClose={() => setTitleDialogOpen(false)}
          currentInfo={titleInfo}
          onSave={(scriptInfo) => {
            window.api.saveTitleInfo(scriptInfo);
            setTitleDialogOpen(false);
          }}
        />
        <PrintDialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)} />
        <BottomBar />
      </div>
    </ScriptDetailsProvider>
  );
}

export default App;
