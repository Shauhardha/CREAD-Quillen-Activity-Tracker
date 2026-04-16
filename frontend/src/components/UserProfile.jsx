import { useEffect, useRef, useState } from "react";
import { fetchUserAttributes, updatePassword } from "aws-amplify/auth";
import {
  FaUser, FaKey, FaEye, FaEyeSlash, FaCheckCircle, FaEnvelope, FaShieldAlt, FaSignOutAlt,
} from "react-icons/fa";

export default function UserProfile({ groups = [], onSignOut }) {
  const [open,        setOpen]        = useState(false);
  const [attrs,       setAttrs]       = useState(null);
  const [showPwForm,  setShowPwForm]  = useState(false);

  /* password-change form */
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,        setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [pwLoading,   setPwLoading]   = useState(false);
  const [pwError,     setPwError]     = useState(null);
  const [pwSuccess,   setPwSuccess]   = useState(false);

  const panelRef = useRef(null);

  /* ── Fetch Cognito user attributes once ─────────────────────── */
  useEffect(() => {
    fetchUserAttributes().then(setAttrs).catch(() => {});
  }, []);

  /* ── Close panel on outside click / Escape ───────────────────── */
  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    function handleEsc(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown",   handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown",   handleEsc);
    };
  }, [open]);

  /* ── Derived display values ──────────────────────────────────── */
  const email    = attrs?.email      ?? "";
  const fullName = attrs?.name       ?? `${attrs?.given_name ?? ""} ${attrs?.family_name ?? ""}`.trim();
  const initials = fullName
    ? fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  const isAdmin = groups.includes("admin");
  const role    = isAdmin ? "Admin" : "Staff";

  /* ── Password-change handler ─────────────────────────────────── */
  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError(null);
    if (newPw !== confirmPw) { setPwError("New passwords do not match."); return; }
    if (newPw.length < 8)   { setPwError("Password must be at least 8 characters."); return; }

    setPwLoading(true);
    try {
      await updatePassword({ oldPassword: currentPw, newPassword: newPw });
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => { setPwSuccess(false); setShowPwForm(false); }, 2500);
    } catch (err) {
      setPwError(err?.message ?? "Failed to update password.");
    } finally {
      setPwLoading(false);
    }
  }

  function togglePwForm() {
    setShowPwForm(f => !f);
    setPwError(null);
    setPwSuccess(false);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  }

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="fixed top-4 right-5 z-40" ref={panelRef}>

      {/* ── Avatar button ──────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Your profile"
        className={`
          w-9 h-9 rounded-full flex items-center justify-center
          text-sm font-bold text-white shadow-lg
          ring-2 ring-white/70 transition-all duration-150
          ${open ? "bg-indigo-700 scale-95" : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105"}
        `}
      >
        {initials || <FaUser size={14} />}
      </button>

      {/* ── Dropdown card ──────────────────────────────────────── */}
      {open && (
        <div
          className="absolute right-0 top-11 w-76 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ width: 288 }}
        >

          {/* Header gradient */}
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 px-5 py-4">
            <div className="flex items-center gap-3">
              {/* Large avatar */}
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-base font-bold shrink-0 ring-2 ring-white/30">
                {initials || <FaUser size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                {fullName && (
                  <p className="font-semibold text-white text-sm truncate leading-tight">
                    {fullName}
                  </p>
                )}
                <p className="text-indigo-200 text-xs truncate">{email}</p>
                <span
                  className={`
                    inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold
                    ${isAdmin
                      ? "bg-amber-400 text-amber-900"
                      : "bg-white/20 text-white"}
                  `}
                >
                  {role}
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">

            {/* Detail rows */}
            <div className="space-y-2">
              {email && (
                <div className="flex items-center gap-2.5 text-xs">
                  <FaEnvelope className="text-gray-300 shrink-0" size={11} />
                  <span className="text-gray-400 w-12 shrink-0">Email</span>
                  <span className="text-gray-700 truncate">{email}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-xs">
                <FaShieldAlt className="text-gray-300 shrink-0" size={11} />
                <span className="text-gray-400 w-12 shrink-0">Role</span>
                <span className="text-gray-700">{role}</span>
              </div>
              {attrs?.sub && (
                <div className="flex items-center gap-2.5 text-xs">
                  <FaUser className="text-gray-300 shrink-0" size={11} />
                  <span className="text-gray-400 w-12 shrink-0">ID</span>
                  <span className="font-mono text-gray-400 truncate text-[10px]">{attrs.sub}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Change password toggle */}
            <button
              onClick={togglePwForm}
              className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              <FaKey size={11} />
              {showPwForm ? "Cancel password change" : "Change password"}
            </button>

            {/* Password form */}
            {showPwForm && (
              <form onSubmit={handlePasswordChange} className="space-y-2.5">

                {/* Current password */}
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    placeholder="Current password"
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-9
                               focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrent ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                  </button>
                </div>

                {/* New password */}
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="New password (min 8 chars)"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    required
                    minLength={8}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-9
                               focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                  </button>
                </div>

                {/* Confirm new password */}
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                />

                {/* Strength hint row */}
                {newPw.length > 0 && (
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor:
                            newPw.length >= 12 ? "#22c55e" :
                            newPw.length >= 10 ? "#84cc16" :
                            newPw.length >= 8  ? "#f59e0b" :
                                                 "#e5e7eb",
                          opacity: i < Math.min(Math.floor(newPw.length / 3), 4) ? 1 : 0.25,
                        }}
                      />
                    ))}
                    <span className="text-[10px] text-gray-400 ml-1 whitespace-nowrap">
                      {newPw.length >= 12 ? "Strong" :
                       newPw.length >= 10 ? "Good"   :
                       newPw.length >= 8  ? "Fair"   : "Weak"}
                    </span>
                  </div>
                )}

                {/* Error / success */}
                {pwError && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">{pwError}</p>
                )}
                {pwSuccess && (
                  <p className="text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <FaCheckCircle size={11} /> Password updated successfully!
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white
                             py-2 rounded-lg text-sm font-semibold
                             disabled:opacity-50 transition"
                >
                  {pwLoading ? "Updating…" : "Update Password"}
                </button>
              </form>
            )}
            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Sign Out */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="flex items-center gap-2 w-full text-sm font-semibold text-red-500 hover:text-red-700 transition"
              >
                <FaSignOutAlt size={15} />
                Sign Out
              </button>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
