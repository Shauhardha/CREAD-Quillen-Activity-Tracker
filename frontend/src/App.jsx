import { useState, useEffect } from "react";
import { getCurrentUser, signOut, fetchAuthSession } from "aws-amplify/auth";

import CustomAuthenticator from "./pages/customAuthenticator";
import AddUserForm from "./pages/UserManagement"; 
import InitiativesManager from "./pages/InitiativesManager";

import bgPassword from "./assets/auth-bg-2.jpg";

/* ===============================
   Authenticated App Component
   =============================== */
function AuthenticatedApp({ user, signOut }) {
  const [page, setPage] = useState("home");
  const [accessToken, setAccessToken] = useState(null);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    async function loadSession() {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString();
        const payload = session.tokens?.accessToken?.payload;
        // console.log("Access token being sent:", token);
        // console.log("Payload token being sent:", payload);

        setAccessToken(token);
        setGroups(payload?.["cognito:groups"] || []);
      } catch (err) {
        console.error("Failed to fetch auth session:", err);
      }
    }

    loadSession();
  }, []);

  const isAdmin = groups.includes("admin");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
    style={{
        backgroundImage: `url(${bgPassword})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
    }}
    >
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Activity Tracker
          </h1>

          <div className="space-x-3">
            <button
              onClick={() => setPage("home")}
              className="px-4 py-2 rounded-lg border border-blue-600 border-2 text-blue-600 bg-white hover:border-black hover:text-black"
            >
              Home
            </button>

            {isAdmin && (
              <button
                onClick={() => setPage("add")}
                className="px-4 py-2 rounded-lg border border-blue-600 border-2 text-blue-600 bg-white hover:border-black hover:text-black"
              >
                Add User
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setPage("initiatives")}
                className="px-4 py-2 rounded-lg border border-blue-600 border-2 text-blue-600 bg-white hover:border-black hover:text-black"
              >
                Manage Initiatives
              </button>
            )}

            <button
              onClick={signOut}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Home */}
        {page === "home" && (
          <div className="bg-white p-6 rounded-xl shadow">            
            
            <p className="text-lg mb-2 text-black">
              Logged in as{" "}
              <strong>{user?.attributes?.email ?? "Unknown"}</strong>
            </p>

            <p className="text-sm text-gray-600 mb-2">
              Groups: {groups.length ? groups.join(", ") : "None"}
            </p>

            <p className="text-xs text-gray-400 break-all">
              Access Token Loaded: {accessToken ? "Yes" : "No"}
            </p>
          </div>
        )}

        {/* Admin: Add User */}
        {page === "add" && isAdmin && (
          <div className="mt-6">
            <AddUserForm accessToken={accessToken} />
          </div>
        )}
        {page === "initiatives" && isAdmin && (
          <div className="mt-6">
            <InitiativesManager accessToken={accessToken} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ===============================
   Root App
   =============================== */
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, []);

  if (loading) return null;

  if (!user) {
    return <CustomAuthenticator onSignedIn={setUser} />;
  }

  return (
    <AuthenticatedApp
      user={user}
      signOut={async () => {
        await signOut();
        setUser(null);
      }}
    />
  );
}
