import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="md:pl-64">
        <Header />

        <main className="mx-auto w-full max-w-[1600px] p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
