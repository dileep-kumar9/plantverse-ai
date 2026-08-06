"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import {
  Edit3,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import PageIntro from "@/components/shared/PageIntro";
import { useCollection } from "@/hooks/useCollection";
import type { Plant } from "@/types/app";

type PlantForm = {
  name: string;
  localName: string;
  scientificName: string;
  place: string;
  health: number;
  icon: string;
  notes: string;
};

const emptyForm: PlantForm = {
  name: "",
  localName: "",
  scientificName: "",
  place: "",
  health: 100,
  icon: "🪴",
  notes: "",
};

const plantIcons = [
  "🪴",
  "🌿",
  "🌱",
  "🌵",
  "🌳",
  "🌴",
  "🌾",
  "🍅",
  "🌶️",
  "🥭",
  "🌹",
  "🌻",
];

const inputClass =
  "mt-2 min-h-12 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-green-600/10";

function clampHealth(value: number) {
  return Math.max(0, Math.min(100, value));
}

function formFromPlant(plant: Plant): PlantForm {
  return {
    name: plant.name,
    localName: plant.localName ?? "",
    scientificName: plant.scientificName ?? "",
    place: plant.place,
    health: clampHealth(Number(plant.health)),
    icon: plant.icon || "🪴",
    notes: plant.notes ?? "",
  };
}

