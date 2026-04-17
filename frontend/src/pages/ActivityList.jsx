import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import { FaEye, FaClipboardCheck, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";

export default function ActivityList({ accessToken }) {
  const navigate = useNavigate();
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken]
  );

  const [activities, setActivities] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");


  // Add this helper function inside the component (or outside if you prefer)
  const getStatusDisplay = (status) => {
    const map = {
      planned: { text: "Pending", color: "bg-yellow-100 text-yellow-800" },
      in_progress: { text: "Active", color: "bg-blue-100 text-blue-800" },
      completed: { text: "Completed", color: "bg-green-100 text-green-800" },
    };
  
    return (
      map[status] || {
        text: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/activities/`, { headers }).then(r => {
        if (!r.ok) throw new Error("Failed to fetch activities");
        return r.json();
      }),
      fetch(`${API_BASE}/misc/activity-types`, { headers }).then(r => r.json()),
    ])
      .then(([acts, types]) => {
        setActivities(acts);
        setActivityTypes(types);
      })
      .catch(err => {
        console.error(err);
        setError("Unable to load activities");
      })
      .finally(() => setLoading(false));
  }, [headers]);

  const filteredActivities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activities.filter((act) => {
      const matchesSearch = !q || (
        act.title?.toLowerCase().includes(q) ||
        act.description?.toLowerCase().includes(q) ||
        act.status?.toLowerCase().includes(q) ||
        act.location?.city?.toLowerCase().includes(q) ||
        act.location?.county?.toLowerCase().includes(q) ||
        act.location?.state?.toLowerCase().includes(q) ||
        act.start_date?.toLowerCase().includes(q) ||
        act.end_date?.toLowerCase().includes(q)
      );
      const matchesStatus = !filterStatus || act.status === filterStatus;
      const matchesType = !filterType || act.activity_type_id === Number(filterType);
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [activities, search, filterStatus, filterType]);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/activities/export`, { headers });
      if (!res.ok) throw new Error("Export failed");
      const allData = await res.json();

      // Respect current filters by matching IDs already visible in the table
      const filteredIds = new Set(filteredActivities.map(a => a.id));
      const rows = allData.filter(row => filteredIds.has(row.id));

      const wsData = [
        [
          "Title", "Activity Type", "Status", "Initiative",
          "Start Date", "End Date", "City", "County", "State",
          "Primary Audience", "Education Level", "Partnership Type",
          "Funding Source", "Funding Source Type", "Funding Amount ($)",
          "Lead Staff", "Description", "Deliverables", "Intended Outcomes",
          "Evidence / Data Sources", "Sustainability Plan", "Notes",
        ],
        ...rows.map(r => [
          r.title,
          r.activity_type,
          r.status,
          r.initiative,
          r.start_date,
          r.end_date,
          r.city,
          r.county,
          r.state,
          r.primary_audience,
          r.education_level,
          r.partnership_type,
          r.funding_source,
          r.funding_source_type,
          r.funding_amount ?? "",
          r.lead_staff ?? "",
          r.description,
          r.deliverables,
          r.intended_outcomes,
          r.evidence,
          r.sustainability_plan,
          r.notes,
        ]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Auto-width columns based on content
      const colWidths = wsData[0].map((_, colIdx) =>
        Math.min(60, Math.max(12, ...wsData.map(row => String(row[colIdx] ?? "").length)))
      );
      ws["!cols"] = colWidths.map(w => ({ wch: w }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Activities");

      const filename = `CREAD_Activities_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error(err);
      setError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 mt-6">
      <h1 className="text-2xl font-bold">Activities</h1>

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-gray-600">Loading...</p>}

      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, location, date…"
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="planned">Pending</option>
          <option value="in_progress">Active</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Activity Types</option>
          {activityTypes.map(t => (
            <option key={t.id} value={t.id}>{t.activityType_name}</option>
          ))}
        </select>
        <button
          onClick={handleExport}
          disabled={exporting || filteredActivities.length === 0}
          className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
        >
          <FaFileExcel size={14} />
          {exporting ? "Exporting…" : `Export (${filteredActivities.length})`}
        </button>
      </div>

      {/* Desktop Table View - hidden on mobile */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Activity</th>
              <th className="p-4">Location</th>
              <th className="p-4">Status</th>
              <th className="p-4">Dates</th>
              <th className="p-4">View Details</th>
            </tr>
          </thead>
          <tbody>
            {/* {activities.map(act => ( */}
            {filteredActivities.map(act => (
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
                  {act.location
                    ? `${act.location.city}, ${act.location.county}, ${act.location.state}`
                    : "N/A"}
                </td>
                {/* <td className="p-4 capitalize text-xs">{act.status}</td> */}
                <td className="p-4">
                    <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        getStatusDisplay(act.status).color
                        }`}
                    >
                        {getStatusDisplay(act.status).text}
                    </span>
                </td>
                <td className="p-4 text-xs">
                  {act.start_date} → {act.end_date}
                </td>
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
            {/* {activities.length === 0 && !loading && ( */}
            {filteredActivities.length === 0 && !loading && (    
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  No activities found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - hidden on desktop */}
      <div className="md:hidden space-y-4">
        {filteredActivities.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-8">
            No activities found
          </div>
        )}

        {filteredActivities.map(act => (
          <div
            key={act.id}
            className="bg-white rounded-xl shadow p-5 space-y-4 hover:shadow-lg transition"
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 text-blue-500 mt-1">
                <FaClipboardCheck size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">{act.title}</h3>
                {act.description && (
                  <p className="text-xs text-gray-600 mt-1">
                    {act.description.slice(0, 150)}…
                  </p>
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
                  {act.location
                    ? `${act.location.city}, ${act.location.state}`
                    : "N/A"}
                </p>
              </div>
              {/* <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium capitalize text-xs">{act.status}</p>
              </div> */}
              <div>
                <p className="text-gray-500">Status</p>
                <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    getStatusDisplay(act.status).color
                    }`}
                >
                    {getStatusDisplay(act.status).text}
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Dates</p>
                <p className="font-medium text-xs">
                  {act.start_date} → {act.end_date}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}