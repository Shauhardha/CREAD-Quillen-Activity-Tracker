import { useEffect, useState, useRef, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { API_BASE } from "../config";
import { fetchAuthSession } from "aws-amplify/auth";
import { FaTrash, FaEdit } from "react-icons/fa";

export default function StakeholdersManager({ accessToken }) {
  const { isReadOnly } = useOutletContext() ?? {};
  const headers = { Authorization: `Bearer ${accessToken}` };

  const [form, setForm] = useState({
    name: "",
    type_id: "",
    organization: "",
    email: "",
    phone: "",
    website: "",
    description: "",
    location_id: "",
  });

  const [editingId, setEditingId] = useState(null);

  /* Dropdown data */
  const [stakeholderTypes, setStakeholderTypes] = useState([]); // partnership_types
  const [stakeholders, setStakeholders] = useState([]);

  /* Location cascade (same as ActivityManager) */
  const [states, setStates] = useState([]);
  const [counties, setCounties] = useState([]);
  const [cities, setCities] = useState([]);
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [city, setCity] = useState("");

  const skipCascadeRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  /* Load reference data */
  useEffect(() => {
    fetch(`${API_BASE}/misc/partnership-types`, { headers }).then(r => r.json()).then(setStakeholderTypes);
    fetch(`${API_BASE}/locations/states`, { headers }).then(r => r.json()).then(setStates);
    fetchStakeholders();
  }, [accessToken]);

  const fetchStakeholders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/stakeholders/`, { headers });
      if (!res.ok) throw new Error("Failed to load stakeholders");
      const data = await res.json();
      setStakeholders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
      if (!search.trim()) return stakeholders;

      const q = search.toLowerCase();

      return stakeholders.filter((item) => {
          return (
          item.name?.toLowerCase().includes(q) ||
          item.organization?.toLowerCase().includes(q) ||
          item.email?.toLowerCase().includes(q) ||
          item.phone?.toLowerCase().includes(q) ||
          item.organization?.toLowerCase().includes(q) 
          );
      });
  }, [stakeholders, search]);

  /* Location cascade effects (copied from ActivityManager) */
  useEffect(() => {
    if (skipCascadeRef.current) return;
    if (!state) {
      setCounties([]);
      setCities([]);
      setCounty("");
      setCity("");
      setForm(f => ({ ...f, location_id: "" }));
      return;
    }
    fetch(`${API_BASE}/locations/counties?state=${state}`, { headers })
      .then(r => r.json())
      .then(setCounties);
    setCounty("");
    setCity("");
    setCities([]);
    setForm(f => ({ ...f, location_id: "" }));
  }, [state, accessToken]);

  useEffect(() => {
    if (skipCascadeRef.current) return;
    if (!state || !county) {
      setCities([]);
      setCity("");
      setForm(f => ({ ...f, location_id: "" }));
      return;
    }
    fetch(`${API_BASE}/locations/cities?state=${state}&county=${encodeURIComponent(county)}`, { headers })
      .then(r => r.json())
      .then(setCities);
    setCity("");
    setForm(f => ({ ...f, location_id: "" }));
  }, [county, state, accessToken]);

  useEffect(() => {
    if (skipCascadeRef.current) return;
    if (!state || !county || !city) {
      setForm(f => ({ ...f, location_id: "" }));
      return;
    }
    fetch(`${API_BASE}/locations/id/?state=${encodeURIComponent(state)}&county=${encodeURIComponent(county)}&city=${encodeURIComponent(city)}`, { headers })
      .then(r => r.json())
      .then(data => {
        const id = data?.id ?? data; // Handles both object {id} and plain number
        setForm(f => ({ ...f, location_id: id }));
      })
      .catch(() => setForm(f => ({ ...f, location_id: "" })));
  }, [city, county, state, accessToken]);

  /* Handlers */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...form,
      type_id: Number(form.type_id),
      location_id: form.location_id ? Number(form.location_id) : null,
    };

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API_BASE}/stakeholders/${editingId}` : `${API_BASE}/stakeholders/`;

    try {
      const { tokens } = await fetchAuthSession();
      if (!tokens?.idToken) return;

      const headers = {
            Authorization: `Bearer ${tokens.idToken.toString()}`,
            "Content-Type": "application/json"
        };
        
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text() || "Failed");

      resetForm();
      await fetchStakeholders();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this stakeholder?")) return;
    try {
      await fetch(`${API_BASE}/stakeholders/${id}`, {
        method: "DELETE",
        headers,
      });
      await fetchStakeholders();
    } catch (err) {
      setError("Delete failed");
    }
  };

  const startEdit = async (stakeholder) => {
    let full = stakeholder;
    try {
      const res = await fetch(`${API_BASE}/stakeholders/${stakeholder.id}`, { headers });
      if (res.ok) full = await res.json();
    } catch {}

    setForm({
      name: full.name || "",
      type_id: full.type_id || "",
      organization: full.organization || "",
      email: full.email || "",
      phone: full.phone || "",
      website: full.website || "",
      description: full.description || "",
      location_id: full.location_id || "",
    });

    // Populate location cascade (same as ActivityManager)
    const loc = full.location;
    if (loc) {
      skipCascadeRef.current = true;
      setState(loc.state || "");
      const countiesRes = await fetch(`${API_BASE}/locations/counties?state=${encodeURIComponent(loc.state || "")}`, { headers });
      
      if (countiesRes.ok) setCounties(await countiesRes.json());
      setCounty(loc.county || "");
      

      const citiesRes = await fetch(`${API_BASE}/locations/cities?state=${encodeURIComponent(loc.state || "")}&county=${encodeURIComponent(loc.county || "")}`, { headers });
      if (citiesRes.ok) setCities(await citiesRes.json());
      setCity(loc.city || "");
      skipCascadeRef.current = false;
    } else {
      setState("");
      setCounty("");
      setCity("");
      setCounties([]);
      setCities([]);
    }

    setEditingId(full.id);
  };

  const resetForm = () => {
    setForm({
      name: "",
      type_id: "",
      organization: "",
      email: "",
      phone: "",
      website: "",
      description: "",
      location_id: "",
    });
    setState("");
    setCounty("");
    setCity("");
    setCounties([]);
    setCities([]);
    setEditingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto mt-6">
      <h2 className="text-2xl font-bold mb-8">Stakeholder Management</h2>
      <div className=" rounded-xl shadow overflow-x-auto  space-y-8">

        {/* View-only banner for non-admin users */}
        {isReadOnly && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            You have view-only access. Contact an admin to make changes.
          </div>
        )}

        {/* Form — admin only */}
        {!isReadOnly && <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-6 text-sm">
            <h2 className="text-lg font-semibold">{editingId ? "Edit Stakeholder" : "Add New Stakeholder"}</h2>
            {error && <p className="text-red-600 bg-red-50 p-3 rounded">{error}</p>}

            <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name (required)"
            required
            className="w-full border p-2 rounded"
            />

            <select
            name="type_id"
            value={form.type_id}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
            >
            <option value="">Select Partnership Type</option>
            {stakeholderTypes.map(t => (
                <option key={t.id} value={t.id}>{t.type_name}</option>
            ))}
            </select>

            <input
            name="organization"
            value={form.organization}
            onChange={handleChange}
            placeholder="Organization (optional)"
            className="w-full border p-2 rounded"
            />

            <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email (optional)"
            className="w-full border p-2 rounded"
            />

            <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone (optional)"
            className="w-full border p-2 rounded"
            />

            <input
            name="website"
            value={form.website}
            onChange={handleChange}
            placeholder="Website (optional)"
            className="w-full border p-2 rounded"
            />

            <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description (optional)"
            className="w-full border p-2 rounded h-32"
            />

            {/* Location Cascade - Identical to ActivityManager */}
            <select value={state} onChange={e => setState(e.target.value)} required className="w-full border p-2 rounded">
            <option value="">Select State</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select value={county} onChange={e => setCounty(e.target.value)} disabled={!state} required className="w-full border p-2 rounded">
            <option value="">Select County</option>
            {counties.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={city} onChange={e => setCity(e.target.value)} disabled={!county} required className="w-full border p-2 rounded">
            <option value="">Select City</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="flex gap-4">
            <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                {editingId ? "Update Stakeholder" : "Create Stakeholder"}
            </button>
            {editingId && (
                <button type="button" onClick={resetForm} className="flex-1 bg-gray-400 text-white py-2 rounded">
                Cancel
                </button>
            )}
            </div>
        </form>}

        {/* Stakeholders List */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-lg font-semibold mb-6">Current Stakeholders</h2>
            {loading ? (
            <p className="text-gray-500">Loading...</p>
            ) : stakeholders.length === 0 ? (
            <p className="text-gray-500">No stakeholders yet.</p>
            ) : (
            <div>
                <section className="border-single border-b-2 py-3 mb-4 border-gray-400">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, organization or email…"
                    className="w-full border border-1 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                </section>
                <div className="overflow-x-auto h-[50vh] overflow-y-auto">
                {filteredItems.map(st => (
                <div key={st.id} className="border rounded-lg p-4 flex justify-between items-start text-sm">
                    <div>
                    <h3 className="font-semibold">{st.name}</h3>
                    <p className="text-xs text-gray-600">
                        Type: {stakeholderTypes.find(t => t.id === st.type_id)?.type_name || "Unknown"}
                    </p>
                    {st.organization && <p className="text-xs">Org: {st.organization}</p>}
                    <div className="flex flex-row gap-2">
                    {st.email && <p className="text-xs">{st.email}</p>}  {st.phone && <p className="text-xs">({st.phone})</p>}
                    </div>
                    {/* {st.website && <p className="text-xs" type="url">{st.website}</p>} */}
                    {st.location && (
                        <p className="text-xs">
                        Location: {st.location.city}, {st.location.county}, {st.location.state}
                        </p>
                    )}
                    </div>
                    {!isReadOnly && (
                      <div className="flex gap-3">
                      <button onClick={() => startEdit(st)} className="text-blue-600">
                          <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(st.id)} className="text-red-600">
                          <FaTrash />
                      </button>
                      </div>
                    )}
                </div>
                ))}
                </div>
            </div>
            )}
        </div>
      </div>
    </div>
  );
}