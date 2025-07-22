import React from "react";
import ReactDOM from "react-dom/client";
import SimpleAdminApp from "./SimpleAdminApp.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SimpleAdminApp />
  </React.StrictMode>,
);
