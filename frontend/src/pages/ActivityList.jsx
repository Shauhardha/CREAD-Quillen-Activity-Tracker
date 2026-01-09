import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import { FaEye, FaClipboardCheck } from "react-icons/fa";

export default function ActivityList({ accessToken }) {
  const navigate = useNavigate();
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken]
  );

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    fetch(`${API_BASE}/activities/`, { headers })
      .then(r => {
        if (!r.ok) throw new Error("Failed to fetch activities");
        return r.json();
      })
      .then(setActivities)
      .catch(err => {
        console.error(err);
        setError("Unable to load activities");
      })
      .finally(() => setLoading(false));
  }, [headers]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Activities</h1>

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-gray-600">Loading...</p>}

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

      {/* Mobile Card View - hidden on desktop */}
      <div className="md:hidden space-y-4">
        {activities.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-8">
            No activities found
          </div>
        )}

        {activities.map(act => (
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