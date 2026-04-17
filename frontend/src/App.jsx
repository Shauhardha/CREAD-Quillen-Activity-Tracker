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
import ActivityTypes from "./pages/ActivityTypes";
import ActivityCalendar from "./pages/ActivityCalendar";
import Visualizations from "./pages/Visualizations";

/* ──────────────────────────────────────────────
   1-HOUR INACTIVITY AUTO-LOGOUT
────────────────────────────────────────────── */
const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour
let inactivityTimer = null;

function startInactivityTimer(onLogout) {
  const resetTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);

    inactivityTimer = setTimeout(() => {
      console.warn("Auto-logout: 1 hour of inactivity");
      onLogout();
    }, INACTIVITY_LIMIT);
  };

  const events = [
    "mousedown",
    "mousemove",
    "keydown",
    "scroll",
    "touchstart",
    "click",
    "focus",
  ];

  events.forEach((event) =>
    document.addEventListener(event, resetTimer, { passive: true })
  );

  resetTimer();

  return () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    events.forEach((event) =>
      document.removeEventListener(event, resetTimer)
    );
  };
}

/* ────────────────────────────────────────────── */

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Initial auth check */
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

  /* Auto-logout when authenticated */
  useEffect(() => {
    if (!user) return;

    const autoLogout = async () => {
      try {
        await signOut();
      } catch (err) {
        console.warn("Auto signOut failed", err);
      } finally {
        setUser(null);
        window.location.replace("/"); // hard reset, no stale route
      }
    };

    const cleanup = startInactivityTimer(autoLogout);
    return cleanup;
  }, [user]);

  if (loading) return null;

  /* Not logged in → Auth screen */
  if (!user) {
    return <CustomAuthenticator onSignedIn={setUser} />;
  }

  /* Logged in → App */
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <AuthenticatedLayout
              onSignOut={async () => {
                await signOut();
                setUser(null);
                window.location.replace("/");
              }}
            />
          }
        >
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Dashboard />} />
          <Route path="/admin/users" element={<AddUserForm />} />
          <Route path="/initiatives" element={<InitiativesManager />} />
          <Route path="/partnership-types" element={<PartnershipTypes />} />
          <Route path="/activity-types" element={<ActivityTypes />} />
          <Route path="/stakeholders" element={<StakeholdersManager />} />
          <Route path="/funding-sources" element={<FundingSourcesManager />} />
          <Route path="/education-levels" element={<EducationLevelsManager />} />
          <Route
            path="/cultural-wealth-tags"
            element={<CulturalWealthTagsManager />}
          />
          <Route path="/strategic-goals" element={<StrategicGoalsManager />} />
          <Route path="/activities" element={<ActivityForm />} />
          <Route path="/association" element={<Association />} />
          <Route path="/activitylist" element={<ActivityList />} />
          <Route path="/activitydetails/:id" element={<ActivityDetails />} />
          <Route path="/calendar" element={<ActivityCalendar />} />
          <Route path="/visualizations" element={<Visualizations />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
