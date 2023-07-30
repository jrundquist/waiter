import { useEffect } from "react";
import "./App.css";
import { EventsOn, EventsOff } from "@runtime/runtime";
// import { Editor } from "./components/Editor";
import { Toolbar } from "@components/Toolbar";
import { Editor } from "@components/Editor";
import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    height: "100%",
  },
}));

function App() {
  useEffect(() => {
    EventsOn("file:open", (file) => {
      console.log("file:open", file);
    });
    return () => {
      EventsOff("file:open");
    };
  }, []);

  const classes = useStyles();

  return (
    <div className={classes.root}>
      {/* <Toolbar /> */}
      <Editor />
    </div>
  );
}

export default App;
