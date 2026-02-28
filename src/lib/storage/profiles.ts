"use client";

import type { HeaderProfile } from "@/lib/api/client";

const PROFILES_KEY = "poker-api-profiles";
const ACTIVE_PROFILE_KEY = "poker-api-active-profile";

export function getDefaultProfile(): HeaderProfile {
  return {
    id: "default",
    name: "Default",
    vendorId:
      process.env.NEXT_PUBLIC_DEFAULT_VENDOR_ID ?? "demoVendor",
    providerId:
      process.env.NEXT_PUBLIC_DEFAULT_PROVIDER_ID ?? "demoProvider",
    userId: process.env.NEXT_PUBLIC_DEFAULT_USER_ID ?? "user-1",
    adminKey:
      process.env.NEXT_PUBLIC_DEFAULT_ADMIN_KEY ?? "dev-admin-key",
  };
}

export function getProfiles(): HeaderProfile[] {
  if (typeof window === "undefined") return [getDefaultProfile()];
  const raw = localStorage.getItem(PROFILES_KEY);
  if (!raw) {
    const defaults = [getDefaultProfile()];
    localStorage.setItem(PROFILES_KEY, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(raw) as HeaderProfile[];
}

export function saveProfile(profile: HeaderProfile): void {
  const profiles = getProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function deleteProfile(id: string): void {
  const profiles = getProfiles().filter((p) => p.id !== id);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  if (getActiveProfileId() === id) {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
}

export function getActiveProfileId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function setActiveProfileId(id: string): void {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}
