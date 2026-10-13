import { useState } from "react";
import ContactsTab from "./ContactsTab";
import EvenementsTab from "./EvenementsTab";
import CommunicationTab from "./CommunicationTab";
import IdeeProspectsTab from "./IdeeProspectsTab";

type Tab = "contacts" | "evenements" | "communication" | "idees";

const TABS: { id: Tab; label: string }[] = [
  { id: "contacts", label: "Contacts" },
  { id: "evenements", label: "Événements & lieux" },
  { id: "communication", label: "Communication & réseaux" },
  { id: "idees", label: "Idées prospects" },
];

export default function ProspectionPage() {
  const [tab, setTab] = useState<Tab>("contacts");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="px-6 pt-3 bg-white border-b border-gray-100 shrink-0">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                tab === t.id
                  ? "border-[#00365A] text-[#00365A]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "contacts" && <ContactsTab />}
        {tab === "evenements" && <EvenementsTab />}
        {tab === "communication" && <CommunicationTab />}
        {tab === "idees" && <IdeeProspectsTab />}
      </div>
    </div>
  );
}
