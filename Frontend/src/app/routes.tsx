import { createBrowserRouter } from "react-router";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Welcome } from "./pages/Welcome";
import { Home } from "./pages/Home";
import { History } from "./pages/History";
import { Planner } from "./pages/Planner";
import { Insights } from "./pages/Insights";
import { AgentChat } from "./pages/AgentChat";
import { Onboarding } from "./pages/Onboarding";
import { ExtensionPopup } from "./pages/ExtensionPopup";
import { Settings } from "./pages/Settings";
import { Help } from "./pages/Help";

export const router = createBrowserRouter([
  {
    path: "/welcome",
    Component: Welcome,
  },
  {
    path: "/onboarding",
    Component: Onboarding,
  },
  {
    path: "/extension",
    Component: ExtensionPopup,
  },
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: Home },
      { path: "history", Component: History },
      { path: "planner", Component: Planner },
      { path: "insights", Component: Insights },
      { path: "chat", Component: AgentChat },
      { path: "settings", Component: Settings },
      { path: "help", Component: Help },
    ],
  },
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { index: true, Component: Home },
      { path: "history", Component: History },
      { path: "planner", Component: Planner },
      { path: "insights", Component: Insights },
      { path: "chat", Component: AgentChat },
      { path: "settings", Component: Settings },
      { path: "help", Component: Help },
    ],
  },
]);
