import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ isAdmin, onSignOut, initialOpen = false }) {
  const [open, setOpen] = useState(initialOpen);
  const baseBtn = "block w-full text-left px-4 py-2 rounded hover:bg-gray-200";
  const active = "bg-blue-600 text-white hover:bg-blue-700";
  const panelRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    function handleEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  return (
    <>
      {/* Toggle button - visible when closed */}
      {!open && (
        <button
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-10 transition-opacity" />

          <aside
            ref={panelRef}
            className="relative w-60 bg-white shadow h-full p-4 transform transition-transform duration-200"
            style={{ willChange: "transform" }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Activity Tracker</h2>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="space-y-1 md:space-y-2 flex-1 text-sm">
              <NavLink to="/home" className={({ isActive }) => `${baseBtn} ${isActive ? active : ""}`}>
                Home
              </NavLink>

              {isAdmin && (
                <NavLink to="/admin/users" className={({ isActive }) => `${baseBtn} ${isActive ? active : ""}`}>
                  Add User
                </NavLink>
              )}

              {isAdmin && (
                <NavLink to="/initiatives" className={({ isActive }) => `${baseBtn} ${isActive ? active : ""}`}>
                  Manage Initiatives
                </NavLink>
              )}

              <NavLink to="/partnership-types" className={({ isActive }) => `${baseBtn} ${isActive ? active : ""}`}>
                Partnership Types
              </NavLink>

              <NavLink to="/stakeholders" className={({ isActive }) => `${baseBtn} ${isActive ? active : ""}`}>
                Stakeholders
              </NavLink>

              <NavLink to="/funding-sources" className={({ isActive }) => `${baseBtn} ${isActive ? active : ""}`}>
                Funding Sources
              </NavLink>

              <NavLink to="/education-levels" className={({ isActive }) => `${baseBtn} ${isActive ? active : ""}`}>
                Education Levels
              </NavLink>

              <NavLink to="/cultural-wealth-tags" className={({ isActive }) => `${baseBtn} ${isActive ? active : ""}`}>
                Cultural Wealth Tags
              </NavLink>

              <NavLink to="/strategic-goals" className={({ isActive }) => `${baseBtn} ${isActive ? active : ""}`}>
                Strategic Goals
              </NavLink>

              <NavLink to="/activities" className={({ isActive }) => `${baseBtn} ${isActive ? active : ""}`}>
                Add Activities
              </NavLink>

              <NavLink to="/association" className={({ isActive }) => `${baseBtn} ${isActive ? active : ""}`}>
                Associate Activities
              </NavLink>

              <NavLink to="/activitylist" className={({ isActive }) => `${baseBtn} ${isActive ? active : ""}`}>
                Activities List
              </NavLink>
            </nav>

            <button onClick={onSignOut} className="mt-10 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
              Sign Out
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
