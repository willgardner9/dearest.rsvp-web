import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { configureApiClient } from "./api/clientConfig";

// Configure the generated API client before the first request.
configureApiClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