export default function PlantsPage() {
  const {
    items: plants,
    loading,
    error,
    mutationError,
    creating,
    updatingId,
    deletingId,
    create,
    update,
    remove,
    reload,
    clearError,
  } = useCollection<Plant>("plants");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] =
    useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<Plant | null>(null);
  const [form, setForm] =
    useState<PlantForm>(emptyForm);
  const [formError, setFormError] = useState("");

  const isEditing = editingId !== null;
  const saving = creating || updatingId === editingId;

  const sortedPlants = useMemo(
    () =>
      [...plants].sort((first, second) => {
        const firstDate =
          first.updatedAt ?? first.createdAt ?? "";
        const secondDate =
          second.updatedAt ?? second.createdAt ?? "";

        return secondDate.localeCompare(firstDate);
      }),
    [plants],
  );

  function openCreate() {
    clearError();
    setFormError("");
    setEditingId(null);
    setForm(emptyForm);
    setEditorOpen(true);
  }

  function openEdit(plant: Plant) {
    clearError();
    setFormError("");
    setEditingId(plant.id);
    setForm(formFromPlant(plant));
    setEditorOpen(true);

    window.requestAnimationFrame(() => {
      document
        .getElementById("plant-editor")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  }

  function closeEditor() {
    if (saving) return;

    setEditorOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  }

  async function savePlant(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const name = form.name.trim();
    const place = form.place.trim();

    if (name.length < 2) {
      setFormError(
        "Enter a plant name with at least 2 characters.",
      );
      return;
    }

    if (place.length < 2) {
      setFormError(
        "Enter where the plant is growing.",
      );
      return;
    }

    const payload = {
      name,
      localName: form.localName.trim(),
      scientificName: form.scientificName.trim(),
      place,
      health: clampHealth(Number(form.health)),
      icon: form.icon.trim() || "🪴",
      notes: form.notes.trim(),
    };

    setFormError("");
    clearError();

    try {
      if (editingId) {
        await update(editingId, payload);
      } else {
        await create(payload);
      }

      closeEditor();
    } catch {
      // The hook exposes the request error in mutationError.
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    clearError();

    try {
      await remove(deleteTarget.id);
      setDeleteTarget(null);

      if (editingId === deleteTarget.id) {
        closeEditor();
      }
    } catch {
      // The hook exposes the request error in mutationError.
    }
  }

  return (
    <main className="page-wrap">
      <PageIntro
        eyebrow="Your garden"
        title="My Plants"
        description="Private plant profiles with health, notes and growing location, stored under your signed-in account."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="voice-button"
          >
            <Plus size={17} />
            Add plant
          </button>
        }
      />

      {editorOpen ? (
        <form
          id="plant-editor"
          onSubmit={savePlant}
          className="dashboard-panel mt-5 scroll-mt-24"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">
                {isEditing ? "Update plant" : "New plant"}
              </p>

              <h2 className="mt-1 text-xl font-semibold sm:text-2xl">
                {isEditing
                  ? "Edit plant profile"
                  : "Add a plant profile"}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeEditor}
              disabled={saving}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--border-color)] transition hover:bg-[var(--surface-secondary)] disabled:opacity-50"
              aria-label="Close plant form"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Plant name
              <input
                required
                maxLength={120}
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className={inputClass}
                placeholder="Example: Tomato"
              />
            </label>

            <label className="text-sm font-medium">
              Local name
              <input
                maxLength={120}
                value={form.localName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    localName: event.target.value,
                  }))
                }
                className={inputClass}
                placeholder="Optional"
              />
            </label>

            <label className="text-sm font-medium">
              Scientific name
              <input
                maxLength={160}
                value={form.scientificName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scientificName:
                      event.target.value,
                  }))
                }
                className={inputClass}
                placeholder="Optional"
              />
            </label>

            <label className="text-sm font-medium">
              Growing location
              <input
                required
                maxLength={120}
                value={form.place}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    place: event.target.value,
                  }))
                }
                className={inputClass}
                placeholder="Terrace, field, pot…"
              />
            </label>

            <div className="sm:col-span-2">
              <span className="text-sm font-medium">
                Plant icon
              </span>

              <div className="mt-2 flex flex-wrap gap-2">
                {plantIcons.map((icon) => {
                  const selected = form.icon === icon;

                  return (
                    <button
                      key={icon}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          icon,
                        }))
                      }
                      className={`grid h-11 w-11 place-items-center rounded-2xl border text-xl transition ${
                        selected
                          ? "border-green-600 bg-green-50 ring-2 ring-green-600/10 dark:bg-green-500/10"
                          : "border-[var(--border-color)] bg-[var(--surface-secondary)] hover:border-[var(--brand-primary)]"
                      }`}
                      aria-label={`Use ${icon} icon`}
                      aria-pressed={selected}
                    >
                      {icon}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="text-sm font-medium sm:col-span-2">
              Health score: {form.health}%
              <input
                type="range"
                min="0"
                max="100"
                value={form.health}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    health: Number(event.target.value),
                  }))
                }
                className="mt-3 w-full accent-green-600"
              />
            </label>

            <label className="text-sm font-medium sm:col-span-2">
              Notes
              <textarea
                value={form.notes}
                maxLength={1500}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                rows={3}
                className={`${inputClass} py-3`}
                placeholder="Care notes, symptoms or follow-up details…"
              />
            </label>
          </div>

          {formError ? (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
            >
              {formError}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              disabled={saving}
              className="voice-button disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Save plant"}
            </button>

            <button
              type="button"
              onClick={closeEditor}
              disabled={saving}
              className="outline-button disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {error || mutationError ? (
        <div
          role="alert"
          className="mt-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{mutationError ?? error}</span>

          <button
            type="button"
            onClick={() => void reload()}
            className="font-semibold underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="dashboard-panel mt-6">
          Loading plants…
        </div>
      ) : null}

      {!loading &&
      !error &&
      !mutationError &&
      !plants.length ? (
        <div className="dashboard-panel mt-6 py-10 text-center sm:py-12">
          <div className="text-4xl">🪴</div>

          <h2 className="mt-3 text-xl font-semibold">
            Add your first plant
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            Your plant list is stored privately under your
            signed-in account and can be loaded across devices.
          </p>

          <button
            type="button"
            onClick={openCreate}
            className="voice-button mt-5"
          >
            <Plus size={17} />
            Add plant
          </button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sortedPlants.map((plant) => {
          const deleting = deletingId === plant.id;
          const updating = updatingId === plant.id;

          return (
            <article
              key={plant.id}
              className="feature-card relative p-4 sm:p-5"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--surface-secondary)] text-3xl sm:h-16 sm:w-16"
                  aria-hidden="true"
                >
                  {plant.icon || "🪴"}
                </div>

                <div className="min-w-0 flex-1 pr-16">
                  <h2 className="truncate text-lg font-semibold sm:text-xl">
                    {plant.localName || plant.name}
                  </h2>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {plant.name} · {plant.place}
                  </p>

                  {plant.scientificName ? (
                    <p className="mt-1 truncate text-xs italic text-[var(--text-tertiary)]">
                      {plant.scientificName}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="absolute right-3 top-3 flex gap-1 sm:right-4 sm:top-4">
                <button
                  type="button"
                  onClick={() => openEdit(plant)}
                  disabled={deleting || updating}
                  className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border-color)] bg-[var(--surface-primary)] text-[var(--brand-primary)] transition hover:bg-[var(--surface-secondary)] disabled:opacity-50"
                  aria-label={`Edit ${plant.name}`}
                >
                  <Edit3 size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(plant)}
                  disabled={deleting || updating}
                  className="grid h-9 w-9 place-items-center rounded-full border border-red-200 bg-[var(--surface-primary)] text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                  aria-label={`Delete ${plant.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                <div
                  className="h-full rounded-full bg-[var(--brand-primary)]"
                  style={{
                    width: `${clampHealth(
                      Number(plant.health),
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-[var(--brand-primary)]">
                  Health {clampHealth(Number(plant.health))}%
                </span>

                {updating ? (
                  <span className="text-xs text-[var(--text-secondary)]">
                    Updating…
                  </span>
                ) : null}

                {deleting ? (
                  <span className="text-xs text-red-600">
                    Deleting…
                  </span>
                ) : null}
              </div>

              {plant.notes ? (
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {plant.notes}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-plant-title"
            className="w-full max-w-md rounded-3xl border border-[var(--border-color)] bg-[var(--surface-primary)] p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10">
                <Trash2 size={21} />
              </div>

              <div>
                <h2
                  id="delete-plant-title"
                  className="text-xl font-semibold"
                >
                  Delete this plant?
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  <strong>{deleteTarget.name}</strong> will be
                  removed from My Plants. This action cannot be
                  undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId === deleteTarget.id}
                className="outline-button disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={deletingId === deleteTarget.id}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={16} />
                {deletingId === deleteTarget.id
                  ? "Deleting…"
                  : "Delete plant"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
