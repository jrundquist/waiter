import { useEffect } from "react";
import "./App.css";
import { EventsOn, EventsOff } from "@runtime/runtime";
import { Editor } from "./components/Editor";

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
      <Editor />
    </div>
  );
}

export default App;
