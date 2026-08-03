"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, Check } from "lucide-react";
import { useAuth } from "@/context/AdminAuthContext";
import { useRouter } from "next/navigation";

const poppinsFont = { fontFamily: "var(--font-inter)" };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (user && user.role === "staff") {
        router.push("/dashboard/kitchen");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden" style={poppinsFont}>
      <Image
        src="/images/background.png"
        alt=""
        fill
        className="object-cover z-0"
        priority
        sizes="100vw"
      />
      <div className="absolute bottom-0 left-0 right-0 z-0" style={{ height: "45vh", maxHeight: "45vh" }}>
        <Image
          src="/images/wave.svg"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8">
          <div className="text-center mb-6">
            <Image
              src="/images/logo.svg"
              alt="QuickCrave"
              width={150}
              height={150}
              className="mx-auto mb-4"
              priority
            />
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2" style={poppinsFont}>
              Welcome Back
            </h1>
            <p className="text-sm text-zinc-600" style={poppinsFont}>
              Login to your account to continue
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center" style={poppinsFont}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" style={poppinsFont}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" strokeWidth={2} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-orange)] focus:border-transparent bg-white text-zinc-900 placeholder-zinc-400 text-base"
                  placeholder="your@example.com"
                  disabled={isLoading}
                  style={poppinsFont}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" strokeWidth={2} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-orange)] focus:border-transparent bg-white text-zinc-900 placeholder-zinc-400 text-base"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  style={poppinsFont}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={2} /> : <Eye className="w-5 h-5" strokeWidth={2} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-[var(--brand-orange)] focus:ring-2 focus:ring-[var(--brand-orange)] focus:ring-offset-2 cursor-pointer"
                disabled={isLoading}
              />
              <label htmlFor="rememberMe" className="ml-2 text-xs font-medium text-zinc-600 uppercase tracking-wide cursor-pointer" style={poppinsFont}>
                REMEMBER ME
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg text-white font-semibold text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-orange)] focus:ring-offset-2"
              style={{
                backgroundColor: isLoading ? "var(--brand-orange-hover)" : "var(--brand-orange)",
              }}
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}