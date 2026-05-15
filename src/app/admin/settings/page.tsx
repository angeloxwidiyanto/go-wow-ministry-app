import { apiFetch } from "@/utils/api";
import SettingsClient from "./SettingsClient";

export const revalidate = 0;

type Setting = { key: string; value: string };

export default async function SettingsPage() {
  let settings: Record<string, string> = {};

  try {
    const rows = await apiFetch<Setting[]>("/api/settings");
    rows.forEach((row) => {
      settings[row.key] = row.value ?? "";
    });
  } catch (e) {
    console.error("Failed to fetch settings from Go API:", e);
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-headline text-zinc-900 mb-2">Settings</h1>
        <p className="text-zinc-500 font-body">
          Configure integrations and admin preferences for WoW Ministry.
        </p>
      </div>
      <SettingsClient settings={settings} />
    </div>
  );
}
