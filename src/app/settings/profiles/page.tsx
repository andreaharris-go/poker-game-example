"use client";

import { useState, useCallback } from "react";
import type { HeaderProfile } from "@/lib/api/client";
import {
  getProfiles,
  saveProfile,
  deleteProfile,
  getActiveProfileId,
  setActiveProfileId,
} from "@/lib/storage/profiles";

function emptyProfile(): HeaderProfile {
  return {
    id: crypto.randomUUID(),
    name: "",
    vendorId: "",
    providerId: "",
    userId: "",
    adminKey: "",
  };
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<HeaderProfile[]>(() =>
    getProfiles(),
  );
  const [activeId, setActiveId] = useState<string | null>(() =>
    getActiveProfileId(),
  );
  const [editing, setEditing] = useState<HeaderProfile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const reload = useCallback(() => {
    setProfiles(getProfiles());
    setActiveId(getActiveProfileId());
  }, []);

  const handleSave = useCallback(() => {
    if (!editing || !editing.name.trim()) return;
    saveProfile(editing);
    setEditing(null);
    reload();
  }, [editing, reload]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteProfile(id);
      setConfirmDelete(null);
      reload();
    },
    [reload],
  );

  const handleSetActive = useCallback(
    (id: string) => {
      setActiveProfileId(id);
      reload();
    },
    [reload],
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Header Profiles</h1>

      {/* Profile list */}
      <div className="mb-6 space-y-2">
        {profiles.map((p) => (
          <div
            key={p.id}
            className={`rounded-lg border p-4 ${
              p.id === activeId
                ? "border-blue-500 bg-gray-800"
                : "border-gray-700 bg-gray-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-white">{p.name}</h3>
                {p.id === activeId && (
                  <span className="rounded bg-blue-900 px-2 py-0.5 text-xs text-blue-300">
                    Active
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {p.id !== activeId && (
                  <button
                    type="button"
                    onClick={() => handleSetActive(p.id)}
                    className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                  >
                    Set Active
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditing({ ...p })}
                  className="rounded bg-gray-600 px-3 py-1 text-xs text-gray-200 hover:bg-gray-500"
                >
                  Edit
                </button>
                {confirmDelete === p.id ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="rounded bg-gray-600 px-3 py-1 text-xs text-gray-200 hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(p.id)}
                    className="rounded bg-red-900 px-3 py-1 text-xs text-red-200 hover:bg-red-800"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
              <span>vendor: {p.vendorId}</span>
              <span>provider: {p.providerId}</span>
              <span>user: {p.userId || "—"}</span>
              <span>admin: {p.adminKey ? "••••" : "—"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit form */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h2 className="mb-4 text-lg font-semibold text-white">
          {editing ? "Edit Profile" : "New Profile"}
        </h2>
        <div className="space-y-3">
          {(
            [
              ["name", "Profile Name"],
              ["vendorId", "Vendor ID"],
              ["providerId", "Provider ID"],
              ["userId", "User ID"],
              ["adminKey", "Admin Key"],
            ] as const
          ).map(([field, label]) => (
            <div key={field}>
              <label className="mb-1 block text-xs text-gray-400">
                {label}
              </label>
              <input
                type="text"
                value={(editing ?? emptyProfile())[field]}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditing((prev) => {
                    const base = prev ?? emptyProfile();
                    return { ...base, [field]: val };
                  });
                }}
                className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!editing?.name?.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Save
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-500"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
