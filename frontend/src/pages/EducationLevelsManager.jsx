import { useEffect, useState, useMemo } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE } from "../config";
import { FaTrash, FaEdit } from "react-icons/fa";

const API_URL = `${API_BASE}/misc/education-levels`;

export default function EducationLevelsManager() {
  const [levels, setLevels] = useState([]);
  const [levelName, setLevelName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [search, setSearch] = useState("");

  /* ===============================
     Load Auth Token
     =============================== */
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

  /* ===============================
     Fetch Levels After Token
     =============================== */
  useEffect(() => {
    if (token !== null) {
      fetchEducationLevels();
    }
  }, [token]);

  const fetchEducationLevels = async () => {
    setError(null);
    try {
      const res = await fetch(API_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || `Failed (status ${res.status})`);
        return;
      }

      setLevels(await res.json());
    } catch {
      setError("Failed to load education levels");
    }
  };

  const filteredEducationLevels = useMemo(() => {
      if (!search.trim()) return levels;

      const q = search.toLowerCase();

      return levels.filter((item) => {
          return (
          item.level_name?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
          );
      });
  }, [levels, search]);

  /* ===============================
     Create / Update
     =============================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      level_name: levelName,
      description,
    };

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      setLevelName("");
      setDescription("");
      setEditingId(null);
      await fetchEducationLevels();
    } catch (err) {
      setError(err.message || "Failed to save education level");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     Delete (Soft)
     =============================== */
  const handleDelete = async (id) => {
    if (!confirm("Delete this education level?")) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      await fetchEducationLevels();
    } catch (err) {
      setError(err.message || "Failed to delete education level");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     Edit Helpers
     =============================== */
  const startEdit = (item) => {
    setLevelName(item.level_name);
    setDescription(item.description || "");
    setEditingId(item.id);
  };

  const cancelEdit = () => {
    setLevelName("");
    setDescription("");
    setEditingId(null);
    setError(null);
  };

  if (token === null) return <div className="p-6">Loading session...</div>;
  if (!token) return <div className="p-6 text-red-600">Not authenticated</div>;

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <h2 className="text-2xl font-bold mb-8">Manage Education Levels</h2>
      <div className=" bg-gray-50 p-6 rounded-xl shadow overflow-x-auto">
        <h3 className="text-lg font-semibold mb-2">
          {editingId ? "Update" : "Add"} Education Level
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 mb-6 text-sm">
          <input
            type="text"
            required
            placeholder="Education level name"
            value={levelName}
            onChange={(e) => setLevelName(e.target.value)}
            disabled={loading}
            className="w-full border rounded px-3 py-2"
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            className="w-full border rounded px-3 py-2"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {editingId ? "Update" : "Add"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <h3 className="text-lg font-semibold mb-2">Existing Education Levels</h3>
        <ul className="space-y-2">
          {levels.length === 0 && (
            <li className="text-gray-500 text-sm">No education levels yet.</li>
          )}
            <section className="border-single border-b-2 py-3 mb-4 border-gray-400">
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, description…"
                className="w-full border border-1 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            </section>
            <div className="overflow-x-auto h-[40vh] overflow-y-auto">

              {filteredEducationLevels.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between items-start border rounded px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.level_name}</p>
                    {item.description && (
                      <p className="text-xs text-gray-600">{item.description}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-blue-600 text-base"
                      disabled={loading}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 text-base"
                      disabled={loading}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </li>
              ))}
            </div>  
        </ul>
      </div>
    </div>
  );
}
