import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import { API_BASE } from "../config";
import { FaClock, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";

/* ── Status colour map (only 3 status colours on the calendar) ── */
const STATUS_COLOR = {
  planned:     { bg: "#fef9c3", border: "#ca8a04", text: "#854d0e" },
  in_progress: { bg: "#a7c9f6", border: "#3b82f6", text: "#1e40af" },
  completed:   { bg: "#dcfce7", border: "#16a34a", text: "#14532d" },
};
const MILESTONE_COLOR = { bg: "#fef3c7", border: "#f59e0b", text: "#78350f" };
const ACHIEVED_COLOR  = { bg: "#f3f4f6", border: "#9ca3af", text: "#9ca3af" };
const DEFAULT_COLOR   = { bg: "#f3f4f6", border: "#9ca3af", text: "#374151" };

const STATUS_LABEL = {
  planned:     "Pending",
  in_progress: "Active",
  completed:   "Completed",
};

/* ── Helpers ───────────────────────────────────────────────────── */

/** Parse "YYYY-MM-DD" as a local midnight date (no UTC shift) */
const parseLocal = (str) => {
  if (!str) return new Date();
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Add one day to a "YYYY-MM-DD" string (FullCalendar end is exclusive) */
const addOneDay = (dateStr) => {
  if (!dateStr) return dateStr;
  const d = parseLocal(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

/** How many days have passed since dateStr */
const daysSince = (dateStr) => {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - parseLocal(dateStr).getTime()) / 86_400_000);
};

/** How many days until dateStr */
const daysUntil = (dateStr) => {
  if (!dateStr) return 9999;
  return Math.ceil((parseLocal(dateStr).getTime() - Date.now()) / 86_400_000);
};

/* ═══════════════════════════════════════════════════════════════ */
export default function ActivityCalendar() {
  const navigate = useNavigate();

  const [activities,       setActivities]       = useState([]);
  const [milestoneMarkers, setMilestoneMarkers] = useState([]);
  const [initiatives,      setInitiatives]      = useState([]);
  const [filterInitiative, setFilterInitiative] = useState("");
  const [filterStatus,     setFilterStatus]     = useState("");
  const [filterActivity,   setFilterActivity]   = useState("");
  const [showMilestones,   setShowMilestones]   = useState(true);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);

  /* ── Fetch ───────────────────────────────────────────────────── */
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/dashboard/calendar-activities`).then((r) => {
        if (!r.ok) throw new Error("Failed to load activities");
        return r.json();
      }),
      fetch(`${API_BASE}/milestones/calendar`).then((r) => r.json()).catch(() => []),
      fetch(`${API_BASE}/initiatives/`).then((r) => r.json()).catch(() => []),
    ])
      .then(([acts, mils, inits]) => {
        setActivities(Array.isArray(acts) ? acts : []);
        setMilestoneMarkers(Array.isArray(mils) ? mils : []);
        setInitiatives(Array.isArray(inits) ? inits : []);
      })
      .catch(() => setError("Unable to load calendar data."))
      .finally(() => setLoading(false));
  }, []);

  const TODAY = new Date().toISOString().slice(0, 10);

  /* ── Build FullCalendar events ───────────────────────────────── */
  const fcEvents = useMemo(() => {
    // Activity multi-day events — only 3 status colours, no overdue/no-update tinting
    const actEvents = activities
      .filter((act) => {
        if (!act.start_date) return false;
        if (filterStatus    && act.status          !== filterStatus)    return false;
        if (filterInitiative && String(act.initiative_id) !== filterInitiative) return false;
        if (filterActivity  && String(act.id)      !== filterActivity)  return false;
        return true;
      })
      .map((act) => {
        // Compute flags for tooltip only — no longer affects calendar colour
        const isOverdue =
          act.status !== "completed" && act.end_date && act.end_date < TODAY;
        const hasNoRecentUpdate =
          act.status === "in_progress" &&
          daysSince(act.latest_update_date ?? act.start_date) > 30;

        const c = STATUS_COLOR[act.status] ?? DEFAULT_COLOR;

        return {
          id:              String(act.id),
          title:           act.title,
          start:           act.start_date,
          end:             addOneDay(act.end_date || act.start_date),
          allDay:          true,
          backgroundColor: c.bg,
          borderColor:     c.border,
          textColor:       c.text,
          extendedProps: {
            type:               "activity",
            status:             act.status,
            isOverdue,
            hasNoRecentUpdate,
            city:               act.city,
            state:              act.state,
            initiative:         act.initiative_name,
            latest_update:      act.latest_update_date,
          },
        };
      });

    // Milestone single-day markers
    const milEvents = showMilestones
      ? milestoneMarkers
          .filter(
            (m) => !filterInitiative || String(m.initiative_id) === filterInitiative
          )
          .map((m) => {
            const c = m.is_achieved ? ACHIEVED_COLOR : MILESTONE_COLOR;
            return {
              id:              `ms-${m.id}`,
              title:           `🎯 ${m.title}`,
              start:           m.due_date,
              end:             m.due_date,
              allDay:          true,
              backgroundColor: c.bg,
              borderColor:     c.border,
              textColor:       c.text,
              extendedProps: {
                type:        "milestone",
                activityId:  m.activity_id,
                is_achieved: m.is_achieved,
              },
            };
          })
      : [];

    return [...actEvents, ...milEvents];
  }, [activities, milestoneMarkers, filterInitiative, filterStatus, filterActivity, showMilestones, TODAY]);

  /* ── Sorted activity list for the activity filter dropdown ───── */
  const sortedActivities = useMemo(() =>
    [...activities].sort((a, b) => a.title.localeCompare(b.title)),
  [activities]);

  /* ── Upcoming deadlines (within 30 days, not completed) ──────── */
  const upcomingDeadlines = useMemo(() =>
    activities
      .filter((a) => {
        if (!a.end_date || a.status === "completed") return false;
        const d = daysUntil(a.end_date);
        return d >= 0 && d <= 30;
      })
      .sort((a, b) => a.end_date.localeCompare(b.end_date)),
  [activities]);

  /* ── Overdue activities (past end_date, not completed) ───────── */
  const overdueActivities = useMemo(() =>
    activities
      .filter((a) => a.status !== "completed" && a.end_date && a.end_date < TODAY)
      .sort((a, b) => a.end_date.localeCompare(b.end_date)),
  [activities, TODAY]);

  /* ── No-update alerts (active, no update 30+ days) ───────────── */
  const noUpdateAlerts = useMemo(() =>
    activities.filter(
      (a) => a.status === "in_progress" &&
             daysSince(a.latest_update_date ?? a.start_date) > 30
    ),
  [activities]);

  /* ── Click event → detail page ───────────────────────────────── */
  const handleEventClick = (info) => {
    const p  = info.event.extendedProps;
    const id = p.type === "milestone" ? p.activityId : info.event.id;
    navigate(`/activitydetails/${id}`);
  };

  /* ── Native browser tooltip on hover ────────────────────────── */
  const handleEventDidMount = (info) => {
    const e = info.event;
    const p = e.extendedProps;

    if (p.type === "milestone") {
      info.el.title = `Milestone: ${e.title.replace("🎯 ", "")}${p.is_achieved ? " ✓ Achieved" : ""}`;
      return;
    }

    const lines = [e.title];
    if (p.city)               lines.push(`${p.city}, ${p.state}`);
    if (p.initiative)         lines.push(`Initiative: ${p.initiative}`);
    lines.push(`Status: ${STATUS_LABEL[p.status] ?? p.status}`);
    if (p.isOverdue)          lines.push("⚠ OVERDUE");
    if (p.hasNoRecentUpdate)  lines.push("⚠ No recent progress update");
    info.el.title = lines.join("\n");
  };

  /* ── Render ──────────────────────────────────────────────────── */
  if (loading) return <p className="p-6 text-gray-500">Loading calendar…</p>;

  const activityCount = fcEvents.filter((e) => !String(e.id).startsWith("ms-")).length;

  return (
    <div className="max-w-7xl mx-auto space-y-4 overflow-x-hidden mt-2">

      {/* ── Dark calendar CSS overrides ───────────────────────────── */}
      <style>{`
        /* Grid lines */
        .cal-dark .fc-theme-standard td,
        .cal-dark .fc-theme-standard th {
          border-color: rgba(8, 0, 0, 0.1);
        }
        .cal-dark .fc-theme-standard .fc-scrollgrid {
          border-color: rgba(8, 0, 0, 0.1);
        }

        /* Column header row (Mon / Tue …) */
        .cal-dark .fc-col-header-cell {
          background: rgba(8, 0, 0, 0.1);
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
        }
        .cal-dark .fc-col-header-cell-cushion {
          color: #64748b;
          font-size: 0.68rem;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          text-decoration: none !important;
          padding: 7px 4px;
        }

        /* Day numbers */
        .cal-dark .fc-daygrid-day-number {
          color: #2c394c;
          font-size: 0.78rem;
          text-decoration: none !important;
        }
        /* Off-month days */
        .cal-dark .fc-day-other .fc-daygrid-day-number {
          color: rgba(148,163,184,0.22);
        }

        /* Today cell */
        .cal-dark .fc-day-today {
          background: rgba(99,102,241,0.13) !important;
        }
        .cal-dark .fc-day-today .fc-daygrid-day-number {
          color: #818cf8 !important;
          font-weight: 700;
        }

        /* Toolbar title */
        .cal-dark .fc-toolbar-title {
          color: #1c4f92 !important;
          font-size: 1.1rem !important;
          font-weight: 600;
        }

        /* "N more" link */
        .cal-dark .fc-daygrid-more-link {
          color: #818cf8 !important;
          font-size: 0.7rem;
        }

        /* Hover brightness on events */
        .cal-dark .fc-daygrid-event:hover {
          filter: brightness(1.12);
          cursor: pointer;
        }

        /* List view */
        .cal-dark .fc-list-day-cushion {
          background: rgba(99,102,241,0.18) !important;
        }
        .cal-dark .fc-list-day-text,
        .cal-dark .fc-list-day-side-text {
          color: #94a3b8 !important;
          text-decoration: none !important;
        }
        .cal-dark .fc-list-event:hover td {
          background: rgba(255,255,255,0.04) !important;
        }
        .cal-dark .fc-list-event-title a {
          color: #cbd5e1 !important;
          text-decoration: none !important;
        }
        .cal-dark .fc-list-event-time {
          color: #64748b !important;
        }
        .cal-dark .fc-list-empty-cushion {
          color: #64748b;
        }
        .cal-dark .fc-list-table td {
          border-color: rgba(255,255,255,0.06) !important;
        }

        /* Popover (+more events overlay) */
        .cal-dark .fc-popover {
          background: #1e2d42 !important;
          border-color: rgba(255,255,255,0.1) !important;
          box-shadow: 0 12px 32px rgba(0,0,0,0.5) !important;
          border-radius: 10px !important;
        }
        .cal-dark .fc-popover-header {
          background: rgba(255,255,255,0.06) !important;
          border-radius: 10px 10px 0 0 !important;
        }
        .cal-dark .fc-popover-title {
          color: #e2e8f0 !important;
          font-size: 0.8rem;
        }
        .cal-dark .fc-popover-close {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }
        .cal-dark .fc-popover-body {
          padding: 8px !important;
        }
      `}</style>

      <h1 className="text-2xl font-bold">Activity Calendar</h1>

      {error && <p className="text-red-600">{error}</p>}

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="planned">Pending</option>
          <option value="in_progress">Active</option>
          <option value="completed">Completed</option>
        </select>

        {/* Initiative filter */}
        <select
          value={filterInitiative}
          onChange={(e) => setFilterInitiative(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Initiatives</option>
          {initiatives.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>

        {/* Activity filter */}
        <select
          value={filterActivity}
          onChange={(e) => setFilterActivity(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs"
        >
          <option value="">All Activities</option>
          {sortedActivities.map((a) => (
            <option key={a.id} value={String(a.id)}>{a.title}</option>
          ))}
        </select>

        {/* Milestone toggle */}
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showMilestones}
            onChange={(e) => setShowMilestones(e.target.checked)}
            className="rounded accent-amber-500"
          />
          Show milestones
        </label>

        {/* Active filter chips */}
        {(filterStatus || filterInitiative || filterActivity) && (
          <div className="flex flex-wrap gap-1.5">
            {filterStatus && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                {STATUS_LABEL[filterStatus]}
                <button onClick={() => setFilterStatus("")} className="hover:text-indigo-900 ml-0.5">
                  <FaTimesCircle size={10} />
                </button>
              </span>
            )}
            {filterInitiative && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                {initiatives.find(i => String(i.id) === filterInitiative)?.name ?? "Initiative"}
                <button onClick={() => setFilterInitiative("")} className="hover:text-indigo-900 ml-0.5">
                  <FaTimesCircle size={10} />
                </button>
              </span>
            )}
            {filterActivity && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                {sortedActivities.find(a => String(a.id) === filterActivity)?.title ?? "Activity"}
                <button onClick={() => setFilterActivity("")} className="hover:text-indigo-900 ml-0.5">
                  <FaTimesCircle size={10} />
                </button>
              </span>
            )}
          </div>
        )}

        <span className="text-sm text-gray-600 ml-auto">
          {activityCount} activit{activityCount === 1 ? "y" : "ies"}
          {showMilestones && milestoneMarkers.length > 0 &&
            ` · ${milestoneMarkers.length} milestone${milestoneMarkers.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {/* ── Legend ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <span key={key}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium"
            style={{ backgroundColor: STATUS_COLOR[key].bg, color: STATUS_COLOR[key].text }}
          >
            {label}
          </span>
        ))}
        {showMilestones && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium"
            style={{ backgroundColor: MILESTONE_COLOR.bg, color: MILESTONE_COLOR.text }}
          >
            🎯 Milestone
          </span>
        )}
        <span className="self-center text-gray-500 italic ml-1">· Click any event to view details</span>
      </div>

      {/* ── Calendar ─────────────────────────────────────────────── */}
      <div
        className="cal-dark rounded-xl shadow-2xl p-4 ring-1 ring-white/5"
        style={{
          height: "99vh",
          background: "linear-gradient(160deg, #faf7f6 0%, #faf7f6 100%)",
          /* FullCalendar CSS tokens 45577e 3c4a69 2f3b54 */ 
          "--fc-border-color":               "rgba(255,255,255,0.07)",
          "--fc-page-bg-color":              "transparent",
          "--fc-today-bg-color":             "rgba(99,102,241,0.13)",
          "--fc-neutral-bg-color":           "rgba(255,255,255,0.04)",
          "--fc-list-event-hover-bg-color":  "rgba(255,255,255,0.04)",
          "--fc-button-bg-color":            "#4f46e5",
          "--fc-button-active-bg-color":     "#4338ca",
          "--fc-button-hover-bg-color":      "#4338ca",
          "--fc-button-border-color":        "#4338ca",
          "--fc-button-hover-border-color":  "#4338ca",
          "--fc-button-active-border-color": "#3730a3",
        }}
      >
        <FullCalendar
          plugins={[dayGridPlugin, listPlugin]}
          initialView="dayGridMonth"
          height="100%"
          headerToolbar={{
            left:   "prev,next today",
            center: "title",
            right:  "dayGridMonth,listMonth",
          }}
          buttonText={{
            today: "Today",
            month: "Month",
            list:  "List",
          }}
          events={fcEvents}
          eventClick={handleEventClick}
          eventDidMount={handleEventDidMount}
          eventDisplay="block"
          fixedWeekCount={false}
          dayMaxEvents={3}
          moreLinkClick="popover"
          noEventsContent="No activities in this date range."
        />
      </div>

      {/* ── Info panels ──────────────────────────────────────────── */}
      {(upcomingDeadlines.length > 0 || overdueActivities.length > 0 || noUpdateAlerts.length > 0) && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center gap-2 mb-3">
                <FaClock className="text-indigo-500" size={13} />
                <h3 className="font-semibold text-sm text-gray-800">
                  Upcoming Deadlines
                  <span className="ml-1.5 text-xs font-normal text-gray-400">(next 30 days)</span>
                </h3>
              </div>
              <ul className="space-y-1">
                {upcomingDeadlines.map((a) => {
                  const d = daysUntil(a.end_date);
                  const urgency =
                    d <= 7  ? "text-red-600 font-semibold" :
                    d <= 14 ? "text-orange-500 font-semibold" :
                              "text-gray-500";
                  return (
                    <li
                      key={a.id}
                      onClick={() => navigate(`/activitydetails/${a.id}`)}
                      className="flex items-center justify-between text-sm py-1.5 border-b last:border-0 cursor-pointer hover:bg-gray-50 rounded px-1 transition"
                    >
                      <span className="truncate text-gray-800">{a.title}</span>
                      <span className={`ml-3 text-xs whitespace-nowrap ${urgency}`}>
                        {d === 0 ? "Today" : d === 1 ? "Tomorrow" : `${d}d`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Overdue Activities */}
          {overdueActivities.length > 0 && (
            <div className="bg-red-50 rounded-xl shadow p-5 border border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <FaTimesCircle className="text-red-500" size={13} />
                <h3 className="font-semibold text-sm text-red-800">
                  Overdue Activities
                  <span className="ml-1.5 text-xs font-normal text-red-400">({overdueActivities.length})</span>
                </h3>
              </div>
              <ul className="space-y-1">
                {overdueActivities.map((a) => {
                  const daysLate = daysSince(a.end_date);
                  return (
                    <li
                      key={a.id}
                      onClick={() => navigate(`/activitydetails/${a.id}`)}
                      className="flex items-center justify-between text-sm py-1.5 border-b border-red-100 last:border-0 cursor-pointer hover:bg-red-100 rounded px-1 transition"
                    >
                      <span className="truncate text-gray-800">{a.title}</span>
                      <span className="ml-3 text-xs text-red-600 font-semibold whitespace-nowrap">
                        {daysLate}d late
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* No Update in 30+ Days */}
          {noUpdateAlerts.length > 0 && (
            <div className="bg-orange-50 rounded-xl shadow p-5 border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <FaExclamationTriangle className="text-orange-500" size={13} />
                <h3 className="font-semibold text-sm text-orange-800">No Update in 30+ Days</h3>
              </div>
              <ul className="space-y-1">
                {noUpdateAlerts.map((a) => (
                  <li
                    key={a.id}
                    onClick={() => navigate(`/activitydetails/${a.id}`)}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-orange-100 last:border-0 cursor-pointer hover:bg-orange-100 rounded px-1 transition"
                  >
                    <span className="truncate text-gray-800">{a.title}</span>
                    <span className="ml-3 text-xs text-orange-600 whitespace-nowrap">
                      {daysSince(a.latest_update_date ?? a.start_date)}d ago
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
