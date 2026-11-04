import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router";
import "./index.css";
import { router } from "./app/router.ts";
import { store } from "./app/store.ts";
import { startThemeSync } from "./lib/theme.ts";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Root element #root was not found in index.html");
}

async function enableMocking(): Promise<void> {
  const useMocks = import.meta.env.DEV || import.meta.env.VITE_USE_MOCKS === "true";
  if (!useMocks) {
    return;
  }
  const { worker } = await import("./mocks/browser.ts");
  await worker.start({ onUnhandledFrame: "bypass" });
}

function renderApp(element: HTMLElement): void {
  createRoot(element).render(
    <StrictMode>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </StrictMode>,
  );
}

startThemeSync();

enableMocking()
  .catch((error: unknown) => {
    console.error("The mock API could not start.", error);
  })
  .finally(() => {
    renderApp(rootElement);
  });