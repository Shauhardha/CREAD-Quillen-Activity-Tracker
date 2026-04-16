import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import { FaEye, FaClipboardCheck, FaUsers } from "react-icons/fa";
import { BsCheck2Circle } from "react-icons/bs";
import { GoPulse } from "react-icons/go";
import { AiOutlineFundProjectionScreen } from "react-icons/ai";
import { SlLocationPin } from "react-icons/sl";
import { MdOutlinePendingActions } from "react-icons/md";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl        from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl  from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl      from "leaflet/dist/images/marker-shadow.png";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";

/* ── Leaflet default-icon fix ──────────────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

/* ── Chart palette ─────────────────────────────────────────────── */
const CHART_COLORS = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b",
  "#ef4444", "#10b981", "#f97316", "#ec4899",
];

/** Format "YYYY-MM" → "Jan 24" */
const fmtMonth = (str) => {
  if (!str) return str;
  const [y, m] = str.split("-");
  return new Date(Number(y), Number(m) - 1)
    .toLocaleString("default", { month: "short", year: "2-digit" });
};

/* ── Status display helper ─────────────────────────────────────── */
const getStatusDisplay = (status) => {
  const map = {
    planned:     { text: "Pending",   color: "bg-yellow-100 text-yellow-800" },
    in_progress: { text: "Active",    color: "bg-blue-100   text-blue-800"   },
    completed:   { text: "Completed", color: "bg-green-100  text-green-800"  },
  };
  return map[status] || {
    text:  status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
    color: "bg-gray-100 text-gray-800",
  };
};

