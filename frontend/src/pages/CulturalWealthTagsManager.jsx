import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE } from "../config";
import { FaTrash, FaEdit } from "react-icons/fa";

const API_URL = `${API_BASE}/misc/cultural-wealth-tags`;

export default function CulturalWealthTagsManager() {
  const [tags, setTags] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

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
     Fetch Tags After Token
     =============================== */
  useEffect(() => {
    if (token !== null) {
      fetchTags();
    }
  }, [token]);

  const fetchTags = async () => {
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

      setTags(await res.json());
    } catch {
      setError("Failed to load cultural wealth tags");
    }
  };

  /* ===============================
     Create / Update
     =============================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = { name, description };

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

      setName("");
      setDescription("");
      setEditingId(null);
      await fetchTags();
    } catch (err) {
      setError(err.message || "Failed to save tag");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     Delete (Soft)
     =============================== */
  const handleDelete = async (id) => {
    if (!confirm("Delete this cultural wealth tag?")) return;

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

      await fetchTags();
    } catch (err) {
      setError(err.message || "Failed to delete tag");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     Edit Helpers
     =============================== */
  const startEdit = (tag) => {
    setName(tag.name);
    setDescription(tag.description || "");
    setEditingId(tag.id);
  };

  const cancelEdit = () => {
    setName("");
    setDescription("");
    setEditingId(null);
    setError(null);
  };

  if (token === null) return <div className="p-6">Loading session...</div>;
  if (!token) return <div className="p-6 text-red-600">Not authenticated</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-8">Manage Cultural Wealth Tags</h2>
      <div className=" bg-gray-50 p-6 rounded-xl shadow overflow-x-auto">
        <h3 className="text-lg font-semibold mb-2">
          {editingId ? "Update" : "Add"} Tag
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 mb-6 text-sm">
          <input
            type="text"
            required
            placeholder="Tag name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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

        <h3 className="text-lg font-semibold mb-2">Existing Tags</h3>
        <ul className="space-y-2">
          {tags.length === 0 && (
            <li className="text-gray-500 text-sm">No cultural wealth tags yet.</li>
          )}

          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex justify-between items-start border rounded px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{tag.name}</p>
                {tag.description && (
                  <p className="text-xs text-gray-600">{tag.description}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => startEdit(tag)}
                  className="text-blue-600 text-base"
                  disabled={loading}
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="text-red-600 text-base"
                  disabled={loading}
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
