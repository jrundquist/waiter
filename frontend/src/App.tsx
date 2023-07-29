import { useEffect } from "react";
import "./App.css";
import { EventsOn, EventsOff } from "@runtime/runtime";
// import { Editor } from "./components/Editor";
import { Toolbar } from "@components/Toolbar";
import { Editor } from "@components/Editor";

function App() {
  useEffect(() => {
    EventsOn("file:open", (file) => {
      console.log("file:open", file);
    });
    return () => {
      EventsOff("file:open");
    };
  }, []);

  return (
    <div id="App">
      <Toolbar />
      <Editor />
    </div>
  );
}

export default App;
