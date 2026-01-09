import { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { API_BASE } from "../config";
import { fetchAuthSession } from "aws-amplify/auth";

export default function ActivityManager() {
  const outlet = useOutletContext();
  const accessToken = outlet?.accessToken;

  const [form, setForm] = useState({
    title: "",
    description: "",
    initiative_id: "",
    lead_staff_ids: [],
    status: "planned",
    start_date: "",
    end_date: "",
    education_level_id: "",
    partnership_type_id: "",
    funding_source_id: "",
    location_id: "",
    notes: "",
  });

  const [editingId, setEditingId] = useState(null);

  /* Dropdown data */
  const [initiatives, setInitiatives] = useState([]);
  const [users, setUsers] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  const [partnershipTypes, setPartnershipTypes] = useState([]);
  const [fundingSources, setFundingSources] = useState([]);

  /* Location cascade */
  const [states, setStates] = useState([]);
  const [counties, setCounties] = useState([]);
  const [cities, setCities] = useState([]);
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [city, setCity] = useState("");

  const skipCascadeRef = useRef(false); // Prevents unwanted cascade during edit

  /* Lead staff dropdown */
  const [showLeads, setShowLeads] = useState(false);
  const leadsRef = useRef(null);

  /* Activities list */
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* Fetch users */
  const fetchUsers = async () => {
    try {
      const { tokens } = await fetchAuthSession();
      if (!tokens?.idToken) return;

      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: {
          Authorization: `Bearer ${tokens.idToken.toString()}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data.map(u => ({
        ...u,
        is_active: u.is_active === true || u.is_active === 1 || u.is_active === '1',
      })));
    } catch (err) {
      console.error("fetchUsers error", err);
    }
  };

  /* Load reference data */
  useEffect(() => {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

    fetchUsers();
    fetch(`${API_BASE}/initiatives/`, { headers }).then(r => r.json()).then(setInitiatives);
    fetch(`${API_BASE}/misc/education-levels`, { headers }).then(r => r.json()).then(setEducationLevels);
    fetch(`${API_BASE}/misc/partnership-types`, { headers }).then(r => r.json()).then(setPartnershipTypes);
    fetch(`${API_BASE}/misc/funding-sources`, { headers }).then(r => r.json()).then(setFundingSources);
    fetch(`${API_BASE}/locations/states`, { headers }).then(r => r.json()).then(setStates);

    fetchActivities();
  }, [accessToken]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/activities/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load activities");
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* Location cascade effects */
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

    fetch(`${API_BASE}/locations/counties?state=${state}`, { headers: { Authorization: `Bearer ${accessToken}` } })
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

    fetch(`${API_BASE}/locations/cities?state=${state}&county=${encodeURIComponent(county)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(setCities);
    setCity("");
    setForm(f => ({ ...f, location_id: "" }));
  }, [county, state, accessToken]);

//   useEffect(() => {
//     if (skipCascadeRef.current) return;

//     if (!state || !county || !city) {
//       setForm(f => ({ ...f, location_id: "" }));
//       return;
//     }

//     fetch(`${API_BASE}/locations/id?state=${state}&county=${encodeURIComponent(county)}&city=${encodeURIComponent(city)}`, {
//       headers: { Authorization: `Bearer ${accessToken}` },
//     })
//       .then(r => r.json())
//       .then(data => {
//         const id = data?.id || "";
//         setForm(f => ({ ...f, location_id: id }));
//       })
//       .catch(() => setForm(f => ({ ...f, location_id: "" })));
//   }, [city, county, state, accessToken]);

  useEffect(() => {
    if (skipCascadeRef.current) return;

    if (!state || !county || !city) {
        setForm(f => ({ ...f, location_id: "" }));
        return;
    }

    const headers = { Authorization: `Bearer ${accessToken}` };

    // console.log("Fetching location ID for:", { state, county, city }); // DEBUG

    fetch(`${API_BASE}/locations/id?state=${encodeURIComponent(state)}&county=${encodeURIComponent(county)}&city=${encodeURIComponent(city)}`, { headers })
        .then(r => {
        // console.log("Location ID response status:", r.status); // DEBUG
        if (!r.ok) {
            console.error("Location ID fetch failed:", r.status);
            throw new Error(`HTTP ${r.status}`);
        }
        return r.json();
        })
        .then(data => {
        // console.log("Location ID raw response:", data); // DEBUG
        const id = data?.id ?? data; // Handle both {id: 5826} or just 5826
        // console.log("Setting location_id to:", id);
        setForm(f => ({ ...f, location_id: id }));
        })
        .catch(err => {
        console.error("Location ID error:", err);
        setError("Could not find location ID - check spelling or add location to DB");
        setForm(f => ({ ...f, location_id: "" }));
        // console.log(form.location_id); // DEBUG
        });
    }, [city, county, state, accessToken]);

  

  /* Close lead dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (showLeads && leadsRef.current && !leadsRef.current.contains(e.target)) {
        setShowLeads(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showLeads]);

  /* Handlers */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleLead = (id) => {
    setForm(prev => ({
      ...prev,
      lead_staff_ids: prev.lead_staff_ids.includes(id)
        ? prev.lead_staff_ids.filter(x => x !== id)
        : [...prev.lead_staff_ids, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...form,
      initiative_id: Number(form.initiative_id),
      lead_staff_ids: form.lead_staff_ids.map(Number),
      education_level_id: form.education_level_id ? Number(form.education_level_id) : null,
      partnership_type_id: form.partnership_type_id ? Number(form.partnership_type_id) : null,
      funding_source_id: form.funding_source_id ? Number(form.funding_source_id) : null,
      location_id: form.location_id ? Number(form.location_id) : null,
    };
    // console.log("Payload being sent:", payload);

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API_BASE}/activities/${editingId}` : `${API_BASE}/activities/`;

    // authentication token
    const { tokens } = await fetchAuthSession();
    if (!tokens?.idToken) throw new Error("Not authenticated");

    const headers = {
    Authorization: `Bearer ${tokens.idToken.toString()}`,
    "Content-Type": "application/json"
    };

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text() || "Failed");

      resetForm();
      await fetchActivities();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Soft delete this activity?")) return;
    try {
      await fetch(`${API_BASE}/activities/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await fetchActivities();
    } catch (err) {
      setError("Delete failed");
    }
  };

  const startEdit = async (activity) => {
    // Fetch full activity if needed (in case list view doesn't include nested data)
    let fullActivity = activity;
    try {
      const res = await fetch(`${API_BASE}/activities/${activity.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) fullActivity = await res.json();
    } catch (err) {
      console.warn("Could not fetch full activity details", err);
    }

    // Populate form
    setForm({
      title: fullActivity.title || "",
      description: fullActivity.description || "",
      initiative_id: fullActivity.initiative_id || "",
      lead_staff_ids: fullActivity.lead_staff_ids || [],
      status: fullActivity.status || "planned",
      start_date: fullActivity.start_date || "",
      end_date: fullActivity.end_date || "",
      education_level_id: fullActivity.education_level_id || "",
      partnership_type_id: fullActivity.partnership_type_id || "",
      funding_source_id: fullActivity.funding_source_id || "",
      location_id: fullActivity.location_id || "",
      notes: fullActivity.notes || "",
    });

    // Populate location cascade
    const loc = fullActivity.location;
    if (loc) {
      skipCascadeRef.current = true;

      setState(loc.state || "");
      // Load counties
      const countiesRes = await fetch(`${API_BASE}/locations/counties?state=${encodeURIComponent(loc.state || "")}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (countiesRes.ok) setCounties(await countiesRes.json());
      setCounty(loc.county || "");

      // Load cities
      const citiesRes = await fetch(`${API_BASE}/locations/cities?state=${encodeURIComponent(loc.state || "")}&county=${encodeURIComponent(loc.county || "")}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
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

    setEditingId(fullActivity.id);
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      initiative_id: "",
      lead_staff_ids: [],
      status: "planned",
      start_date: "",
      end_date: "",
      education_level_id: "",
      partnership_type_id: "",
      funding_source_id: "",
      location_id: "",
      notes: "",
    });
    setState("");
    setCounty("");
    setCity("");
    setCounties([]);
    setCities([]);
    setEditingId(null);
    setShowLeads(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-2">
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-6 text-sm">
        <h2 className="text-2xl font-bold">{editingId ? "Edit Activity" : "Create New Activity"}</h2>
        {error && <p className="text-red-600 bg-red-50 p-3 rounded">{error}</p>}

        {/* Title & Description */}
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required className="w-full border p-2 rounded" />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border p-2 rounded h-22" />

        {/* Initiative */}
        <select name="initiative_id" value={form.initiative_id} onChange={handleChange} required className="w-full border p-2 rounded">
          <option value="">Select Initiative</option>
          {initiatives.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>

        {/* Lead Staff Dropdown */}
        <div className="relative">
          <button type="button" onClick={() => setShowLeads(!showLeads)} className="w-full border p-2 rounded text-left flex justify-between items-center">
            <span>{form.lead_staff_ids.length ? `${form.lead_staff_ids.length} lead(s) selected` : "Select Lead Staff"}</span>
            <span>▼</span>
          </button>
          {showLeads && (
            <div ref={leadsRef} className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
              {users.map(u => (
                <label key={u.id} className="flex items-center p-2 hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={form.lead_staff_ids.includes(u.id)}
                    onChange={() => toggleLead(u.id)}
                    className="mr-3"
                  />
                  <span>{u.name || u.email}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Status & Dates */}
        <select name="status" value={form.status} onChange={handleChange} className="w-full border p-2 rounded">
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <div className="grid grid-cols-2 gap-4">
          <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required className="border p-2 rounded" />
          <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required className="border p-2 rounded" />
        </div>

        {/* Location Cascade */}
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

        {/* Other Dropdowns */}
        <select name="education_level_id" value={form.education_level_id} onChange={handleChange} className="w-full border p-2 rounded">
          <option value="">Education Level (Optional)</option>
          {educationLevels.map(e => <option key={e.id} value={e.id}>{e.level_name}</option>)}
        </select>

        <select name="partnership_type_id" value={form.partnership_type_id} onChange={handleChange} className="w-full border p-2 rounded">
          <option value="">Partnership Type (Optional)</option>
          {partnershipTypes.map(p => <option key={p.id} value={p.id}>{p.type_name}</option>)}
        </select>

        <select name="funding_source_id" value={form.funding_source_id} onChange={handleChange} className="w-full border p-2 rounded">
          <option value="">Funding Source (Optional)</option>
          {fundingSources.map(f => <option key={f.id} value={f.id}>{f.source_name}</option>)}
        </select>

        <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" className="w-full border p-2 rounded h-24" />

        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
            {editingId ? "Update Activity" : "Create Activity"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="flex-1 bg-gray-400 text-white py-2 rounded">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Activities List */}
      <div className="bg-white p-6 rounded-xl shadow text-sm">
        <h2 className="text-2xl font-bold mb-6">Current Activities</h2>
        {activities.length === 0 ? (
          <p className="text-gray-500">No activities yet.</p>
        ) : (
          <div className="space-y-4">
            {activities.map(act => (
              <div key={act.id} className="border rounded-lg p-4 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-base">{act.title}</h3>
                  <p className="text-sm text-gray-600">{act.status} • {act.start_date} to {act.end_date}</p>
                  {act.location && <p className="text-sm">Location: {act.location.city}, {act.location.county}, {act.location.state}</p>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => startEdit(act)} className="text-blue-600 font-medium">Edit</button>
                  <button onClick={() => handleDelete(act.id)} className="text-red-600 font-medium">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}