import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import ChantierDetail from "./ChantierDetail";
import { INITIAL_CHANTIERS } from "./chantierData";
import type { Chantier } from "./chantierTypes";

export default function ChantierDetailRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const chantierId = Number(id);
  const [chantier, setChantier] = useState<Chantier | null>(
    () => INITIAL_CHANTIERS.find((c) => c.id === chantierId) || null
  );

  // Sync state if id changes (unlikely without unmount, but safe)
  useEffect(() => {
    setChantier(INITIAL_CHANTIERS.find((c) => c.id === chantierId) || null);
  }, [chantierId]);

  if (!chantier) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl text-gray-900 font-semibold">Chantier introuvable</h2>
        <button
          onClick={() => navigate("/chantiers")}
          className="mt-4 text-violet-600 hover:underline"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const handleUpdate = (updated: Chantier) => {
    setChantier(updated);
    // Persist in memory data array
    const idx = INITIAL_CHANTIERS.findIndex((c) => c.id === updated.id);
    if (idx !== -1) {
      INITIAL_CHANTIERS[idx] = updated;
    }
  };

  return (
    <ChantierDetail
      chantier={chantier}
      onBack={() => navigate("/chantiers")}
      onUpdate={handleUpdate}
    />
  );
}