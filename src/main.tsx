
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import { installRadixPointerEventsFix } from "./lib/radix-pointer-events-fix.ts";

  installRadixPointerEventsFix();
  createRoot(document.getElementById("root")!).render(<App />);
