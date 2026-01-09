import { useEffect, useState } from "react";
import { API_BASE } from "../config";

export default function ActivityAssociations({ accessToken }) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const [activeTab, setActiveTab] = useState("goals"); // "goals" or "wealth"

  const [activities, setActivities] = useState([]);
  const [goals, setGoals] = useState([]);
  const [wealthTags, setWealthTags] = useState([]);

  const [activityId, setActivityId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [wealthId, setWealthId] = useState("");

  const [goalLinks, setGoalLinks] = useState([]);
  const [wealthLinks, setWealthLinks] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/activities`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/strategic-goals`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/misc/cultural-wealth-tags`, { headers }).then(r => r.json()),
    ])
      .then(([acts, gls, wts]) => {
        setActivities(acts);
        setGoals(gls);
        setWealthTags(wts);
      })
      .catch(console.error);

    fetchLinks();
  }, [accessToken]);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const [gRes, wRes] = await Promise.all([
        fetch(`${API_BASE}/activity-goals/`, { headers }),
        fetch(`${API_BASE}/activity-cultural-wealth/`, { headers }),
      ]);

      const gData = gRes.ok ? await gRes.json() : [];
      const wData = wRes.ok ? await wRes.json() : [];

      console.log("Fetched Links:", { gData, wData });

      setGoalLinks(Array.isArray(gData) ? gData : []);
      setWealthLinks(Array.isArray(wData) ? wData : []);
    } catch (err) {
      console.error("fetchLinks error", err);
    } finally {
      setLoading(false);
    }
  };

  const addGoalLink = async () => {
    if (!activityId || !goalId) return;
    await fetch(`${API_BASE}/activity-goals/?activity_id=${activityId}&goal_id=${goalId}`, {
      method: "POST",
      headers,
    });
    setActivityId("");
    setGoalId("");
    fetchLinks();
  };

  const deleteGoalLink = async (activity_id, goal_id) => {
    await fetch(`${API_BASE}/activity-goals/?activity_id=${activity_id}&goal_id=${goal_id}`, {
      method: "DELETE",
      headers,
    });
    fetchLinks();
  };

  const addWealthLink = async () => {
    if (!activityId || !wealthId) return;
    await fetch(`${API_BASE}/activity-cultural-wealth/?activity_id=${activityId}&cultural_wealth_id=${wealthId}`, {
      method: "POST",
      headers,
    });
    setActivityId("");
    setWealthId("");
    fetchLinks();
  };

  const deleteWealthLink = async (activity_id, cultural_wealth_id) => {
    await fetch(`${API_BASE}/activity-cultural-wealth/?activity_id=${activity_id}&cultural_wealth_id=${cultural_wealth_id}`, {
      method: "DELETE",
      headers,
    });
    fetchLinks();
  };

  const currentActivity = activities.find(a => a.id === Number(activityId));

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("goals")}
          className={`px-6 py-3 font-medium border-b-2 transition ${
            activeTab === "goals"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-600 hover:text-indigo-600"
          }`}
        >
          Strategic Goals
        </button>
        <button
          onClick={() => setActiveTab("wealth")}
          className={`px-6 py-3 font-medium border-b-2 transition ${
            activeTab === "wealth"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-600 hover:text-indigo-600"
          }`}
        >
          Cultural Wealth Tags
        </button>
      </div>

      {/* Tab Content */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Add Association Card */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="text-lg font-semibold">
            {activeTab === "goals" ? "Link Activity to Goal" : "Link Activity to Cultural Wealth Tag"}
          </h3>

          <select
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="">Select Activity</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>

          {activeTab === "goals" ? (
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              disabled={!activityId}
            >
              <option value="">Select Goal</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.goal_name}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={wealthId}
              onChange={(e) => setWealthId(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              disabled={!activityId}
            >
              <option value="">Select Tag</option>
              {wealthTags.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={activeTab === "goals" ? addGoalLink : addWealthLink}
            disabled={loading || !activityId || (activeTab === "goals" ? !goalId : !wealthId)}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            Add Association
          </button>
        </div>

        {/* Current Associations List */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Current {activeTab === "goals" ? "Goal" : "Cultural Wealth"} Associations
            {currentActivity && <span className="text-sm font-normal text-gray-600"> for "{currentActivity.title}"</span>}
          </h3>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : activeTab === "goals" ? (
            goalLinks.length === 0 ? (
              <p className="text-gray-500">No goal associations yet.</p>
            ) : (
              <ul className="space-y-3">
                {goalLinks.map((link) => (
                  <li
                    key={`${link.activity_id}-${link.goal_id}`}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{link.activity_title || "Unknown Activity"}</p>
                      <p className="text-sm text-gray-600">→ {link.goal_name}</p>
                    </div>
                    <button
                      onClick={() => deleteGoalLink(link.activity_id, link.goal_id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            wealthLinks.length === 0 ? (
              <p className="text-gray-500">No cultural wealth associations yet.</p>
            ) : (
            //   <ul className="space-y-3">
            //     {wealthLinks.map((link) => {
            //       const activity = link.activity || link[1];
            //       const tag = link.tag || link[2] || link;
            //       if (!activity || !tag) return null;
            //       return (
            //         <li
            //           key={`${activity.id}-${tag.id}`}
            //           className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            //         >
            //           <div>
            //             <p className="font-medium">{activity.title || "Unknown Activity"}</p>
            //             <p className="text-sm text-gray-600">→ {tag.name || tag.tag_name}</p>
            //           </div>
            //           <button
            //             onClick={() => deleteWealthLink(activity.id, tag.id)}
            //             className="text-red-600 hover:text-red-800 font-medium"
            //           >
            //             Remove
            //           </button>
            //         </li>
            //       );
            //     })}
            //   </ul>
            <ul className="space-y-3">
                {wealthLinks.map((link) => (
                  <li
                    key={`${link.activity_id}-${link.cultural_wealth_id}`}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{link.activity_title || "Unknown Activity"}</p>
                      <p className="text-sm text-gray-600">→ {link.cultural_wealth_name}</p>
                    </div>
                    <button
                      onClick={() => deleteWealthLink(link.activity_id, link.cultural_wealth_id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </div>
    </div>
  );
}