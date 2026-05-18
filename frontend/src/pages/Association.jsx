import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { API_BASE } from "../config";
import { FaTrash } from "react-icons/fa";

export default function ActivityAssociations() {
  const { isReadOnly, accessToken } = useOutletContext() ?? {};
  const headers = { Authorization: `Bearer ${accessToken}` };

  const [activeTab, setActiveTab] = useState("goals"); // "goals" or "wealth" or "stakeholders"

  const [activities, setActivities] = useState([]);
  const [goals, setGoals] = useState([]);
  const [wealthTags, setWealthTags] = useState([]);
  const [stakeholders, setStakeholders] = useState([]);

  const [activityId, setActivityId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [wealthId, setWealthId] = useState("");
  const [stakeholderId, setStakeholderId] = useState("");

  const [goalLinks, setGoalLinks] = useState([]);
  const [wealthLinks, setWealthLinks] = useState([]);
  const [stakeholderLinks, setStakeholderLinks] = useState([]);

  const [status, setStatus] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      fetch(`${API_BASE}/activities`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/strategic-goals`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/misc/cultural-wealth-tags`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/stakeholders/`, { headers }).then(r => r.json()), 
    ])
      .then(([acts, gls, wts, stks]) => {
        setActivities(acts);
        setGoals(gls);
        setWealthTags(wts);
        setStakeholders(stks);
      })
      .catch(console.error);

    fetchLinks();
  }, [accessToken]);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const [gRes, wRes, stkRes] = await Promise.all([
        fetch(`${API_BASE}/activity-goals/`, { headers }),
        fetch(`${API_BASE}/activity-cultural-wealth/`, { headers }),
        fetch(`${API_BASE}/activity-stakeholders/`, { headers }),
      ]);

      const gData = gRes.ok ? await gRes.json() : [];
      const wData = wRes.ok ? await wRes.json() : [];
      const stkData = stkRes.ok ? await stkRes.json() : [];

    //   console.log("Fetched Links:", { gData, wData, stkData });

      setGoalLinks(Array.isArray(gData) ? gData : []);
      setWealthLinks(Array.isArray(wData) ? wData : []);
      setStakeholderLinks(Array.isArray(stkData) ? stkData : []);
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

  const addStakeholderLink = async () => {
    // console.log("Adding stakeholder link with:", { activityId, stakeholderId, status, description });
    if (!activityId || !stakeholderId) return;
    await fetch(`${API_BASE}/activity-stakeholders/?activity_id=${activityId}&stakeholder_id=${stakeholderId}&role=${status}&notes=${description}`, {
      method: "POST",
      headers,
    });
    setActivityId("");
    setStakeholderId("");
    setStatus("");
    setDescription("");
    fetchLinks();
  };

  const deleteStakeholderLink = async (activity_id, stakeholder_id) => {
    await fetch(`${API_BASE}/activity-stakeholders/?activity_id=${activity_id}&stakeholder_id=${stakeholder_id}`, {
      method: "DELETE",
      headers,
    });
    fetchLinks();
  };

  const currentActivity = activities.find(a => a.id === Number(activityId));

  // Block read-only users entirely
  if (isReadOnly) {
    return (
      <div className="max-w-5xl mx-auto p-4 mt-10 flex flex-col items-center gap-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md w-full">
          <p className="text-4xl mb-3">🔒</p>
          <h2 className="text-lg font-semibold text-red-700 mb-2">Access Restricted</h2>
          <p className="text-sm text-red-600">
            You do not have permission to access the Associate Activities page.
            Contact an admin if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      {/* Tabs */}
      <div className="flex border-b text-xs md:text-base">
        <button
          onClick={() => setActiveTab("goals")}
          className={`px-5 py-2 font-medium border-b-2 transition ${
            activeTab === "goals"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-600 hover:text-indigo-600"
          }`}
        >
          Strategic Goals
        </button>
        <button
          onClick={() => setActiveTab("wealth")}
          className={`px-5 py-2 font-medium border-b-2 transition ${
            activeTab === "wealth"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-600 hover:text-indigo-600"
          }`}
        >
          Cultural Wealth Tags
        </button>
        <button
          onClick={() => setActiveTab("stakeholders")}
          className={`px-5 py-2 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === "stakeholders" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600 hover:text-indigo-600"
          }`}
        >
          Stakeholders
        </button>
      </div>

      {/* Tab Content */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Add Association Card */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="text-lg font-semibold">
            {activeTab === "goals" ? "Link Activity to Goal" :
             activeTab === "wealth" ? "Link Activity to Cultural Wealth Tag" :
             "Link Activity to Stakeholder"}
          </h3>

          <select
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 text-sm"
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
              className="w-full border rounded-lg px-4 py-2 text-sm"
              disabled={!activityId}
            >
              <option value="">Select Goal</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.goal_name}
                </option>
              ))}
            </select>
          ) : activeTab === "wealth" ? (
            <select
              value={wealthId}
              onChange={(e) => setWealthId(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 text-sm"
              disabled={!activityId}
            >
              <option value="">Select Tag</option>
              {wealthTags.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          ) : (
            <>
                <select
                value={stakeholderId}
                onChange={(e) => setStakeholderId(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm"
                disabled={!activityId}
                >
                <option value="">Select Stakeholder</option>
                {stakeholders.map((s) => (
                    <option key={s.id} value={s.id}>
                    {s.name}
                    </option>
                ))}
                </select>
                <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border p-2 rounded capitalize text-sm" default="participant">
                    <option value="lead">lead</option>
                    <option value="partner">partner</option>
                    <option value="participant">participant</option>
                    <option value="funder">funder</option>
                    <option value="advisor">advisor</option>
                    <option value="other">other</option>
                </select>
                <textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full border p-2 rounded h-22 text-sm" />
            </>    
          )}

          <button
            onClick={
              activeTab === "goals" ? addGoalLink : 
              activeTab === "wealth" ? addWealthLink : 
              addStakeholderLink
            }
            disabled={loading || !activityId || 
              (activeTab === "goals" ? !goalId : 
              activeTab === "wealth" ? !wealthId : !stakeholderId)}
            className="w-full text-sm bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            Add Association
          </button>
        </div>

        {/* Current Associations List */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Current {activeTab === "goals" ? "Goal" :
                     activeTab === "wealth" ? "Cultural Wealth" :
                     "Stakeholder"} Associations
            {/* {currentActivity && <span className="text-sm font-normal text-gray-600"> for "{currentActivity.title}"</span>} */}
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
                      <p className="font-medium text-sm">{link.activity_title || "Unknown Activity"}</p>
                      <p className="text-xs text-gray-600">→ {link.goal_name}</p>
                    </div>
                    <button
                      onClick={() => deleteGoalLink(link.activity_id, link.goal_id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : activeTab === "wealth" ? (
            wealthLinks.length === 0 ? (
              <p className="text-gray-500">No cultural wealth associations yet.</p>
            ) : (
            <ul className="space-y-3">
                {wealthLinks.map((link) => (
                  <li
                    key={`${link.activity_id}-${link.cultural_wealth_id}`}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{link.activity_title || "Unknown Activity"}</p>
                      <p className="text-xs text-gray-600">→ {link.cultural_wealth_name}</p>
                    </div>
                    <button
                      onClick={() => deleteWealthLink(link.activity_id, link.cultural_wealth_id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            stakeholderLinks.length === 0 ? (
              <p className="text-gray-500">No stakeholder associations yet.</p>
            ) : (
              <ul className="space-y-3">
                {stakeholderLinks.map((link) => (
                  <li
                    key={`${link.activity_id}-${link.stakeholder_id}`}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{link.activity_title || "Unknown Activity"}</p>
                      <p className="text-xs text-gray-600"> {link.stakeholder_name}</p>
                      <p className="text-xs text-gray-600"> Role: {link.role}</p>
                      <p className="text-xs text-gray-600"> Notes: {link.notes}</p>
                    </div>
                    <button
                      onClick={() => deleteStakeholderLink(link.activity_id, link.stakeholder_id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      <FaTrash />
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