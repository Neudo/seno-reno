import { Outlet } from "react-router";
import { RoutineProvider } from "./context/RoutineContext";
import AppSidebar from "./components/AppSidebar";
import AppHeader from "./components/AppHeader";

export default function Root() {
  return (
    <RoutineProvider>
      <div className="flex h-full overflow-hidden bg-[#F4F5F7]">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AppHeader />
          <Outlet />
        </div>
      </div>
    </RoutineProvider>
  );
}
