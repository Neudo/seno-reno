import { createContext, useContext, useState } from "react";
import { DEFAULT_SECTIONS, type RoutineSection } from "../components/routine/routineData";

interface RoutineContextValue {
  sections: RoutineSection[];
  setSections: React.Dispatch<React.SetStateAction<RoutineSection[]>>;
}

const RoutineContext = createContext<RoutineContextValue | null>(null);

export function RoutineProvider({ children }: { children: React.ReactNode }) {
  const [sections, setSections] = useState<RoutineSection[]>(DEFAULT_SECTIONS);
  return (
    <RoutineContext.Provider value={{ sections, setSections }}>
      {children}
    </RoutineContext.Provider>
  );
}

export function useRoutine() {
  const ctx = useContext(RoutineContext);
  if (!ctx) throw new Error("useRoutine must be used inside RoutineProvider");
  return ctx;
}
