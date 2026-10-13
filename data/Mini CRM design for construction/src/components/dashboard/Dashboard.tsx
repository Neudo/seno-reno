import KpiRow from "./KpiRow";
import RoutineSection from "./RoutineSection";
import ChantiersSection from "./ChantiersSection";
import PlanningSection from "./PlanningSection";
import FinancesSection from "./FinancesSection";
import QuickAccessSection from "./QuickAccessSection";

export default function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F5F7]">
      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">
        {/* KPI Row */}
        <KpiRow />

        {/* Quick access cards */}
        <QuickAccessSection />

        {/* Trésorerie — full width */}
        <FinancesSection />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          <ChantiersSection />
          <PlanningSection />
        </div>
      </div>
    </div>
  );
}