/* ═══════════════════════════════════════════════════════════════ */
export default function ActivityList({ accessToken }) {
  const navigate = useNavigate();
  const headers  = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken]);

  /* ── State ───────────────────────────────────────────────────── */
  const [activities,         setActivities]         = useState([]);
  const [summary,            setSummary]            = useState({});
  const [countynum,          setCountynum]          = useState({});
  const [stakeholdernum,     setStakeholdernum]     = useState({});
  const [stakeholders,       setStakeholders]       = useState([]);
  const [activitiesMap,      setActivitiesMap]      = useState([]);
  const [showActivities,     setShowActivities]     = useState(true);
  const [typeBreakdown,      setTypeBreakdown]      = useState([]);
  const [initiativeProgress, setInitiativeProgress] = useState([]);
  const [monthlyTrend,       setMonthlyTrend]       = useState([]);
  const [fundingBySource,    setFundingBySource]    = useState([]);
  const [loading,            setLoading]            = useState(false);
  const [error,              setError]              = useState(null);

  /* ── Fetch all dashboard data ────────────────────────────────── */
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/dashboard/stakeholders`,            { headers }).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/dashboard/activity-status-summary`, { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/dashboard/counties-served`,         { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/dashboard/stakeholder-count`,       { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/dashboard/activities`,              { headers }).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/dashboard/activity-type-breakdown`, { headers }).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/dashboard/initiative-progress`,     { headers }).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/dashboard/monthly-trend`,           { headers }).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/dashboard/funding-by-source`,       { headers }).then(r => r.json()).catch(() => []),
    ]).then(([sk, gls, wts, prog, lod, types, inits, trend, funding]) => {
      setStakeholders(sk);
      setSummary(gls          ?? {});
      setCountynum(wts        ?? {});
      setStakeholdernum(prog  ?? {});
      setActivitiesMap(Array.isArray(lod) ? lod : []);
      setTypeBreakdown(Array.isArray(types) ? types : []);
      setInitiativeProgress(Array.isArray(inits) ? inits : []);
      setMonthlyTrend(
        Array.isArray(trend)
          ? trend.map(r => ({ ...r, label: fmtMonth(r.month) }))
          : []
      );
      setFundingBySource(Array.isArray(funding) ? funding : []);
    });
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Recent activities (top 5) ───────────────────────────────── */
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/dashboard/activities`, { headers })
      .then(r => { if (!r.ok) throw new Error("Failed to fetch activities"); return r.json(); })
      .then(data => setActivities(data.slice(0, 5)))
      .catch(() => setError("Unable to load activities"))
      .finally(() => setLoading(false));
  }, [headers]);

  const dataToShow = showActivities ? activitiesMap : stakeholders;
  const typeBarHeight = Math.max(140, typeBreakdown.length * 40);


  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        .leaflet-container { z-index: 10; }
        .leaflet-top, .leaflet-bottom { z-index: 20 !important; }
        .leaflet-container img { max-width: none !important; max-height: none !important; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold">CREAD-Quillen Activity Dashboard</h1>
        <h2 className="text-[15px] mb-6">Track and manage rural health initiatives</h2>

        {error   && <p className="text-red-600">{error}</p>}
        {loading && <p className="text-gray-600">Loading...</p>}

        {/* ── KPI Cards ────────────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">

          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex gap-3 mt-1">
              <div className="flex-shrink-0 mt-1 text-red-600 bg-red-200 rounded-full w-8 h-8 flex items-center justify-center">
                <AiOutlineFundProjectionScreen size={20} />
              </div>
              <div>
                <p className="font-sm text-base">Total Projects</p>
                <p className="text-base font-bold text-gray-600 mt-1">{summary.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex gap-3 mt-1">
              <div className="flex-shrink-0 mt-1 text-purple-700 bg-purple-300 rounded-full w-8 h-8 flex items-center justify-center">
                <SlLocationPin size={20} />
              </div>
              <div>
                <p className="font-sm text-sm">Counties Served</p>
                <p className="text-base font-bold text-gray-600 mt-1">{countynum.counties_served}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex gap-3 mt-1">
              <div className="flex-shrink-0 mt-1 text-orange-900 bg-orange-300 rounded-full w-8 h-8 flex items-center justify-center">
                <FaUsers size={20} />
              </div>
              <div>
                <p className="font-sm text-sm">Total Stakeholders</p>
                <p className="text-base font-bold text-gray-600 mt-1">{stakeholdernum.total_stakeholders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex gap-3 mt-1">
              <div className="flex-shrink-0 mt-1 text-amber-600 bg-yellow-300 rounded-full w-8 h-8 flex items-center justify-center">
                <MdOutlinePendingActions size={20} />
              </div>
              <div>
                <p className="font-sm text-sm">Planned Projects</p>
                <p className="text-base font-bold text-gray-600 mt-1">{summary.planned}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex gap-3 mt-1">
              <div className="flex-shrink-0 mt-1 text-blue-600 bg-blue-200 rounded-full w-8 h-8 flex items-center justify-center">
                <GoPulse size={20} />
              </div>
              <div>
                <p className="font-sm text-sm">Active Projects</p>
                <p className="text-base font-bold text-gray-600 mt-1">{summary.in_progress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex gap-3 mt-1">
              <div className="flex-shrink-0 mt-1 text-green-700 bg-green-300 rounded-full w-8 h-8 flex items-center justify-center">
                <BsCheck2Circle size={20} />
              </div>
              <div>
                <p className="font-sm text-sm">Completed Projects</p>
                <p className="text-base font-bold text-gray-600 mt-1">{summary.completed}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Activity Type Breakdown + Initiative Progress */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* Activity Type Breakdown */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-2">Activities by Type</h2>
            {typeBreakdown.length === 0 ? (
              <p className="text-xs text-gray-500">No data yet.</p>
            ) : (
              <div className="space-y-3 p-1 h-36 overflow-x-auto">
                {(() => {
                  const maxCount = Math.max(...typeBreakdown.map(t => t.count), 1);
                  return typeBreakdown.map(item => (
                    <div key={item.activity_type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 truncate">{item.activity_type}</span>
                        <span className="font-semibold text-gray-900 ml-2">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.round((item.count / maxCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Initiative Progress */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Progress by Initiative</h2>
            {initiativeProgress.length === 0 ? (
              <p className="text-sm text-gray-500">No initiative data yet.</p>
            ) : (
              <div className="h-36 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b">
                      <th className="pb-2 text-left font-medium">Initiative</th>
                      <th className="pb-2 text-center font-medium">Planned</th>
                      <th className="pb-2 text-center font-medium">Active</th>
                      <th className="pb-2 text-center font-medium">Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initiativeProgress.map(row => (
                      <tr key={row.initiative_name} className="border-b last:border-0">
                        <td className="py-2 font-medium text-gray-800 text-xs">{row.initiative_name}</td>
                        <td className="py-2 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">
                            {row.planned}
                          </span>
                        </td>
                        <td className="py-2 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                            {row.in_progress}
                          </span>
                        </td>
                        <td className="py-2 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                            {row.completed}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        

        {/* ── Recent Activities ─────────────────────────────────── */}
        <h2 className="text-[18px] mb-3 font-semibold">Recent Activities</h2>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
          <div className="overflow-y-auto h-[50vh]">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-4">Activity</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Progress Updated</th>
                  <th className="p-4">View Details</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(act => (
                  <tr key={act.id} className="border-b hover:bg-gray-50">
                    <td className="p-5">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 text-blue-500 mt-1">
                          <FaClipboardCheck size={20} />
                        </div>
                        <div>
                          <p className="font-medium">{act.title}</p>
                          {act.description && (
                            <p className="text-xs text-gray-600 mt-1">
                              {act.description.slice(0, 100)}…
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs">
                      {act.location_id ? `${act.city}, ${act.county}, ${act.state}` : "N/A"}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusDisplay(act.status).color}`}>
                        {getStatusDisplay(act.status).text}
                      </span>
                    </td>
                    <td className="p-4 text-xs">{act.latest_update_date || "N/A"}</td>
                    <td className="p-4">
                      <button
                        onClick={() => navigate(`/activitydetails/${act.id}`)}
                        className="text-indigo-600 hover:text-indigo-800 transition"
                        title="View Details"
                      >
                        <FaEye size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
                {activities.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No activities found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {activities.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-8">No activities found</div>
          )}
          {activities.map(act => (
            <div key={act.id} className="bg-white rounded-xl shadow p-5 space-y-4 hover:shadow-lg transition">
              <div className="flex gap-3">
                <div className="flex-shrink-0 text-blue-500 mt-1">
                  <FaClipboardCheck size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base">{act.title}</h3>
                  {act.description && (
                    <p className="text-xs text-gray-600 mt-1">{act.description.slice(0, 150)}…</p>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/activitydetails/${act.id}`)}
                  className="text-indigo-600 hover:text-indigo-800 transition"
                  title="View Details"
                >
                  <FaEye size={24} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium text-xs">
                    {act.location_id ? `${act.city}, ${act.state}` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusDisplay(act.status).color}`}>
                    {getStatusDisplay(act.status).text}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Dates</p>
                  <p className="font-medium text-xs">{act.start_date} → {act.end_date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Map ───────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto space-y-4 mt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-[18px] font-semibold">Service Areas Map</h2>
            <button
              onClick={() => setShowActivities(!showActivities)}
              className="bg-blue-700 text-sm text-white px-4 py-2 rounded hover:bg-blue-800"
            >
              Show {showActivities ? "Stakeholders" : "Activities"}
            </button>
          </div>

          {error   && <p className="text-red-600">{error}</p>}
          {loading ? (
            <p className="text-gray-500">Loading map data...</p>
          ) : (
            <div className="rounded-xl overflow-hidden">
              <MapContainer center={[36.3134, -82.3535]} zoom={8} style={{ height: "500px", width: "100%" }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                />
                {dataToShow.map(item => {
                  const lat = item.latitude;
                  const lon = item.longitude;
                  if (!lat || !lon) return null;
                  return (
                    <Marker key={item.id} position={[lat, lon]}>
                      <Popup>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{showActivities ? item.title : item.name}</p>
                          {showActivities && item.description && (
                            <p>{item.description.slice(0, 100)}...</p>
                          )}
                          <p>Location: {item.city}, {item.county}, {item.state}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
