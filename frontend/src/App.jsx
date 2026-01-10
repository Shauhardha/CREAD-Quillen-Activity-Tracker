import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getCurrentUser, signOut } from "aws-amplify/auth";

import CustomAuthenticator from "./pages/customAuthenticator";
import AuthenticatedLayout from "./layouts/AuthenticatedLayout";

import AddUserForm from "./pages/UserManagement";
import InitiativesManager from "./pages/InitiativesManager";
import PartnershipTypes from "./pages/PartnershipTypes";
import FundingSourcesManager from "./pages/FundingSourcesManager";
import EducationLevelsManager from "./pages/EducationLevelsManager";
import CulturalWealthTagsManager from "./pages/CulturalWealthTagsManager";
import StrategicGoalsManager from "./pages/StrategicGoalsManager";
import ActivityForm from "./pages/ActivityForm";
import Association from "./pages/Association";
import ActivityDetails from "./pages/ActivityDetails";
import ActivityList from "./pages/ActivityList";
import StakeholdersManager from "./pages/StakeholdersManager";
import Dashboard from "./pages/Dashboard.jsx";


function HomePage() {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-2">Welcome</h2>
      <p className="text-gray-600">You are logged in.</p>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      try {
        const u = await getCurrentUser();
        setUser(u);
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
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <AuthenticatedLayout
              onSignOut={async () => {
                await signOut();
                setUser(null);
              }}
            />
          }
        >
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Dashboard />} />
          <Route path="/admin/users" element={<AddUserForm />} />
          <Route path="/initiatives" element={<InitiativesManager />} />
          <Route path="/partnership-types" element={<PartnershipTypes />} />
          <Route path="/stakeholders" element={<StakeholdersManager />} />
          <Route path="/funding-sources" element={<FundingSourcesManager />} />
          <Route path="/education-levels" element={<EducationLevelsManager />} />
          <Route path="/cultural-wealth-tags" element={<CulturalWealthTagsManager />} />
          <Route path="/strategic-goals" element={<StrategicGoalsManager />} />
          <Route path="/activities" element={<ActivityForm />} />
          <Route path="/association" element={<Association />} />
          <Route path="/activitylist" element={<ActivityList />} />
          <Route path="/activitydetails/:id" element={<ActivityDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
