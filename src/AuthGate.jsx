import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./lib/firebase.js";
import { LogOut } from "lucide-react";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined);
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

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f4", fontFamily: "Inter, sans-serif", padding: 16 }}>
        <div style={{ background: "#fff", padding: 32, borderRadius: 16, width: "100%", maxWidth: 360, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <h2 style={{ margin: "0 0 4px", fontFamily: "Oswald, sans-serif", color: "#1e293b" }}>შესვლა</h2>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b" }}>
            საფეხბურთო სკოლების პორტალში შესასვლელად გაიარეთ ავტორიზაცია
          </p>
          <input
            type="email"
            placeholder="ელფოსტა"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", marginBottom: 10, border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
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
          <button
            onClick={handleLogin}
            disabled={busy || !email || !password}
            style={{ width: "100%", padding: "10px 12px", background: "#047857", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", opacity: busy || !email || !password ? 0.5 : 1 }}
          >
            {busy ? "მიმდინარეობს შესვლა…" : "შესვლა"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => signOut(auth)}
        title="გამოსვლა"
        style={{ position: "fixed", bottom: 16, right: 16, zIndex: 100, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 999, padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", cursor: "pointer", color: "#475569" }}
      >
        <LogOut size={14} /> გამოსვლა
      </button>
      {children}
    </div>
  );
}
