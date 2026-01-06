import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { fetchAuthSession } from "aws-amplify/auth";
import { FaTrash, FaSave, FaEdit, FaTimesCircle } from "react-icons/fa";


function AddUserForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff'  // default
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState([]);
  const [token, setToken] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: 'staff', is_active: true });

  // Ensure form is cleared each time the component mounts (prevents stale values/autofill remnants)
  useEffect(() => {
    setFormData({ name: '', email: '', password: '', role: 'staff' });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  function validatePassword(pw) {
    const errors = [];
    if (!pw || pw.length < 8) errors.push('Minimum 8 characters');
    if (!/[0-9]/.test(pw)) errors.push('At least one number');
    if (!/[a-z]/.test(pw)) errors.push('At least one lowercase letter');
    if (!/[A-Z]/.test(pw)) errors.push('At least one uppercase letter');
    const specialSet = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?~`]/;
    const hasSpecial = specialSet.test(pw);
    const hasInternalSpace = /\S[ ]+\S/.test(pw);
    if (!hasSpecial && !hasInternalSpace) errors.push('At least one special character or a non-leading/non-trailing space');
    return errors;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // ensure latest users list then validate uniqueness and password
      await fetchUsers();
      if (formData.email && users.some((u) => u.email && u.email.toLowerCase() === formData.email.toLowerCase())) {
        const msg = 'This email is already in use.';
        setMessage(msg);
        try { window.alert(msg); } catch (e) {}
        setLoading(false);
        return;
      }

      const pwErrors = validatePassword(formData.password);
      if (pwErrors.length > 0) {
        const msg = 'Password invalid: ' + pwErrors.join('; ');
        setMessage(msg);
        try { window.alert(msg); } catch (e) {}
        setLoading(false);
        return;
      }

      // Get fresh token from Cognito (same as your fetchLogs)
      // get access token
      const { tokens } = await fetchAuthSession();
      if (!tokens?.idToken) throw new Error("Not authenticated");

      const headers = {
        Authorization: `Bearer ${tokens.idToken.toString()}`,
        "Content-Type": "application/json"
      };

      const res = await fetch(`${API_BASE}/admin/add-user`, {
        method: "POST",
        headers,
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      setMessage(`Success! User added. Cognito Sub: ${data.sub}`);
      // show alert to user
      try { window.alert(`User added: ${formData.email || data.sub}`); } catch (e) {}
      // Optional: clear form
      setFormData({ name: '', email: '', password: '', role: 'staff' });
      // refresh users list so the newly added user appears
      await fetchUsers();

    } catch (err) {
      console.error("Failed to add user:", err);
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users (admin)
  const fetchUsers = async () => {
    try {
      const { tokens } = await fetchAuthSession();
      if (!tokens?.idToken) throw new Error("Not authenticated");

      const headers = {
        Authorization: `Bearer ${tokens.idToken.toString()}`,
        "Content-Type": "application/json"
      };

      const res = await fetch(`${API_BASE}/admin/users`, {
        headers,
      });

      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      // coerce is_active to boolean (DB may return 1/0 or '1'/'0')
      const normalized = data.map((u) => ({
        ...u,
        is_active: u.is_active === true || u.is_active === 1 || u.is_active === '1' || u.is_active === 'true',
      }));
      setUsers(normalized);
    } catch (err) {
      console.error('fetchUsers error', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({ name: user.name || '', role: user.role || 'staff', is_active: !!user.is_active });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', role: 'staff', is_active: true });
  };

  const saveEdit = async (id) => {
    try {
      
      const { tokens } = await fetchAuthSession();
      if (!tokens?.idToken) throw new Error("Not authenticated");

      const headers = {
        Authorization: `Bearer ${tokens.idToken.toString()}`,
        "Content-Type": "application/json"
      };


      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to update user');
      }

      await fetchUsers();
      try { window.alert(`User updated: ${editForm.name || id}`); } catch (e) {}
      cancelEdit();
    } catch (err) {
      console.error('saveEdit error', err);
      setMessage('Error updating user: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This action will remove them from Cognito.')) return;

    try {
      const { tokens } = await fetchAuthSession();
      if (!tokens?.idToken) throw new Error('Not authenticated');

      const headers = {
        Authorization: `Bearer ${tokens.idToken.toString()}`,
        'Content-Type': 'application/json',
      };

      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to delete user');
      }

      setMessage('User deleted');
      await fetchUsers();
    } catch (err) {
      console.error('delete user error', err);
      setMessage('Error deleting user: ' + err.message);
    }
  };

  return (
    <div className=" mx-auto bg-gray-100 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-8 text-black">User Management</h2>

      <div className="bg-white p-4 rounded-lg shadow">      

          <h3 className="text-lg font-semibold mb-4 text-black">Add New User</h3>
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-sm text-black font-semibold mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border bg-gray-100 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-sm text-black font-medium mb-1">Email (used for login)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full px-4 py-2 border bg-gray-100 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-sm text-black font-medium mb-1">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
                autoComplete="new-password"
                className="w-full px-4 py-2 border bg-gray-100 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
                <div className="mt-2 ml-1 flex items-center text-sm">
                  <input
                    id="show-password"
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="mr-2 w-4 h-4 bg-white text-black border-gray-300 rounded"
                  />
                  <label htmlFor="show-password" className="text-gray-700">Show password</label>
                </div>
            </div>

            <div>
              <label className="block text-sm text-black font-medium mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border bg-gray-100 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="read_only">Read Only</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Adding User..." : "Add User"}
            </button>
          </form>
      </div> 

      {/* {message && (
        <div className={`mt-6 p-4 rounded-lg text-center ${message.includes("Success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message}
        </div>
      )} */}
      
      {/* Users table */}
      <div className="mt-8 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3 text-black">Users List</h3>
        <div className="h-[30vh] overflow-x-auto overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm text-gray-600 border-b">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Active</th>
                <th className="py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b text-sm">
                  <td className="py-2 px-3">
                    {editingId === u.id ? (
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="px-2 py-1 border rounded" />
                    ) : (
                      u.name
                    )}
                  </td>
                  <td className="py-2 px-3">{u.email}</td>
                  <td className="py-2 px-3">
                    {editingId === u.id ? (
                      <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="px-2 py-1 border rounded">
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="read_only">Read Only</option>
                      </select>
                    ) : (
                      u.role
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {editingId === u.id ? (
                      <input type="checkbox" checked={!!editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} />
                    ) : (
                      u.is_active ? 'Yes' : 'No'
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {editingId === u.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(u.id)} className="px-3 py-1 bg-green-600 text-white rounded"><FaSave /></button>
                        <button onClick={cancelEdit} className="px-3 py-1 border rounded text-base"><FaTimesCircle /></button>
                        <button onClick={() => handleDelete(u.id)} className="px-3 py-1 bg-red-600 text-white rounded"><FaTrash /></button>
                      </div>
                    ) : (
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(u)} className="px-3 py-1 border rounded"><FaEdit /></button>            
                          </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div> 
    </div>
  );
}

export default AddUserForm;