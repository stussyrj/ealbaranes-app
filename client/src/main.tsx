import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  console.error("Root element not found!");
} else {
  try {
    createRoot(root).render(<App />);
  } catch (error) {
    console.error("Failed to render app:", error);
    root.innerHTML = `<div style="padding:20px; color:red;">Error: ${error instanceof Error ? error.message : String(error)}</div>`;
  }
}
