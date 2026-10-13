import { ClipboardList, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F5F7]">
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
        <div className="bg-white border border-gray-200 divide-y divide-gray-100">
          <div className="px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Personnalisation</p>
          </div>

          <button
            onClick={() => navigate("/routine/parametres")}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer text-left group"
          >
            <div className="w-8 h-8 bg-[#E8F0F6] flex items-center justify-center shrink-0">
              <ClipboardList size={16} className="text-[#00365A]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 group-hover:text-[#00365A] transition-colors">
                Routine quotidienne
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Gérer les catégories et tâches permanentes de la routine du matin
              </p>
            </div>
            <ChevronRight size={14} className="text-gray-400 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
