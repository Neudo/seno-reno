// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContratSousTraitantPage } from "@/features/outils/pages/ContratSousTraitantPage";
import { ContractGenerationDialog } from "@/features/outils/subcontracting/ContractGenerationDialog";
import { ContractGenerationForm } from "@/features/outils/subcontracting/ContractGenerationForm";
import type {
  ContractContext,
  ContractSettings,
} from "@/features/outils/subcontracting/contract-data";

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
}));
vi.mock("@/features/auth/context/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "owner" } }),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));
vi.mock(
  "@/features/outils/api/subcontractor-contract-settings-api",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/features/outils/api/subcontractor-contract-settings-api")
    >()),
    getContractSettings: mocks.getSettings,
    saveContractSettings: mocks.saveSettings,
  }),
);
vi.mock("@/features/outils/api/subcontractor-contract-api", () => ({
  getSubcontractorContractReferenceFiles: async () => [],
  getSubcontractorContractReferenceFileUrl: vi.fn(),
  uploadSubcontractorContractReferenceFile: vi.fn(),
}));
vi.mock("@/features/outils/subcontracting/generate-contract-pdfs", () => ({
  generateContractPdfs: mocks.generate,
}));

const context: ContractContext = {
  siteName: "Chantier de test",
  siteAddress: "Adresse du chantier de test",
  serviceDescription: "Pose de menuiseries",
  subcontractor: {
    id: "artisan-test",
    name: "Atelier de test",
    address: "Adresse du siège de test",
    postalCode: "89000",
    city: "Auxerre",
    contactName: "Contact de test",
    email: "",
    phone: "",
    notes: "",
    isArchived: false,
    createdAt: "",
    updatedAt: "",
  },
};

const settings: ContractSettings = {
  principal: {
    name: "Donneur d’ordre de test",
    legalForm: "SARL",
    address: "Adresse donneur de test",
    registryCity: "Auxerre",
    registrationNumber: "RCS-TEST-01",
    capital: "",
  },
  principalRepresentatives: "Représentant de test",
  courtCity: "Sens",
  defaultSignatureCity: "Auxerre",
};

const revokeObjectURL = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSettings.mockResolvedValue(settings);
  mocks.saveSettings.mockImplementation(async (_userId, values) => values);
  mocks.generate.mockResolvedValue([
    {
      kind: "contract",
      filename: "contrat-test.pdf",
      blob: new Blob(["%PDF"], { type: "application/pdf" }),
    },
    {
      kind: "declaration",
      filename: "declaration-test.pdf",
      blob: new Blob(["%PDF"], { type: "application/pdf" }),
    },
  ]);
  let sequence = 0;
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = () => `blob:qa-${++sequence}`;
      static revokeObjectURL = revokeObjectURL;
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mount(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrap = (view: ReactNode) => (
    <QueryClientProvider client={client}>{view}</QueryClientProvider>
  );
  const view = render(wrap(children));
  return (next: ReactNode) => view.rerender(wrap(next));
}

