import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import { fetchAuthSession } from "aws-amplify/auth";
import { FaCheck, FaTrash, FaPlus, FaFileExcel, FaPrint } from "react-icons/fa";
import * as XLSX from "xlsx";

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
  const [stakeholders, setStakeholders] = useState([]);

  // ── Milestones ─────────────────────────────────────────────────
  const [milestones, setMilestones] = useState([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: "", description: "", due_date: "" });
  const [savingMilestone, setSavingMilestone] = useState(false);

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
  const [search, setSearch] = useState("");

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
      fetch(`${API_BASE}/stakeholders/activity/${id}`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/milestones/?activity_id=${id}`).then(r => r.json()),
    ]).then(([act, gls, wts, prog, leads, stk, mils]) => {
      setActivity(act);
      setGoals(gls);
      setWealthTags(wts);
      setActivityLeads(leads);
      setProgressUpdates(prog);
      setStakeholders(stk);
      setMilestones(Array.isArray(mils) ? mils : []);
    });
  }, [id]);

  const filteredProgress = useMemo(() => {
      if (!search.trim()) return progressUpdates;

      const q = search.toLowerCase();

      return progressUpdates.filter((item) => {
          return (
          item.update_date?.toLowerCase().includes(q) ||
          item.notes?.toLowerCase().includes(q) ||
          item.milestones?.toLowerCase().includes(q) ||
          item.quantitative_outcome?.toLowerCase().includes(q) ||
          item.qualitative_outcome?.toLowerCase().includes(q) ||
          item.evaluation_tool_reference?.toLowerCase().includes(q)
          );
      });
  }, [progressUpdates, search]);

  
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

    // console.log("Updating status to:", statusValue);

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

  // ── Excel Export ───────────────────────────────────────────────
  const exportReport = () => {
    const wb   = XLSX.utils.book_new();
    const safe = (v) => v ?? "";
    const dateStr = new Date().toISOString().slice(0, 10);

    /* ── Sheet 1: Activity Details ─────────────────────────── */
    const detailRows = [
      ["Field", "Value"],
      ["Title",              safe(activity.title)],
      ["Status",             safe(activity.status)],
      ["Initiative",         safe(activity.initiative_name)],
      ["Activity Type",      safe(activity.activity_type_name)],
      ["Start Date",         safe(activity.start_date)],
      ["End Date",           safe(activity.end_date)],
      ["City",               safe(activity.city)],
      ["County",             safe(activity.county)],
      ["State",              safe(activity.state)],
      ["Primary Audience",   safe(activity.primary_audience)],
      ["Education Level",    safe(activity.education_level_name)],
      ["Partnership Type",   safe(activity.partnership_name)],
      ["Funding Source",     safe(activity.funding_name)],
      ["Funding Amount ($)", activity.funding_amount != null ? Number(activity.funding_amount) : ""],
      ["Lead Staff",         activityLeads.map(l => l.user_name).join(", ")],
      ["Description",        safe(activity.activity_desc)],
      ["Deliverables",       safe(activity.deliverables)],
      ["Intended Outcomes",  safe(activity.intended_outcomes)],
      ["Evidence / Data",    safe(activity.evidence)],
      ["Sustainability Plan",safe(activity.sustainability_plan)],
      ["Notes",              safe(activity.notes)],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(detailRows);
    ws1["!cols"] = [{ wch: 22 }, { wch: 72 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Activity Details");

    /* ── Sheet 2: Progress Updates ─────────────────────────── */
    const progHeader = [
      "Date", "Notes", "Milestones Noted",
      "Quantitative Outcome", "Qualitative Outcome", "Evaluation Tool",
    ];
    const progRows = [
      progHeader,
      ...progressUpdates.map(p => [
        safe(p.update_date),
        safe(p.notes),
        safe(p.milestones),
        safe(p.quantitative_outcome),
        safe(p.qualitative_outcome),
        safe(p.evaluation_tool_reference),
      ]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(progRows);
    ws2["!cols"] = progRows[0].map((_, ci) => ({
      wch: Math.min(60, Math.max(14, ...progRows.map(r => String(r[ci] ?? "").length))),
    }));
    XLSX.utils.book_append_sheet(wb, ws2, "Progress Updates");

    /* ── Sheet 3: Milestones ───────────────────────────────── */
    const milRows = [
      ["Title", "Description", "Due Date", "Achieved", "Achieved Date"],
      ...milestones.map(m => [
        safe(m.title),
        safe(m.description),
        safe(m.due_date),
        m.is_achieved ? "Yes" : "No",
        safe(m.achieved_date),
      ]),
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(milRows);
    ws3["!cols"] = [{ wch: 32 }, { wch: 42 }, { wch: 12 }, { wch: 10 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Milestones");

    /* ── Sheet 4: Associations ─────────────────────────────── */
    const assocRows = [
      ["Type", "Name", "Details"],
      ...goals.map(g => ["Strategic Goal", safe(g.goal_name), ""]),
      ...(goals.length > 0 && wealthTags.length > 0 ? [["", "", ""]] : []),
      ...wealthTags.map(w => ["Cultural Wealth Capital", safe(w.cultural_wealth_name), ""]),
      ...(wealthTags.length > 0 && stakeholders.length > 0 ? [["", "", ""]] : []),
      ...stakeholders.map(s => [
        "Stakeholder",
        safe(s.stakeholder_name),
        [s.role, s.notes].filter(Boolean).join(" — "),
      ]),
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(assocRows);
    ws4["!cols"] = [{ wch: 22 }, { wch: 42 }, { wch: 42 }];
    XLSX.utils.book_append_sheet(wb, ws4, "Associations");

    XLSX.writeFile(wb, `CREAD_Activity_${id}_${dateStr}.xlsx`);
  };

  // ── Milestone handlers ─────────────────────────────────────────
  const refreshMilestones = () =>
    fetch(`${API_BASE}/milestones/?activity_id=${id}`)
      .then(r => r.json())
      .then(data => setMilestones(Array.isArray(data) ? data : []));

  const toggleMilestone = async (milestoneId) => {
    const { tokens } = await fetchAuthSession();
    await fetch(`${API_BASE}/milestones/${milestoneId}/achieve`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokens.idToken.toString()}` },
    });
    refreshMilestones();
  };

  const deleteMilestone = async (milestoneId) => {
    if (!window.confirm("Delete this milestone?")) return;
    const { tokens } = await fetchAuthSession();
    await fetch(`${API_BASE}/milestones/${milestoneId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokens.idToken.toString()}` },
    });
    refreshMilestones();
  };

  const submitMilestone = async (e) => {
    e.preventDefault();
    setSavingMilestone(true);
    try {
      const { tokens } = await fetchAuthSession();
      const body = {
        title: milestoneForm.title,
        description: milestoneForm.description || null,
        due_date: milestoneForm.due_date || null,
      };
      await fetch(`${API_BASE}/milestones/?activity_id=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.idToken.toString()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      setMilestoneForm({ title: "", description: "", due_date: "" });
      setShowMilestoneForm(false);
      refreshMilestones();
    } finally {
      setSavingMilestone(false);
    }
  };

  if (!activity) return <p className="p-6">Loading…</p>;

  return (
    <div className="max-w-5xl mx-auto p-0 sm:p-4 space-y-4">

      {/* ── Print / export CSS ──────────────────────────────────── */}
      <style>{`
        .print-only { display: none; }

        @media print {
          /* Hide app chrome */
          aside,
          .no-print { display: none !important; }

          /* Strip background image from layout */
          body,
          body > div,
          body > div > div { background-image: none !important; background-color: white !important; }

          /* Full-width content, no extra padding */
          main { padding: 0 !important; margin: 0 !important; }
          .max-w-5xl { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }

          /* Remove shadows & rings */
          * { box-shadow: none !important; }

          /* Un-scroll the progress list */
          .progress-scroll { height: auto !important; max-height: none !important; overflow: visible !important; }

          /* Avoid page breaks inside cards */
          .bg-white { break-inside: avoid; page-break-inside: avoid; }

          /* Show print-only header */
          .print-only { display: block !important; }
        }
      `}</style>

      {/* ── Print-only report header ────────────────────────────── */}
      <div className="print-only border-b pb-4 mb-2">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">CREAD Quillen Activity Tracker</p>
        <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Report generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* ── Screen action bar ───────────────────────────────────── */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={() => navigate(-1)} className="text-indigo-600 text-sm">
          ← Back
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export Excel */}
          <button
            onClick={exportReport}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
          >
            <FaFileExcel size={13} />
            Export Excel
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
          >
            <FaPrint size={13} />
            Print
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Status update */}
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
          <span
              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
              getStatusDisplay(activity.status).color
              }`}
          >
              {getStatusDisplay(activity.status).text}
          </span>
          </p>
          <p><b>Initiative:</b> {activity.initiative_name || "—"}</p>
          <p><b>Activity Type:</b> {activity.activity_type_name || "—"}</p>
          <p><b>Dates:</b> {activity.start_date} → {activity.end_date}</p>
          <p><b>Location:</b> {activity.city}, {activity.county}, {activity.state}</p>
          <p><b>Primary Audience:</b> {activity.primary_audience || "—"}</p>
          <p><b>Education Level:</b> {activity.education_level_name || "—"}</p>
          <p><b>Partnership:</b> {activity.partnership_name || "—"}</p>
          <p><b>Funding Source:</b> {activity.funding_name || "—"}</p>
          <p><b>Funding Amount:</b> {activity.funding_amount != null ? `$${Number(activity.funding_amount).toLocaleString()}` : "—"}</p>
          <p><b>Lead Staff:</b> {activityLeads.map(l => l.user_name).join(", ") || "—"}</p>
          <p><b>Notes:</b> {activity.notes || "—"}</p>
        </div>
      </div>

      {/* Planning & Evaluation Details */}
      {(activity.deliverables || activity.intended_outcomes || activity.evidence || activity.sustainability_plan) && (
        <div className="bg-white rounded-xl shadow p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-800">Planning &amp; Evaluation Details</h2>
          <div className="space-y-5 text-sm">

            {activity.deliverables && (
              <div>
                <p className="font-semibold text-gray-700 mb-1">Deliverables / Outputs</p>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{activity.deliverables}</p>
              </div>
            )}

            {activity.intended_outcomes && (
              <div>
                <p className="font-semibold text-gray-700 mb-1">Intended Outcomes</p>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{activity.intended_outcomes}</p>
              </div>
            )}

            {activity.evidence && (
              <div>
                <p className="font-semibold text-gray-700 mb-1">Evidence / Data Sources</p>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{activity.evidence}</p>
              </div>
            )}

            {activity.sustainability_plan && (
              <div>
                <p className="font-semibold text-gray-700 mb-1">Sustainability Plan</p>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{activity.sustainability_plan}</p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Associations */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold mb-3">Strategic Goals</h3>
          <ul className="list-disc pl-5 text-xs">
            {goals.map(g => <li key={g.goal_id}>{g.goal_name}</li>)}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold mb-3">Cultural Wealth Tags</h3>
          <ul className="list-disc pl-5 text-xs">
            {wealthTags.map(w => <li key={w.cultural_wealth_id}>{w.cultural_wealth_name}</li>)}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold mb-3">Stakeholders</h3>
          <ul className="list-disc pl-5 text-xs">
            {stakeholders.map(s => <li key={s.stakeholder_id}>{s.stakeholder_name} ({s.role}) {s.notes && `- ${s.notes}`}</li>)}
          </ul>
        </div>
      </div>

      {/* ── Milestones ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Milestones</h3>
          <button
            onClick={() => setShowMilestoneForm(p => !p)}
            className="no-print flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            <FaPlus size={11} />
            {showMilestoneForm ? "Cancel" : "Add Milestone"}
          </button>
        </div>

        {/* Add form */}
        {showMilestoneForm && (
          <form onSubmit={submitMilestone} className="no-print bg-gray-50 border rounded-xl p-4 space-y-3 text-sm">
            <input
              type="text"
              required
              placeholder="Milestone title *"
              value={milestoneForm.title}
              onChange={e => setMilestoneForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              placeholder="Description (optional)"
              value={milestoneForm.description}
              onChange={e => setMilestoneForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
            />
            <div className="flex items-center gap-3">
              <label className="text-gray-600 text-xs whitespace-nowrap">Due date</label>
              <input
                type="date"
                value={milestoneForm.due_date}
                onChange={e => setMilestoneForm(f => ({ ...f, due_date: e.target.value }))}
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={savingMilestone}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              {savingMilestone ? "Saving…" : "Save Milestone"}
            </button>
          </form>
        )}

        {/* Milestone list */}
        {milestones.length === 0 && !showMilestoneForm ? (
          <p className="text-sm text-gray-500 italic">No milestones added yet.</p>
        ) : (
          <ul className="space-y-2">
            {milestones.map(m => {
              const today = new Date().toISOString().slice(0, 10);
              const overdue = m.due_date && m.due_date < today && !m.is_achieved;
              return (
                <li
                  key={m.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition ${
                    m.is_achieved
                      ? "bg-green-50 border-green-200"
                      : overdue
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleMilestone(m.id)}
                    title={m.is_achieved ? "Mark as not achieved" : "Mark as achieved"}
                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                      m.is_achieved
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-400 hover:border-indigo-500"
                    }`}
                  >
                    {m.is_achieved && <FaCheck size={9} />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${m.is_achieved ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {m.title}
                    </p>
                    {m.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-1">
                      {m.due_date && (
                        <span className={`text-xs ${overdue ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                          Due: {m.due_date}{overdue ? " — Overdue" : ""}
                        </span>
                      )}
                      {m.is_achieved && m.achieved_date && (
                        <span className="text-xs text-green-600">
                          Achieved: {m.achieved_date}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => deleteMilestone(m.id)}
                    className="no-print flex-shrink-0 text-gray-300 hover:text-red-500 transition mt-0.5"
                    title="Delete milestone"
                  >
                    <FaTrash size={13} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Progress */}

        <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Progress Updates</h3>
            <button
              onClick={() => {
                setShowProgressForm(prev => !prev);

                // wait for the DOM to update if the form appears
                setTimeout(() => {
                  document
                    .getElementById("add_new_progress")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 0);
              }}
              className="no-print flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              <FaPlus size={11} />
              {showProgressForm ? "Cancel" : "Add Progress Update"}
            </button>
        </div>

        {/* Updates Timeline */}
        {progressUpdates.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
            No progress updates recorded yet.
            </p>
        ) : (
            <div> 
              <section className="no-print border-single border-b-2 py-3 mb-4 border-gray-400">
              <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by date, notes, milestones, etc…"
                  className="w-full border border-1 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              </section>
              <div className="progress-scroll overflow-x-auto h-[60vh] overflow-y-auto">

                <ul className="space-y-4">
                {filteredProgress.map(p => (
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
              </div>  
            </div>  
        )}

        {/* Add Progress Form */}
        <div id="add_new_progress" className="no-print">
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
    </div>
  );
}
