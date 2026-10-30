import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import DashboardPage from "../pages/DashboardPage";
import ProjectsPage from "../pages/ProjectsPage";
import NewProjectPage from "../pages/NewProjectPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "projects",
        element: <ProjectsPage />,
      },
      {
        path: "projects/new",
        element: <NewProjectPage />,
      },
      //   {
      //     path: "projects/:projectId",
      //     element: <ProjectDetailsPage />,
      //   },
      //   {
      //     path: "code-graph",
      //     element: <CodeGraphPage />,
      //   },
      //   {
      //     path: "code-search",
      //     element: <CodeSearchPage />,
      //   },
      //   {
      //     path: "flows",
      //     element: <FlowsPage />,
      //   },
      //   {
      //     path: "settings",
      //     element: <SettingsPage />,
      //   },
      //   {
      //     path: "*",
      //     element: <NotFoundPage />,
      //   },
    ],
  },
]);