describe("subcontracting contract form", () => {
  it("opens the same form from the chantier card and uses known data without guessing the signatory", async () => {
    mount(<ContractGenerationDialog context={context} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Générer les documents pour Atelier de test",
      }),
    );
    const dialog = within(screen.getByRole("dialog"));
    const address = await dialog.findByLabelText("Adresse du chantier");
    expect((address as HTMLTextAreaElement).value).toBe(context.siteAddress);
    const subcontractor = within(
      dialog.getByRole("region", { name: "Sous-traitant et déclarant" }),
    );
    expect(
      (subcontractor.getByLabelText("Raison sociale") as HTMLInputElement)
        .value,
    ).toBe("Atelier de test");
    expect(
      (
        subcontractor.getByLabelText(
          "Adresse du siège social",
        ) as HTMLTextAreaElement
      ).value,
    ).toBe("Adresse du siège de test, 89000 Auxerre");
    expect(
      (
        subcontractor.getByLabelText(
          "Spécialités ou prestations",
        ) as HTMLTextAreaElement
      ).value,
    ).toBe("Pose de menuiseries");
    expect(
      (subcontractor.getByLabelText("Nom du déclarant") as HTMLInputElement)
        .value,
    ).toBe("");
    expect(dialog.getByText(settings.principal.name)).toBeTruthy();
    expect(dialog.queryByLabelText("Représentant(s) de la société")).toBeNull();
    expect(dialog.queryByLabelText("Ville du tribunal de commerce")).toBeNull();
    expect(
      (dialog.getByLabelText("Lieu de signature") as HTMLInputElement).value,
    ).toBe("Auxerre");
    fireEvent.click(dialog.getByRole("button", { name: "Fermer" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("keeps uploads and saves the reusable principal in Outils without offering PDF generation", async () => {
    const rerender = mount(<ContratSousTraitantPage />);
    const name = await screen.findByLabelText("Raison sociale");
    expect((name as HTMLInputElement).value).toBe(settings.principal.name);
    expect(
      await screen.findAllByRole("button", { name: "Choisir un fichier" }),
    ).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: /Générer les deux PDF/ }),
    ).toBeNull();

    const updated = {
      ...settings,
      principal: { ...settings.principal, name: "Société test modifiée" },
    };
    mocks.saveSettings.mockImplementationOnce(async (_userId, values) => {
      mocks.getSettings.mockResolvedValue(values);
      return values;
    });
    fireEvent.change(name, { target: { value: updated.principal.name } });
    fireEvent.click(
      screen.getByRole("button", { name: "Enregistrer les coordonnées" }),
    );
    expect(await screen.findByText("Coordonnées enregistrées.")).toBeTruthy();
    expect(mocks.saveSettings).toHaveBeenCalledWith("owner", updated);
    rerender(<ContractGenerationForm context={context} />);
    expect(await screen.findByText(updated.principal.name)).toBeTruthy();
    expect(screen.queryByLabelText("Représentant(s) de la société")).toBeNull();
  });

  it("directs the user to Outils when no principal has been configured", async () => {
    mocks.getSettings.mockResolvedValue(null);
    mount(<ContractGenerationForm context={context} />);
    const link = await screen.findByRole("link", {
      name: "Renseigner les coordonnées",
    });
    expect(link.getAttribute("href")).toBe("/contrat-sous-traitant");
    expect(
      screen.queryByRole("button", { name: /Générer les deux PDF/ }),
    ).toBeNull();
  });

  it("blocks generation with missing fields and exposes two downloads after a valid submission", async () => {
    mount(<ContractGenerationForm context={context} />);
    const form = await screen.findByRole<HTMLFormElement>("form");
    fireEvent.submit(form);
    await waitFor(() =>
      expect(
        screen.getByLabelText("Numéro de contrat").getAttribute("aria-invalid"),
      ).toBe("true"),
    );
    expect(mocks.generate).not.toHaveBeenCalled();

    const values = {
      contractNumber: "C-TEST-01",
      purchaseOrderNumber: "BDC-TEST-02",
      "subcontractor.legalForm": "SAS",
      "subcontractor.registryCity": "Sens",
      "subcontractor.registrationNumber": "RCS-TEST-02",
      declarantFirstName: "Élodie",
      declarantLastName: "Déclarant",
      declarantRole: "Présidente",
      signatureCity: "Joigny",
      signatureDate: "2026-11-05",
    };
    for (const [name, value] of Object.entries(values)) {
      fireEvent.change(form.elements.namedItem(name) as HTMLInputElement, {
        target: { value },
      });
    }
    fireEvent.submit(form);
    const contract = await screen.findByRole("link", {
      name: "Télécharger : Contrat de sous-traitance",
    });
    expect(contract.getAttribute("download")).toBe("contrat-test.pdf");
    expect(
      screen
        .getByRole("link", { name: "Télécharger : Déclaration sur l’honneur" })
        .getAttribute("download"),
    ).toBe("declaration-test.pdf");
    expect(mocks.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        siteAddress: context.siteAddress,
        contractNumber: "C-TEST-01",
        purchaseOrderNumber: "BDC-TEST-02",
        principal: settings.principal,
        principalRepresentatives: settings.principalRepresentatives,
        courtCity: settings.courtCity,
        signatureCity: "Joigny",
      }),
    );
    fireEvent.change(screen.getByLabelText("Numéro de contrat"), {
      target: { value: "C-TEST-03" },
    });
    expect(screen.queryByRole("link", { name: /Télécharger/ })).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
