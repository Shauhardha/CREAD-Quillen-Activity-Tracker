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
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Fix default icon paths
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export default function ActivityList({ accessToken }) {
  const navigate = useNavigate();
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken]
  );

  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState([]);
  const [countynum, setCountynum] = useState([]);
  const [stakeholdernum, setStakeholdernum] = useState([]);
  const [stakeholders, setStakeholders] = useState([]);
  const [activitiesMap, setActivitiesMap] = useState([]);
  const [showActivities, setShowActivities] = useState(true);
  
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
    Promise.all([
      fetch(`${API_BASE}/dashboard/stakeholders`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/dashboard/activity-status-summary`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/dashboard/counties-served`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/dashboard/stakeholder-count`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/dashboard/activities`, { headers }).then(r => r.json()),
    ]).then(([act, gls, wts, prog, lod]) => {
      // console.log("All stakeholders from API:", lod, act); // log full data
      setStakeholders(act);
      setSummary(gls);
      setCountynum(wts);
      setStakeholdernum(prog);
      setActivitiesMap(lod);
    });
  }, []);
 
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/dashboard/activities`, { headers })
        .then(r => {
        if (!r.ok) throw new Error("Failed to fetch activities");
        return r.json();
        })
        .then(data => {
        // console.log("All activities from API:", data); // log full data
        setActivities(data.slice(0, 5)); // 👈 only first 5
        })
        .catch(err => {
        console.error(err);
        setError("Unable to load activities");
        })
        .finally(() => setLoading(false));
    }, [headers]);  

    const dataToShow = showActivities ? activitiesMap : stakeholders;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold">Activity Dashboard</h1>
      <h2 className="text-[15px] mb-6">Track and manage rural health initiatives</h2>

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-gray-600">Loading...</p>}

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex gap-3 mt-1">
            <div className="flex-shrink-0 mt-1 text-red-600 bg-red-200 rounded-full w-8 h-8 flex items-center justify-center">
                <AiOutlineFundProjectionScreen size={20} />
            </div>
            <div>
                <p className="font-sm text-base">Total Projects</p>
                <p className="text-base font-bold text-gray-600 mt-1">
                    {summary.total}
                </p>
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
                <p className="text-base font-bold text-gray-600 mt-1">
                    {countynum.counties_served}
                </p>
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
                <p className="text-base font-bold text-gray-600 mt-1">
                    {stakeholdernum.total_stakeholders}
                </p>
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
                <p className="text-base font-bold text-gray-600 mt-1">
                    {summary.planned}
                </p>
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
                <p className="text-base font-bold text-gray-600 mt-1">
                    {summary.in_progress}
                </p>
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
                <p className="text-base font-bold text-gray-600 mt-1">
                    {summary.completed}
                </p>
            </div>
          </div>
        </div>

       </div>

       <h2 className="text-[18px] mb-3 font-semibold">Recent Activities</h2> 

      {/* Desktop Table View - hidden on mobile */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
        <div className=" overflow-y-auto h-[50vh]">
        <table className="w-full text-sm text-left">          
          <thead className="bg-gray-200">
            <tr>
              <th className="p-4">Activity</th>
              <th className="p-4">Location</th>
              <th className="p-4">Status</th>
              <th className="p-4">Last Process Updated</th>
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
                  {act.location_id
                    ? `${act.city}, ${act.county}, ${act.state}`
                    : "N/A"}
                </td>
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
                  {/* {act.start_date} → {act.end_date} */}
                  {act.latest_update_date || "N/A"}
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
                  {act.location_id
                    ? `${act.city}, ${act.state}`
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

      {/* Map */}  
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

        {error && <p className="text-red-600">{error}</p>}
        {loading ? (
          <p className="text-gray-500">Loading map data...</p>
        ) : (
          <div className="rounded-xl overflow-hidden z-20">
            <MapContainer center={[36.3134, -82.3535]} zoom={8} style={{ height: "500px", width: "100%" }}>
              <TileLayer
          
                // Minimal Map - Best
                // url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
                // attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'

                // More option
                // url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                // attribution="&copy; OpenStreetMap &copy; CARTO"

                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'

                // More option 2
                // url="https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png"
                // attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'

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
                        {showActivities ? (
                          <p>{item.description?.slice(0, 100)}...</p>
                        ) : null}
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
  );
}