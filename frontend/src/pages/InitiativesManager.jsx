import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE } from "../config";
import { FaTrash, FaSave, FaEdit, FaTimesCircle } from "react-icons/fa";

const API_URL = `${API_BASE}/initiatives`;

export default function InitiativesManager() {
  const [initiatives, setInitiatives] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  console.log("Current API_BASE:", API_BASE);

  // Load token ONCE
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await fetchAuthSession();
        const accessToken = session.tokens?.accessToken?.toString();
        setToken(accessToken || null);
      } catch {
        setToken(null);
      }
    };

    loadSession();
  }, []);

  // Fetch initiatives AFTER token is resolved
  useEffect(() => {
    if (token !== null) {  // Wait for token resolution (even if null)
      fetchInitiatives();
    }
  }, [token]);

  const fetchInitiatives = async () => {
    setError(null);  // Clear previous errors
    try {
    //   console.log("Fetching initiatives with token:", token ? "present" : "none");
      const res = await fetch(`${API_URL}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Fetch initiatives failed:", res.status, text);
        setError(text || `Failed to load (status: ${res.status})`);
        return;
      }

      const data = await res.json();
    //   console.log("Initiatives from API:", data);
      setInitiatives(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load initiatives - check network or server");
    }
  };

  // Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const submittedName = name;
    setName("");

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ name: submittedName }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed (status: ${res.status})`);
      }

      setEditingId(null);
      await fetchInitiatives();
    } catch (err) {
      setError(err.message || "Failed to save initiative");
      setName(submittedName);
    } finally {
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!confirm("Delete this initiative?")) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Delete failed (status: ${res.status})`);
      }

      await fetchInitiatives();
    } catch (err) {
      setError(err.message || "Failed to delete initiative");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (initiative) => {
    setName(initiative.name);
    setEditingId(initiative.id);
    setError(null);
  };

  const cancelEdit = () => {
    setName("");
    setEditingId(null);
    setError(null);
  };

  if (token === null) {
    return <div className="max-w-xl mx-auto p-6">Loading session...</div>;
  }

  if (!token) {
    return <div className="max-w-xl mx-auto p-6 text-red-600">Not authenticated - please log in.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto rounded-xl ">
      <h2 className="text-2xl font-bold mb-8">Manage Initiatives X</h2>

        <div className=" bg-gray-50 p-6 rounded-xl shadow overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">{editingId ? "Update" : "Add"} Initiatives</h3>  
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-4 text-sm">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Initiative name"
              disabled={loading}
              className="flex-1 border rounded px-3 py-2 disabled:bg-gray-100"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : editingId ? "Update" : "Add"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border rounded"
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {error && <p className="text-red-600 mb-3">{error}</p>}

          
          <h3 className="text-lg font-semibold mt-8 mb-2">Existing Initiatives</h3>
          <ul className="space-y-2">
            {initiatives.length === 0 && (
              <li className="text-gray-500 text-sm">No initiatives yet.</li>
            )}

            {initiatives.map((initiative) => (
              <li
                key={initiative.id}
                className="flex justify-between items-center border rounded px-3 py-2 text-xs md:text-sm"
              >
                <span className="mr-1.5">{initiative.name}</span>
                <div className="flex gap-4">
                  <button
                    onClick={() => startEdit(initiative)}
                    className="text-blue-600 text-base"
                    disabled={loading}
                  >
                    {/* Edit */}
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(initiative.id)}
                    className="text-red-600 text-base"
                    disabled={loading}
                  >
                    {/* Delete */}
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