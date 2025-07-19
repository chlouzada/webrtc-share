import React from "react";
import ReactDOM from "react-dom/client";
import {
  RouterProvider,
  createRouter,
  createHashHistory,
} from "@tanstack/react-router";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { routeTree } from "./routeTree.gen";

import "./index.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

const history = createHashHistory();
const router = createRouter({ routeTree, history });

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <MantineProvider
      theme={{
        primaryColor: "teal",
      }}
    >
      <Notifications />
      <RouterProvider router={router} />
    </MantineProvider>
  </React.StrictMode>
);

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
