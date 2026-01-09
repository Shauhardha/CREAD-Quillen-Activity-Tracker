import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import { fetchAuthSession } from "aws-amplify/auth";

export default function ActivityDetails({ accessToken }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const [activity, setActivity] = useState(null);
  const [goals, setGoals] = useState([]);
  const [wealthTags, setWealthTags] = useState([]);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [activityLeads, setActivityLeads] = useState([]);

  const [showProgressForm, setShowProgressForm] = useState(false);
  const [form, setForm] = useState({
    update_date: "",
    notes: "",
    milestones: "",
    quantitative_outcome: "",
    qualitative_outcome: "",
    evaluation_tool_reference: "",
  });

  const [statusValue, setStatusValue] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
      fetch(`${API_BASE}/activities/details/${id}`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/activity-goals/activity/${id}`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/activity-cultural-wealth/activity/${id}`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/progress-updates/?activity_id=${id}`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/activities/leads/${id}`, { headers }).then(r => r.json()),
    ]).then(([act, gls, wts, prog, leads]) => {
      setActivity(act);
      setGoals(gls);
      setWealthTags(wts);
      setActivityLeads(leads);
      setProgressUpdates(prog);
    });
  }, [id]);

  useEffect(() => {
    if (activity?.status) {
      setStatusValue(activity.status);
    }
  }, [activity]);

  const submitProgress = async (e) => {
    e.preventDefault();
    // console.log("Submitting progress:", form);

    const { tokens } = await fetchAuthSession();
    if (!tokens?.idToken) throw new Error("Not authenticated");

    const headers = {
    Authorization: `Bearer ${tokens.idToken.toString()}`,
    "Content-Type": "application/json"
    };

    await fetch(`${API_BASE}/progress-updates/?activity_id=${id}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        activity_id: Number(id),
        ...form,
      }),
    });

    setShowProgressForm(false);
    setForm({
      update_date: "",
      notes: "",
      milestones: "",
      quantitative_outcome: "",
      qualitative_outcome: "",
      evaluation_tool_reference: "",
    });

    const res = await fetch(`${API_BASE}/progress-updates/?activity_id=${id}`, { headers });
    setProgressUpdates(await res.json());
  };

  const updateStatus = async () => {
    if (!statusValue || statusValue === activity.status) return;

    console.log("Updating status to:", statusValue);

    setUpdatingStatus(true);

    try {
      const { tokens } = await fetchAuthSession();
      if (!tokens?.idToken) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE}/activities/${id}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${tokens.idToken.toString()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: statusValue }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      // Update UI without refetching everything
      setActivity(prev => ({ ...prev, status: statusValue }));
    } catch (err) {
      console.error(err);
      alert("Status update failed");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!activity) return <p className="p-6">Loading…</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={() => navigate(-1)} className="text-indigo-600">
            ← Back to Activities
          </button>

          <div className="mt-3 flex items-center gap-3">
            <select
              value={statusValue}
              onChange={e => setStatusValue(e.target.value)}
              className="border rounded-lg px-3 py-1 text-sm"
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <button
              onClick={updateStatus}
              disabled={updatingStatus || statusValue === activity.status}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              Update Status
            </button>
          </div>
        </div>

      {/* Activity Info */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold">{activity.title}</h1>
        <p>{activity.activity_desc}</p>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <p><b>Status:</b> 
          {/* {getStatusDisplay(activity.status).text}</p> */}
          <span
              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
              getStatusDisplay(activity.status).color
              }`}
          >
              {getStatusDisplay(activity.status).text}
          </span>
          </p>  
          <p><b>Initiative:</b> {activity.initiative_name}</p>
          <p><b>Dates:</b> {activity.start_date} → {activity.end_date}</p>
          <p><b>Location:</b> {activity.city}, {activity.county}, {activity.state}</p>
          <p><b>Education Level:</b> {activity.education_level_name}</p>
          <p><b>Partnership:</b> {activity.partnership_name}</p>
          <p><b>Funding:</b> {activity.funding_name}</p>
          <p><b>Notes:</b> {activity.notes}</p>
          <p><b>Lead Staff:</b> {activityLeads.map(l => l.user_name).join(", ")}</p>
        </div>
      </div>

      {/* Associations */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold mb-3">Strategic Goals</h3>
          <ul className="list-disc pl-5 text-sm">
            {goals.map(g => <li key={g.goal_id}>{g.goal_name}</li>)}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold mb-3">Cultural Wealth Tags</h3>
          <ul className="list-disc pl-5 text-sm">
            {wealthTags.map(w => <li key={w.cultural_wealth_id}>{w.cultural_wealth_name}</li>)}
          </ul>
        </div>
      </div>

      {/* Progress */}

        <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Progress Updates</h3>
            <button
            onClick={() => setShowProgressForm(!showProgressForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
            {showProgressForm ? "Cancel" : "Add Update"}
            </button>
        </div>

        {/* Updates Timeline */}
        {progressUpdates.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
            No progress updates recorded yet.
            </p>
        ) : (
            <ul className="space-y-4">
            {progressUpdates.map(p => (
                <li
                key={p.id}
                className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:shadow-sm transition"
                >
                {/* Date */}
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-indigo-600">
                    {new Date(p.update_date).toLocaleDateString()}
                    </span>
                </div>

                {/* Notes */}
                {p.notes && (
                    <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium text-gray-800">Notes:</span>{" "}
                    {p.notes}
                    </p>
                )}

                {/* Milestones */}
                {p.milestones && (
                    <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium text-gray-800">Milestones:</span>{" "}
                    {p.milestones}
                    </p>
                )}

                {/* Outcomes */}
                <div className="grid md:grid-cols-2 gap-3 mt-2">
                    {p.quantitative_outcome && (
                    <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs uppercase text-gray-500 font-semibold mb-1">
                        Quantitative Outcome
                        </p>
                        <p className="text-sm text-gray-700">
                        {p.quantitative_outcome}
                        </p>
                    </div>
                    )}

                    {p.qualitative_outcome && (
                    <div className="bg-white border rounded-lg p-3">
                        <p className="text-xs uppercase text-gray-500 font-semibold mb-1">
                        Qualitative Outcome
                        </p>
                        <p className="text-sm text-gray-700">
                        {p.qualitative_outcome}
                        </p>
                    </div>
                    )}
                </div>

                {/* Evaluation Tool */}
                {p.evaluation_tool_reference && (
                    <p className="text-xs text-gray-500 mt-2">
                    Evaluation Tool:{" "}
                    <span className="font-medium text-gray-700">
                        {p.evaluation_tool_reference}
                    </span>
                    </p>
                )}
                </li>
            ))}
            </ul>
        )}

        {/* Add Progress Form */}
        {showProgressForm && (
            <form
            onSubmit={submitProgress}
            className="bg-gray-50 border rounded-xl p-5 space-y-4 text-xs"
            >
            <h4 className="font-semibold text-gray-700">
                New Progress Update
            </h4>

            <input
                type="date"
                required
                className="w-full border rounded-lg px-3 py-2"
                onChange={e =>
                setForm(f => ({ ...f, update_date: e.target.value }))
                }
            />

            <textarea
                placeholder="Notes"
                className="w-full border rounded-lg px-3 py-2"
                onChange={e =>
                setForm(f => ({ ...f, notes: e.target.value }))
                }
            />

            <textarea
                placeholder="Milestones"
                className="w-full border rounded-lg px-3 py-2"
                onChange={e =>
                setForm(f => ({ ...f, milestones: e.target.value }))
                }
            />

            <div className="grid md:grid-cols-2 gap-3">
                <input
                placeholder="Quantitative Outcome"
                className="border rounded-lg px-3 py-2"
                onChange={e =>
                    setForm(f => ({ ...f, quantitative_outcome: e.target.value }))
                }
                />
                <input
                placeholder="Qualitative Outcome"
                className="border rounded-lg px-3 py-2"
                onChange={e =>
                    setForm(f => ({ ...f, qualitative_outcome: e.target.value }))
                }
                />
            </div>

            <input
                placeholder="Evaluation Tool Reference"
                className="w-full border rounded-lg px-3 py-2"
                onChange={e =>
                setForm(f => ({
                    ...f,
                    evaluation_tool_reference: e.target.value,
                }))
                }
            />

            <button className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition">
                Save Progress Update
            </button>
            </form>
        )}
        </div>
    </div>
  );
}
