import React, { useState, useEffect, useContext, createContext } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./lib/firebase.js";
import { LogIn, LogOut } from "lucide-react";

const AuthContext = createContext({ user: null, canEdit: false });

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    setError("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setShowLogin(false);
      setEmail("");
      setPassword("");
    } catch (e) {
      setError("ელფოსტა ან პაროლი არასწორია.");
    } finally {
      setBusy(false);
    }
  };

  if (user === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", color: "#64748b" }}>
        იტვირთება…
      </div>
    );
  }

  const canEdit = !!user;

  return (
    <AuthContext.Provider value={{ user, canEdit }}>
      {children}

      {canEdit ? (
        <button
          onClick={() => signOut(auth)}
          title="გამოსვლა"
          style={{ position: "fixed", bottom: 16, right: 16, zIndex: 100, background: "#047857", color: "#fff", border: "none", borderRadius: 999, padding: "10px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 10px rgba(0,0,0,0.18)", cursor: "pointer", fontWeight: 600, fontFamily: "Inter, sans-serif" }}
        >
          <LogOut size={14} /> ადმინისტრატორი — გამოსვლა
        </button>
      ) : (
        <button
          onClick={() => setShowLogin(true)}
          title="ადმინისტრატორის შესვლა"
          style={{ position: "fixed", bottom: 16, right: 16, zIndex: 100, background: "#fff", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 999, padding: "10px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 10px rgba(0,0,0,0.12)", cursor: "pointer", fontWeight: 600, fontFamily: "Inter, sans-serif" }}
        >
          <LogIn size={14} /> ადმინისტრატორის შესვლა
        </button>
      )}

      {showLogin && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 200 }}
          onClick={() => setShowLogin(false)}
        >
          <div
            style={{ background: "#fff", padding: 32, borderRadius: 16, width: "100%", maxWidth: 360, boxShadow: "0 4px 24px rgba(0,0,0,0.2)", fontFamily: "Inter, sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 4px", fontFamily: "Oswald, sans-serif", color: "#1e293b" }}>ადმინისტრატორის შესვლა</h2>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b" }}>
              რედაქტირების უფლებისთვის შედით თქვენი ანგარიშით
            </p>
            <input
              type="email"
              placeholder="ელფოსტა"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", marginBottom: 10, border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
              autoFocus
            />
            <input
              type="password"
              placeholder="პაროლი"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", marginBottom: 14, border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
            />
            {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowLogin(false)}
                style={{ flex: 1, padding: "10px 12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
              >
                გაუქმება
              </button>
              <button
                onClick={handleLogin}
                disabled={busy || !email || !password}
                style={{ flex: 1, padding: "10px 12px", background: "#047857", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", opacity: busy || !email || !password ? 0.5 : 1 }}
              >
                {busy ? "შედის…" : "შესვლა"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
