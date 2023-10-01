/// <reference types="../preload/index" />
import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeWrapper } from "@contexts/ThemeWrapper";
import { SettingsApp } from "@/components/SettingsApp";
import { SettingsProvider } from "@/contexts/Settings";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <SettingsProvider>
      <ThemeWrapper>
        <SettingsApp />
      </ThemeWrapper>
    </SettingsProvider>
  </React.StrictMode>
);
