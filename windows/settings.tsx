/// <reference types="../preload/index" />
import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeWrapper } from "@contexts/ThemeWrapper";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <ThemeWrapper>
      <>
        <h1>Settings</h1>
        <p>Coming soon...</p>
      </>
    </ThemeWrapper>
  </React.StrictMode>
);
