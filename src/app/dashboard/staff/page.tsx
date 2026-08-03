"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, X, Eye, EyeOff, UserCheck, UserX, KeyRound } from "lucide-react";
import {
  fetchStaff,
  createStaff,
  updateStaff,
  updateStaffStatus,
  resetStaffPassword,
  StaffMember,
} from "@/lib/admin-api";

// ─── Create Modal ─────────────────────────────────────────────────────────────
function CreateStaffModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (s: StaffMember) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const staff = await createStaff({ name, email, password });
      onCreated(staff);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create staff member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Create Staff Account</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="staff@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 pr-10"
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-600 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Staff
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({
  staff,
  onClose,
}: {
  staff: StaffMember;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetStaffPassword(staff._id, password);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Reset Password</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
        <p className="text-sm text-zinc-500 mb-4">Setting new password for <strong>{staff.name}</strong></p>

        {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
        {success && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">Password updated!</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 pr-10"
              placeholder="New password (min 6 chars)"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancel</button>
            <button type="submit" disabled={loading || success} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStaff();
      setStaff(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleToggleStatus = async (member: StaffMember) => {
    setTogglingId(member._id);
    try {
      const isActive = !(member.isActive ?? true);
      const updated = await updateStaffStatus(member._id, isActive);
      setStaff((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
            Staff Management
          </span>
          <nav className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-1" aria-label="Breadcrumb">
            <span>Home</span><span>/</span><span className="font-medium">Staff</span>
          </nav>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-md">
        {staff.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 dark:text-zinc-500">
            <p className="text-lg font-medium">No staff members yet</p>
            <p className="text-sm mt-1">Click &ldquo;Add Staff&rdquo; to create an account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-red-600 text-xs font-semibold uppercase tracking-wider text-white">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Login</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {staff.map((member) => {
                  const active = member.isActive !== false;
                  return (
                    <tr key={member._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30">
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                        {member.name}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">{member.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            active
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-zinc-400"}`} />
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs">
                        {member.lastLoginAt ? formatDate(member.lastLoginAt) : "Never"}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs">
                        {formatDate(member.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(member)}
                            disabled={togglingId === member._id}
                            title={active ? "Deactivate" : "Activate"}
                            className={`p-1.5 rounded-lg transition-colors ${
                              active
                                ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                            } disabled:opacity-50`}
                          >
                            {togglingId === member._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setResetTarget(member)}
                            title="Reset Password"
                            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateStaffModal
          onClose={() => setShowCreate(false)}
          onCreated={(s) => setStaff((prev) => [s, ...prev])}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          staff={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}
