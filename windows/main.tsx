/// <reference types="../preload/index" />
import React from "react";
import { createRoot } from "react-dom/client";
import App from "@components/App";
import { SettingsProvider } from "@/contexts/Settings";
import { ThemeWrapper } from "@/contexts/ThemeWrapper";

const container = document.getElementById("root");

const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <SettingsProvider>
      <ThemeWrapper>
        <App />
      </ThemeWrapper>
    </SettingsProvider>
  </React.StrictMode>
);
