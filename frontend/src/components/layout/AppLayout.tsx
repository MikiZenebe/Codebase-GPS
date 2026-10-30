import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="md:pl-[260px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 w-full p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
