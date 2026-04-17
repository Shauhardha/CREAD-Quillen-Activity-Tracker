import { useEffect, useState, useMemo } from "react";
import { API_BASE } from "../config";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis,
} from "recharts";
import { FaEye, FaClipboardCheck, FaUsers } from "react-icons/fa";
import { BsCheck2Circle } from "react-icons/bs";
import { GoPulse } from "react-icons/go";
import { AiOutlineFundProjectionScreen } from "react-icons/ai";
import { SlLocationPin } from "react-icons/sl";
import { MdOutlinePendingActions } from "react-icons/md";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl       from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl     from "leaflet/dist/images/marker-shadow.png";

/* ── Leaflet default-icon fix ──────────────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

/* ── Palette ───────────────────────────────────────────────────── */
const COLORS = [
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

/* ── Section heading component ─────────────────────────────────── */
function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow p-6 ${className}`}>
      <h2 className="text-base font-semibold text-gray-800 leading-snug">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function Visualizations() {
  const [summary,            setSummary]            = useState({});
  const [monthlyTrend,       setMonthlyTrend]       = useState([]);
  const [fundingBySource,    setFundingBySource]    = useState([]);
  const [initiativeProgress, setInitiativeProgress] = useState([]);
  const [culturalWealth,     setCulturalWealth]     = useState([]);
  const [updateFrequency,    setUpdateFrequency]    = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);

  /* ── Map state ───────────────────────────────────────────────── */
  const [activitiesMap,  setActivitiesMap]  = useState([]);
  const [stakeholders,   setStakeholders]   = useState([]);
  const [showActivities, setShowActivities] = useState(true);
  const [mapLoading,     setMapLoading]     = useState(true);

  /* ── Fetch all chart data in parallel ───────────────────────── */
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/dashboard/activity-status-summary`).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/dashboard/monthly-trend`          ).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/dashboard/funding-by-source`      ).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/dashboard/initiative-progress`    ).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/dashboard/cultural-wealth-frequency`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/dashboard/update-frequency`       ).then(r => r.json()).catch(() => []),
    ])
      .then(([sum, trend, funding, inits, cw, updates]) => {
        setSummary(sum ?? {});
        setMonthlyTrend(
          Array.isArray(trend)
            ? trend.map(r => ({ ...r, label: fmtMonth(r.month) }))
            : []
        );
        setFundingBySource(Array.isArray(funding) ? funding : []);
        setInitiativeProgress(Array.isArray(inits) ? inits : []);
        setCulturalWealth(Array.isArray(cw) ? cw : []);
        setUpdateFrequency(
          Array.isArray(updates)
            ? updates.map(r => ({ ...r, label: fmtMonth(r.month) }))
            : []
        );
      })
      .catch(() => setError("Unable to load visualization data."))
      .finally(() => setLoading(false));
  }, []);

  /* ── Fetch map data separately (doesn't block charts) ───────── */
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/dashboard/activities`  ).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/dashboard/stakeholders`).then(r => r.json()).catch(() => []),
    ]).then(([acts, stks]) => {
      setActivitiesMap(Array.isArray(acts) ? acts : []);
      setStakeholders(Array.isArray(stks) ? stks : []);
    }).finally(() => setMapLoading(false));
  }, []);

  /* ── Derived data ────────────────────────────────────────────── */

  const statusDonutData = [
    { name: "Pending",   value: Number(summary.planned     ?? 0), color: "#fab70c" },
    { name: "Active",    value: Number(summary.in_progress ?? 0), color: "#0a59da" },
    { name: "Completed", value: Number(summary.completed   ?? 0), color: "#22c55e" },
  ].filter(d => d.value > 0);

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const r   = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x   = cx + r * Math.cos(-midAngle * RADIAN);
    const y   = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  // Activity pipeline (funnel) — Planned → Active → Completed
  const pipelineData = [
    { name: "Planned",   value: Number(summary.planned     ?? 0), color: "#fab70c" },
    { name: "Active",    value: Number(summary.in_progress ?? 0), color: "#0a59da" },
    { name: "Completed", value: Number(summary.completed   ?? 0), color: "#22c55e" },
  ];
  const maxPipelineVal = Math.max(...pipelineData.map(d => d.value), 1);

  // Initiative completion % — sorted highest first
  const initiativeCompletion = useMemo(() =>
    [...initiativeProgress]
      .map(i => ({
        ...i,
        total: Number(i.total),
        completed: Number(i.completed),
        pct: Number(i.total) > 0 ? Math.round((Number(i.completed) / Number(i.total)) * 100) : 0,
      }))
      .sort((a, b) => b.pct - a.pct),
  [initiativeProgress]);

  // Only show scatter if at least one source has a recorded funding amount
  const hasFundingAmounts = fundingBySource.some(f => Number(f.total_amount) > 0);

  // Scatter data — convert strings to numbers
  const scatterData = useMemo(() =>
    fundingBySource.map(f => ({
      ...f,
      count:        Number(f.count),
      total_amount: Number(f.total_amount),
    })),
  [fundingBySource]);

  /* ── Empty-state helper ──────────────────────────────────────── */
  const Empty = ({ msg = "No data yet." }) => (
    <p className="text-sm text-gray-400 italic py-6 text-center">{msg}</p>
  );

  const initBarHeight = Math.max(140, initiativeProgress.length * 48);

  const formatInitiativeName = (name) => {
    if (name === "Center for Rural Education and Development") return "CREAD";
    if (name === "Quillen Chair of Excellence in Teaching and Learning") return "Quillen";
    return name;
  };

  /* ── Render ──────────────────────────────────────────────────── */
  if (loading) return <p className="p-6 text-gray-500">Loading visualizations…</p>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 overflow-x-hidden mt-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Visualizations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Analytics and insights across all CREAD activities
        </p>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

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

      {/* ── Charts Row 2: Type Bar + Initiative Stacked Bar ──── */}
      <div className="mb-6">
        {/* Initiative Progress Stacked Bar */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Progress by Initiative</h2>
          <p className="text-xs text-gray-400 mb-3">Activity counts stacked by status per initiative</p>
          {initiativeProgress.length === 0 ? (
            <p className="text-sm text-gray-500">No initiative data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={initBarHeight}>
              <BarChart
                data={initiativeProgress}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="initiative_name"
                  type="category"
                  width={80}
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatInitiativeName}
                />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="planned"     stackId="a" fill="#fab70c" name="Pending"   />
                <Bar dataKey="in_progress" stackId="a" fill="#0a59da" name="Active"    />
                <Bar dataKey="completed"   stackId="a" fill="#22c55e" name="Completed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* ══ ROW 1: Funding Breakdown + Activity Pipeline ═════════ */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Status Distribution Donut */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Activity Status Distribution</h2>
        <p className="text-xs text-gray-400 mb-3">Breakdown of all projects by current status</p>
        {statusDonutData.length === 0 ? (
          <p className="text-sm text-gray-500">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusDonutData}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {statusDonutData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

        {/* 2 ── Activity Pipeline / Completion Funnel */}
        <ChartCard
          title="Activity Pipeline"
          subtitle="How activities are distributed across lifecycle stages"
        >
          <div className="space-y-4 pt-2">
            {pipelineData.map((stage) => {
              const widthPct = Math.round((stage.value / maxPipelineVal) * 100);
              return (
                <div key={stage.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{stage.name}</span>
                    <span className="font-bold tabular-nums" style={{ color: stage.color }}>
                      {stage.value}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-9">
                    <div
                      className="h-9 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                      style={{
                        width: `${Math.max(widthPct, 6)}%`,
                        backgroundColor: stage.color,
                      }}
                    >
                      {widthPct > 12 && (
                        <span className="text-white text-xs font-semibold">
                          {widthPct}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

      </div>

      {/* ══ ROW 2: Monthly Activity Trend (full width) ═══════════ */}
      <ChartCard
        title="Monthly Activity Trend"
        subtitle="Number of activities started each month — shows organisational growth (last 24 months)"
      >
        {monthlyTrend.length === 0 ? (
          <Empty msg="No dated activities yet." />
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={monthlyTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, "Activities started"]} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#trendFill)"
                dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ══ ROW 3: Cultural Wealth Radar + Initiative Completion ═ */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* 3 ── Cultural Wealth Radar */}
        <ChartCard
          title="Cultural Wealth Capital Frequency"
          subtitle="Which of CREAD's 6 capitals are most represented across all activities"
        >
          {culturalWealth.length === 0 ? (
            <Empty msg="No cultural wealth tags linked yet. Use Associate Activities to tag activities." />
          ) : (
            <ResponsiveContainer width="100%" height={290}>
              <RadarChart
                data={culturalWealth}
                margin={{ top: 15, right: 40, bottom: 15, left: 40 }}
              >
                <PolarGrid gridType="polygon" stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="tag"
                  tick={{ fontSize: 11, fill: "#4b5563" }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, "auto"]}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickCount={4}
                />
                <Radar
                  name="Activities"
                  dataKey="count"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
                />
                <Tooltip formatter={(v) => [v, "Activities tagged"]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* 4 ── Initiative Completion % Bars (pure CSS — no library needed) */}
        <ChartCard
          title="Initiative Completion"
          subtitle="Percentage of activities completed per initiative, sorted highest first"
        >
          {initiativeCompletion.length === 0 ? (
            <Empty msg="No initiative data yet." />
          ) : (
            <div className="space-y-4 pt-1">
              {initiativeCompletion.map((init) => {
                const barColor =
                  init.pct === 100 ? "#22c55e" :
                  init.pct >= 50  ? "#3b82f6" :
                                    "#f59e0b";
                return (
                  <div key={init.initiative_name}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm text-gray-700 truncate pr-3 leading-tight">
                        {init.initiative_name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400 tabular-nums">
                          {init.completed}/{init.total}
                        </span>
                        <span
                          className="text-sm font-bold tabular-nums w-10 text-right"
                          style={{ color: barColor }}
                        >
                          {init.pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${init.pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>

      </div>

      {/* ── Funding by Source (only rendered when data exists) ── */}
      {fundingBySource.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Funding by Source</h2>
          <p className="text-xs text-gray-400 mb-4">Activity count and total dollar amount per funding source</p>
          <div className="grid md:grid-cols-2 gap-6">

            {/* Count donut */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 text-center">Activity Count</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={fundingBySource}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {fundingBySource.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} activities`, n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Amount bar */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 text-center">Total Funding ($)</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={fundingBySource}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }}
                    tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                  <YAxis dataKey="source" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => [`$${Number(v).toLocaleString()}`, "Total Funding"]}
                  />
                  <Bar dataKey="total_amount" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Total ($)">
                    {fundingBySource.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      )}

      {/* ══ ROW 4: Progress Update Frequency (full width) ════════ */}
      <div className="grid md:grid-cols-2 gap-6">  
        <ChartCard
          title="Funding Breakdown"
          subtitle="Activity count split by funding source"
        >
          {fundingBySource.length === 0 ? (
            <Empty msg="No funding sources assigned yet. Edit activities to add funding sources." />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={fundingBySource}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {fundingBySource.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} activit${v === 1 ? "y" : "ies"}`, n]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      
        {updateFrequency.length > 0 && (
          <ChartCard
            title="Progress Update Activity"
            subtitle="How frequently progress updates are logged each month — a proxy for team engagement"
          >
            <ResponsiveContainer width="100%" height={210}>
              <BarChart
                data={updateFrequency}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, "Updates logged"]} />
                <Bar dataKey="count" name="Updates" fill="#8b5cf6" radius={[3, 3, 0, 0]}>
                  {updateFrequency.map((_, i) => (
                    <Cell
                      key={i}
                      fill={`hsl(${258 - i * 4}, 72%, ${58 + i * 1.5}%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* ══ ROW 5: Funding vs. Activity Volume Scatter ═══════════ */}
      {hasFundingAmounts && (
        <ChartCard
          title="Funding vs. Activity Volume"
          subtitle="Which funding sources generate the most activities relative to their dollar investment"
        >
          <ResponsiveContainer width="100%" height={270}>
            <ScatterChart margin={{ top: 10, right: 30, bottom: 30, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="count"
                name="Activities"
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                label={{
                  value: "Number of Activities",
                  position: "insideBottom",
                  offset: -16,
                  fontSize: 11,
                  fill: "#9ca3af",
                }}
              />
              <YAxis
                dataKey="total_amount"
                name="Total Funding"
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` :
                  v >= 1_000     ? `$${(v / 1_000).toFixed(0)}k`     :
                                   `$${v}`
                }
                label={{
                  value: "Total Funding ($)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  fontSize: 11,
                  fill: "#9ca3af",
                }}
              />
              <ZAxis range={[70, 70]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-xs">
                      <p className="font-semibold text-gray-800 mb-1">{d.source}</p>
                      <p className="text-gray-600">
                        Activities: <span className="font-medium text-gray-800">{d.count}</span>
                      </p>
                      <p className="text-gray-600">
                        Total funding:{" "}
                        <span className="font-medium text-gray-800">
                          ${Number(d.total_amount).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData} fill="#6366f1" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ══ Service Areas Map ════════════════════════════════════ */}
      <style>{`
        .leaflet-container { z-index: 10; }
        .leaflet-top, .leaflet-bottom { z-index: 20 !important; }
        .leaflet-container img { max-width: none !important; max-height: none !important; }
      `}</style>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Service Areas Map</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Geographic distribution of {showActivities ? "activities" : "stakeholders"} across the region
            </p>
          </div>
          <button
            onClick={() => setShowActivities(p => !p)}
            className="bg-blue-700 text-sm text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition shrink-0"
          >
            Show {showActivities ? "Stakeholders" : "Activities"}
          </button>
        </div>

        {mapLoading ? (
          <p className="text-sm text-gray-400 italic py-4 text-center">Loading map data…</p>
        ) : (
          <div className="rounded-xl overflow-hidden">
            <MapContainer
              center={[36.3134, -82.3535]}
              zoom={8}
              style={{ height: "500px", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
              />
              {(showActivities ? activitiesMap : stakeholders).map(item => {
                const lat = item.latitude;
                const lon = item.longitude;
                if (!lat || !lon) return null;
                return (
                  <Marker key={item.id} position={[lat, lon]}>
                    <Popup>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{showActivities ? item.title : item.name}</p>
                        {showActivities && item.description && (
                          <p>{item.description.slice(0, 100)}…</p>
                        )}
                        <p className="text-gray-500">
                          {item.city}, {item.county}, {item.state}
                        </p>
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
  );
}
