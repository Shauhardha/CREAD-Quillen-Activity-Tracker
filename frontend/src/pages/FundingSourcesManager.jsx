import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE } from "../config";
import { FaTrash, FaEdit } from "react-icons/fa";

const API_URL = `${API_BASE}/misc/funding-sources`;

export default function FundingSourcesManager() {
  const [sources, setSources] = useState([]);
  const [sourceName, setSourceName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  // Load auth token ONCE
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

  // Fetch after token resolves
  useEffect(() => {
    if (token !== null) {
      fetchFundingSources();
    }
  }, [token]);

  const fetchFundingSources = async () => {
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

      setSources(await res.json());
    } catch {
      setError("Failed to load funding sources");
    }
  };

  // Create / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      source_name: sourceName,
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

      setSourceName("");
      setDescription("");
      setEditingId(null);
      await fetchFundingSources();
    } catch (err) {
      setError(err.message || "Failed to save funding source");
    } finally {
      setLoading(false);
    }
  };

  // Delete (soft delete)
  const handleDelete = async (id) => {
    if (!confirm("Delete this funding source?")) return;

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

      await fetchFundingSources();
    } catch (err) {
      setError(err.message || "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    setSourceName(item.source_name);
    setDescription(item.description || "");
    setEditingId(item.id);
  };

  const cancelEdit = () => {
    setSourceName("");
    setDescription("");
    setEditingId(null);
    setError(null);
  };

  if (token === null) return <div className="p-6">Loading session...</div>;
  if (!token) return <div className="p-6 text-red-600">Not authenticated</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-8">Manage Funding Sources</h2>

      <h3 className="text-lg font-semibold mb-2">
        {editingId ? "Update" : "Add"} Funding Source
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3 mb-6 text-sm">
        <input
          type="text"
          required
          placeholder="Source name"
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
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
            className="bg-blue-600 text-white px-4 py-2 rounded"
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

      <h3 className="text-lg font-semibold mb-2">Existing Funding Sources</h3>
      <ul className="space-y-2">
        {sources.length === 0 && (
          <li className="text-gray-500 text-sm">No funding sources yet.</li>
        )}

        {sources.map((item) => (
          <li
            key={item.id}
            className="flex justify-between items-start border rounded px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium">{item.source_name}</p>
              {item.description && (
                <p className="text-xs text-gray-600">{item.description}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => startEdit(item)}
                className="text-blue-600"
                disabled={loading}
              >
                <FaEdit />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-red-600"
                disabled={loading}
              >
                <FaTrash />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
