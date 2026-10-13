import { useState } from "react";
import { Plus, Search, Copy, Check, Phone, Mail, Building2, User } from "lucide-react";
import type { Client, ClientFilter } from "./clientTypes";
import { clientDisplayName, clientSubtitle, clientLocalisation, clientDerniereActivite } from "./clientTypes";
import { INITIAL_CLIENTS, getNextClientId } from "./clientData";
import ClientDetail from "./ClientDetail";
import ClientFormModal from "./ClientFormModal";

const FILTERS: { id: ClientFilter; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "en_cours", label: "Chantier en cours" },
  { id: "sans_chantier", label: "Sans chantier" },
  { id: "archives", label: "Archivés" },
];

function CopyBtn({ value, icon }: { value: string; icon: "mail" | "phone" }) {
  const [copied, setCopied] = useState(false);
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const Icon = icon === "mail" ? Mail : Phone;
  return (
    <button
      onClick={handle}
      title={`Copier ${icon === "mail" ? "l'email" : "le téléphone"}`}
      className="group flex items-center gap-1 text-gray-400 hover:text-[#00365A] transition-colors cursor-pointer"
    >
      <Icon size={12} />
      {copied
        ? <Check size={11} className="text-emerald-500" />
        : <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      }
    </button>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ClientFilter>("tous");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const selectedClient = clients.find((c) => c.id === selectedId) ?? null;

  if (selectedClient) {
    return (
      <ClientDetail
        client={selectedClient}
        onBack={() => setSelectedId(null)}
        onUpdate={(updated) => setClients((prev) => prev.map((c) => c.id === updated.id ? updated : c))}
      />
    );
  }

  const filtered = clients.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      const haystack = [
        clientDisplayName(c),
        c.societe ?? "",
        c.email,
        c.telephone,
        c.ville ?? "",
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filter === "en_cours") return c.chantiers.some((ch) => ch.statut === "en_cours") && !c.archive;
    if (filter === "sans_chantier") return c.chantiers.length === 0 && !c.archive;
    if (filter === "archives") return c.archive;
    return !c.archive;
  });

  const filterCounts: Record<ClientFilter, number> = {
    tous: clients.filter((c) => !c.archive).length,
    en_cours: clients.filter((c) => !c.archive && c.chantiers.some((ch) => ch.statut === "en_cours")).length,
    sans_chantier: clients.filter((c) => !c.archive && c.chantiers.length === 0).length,
    archives: clients.filter((c) => c.archive).length,
  };

  const handleAdd = (data: Omit<Client, "id" | "chantiers" | "documents" | "dateCreation" | "archive">) => {
    const newClient: Client = {
      ...data,
      id: getNextClientId(),
      chantiers: [],
      documents: [],
      dateCreation: new Date().toISOString().slice(0, 10),
      archive: false,
    };
    setClients((prev) => [newClient, ...prev]);
    setShowForm(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 shrink-0 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative" style={{ minWidth: 150, maxWidth: 280, flex: "1 1 200px" }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#00365A] transition-colors"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="ml-auto flex items-center gap-2 bg-[#00365A] text-white text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-[#004d80] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} />
            Ajouter un client
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-sm cursor-pointer transition-colors ${
                filter === id
                  ? "bg-[#00365A] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-sm font-semibold ${
                filter === id ? "bg-white/20 text-white" : "bg-white text-gray-500"
              }`}>
                {filterCounts[id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Localisation</th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Chantiers</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-12 text-sm">
                    Aucun client correspondant.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const name = clientDisplayName(c);
                  const sub = clientSubtitle(c);
                  const loc = clientLocalisation(c);
                  const activite = clientDerniereActivite(c);
                  const enCours = c.chantiers.filter((ch) => ch.statut === "en_cours").length;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className="border-b border-gray-50 cursor-pointer hover:bg-blue-50/40 transition-colors"
                    >
                      {/* Client */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-sm flex items-center justify-center shrink-0 ${
                            c.type === "societe" ? "bg-indigo-100" : "bg-gray-100"
                          }`}>
                            {c.type === "societe"
                              ? <Building2 size={12} className="text-indigo-500" />
                              : <User size={12} className="text-gray-500" />
                            }
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{name}</p>
                            {sub && <p className="text-xs text-gray-400">{sub}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {c.email && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-gray-600">{c.email}</span>
                              <CopyBtn value={c.email} icon="mail" />
                            </div>
                          )}
                          {c.telephone && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-500">{c.telephone}</span>
                              <CopyBtn value={c.telephone} icon="phone" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Localisation */}
                      <td className="px-4 py-3 text-gray-500 text-xs">{loc}</td>

                      {/* Chantiers */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-gray-700">{c.chantiers.length}</span>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ClientFormModal onClose={() => setShowForm(false)} onSave={handleAdd} />
      )}
    </div>
  );
}
