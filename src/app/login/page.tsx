"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { signInAction } from "./actions";

const initialState = { error: "" };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await signInAction(formData);
      return result ?? initialState;
    },
    initialState
  );

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf5ff] via-white to-[#f0fdf4] flex items-center justify-center p-6">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-purple-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_80px_-20px_rgba(147,11,212,0.15)] border border-white/60 p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="mb-5">
              <Image
                src="/logo.png"
                alt="Wonders of Worship"
                width={180}
                height={50}
                className="w-44 h-auto object-contain"
                priority
              />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-headline font-bold text-zinc-900">
                Welcome back
              </h1>
              <p className="text-sm text-zinc-500 mt-1 font-body">
                Sign in to the Sanctuary Admin Dashboard
              </p>
            </div>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-zinc-600 uppercase tracking-wider"
              >
                Email address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-[20px]">
                  mail
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@wowministry.id"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50/80 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-zinc-600 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-[20px]">
                  lock
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-zinc-50/80 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Error message */}
            {state?.error && (
              <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-100 rounded-xl">
                <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0">
                  error
                </span>
                <p className="text-xs font-medium text-red-600">{state.error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-[0_4px_20px_-4px_rgba(147,11,212,0.4)] hover:shadow-[0_4px_28px_-4px_rgba(147,11,212,0.5)] hover:-translate-y-px active:translate-y-0 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Sign in
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-[11px] text-zinc-400 mt-8 leading-relaxed">
            Don&apos;t have an account? Contact your{" "}
            <span className="font-semibold text-zinc-500">Super Admin</span> to
            get access.
          </p>
        </div>

        {/* Bottom brand */}
        <p className="text-center text-[11px] text-zinc-400 mt-6">
          Wonders of Worship Ministry &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
