import React from "react";
import ReactDOM from "react-dom/client";
import Router from "./Router.tsx";
import "./index.css";
import { VLMProvider } from "./context/VLMContext.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <VLMProvider>
      <Router />
    </VLMProvider>
  </React.StrictMode>,
);
