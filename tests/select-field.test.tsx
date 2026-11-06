// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SelectField } from "@/shared/components/SelectField";

function ControlledSelect() {
  const [value, setValue] = useState("");
  return (
    <>
      <label htmlFor="client">Client</label>
      <SelectField
        id="client"
        value={value}
        onValueChange={setValue}
        required
        options={[
          { value: "", label: "Sans rattachement" },
          { value: "client-1", label: "Client enregistré" },
          { value: "option:client-2", label: "Autre client" },
          { value: "archived", label: "Client archivé", disabled: true },
        ]}
      />
      <output aria-label="Valeur enregistrée">{value}</output>
    </>
  );
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("SelectField", () => {
  it("opens shadcn options and lets an optional relationship be selected and cleared", async () => {
    render(<ControlledSelect />);
    const trigger = screen.getByRole("combobox", { name: "Client" });
    expect(trigger.textContent).toBe("Sans rattachement");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.click(
      await screen.findByRole("option", { name: "Client enregistré" }),
    );
    expect(trigger.textContent).toBe("Client enregistré");
    expect(screen.getByLabelText("Valeur enregistrée").textContent).toBe(
      "client-1",
    );
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.click(
      await screen.findByRole("option", { name: "Sans rattachement" }),
    );
    expect(trigger.textContent).toBe("Sans rattachement");
    expect(screen.getByLabelText("Valeur enregistrée").textContent).toBe("");
    expect(trigger.getAttribute("aria-required")).toBe("true");
  });

  it("preserves option values and disabled items", async () => {
    render(<ControlledSelect />);
    const trigger = screen.getByRole("combobox", { name: "Client" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(
      (
        await screen.findByRole("option", { name: "Client archivé" })
      ).getAttribute("aria-disabled"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("option", { name: "Autre client" }));
    expect(screen.getByLabelText("Valeur enregistrée").textContent).toBe(
      "option:client-2",
    );
  });

  it("closes with Escape and restores focus to the trigger", async () => {
    render(<ControlledSelect />);
    const trigger = screen.getByRole("combobox", { name: "Client" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const list = await screen.findByRole("listbox");
    fireEvent.keyDown(list, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("keeps a disabled field unavailable", () => {
    render(
      <SelectField
        aria-label="Statut"
        disabled
        value="PENDING"
        onValueChange={vi.fn()}
        options={[{ value: "PENDING", label: "En attente" }]}
      />,
    );
    expect(
      (screen.getByRole("combobox", { name: "Statut" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
