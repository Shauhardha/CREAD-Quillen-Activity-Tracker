import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import Sidebar from "../components/Sidebar";
import UserProfile from "../components/UserProfile";
import bgPassword from "../assets/auth-bg-2.jpg";

export default function AuthenticatedLayout({ onSignOut }) {
  const [accessToken, setAccessToken] = useState(null);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    async function loadSession() {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      const payload = session.tokens?.idToken?.payload;

      setAccessToken(token);
      setGroups(payload?.["cognito:groups"] || []);
    }
    loadSession();
  }, []);

  const isAdmin    = groups.includes("admin");
  const isReadOnly = groups.includes("read_only");

  return (
    <div className=" mx-auto flex min-h-screen bg-gray-50"
      style={{
        backgroundImage: `url(${bgPassword})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <Sidebar isAdmin={isAdmin} isReadOnly={isReadOnly} onSignOut={onSignOut} />
      <UserProfile groups={groups} onSignOut={onSignOut} />

      <main className="flex-1 p-3 md:p-6 flex justify-center mt-10 overflow-x-hidden">
        <div className="w-full max-w-4xl">
            <Outlet context={{ accessToken, groups, isAdmin, isReadOnly }} />
        </div>
      </main>
    </div>
  );
}
