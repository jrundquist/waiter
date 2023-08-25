import { useEffect } from "react";
import "./App.css";
// import { EventsOn, EventsOff } from "@runtime/runtime";
import { Editor } from "@components/Editor";
// import { DarkLightToggle } from "@/renderer/components/DarkLightToggle";
import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";
import { ScriptDetailsProvider } from "@contexts/ScriptDetails";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    height: "100%",
    color: theme.palette.text.primary,
  },
}));

function App() {
  useEffect(() => {
    // EventsOn("file:open", (file) => {
    //   console.log("file:open", file);
    // });
    // return () => {
    //   EventsOff("file:open");
    // };
  }, []);

  const classes = useStyles();
  return (
    <div className={classes.root}>
      <ScriptDetailsProvider>
        <Editor />
      </ScriptDetailsProvider>
    </div>
  );
}

export default App;
