type Account = {
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export function getAccountPresentation(account: Account | null) {
  const metadata = account?.user_metadata;
  const fullName = [metadata?.full_name, metadata?.name]
    .find(
      (value): value is string =>
        typeof value === "string" && Boolean(value.trim()),
    )
    ?.trim();
  const firstName =
    typeof metadata?.first_name === "string"
      ? metadata.first_name.trim()
      : fullName?.split(/\s+/)[0];
  const displayName = fullName || account?.email || "Mon compte";
  const words = (fullName || account?.email?.split("@")[0] || "")
    .split(/\s+/)
    .filter(Boolean);
  const initials =
    words.length > 1
      ? `${words[0][0]}${words.at(-1)![0]}`.toUpperCase()
      : words[0]?.slice(0, 2).toUpperCase() || "—";

  return { displayName, firstName, initials };
}

export function getPageHeader(pathname: string, firstName?: string) {
  if (pathname === "/dashboard") {
    return {
      title: firstName ? `Bonjour ${firstName}` : "Bonjour",
      subtitle: "Voici les éléments à surveiller aujourd'hui.",
    };
  }
  if (pathname === "/routine/parametres") {
    return {
      title: "Personnalisation de la routine",
      subtitle: "Paramètres › Routine quotidienne",
    };
  }
  if (pathname.startsWith("/routine")) {
    return { title: "Routine du jour", subtitle: "Checklist quotidienne" };
  }
  if (["/clients", "/prospection", "/statistiques"].includes(pathname)) {
    return { title: "Clients & prospects" };
  }
  if (
    [
      "/finances",
      "/tresorerie",
      "/charges-fixes",
      "/marges",
      "/remboursements-pe",
    ].includes(pathname)
  ) {
    return { title: "Finances" };
  }
  if (pathname.startsWith("/chantiers")) return { title: "Chantiers" };
  if (pathname === "/parametres") {
    return { title: "Paramètres", subtitle: "Configuration de l'application" };
  }
  const titles: Record<string, string> = {
    "/devis": "Devis",
    "/planning": "Planning",
    "/generation-bdc": "Génération BDC",
    "/sous-traitants": "Sous-traitants",
    "/contrat-sous-traitant": "Contrat sous-traitant",
  };
  return { title: titles[pathname] ?? "SENO Rénovation" };
}
