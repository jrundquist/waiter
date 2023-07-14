import { useEffect, useState } from "react";
import "./App.css";
import { Greet } from "@go/waiter/MiddlewareFunctions";
import { EventsOn, EventsOff } from "@runtime/runtime";

function App() {
  const [resultText, setResultText] = useState(
    "Please enter your name below 👇"
  );

  useEffect(() => {
    EventsOn("file:open", (file) => {
      console.log(file);
    });
    return () => {
      EventsOff("file:open");
    };
  }, []);

  const [name, setName] = useState("");
  const updateName = (e: any) => setName(e.target.value);
  const updateResultText = (result: string) => setResultText(result);

  function greet() {
    Greet(name).then(updateResultText);
  }

  return (
    <div id="App">
      <div id="result" className="result">
        {resultText}
      </div>
      <div id="input" className="input-box">
        <input
          id="name"
          className="input"
          onChange={updateName}
          autoComplete="off"
          name="input"
          type="text"
        />
        <button className="btn" onClick={greet}>
          Greet
        </button>
      </div>
    </div>
  );
}

export default App;
