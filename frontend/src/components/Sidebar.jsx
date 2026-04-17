import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

/* ── Group definitions ────────────────────────────────────────────── */
const GROUPS = [
  {
    key: "overview",
    label: "Overview",
    links: [
      { to: "/home",          label: "Home" },
      { to: "/activitylist",  label: "Activity List" },
      { to: "/calendar",      label: "Calendar" },
      { to: "/visualizations",label: "Visualizations" },
    ],
  },
  {
    key: "activities",
    label: "Activities +",
    links: [
      { to: "/activity-types", label: "Activity Types" },
      { to: "/activities",     label: "Add Activities" },
      { to: "/association",    label: "Associate Activities" },
    ],
  },
  {
    key: "reference",
    label: "Reference Data",
    links: [
      { to: "/partnership-types",   label: "Partnership Types" },
      { to: "/stakeholders",        label: "Stakeholders" },
      { to: "/funding-sources",     label: "Funding Sources" },
      { to: "/education-levels",    label: "Education Levels" },
      { to: "/cultural-wealth-tags",label: "Cultural Wealth Tags" },
      { to: "/strategic-goals",     label: "Strategic Goals" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    adminOnly: true,
    links: [
      { to: "/admin/users",  label: "Add User" },
      { to: "/initiatives",  label: "Manage Initiatives" },
    ],
  },
];

/* ── Component ────────────────────────────────────────────────────── */
export default function Sidebar({ isAdmin, onSignOut, initialOpen = false }) {
  const [open,        setOpen]        = useState(initialOpen);
  const [activeGroup, setActiveGroup] = useState(null);   // accordion: one open at a time
  const [expandAll,   setExpandAll]   = useState(false);  // override: all open
  const panelRef = useRef(null);

  const baseLink   = "block w-full text-left px-3 py-1.5 rounded-lg hover:bg-gray-200 text-[12px] transition";
  const activeLink = "bg-blue-600 text-white hover:bg-blue-600 hover:text-gray-300";

  /* ── Outside click + Escape ─────────────────────────────────────── */
  useEffect(() => {
    function handleOutside(e) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    function handleEsc(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown",  handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown",    handleEsc);
    return () => {
      document.removeEventListener("mousedown",  handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown",    handleEsc);
    };
  }, [open]);

  /* ── Helpers ────────────────────────────────────────────────────── */
  const isGroupOpen = (key) => expandAll || activeGroup === key;

  const toggleGroup = (key) => {
    if (expandAll) {
      // collapse all-expanded mode → open only the clicked group
      setExpandAll(false);
      setActiveGroup(key);
    } else {
      // accordion: open clicked, close others (click again to close)
      setActiveGroup(prev => (prev === key ? null : key));
    }
  };

  const handleExpandAll = (checked) => {
    setExpandAll(checked);
    if (!checked) setActiveGroup(null);
  };

  const visibleGroups = GROUPS.filter(g => !g.adminOnly || isAdmin);

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <>
      {/* Hamburger toggle (visible when sidebar is closed) */}
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

      {/* Overlay + panel */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-10" />

          <aside
            ref={panelRef}
            className="relative w-60 bg-white shadow-xl h-full flex flex-col"
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
          >
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 shrink-0">
              <NavLink
                to="/home"
                onClick={() => setOpen(false)}
                className="text-lg font-bold text-gray-800 hover:text-indigo-600 transition"
              >
                Activity Tracker
              </NavLink>
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

            {/* ── Expand-all checkbox ──────────────────────────────── */}
            <div className="px-4 py-2.5 border-b border-gray-100 shrink-0">
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={expandAll}
                  onChange={e => handleExpandAll(e.target.checked)}
                  className="rounded accent-blue-600"
                />
                Expand all sections
              </label>
            </div>

            {/* ── Scrollable nav ───────────────────────────────────── */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
              {visibleGroups.map(group => (
                <div key={group.key} className="mb-1">

                  {/* Group header button */}
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11.5px] font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 hover:text-gray-600 transition"
                  >
                    <span>{group.label}</span>
                    {isGroupOpen(group.key)
                      ? <FaChevronDown size={9} />
                      : <FaChevronRight size={9} />
                    }
                  </button>

                  {/* Group links (animated-ish via conditional render) */}
                  {isGroupOpen(group.key) && (
                    <div className="ml-2 mt-0.5 pl-2 border-l-2 font-semibold border-blue-100 space-y-0.5">
                      {group.links.map(link => (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          // onClick={() => setOpen(false)}
                          className={({ isActive }) =>
                            `${baseLink} ${isActive ? activeLink : "text-gray-700"}`
                          }
                        >
                          {link.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* ── Sign Out ─────────────────────────────────────────── */}
            <div className="px-4 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={onSignOut}
                className="w-full bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
