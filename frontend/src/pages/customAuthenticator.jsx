import { useState } from "react";
import { signIn, confirmSignIn, getCurrentUser } from "aws-amplify/auth";

import bgEmail from "../assets/auth-bg-1.jpg";
import bgPassword from "../assets/auth-bg-2.jpg";

export default function CustomAuthenticator({ onSignedIn }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [user, setUser] = useState(null); 

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError(null);
    setStep("password");
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
        const response = await signIn({
        username: email,
        password,
        });
        // console.log("SIGN IN RESPONSE:", response);

        // 🔑 Cognito requires password change
        if (
        response.nextStep?.signInStep ===
        "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
        ) {
        setStep("newPassword");
        return;
        }

        // ✅ Normal sign-in
        const user = await getCurrentUser();
        onSignedIn(user);

    } catch (err) {
        setError(err?.message || "Failed to sign in");
    } finally {
        setLoading(false);
    }
  }

  async function handleNewPasswordSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
        // await confirmSignIn({
        // challengeResponse: newPassword,
        // });
        await confirmSignIn(newPassword);

        const user = await getCurrentUser();
        onSignedIn(user);
    } catch (err) {
        setError(err?.message || "Failed to set new password");
    } finally {
        setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center p-4"
      style={{
        backgroundImage:
          step === "email"
            ? `url(${bgEmail})`
            : `url(${bgEmail})`,
      }}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-8">
        {step === "email" && (
          <>
            <h1 className="text-2xl font-bold mb-2 text-black">Sign in</h1>
            <p className="text-sm text-gray-600 mb-4">
              Sign in to your account.
            </p>

            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                  placeholder="name@company.com"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white 
                       font-bold py-3 rounded-lg transition"
              >
                Next
              </button>
            </form>
          </>
        )}

        {step === "password" && (
          <>
            <h1 className="text-2xl font-bold text-black mb-4">Enter your password</h1>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-black">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500 bg-gray-100 text-black"
                  placeholder="Enter password"
                />
                <div className="mt-2 flex items-center text-sm">
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

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Continue"}
              </button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full bg-white border-blue-600 border-2 text-blue-600 font-bold py-2 rounded-lg hover:border-black hover:text-black"
              >
                Back
              </button>
            </form>
          </>
        )}

        {step === "newPassword" && (
            <>
                <h1 className="text-2xl font-bold mb-4 text-black">
                Set a new password
                </h1>

                <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-black">
                    New Password
                    </label>
                    <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-100 border rounded-lg
                                focus:ring-2 focus:ring-indigo-500 text-black"
                    placeholder="Enter a new password"
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg
                            font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Updating..." : "Set Password & Sign In"}
                </button>
                </form>
            </>
        )}
      </div>
    </div>
  );
}
