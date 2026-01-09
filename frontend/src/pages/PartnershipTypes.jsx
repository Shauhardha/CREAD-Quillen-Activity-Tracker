import { useEffect, useState } from "react";
import { API_BASE } from "../config";
import { fetchAuthSession } from "aws-amplify/auth";
import { FaTrash, FaSave, FaEdit, FaTimesCircle } from "react-icons/fa";


export default function PartnershipTypes({ accessToken }) {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState({ id: null, type_name: "", description: "" });
	const [editing, setEditing] = useState(false);

	useEffect(() => {
		fetchList();
	}, []);

	async function fetchList() {
		setLoading(true);
		try {
			const res = await fetch(`${API_BASE}/misc/partnership-types`, {
				headers: accessToken
					? { Authorization: `Bearer ${accessToken}` }
					: undefined,
			});

			if (!res.ok) throw new Error("no-api");

			const data = await res.json();
			// Show only active (deleted_at === null)
			setItems(Array.isArray(data) ? data.filter((d) => !d.deleted_at) : []);
		} catch (err) {
			console.warn("Failed to load partnership types from API, using empty list", err);
			setItems([]);
		} finally {
			setLoading(false);
		}
	}

	function resetForm() {
		setForm({ id: null, type_name: "", description: "" });
		setEditing(false);
	}

	async function handleSubmit(e) {
		e.preventDefault();
		const payload = { type_name: form.type_name, description: form.description };

		try {
			if (editing && form.id) {
				// update
				const res = await fetch(`${API_BASE}/misc/partnership-types/${form.id}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
					},
					body: JSON.stringify(payload),
				});

				if (!res.ok) throw new Error("update-failed");
				const updated = await res.json();
				setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
			} else {
				// create
				const res = await fetch(`${API_BASE}/misc/partnership-types`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
					},
					body: JSON.stringify(payload),
				});

				if (!res.ok) throw new Error("create-failed");
				const created = await res.json();
				// only show if not soft-deleted
				if (!created.deleted_at) setItems((prev) => [created, ...prev]);
			}

			resetForm();
		} catch (err) {
			console.warn("API unavailable or request failed; updating local state only", err);
			// Fallback: optimistic local update
			if (editing && form.id) {
				setItems((prev) => prev.map((p) => (p.id === form.id ? { ...p, ...payload } : p)));
			} else {
				const fake = { id: Date.now(), ...payload, deleted_at: null };
				setItems((prev) => [fake, ...prev]);
			}
			resetForm();
		}
	}

	function handleEdit(item) {
		setForm({ id: item.id, type_name: item.type_name || "", description: item.description || "" });
		setEditing(true);
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	async function handleDelete(item) {
        const confirmed = window.confirm(
        `Delete partnership type "${item.type_name}"? This cannot be undone.`
        );
        if (!confirmed) return;

        try {
            const { tokens } = await fetchAuthSession();
            if (!tokens?.idToken) throw new Error("Not authenticated");

            const headers = {
                Authorization: `Bearer ${tokens.idToken.toString()}`,
                "Content-Type": "application/json"
            };    
            const res = await fetch(
            `${API_BASE}/misc/partnership-types/${item.id}`,
            {
            method: "DELETE",
            headers,
            }
        );

        if (!res.ok) throw new Error("delete-failed");

        setItems((prev) => prev.filter((p) => p.id !== item.id));
        } catch (err) {
        console.error("Delete failed", err);
        alert("Failed to delete partnership type");
        }
    }

	return (
		<div className="max-w-xl md:max-w-4xl mx-auto">
			<h2 className="text-2xl font-bold mb-4">Partnership Types</h2>
            <div className=" bg-gray-50 p-6 rounded-xl shadow overflow-x-auto">
                <h3 className="text-lg font-semibold mb-4">
                {editing ? "Update" : "Add"} Partnership Type
                </h3>
                <form onSubmit={handleSubmit} className="mb-6 text-sm">
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700">Type name</label>
                        <input
                            value={form.type_name}
                            onChange={(e) => setForm((f) => ({ ...f, type_name: e.target.value }))}
                            placeholder="Partnership name"
                            required
                            className="mt-1 block w-full rounded-md border shadow-sm p-2"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            placeholder="Description of the partnership type"
                            className="mt-1 block w-full rounded-md border shadow-sm p-2"
                        />
                    </div>

                    <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" type="submit">
                            {editing ? "Save" : "Add"}
                        </button>
                        {editing && (   
                            <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-200 rounded">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                <div>
                    <h3 className="font-medium mb-2">Active Partnership Types</h3>
                    {loading ? (
                        <div>Loading...</div>
                    ) : items.length === 0 ? (
                        <div className="text-sm text-gray-500">No partnership types found.</div>
                    ) : (
                        <div className="overflow-x-auto h-[40vh] overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200 table-fixed w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Name</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 ">Description</th>
                                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500 ">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100 text-[11px] md:text-sm">
                                    {items.map((it) => (
                                        <tr key={it.id}>
                                            <td className="px-4 py-2 align-top">{it.type_name}</td>
                                                <td className="px-4 py-2 align-top break-words whitespace-normal max-w-[40ch]">{it.description}</td>
                                            <td className="px-4 py-2 align-top">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                    onClick={() => handleEdit(it)}
                                                    className="px-3 py-1 rounded text-base text-blue-600"
                                                    >
                                                    <FaEdit />
                                                    </button>
                                                    <button
                                                    onClick={() => handleDelete(it)}
                                                    className="px-3 py-1 text-red-600 rounded text-base"
                                                    >
                                                    <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>    
		</div>
	);
}
