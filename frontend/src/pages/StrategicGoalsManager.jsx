import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE } from "../config";
import { FaTrash, FaEdit } from "react-icons/fa";

const API_URL = `${API_BASE}/strategic-goals`;
const INITIATIVES_URL = `${API_BASE}/initiatives/`;

export default function StrategicGoalsManager() {
  const { isReadOnly } = useOutletContext() ?? {};
  const [goals, setGoals] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [initiativeId, setInitiativeId] = useState("");
  const [goalName, setGoalName] = useState("");
  const [description, setDescription] = useState("");
  const [goalTerm, setGoalTerm] = useState("short_term");
  const [isActive, setIsActive] = useState(true); // NEW: is_active
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [search, setSearch] = useState("");

  // Load auth token
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await fetchAuthSession();
        setToken(session.tokens?.accessToken?.toString() || null);
      } catch {
        setToken(null);
      }
    };
    loadSession();
  }, []);

  // Fetch goals and initiatives after token
  useEffect(() => {
    if (token !== null) {
      fetchGoals();
      fetchInitiatives();
    }
  }, [token]);

  const fetchGoals = async () => {
    try {
      const res = await fetch(API_URL, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!res.ok) throw new Error("Failed to load goals");
      const data = await res.json();
      // Normalize is_active field (DB may return 1/0 or '1'/'0' or true/false)
      const normalized = Array.isArray(data)
        ? data.map((g) => ({
            ...g,
            is_active: g.is_active == 1 || g.is_active === true,
            }))
        : [];  
      setGoals(normalized);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredGoals = useMemo(() => {
      if (!search.trim()) return goals;

      const q = search.toLowerCase();

      return goals.filter((item) => {
          return (
          item.goal_name?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.goal_term?.toLowerCase().includes(q)
          );
      });
  }, [goals, search]);

  const fetchInitiatives = async () => {
    try {
      const res = await fetch(INITIATIVES_URL, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!res.ok) throw new Error("Failed to load initiatives");
      setInitiatives(await res.json());
    } catch (err) {
      console.error("Initiatives fetch error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = { initiative_id: initiativeId, goal_name: goalName, description, goal_term: goalTerm, is_active: isActive };

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text() || "Failed to save goal");

      // Reset form
      setGoalName("");
      setDescription("");
      setGoalTerm("short_term");
      setInitiativeId("");
      setIsActive(true);
      setEditingId(null);
      await fetchGoals();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this strategic goal?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!res.ok) throw new Error(await res.text() || "Delete failed");
      await fetchGoals();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (goal) => {
    setGoalName(goal.goal_name);
    setDescription(goal.description || "");
    setGoalTerm(goal.goal_term);
    setInitiativeId(goal.initiative_id);
    setIsActive(goal.is_active); // NEW: set checkbox
    setEditingId(goal.id);
  };

  const cancelEdit = () => {
    setGoalName("");
    setDescription("");
    setGoalTerm("short_term");
    setInitiativeId("");
    setIsActive(true);
    setEditingId(null);
    setError(null);
  };

  if (token === null) return <div className="p-6">Loading session...</div>;
  if (!token) return <div className="p-6 text-red-600">Not authenticated</div>;

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <h2 className="text-2xl font-bold mb-6">Strategic Goals</h2>
      <div className=" bg-white p-6 rounded-xl shadow overflow-x-auto">

        {/* View-only banner for non-admin users */}
        {isReadOnly && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 mb-4">
            You have view-only access. Contact an admin to make changes.
          </div>
        )}

        {!isReadOnly && (
          <>
            <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Update" : "Add"} Strategic Goal
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 mb-6 text-sm">
            <select
            required
            value={initiativeId}
            onChange={(e) => setInitiativeId(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
            >
            <option value="">Select Initiative</option>
            {initiatives.map((i) => (
                <option key={i.id} value={i.id}>
                {i.name}
                </option>
            ))}
            </select>

            <input
            type="text"
            placeholder="Goal name"
            required
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            />

            <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2"
            />

            <select
            value={goalTerm}
            onChange={(e) => setGoalTerm(e.target.value)}
            className="w-full border rounded px-3 py-2"
            >
            <option value="short_term">Short Term</option>
            <option value="long_term">Long Term</option>
            </select>

            {/* NEW: is_active checkbox */}
            <label className="flex items-center gap-2 ml-2">
            <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="form-checkbox w-4 h-4 bg-black text-white"
            />
            Active Status
            </label>

            <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
                {editingId ? "Update" : "Add"}
            </button>
            {editingId && (
                <button type="button" onClick={cancelEdit} className="px-4 py-2 border rounded">
                Cancel
                </button>
            )}
            </div>
        </form>
          </>
        )}

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <h3 className="text-lg font-semibold mb-2">Existing Goals</h3>
        <ul className="space-y-2">
            {goals.length === 0 && <li className="text-gray-500 text-sm">No goals yet.</li>}
            <section className="border-single border-b-2 py-3 mb-4 border-gray-400">
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by source name, description, goal term…"
                className="w-full border border-1 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            </section>
            <div className="overflow-x-auto h-[40vh] overflow-y-auto">
            {filteredGoals.map((g) => (
            <li key={g.id} className="flex justify-between items-center border rounded px-3 py-2 text-sm">
                <div>
                <p className="font-medium">{g.goal_name}</p>
                <p className="text-xs text-gray-600">{g.description}</p>
                <p className="text-xs text-gray-500">
                    Initiative ID: {g.initiative_id} | Term: {g.goal_term} | {" "}
                        <span className={g.is_active ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {g.is_active ? "Active: Yes" : "Active: No"}
                        </span>
                </p>
                </div>
                {!isReadOnly && (
                  <div className="flex gap-3">
                  <button onClick={() => startEdit(g)} className="text-blue-600 text-base" disabled={loading}>
                      <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(g.id)} className="text-red-600 text-base" disabled={loading}>
                      <FaTrash />
                  </button>
                  </div>
                )}
            </li>
            ))}
            </div>
        </ul>
      </div>  
    </div>
  );
}
