"use client";

import { useState, useTransition, useRef } from "react";
import { saveFonnteTokenAction, testFonnteTokenAction } from "./actions";

type Props = {
  settings: Record<string, string>;
};

type Toast = { type: "success" | "error"; message: string; detail?: string };

export default function SettingsClient({ settings }: Props) {
  const [token, setToken] = useState(settings["fonnte_token"] ?? "");
  const [showToken, setShowToken] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [testing, startTest] = useTransition();
  const [saving, startSave] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const hasToken = token.trim().length > 0;
  const isSaved = token === (settings["fonnte_token"] ?? "");

  function showToast(t: Toast) {
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  }

  function handleTest() {
    startTest(async () => {
      const result = await testFonnteTokenAction();
      showToast({
        type: result.success ? "success" : "error",
        message: result.message,
        detail: result.device,
      });
    });
  }

  function handleSave(formData: FormData) {
    startSave(async () => {
      const result = await saveFonnteTokenAction(formData);
      showToast({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    });
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-xl shadow-xl border text-sm max-w-sm transition-all ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <div>
            <p className="font-semibold">{toast.message}</p>
            {toast.detail && <p className="text-xs mt-0.5 opacity-70">{toast.detail}</p>}
          </div>
        </div>
      )}

      {/* Fonnte Section */}
      <section className="bg-white rounded-2xl border border-zinc-100 shadow-[0px_10px_30px_-5px_rgba(147,17,212,0.05)] overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            {/* WhatsApp-style icon */}
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-emerald-500" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-headline text-zinc-900">Fonnte WhatsApp Integration</h2>
            <p className="text-sm text-zinc-500">Send automated WhatsApp notifications for registrations and confirmations.</p>
          </div>
          <div className="ml-auto">
            {hasToken && isSaved ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                Not configured
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <form ref={formRef} action={handleSave} className="p-8 space-y-6">
          {/* Info callout */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <span className="material-symbols-outlined text-blue-500 text-lg shrink-0 mt-0.5">info</span>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Fonnte</strong> is an Indonesian WhatsApp gateway service. It requires you to link your own WhatsApp number as a device.</p>
              <p>Get your API token from <a href="https://md.fonnte.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-blue-900">md.fonnte.com</a> → Dashboard → Your Device → Token.</p>
            </div>
          </div>

          {/* Token input */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              API Token
            </label>
            <div className="relative">
              <input
                name="fonnte_token"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your Fonnte device token here…"
                className="w-full pr-12 pl-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-mono transition-all"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                title={showToken ? "Hide token" : "Show token"}
              >
                <span className="material-symbols-outlined text-xl">
                  {showToken ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              This token is stored securely in your database and never exposed to the public.
            </p>
          </div>

          {/* How it works */}
          <div className="bg-zinc-50 rounded-xl p-5 space-y-3 border border-zinc-100">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">How Fonnte Works</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: "phone_android", title: "Link Your Phone", desc: "Connect your WhatsApp number as a device in the Fonnte dashboard." },
                { icon: "vpn_key", title: "Copy the Token", desc: "Each device gets a unique token. Paste it here and save." },
                { icon: "send", title: "Auto-send Messages", desc: "The app will automatically send WA notifications for new registrations and payment confirmations." },
              ].map((item) => (
                <div key={item.title} className="flex flex-col items-center text-center p-3 bg-white rounded-lg border border-zinc-100">
                  <span className="material-symbols-outlined text-primary text-2xl mb-2">{item.icon}</span>
                  <p className="text-xs font-semibold text-zinc-800 mb-1">{item.title}</p>
                  <p className="text-[11px] text-zinc-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !token.trim()}
              className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  Saving…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">save</span>
                  Save Token
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !hasToken || !isSaved}
              className="px-6 py-2.5 bg-zinc-100 text-zinc-700 text-sm font-semibold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              title={!isSaved ? "Save the token first before testing" : ""}
            >
              {testing ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  Testing…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">wifi_tethering</span>
                  Test Connection
                </>
              )}
            </button>
            {!isSaved && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">warning</span>
                Unsaved changes
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Future integrations placeholder */}
      <section className="bg-white rounded-2xl border border-dashed border-zinc-200 p-8 text-center">
        <span className="material-symbols-outlined text-zinc-300 text-4xl mb-3">extension</span>
        <p className="text-sm font-semibold text-zinc-400">More integrations coming soon</p>
        <p className="text-xs text-zinc-400 mt-1">Email (SMTP), payment gateway, and Google Sheets sync.</p>
      </section>
    </div>
  );
}
