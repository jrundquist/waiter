/// <reference types="../preload/index" />
import React from "react";
import { createRoot } from "react-dom/client";
import { SettingsProvider } from "@/contexts/Settings";
import { ThemeWrapper } from "@/contexts/ThemeWrapper";

const container = document.getElementById("root");

const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <SettingsProvider>
      <ThemeWrapper>
        <h1>DEBUG</h1>
      </ThemeWrapper>
    </SettingsProvider>
  </React.StrictMode>
);
