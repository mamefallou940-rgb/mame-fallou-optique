import { useState } from "react";
import "./AdminLogin.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function AdminLogin({ onLogin, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.token) {
        throw new Error(result.message || "Identifiant ou mot de passe incorrect.");
      }
      onLogin(result.token);
    } catch (err) {
      setError(err.message || "Impossible de se connecter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">👓</div>
        <p className="section-label">ADMINISTRATION</p>
        <h1>MAME FALLOU<span>OPTIQUE</span></h1>
        <p className="admin-login-description">Connectez-vous pour gérer votre boutique.</p>
        <form onSubmit={handleSubmit}>
          <div className="admin-field"><label>Identifiant</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Votre identifiant" required /></div>
          <div className="admin-field"><label>Mot de passe</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Votre mot de passe" required /></div>
          {error && <div className="admin-login-error">{error}</div>}
          <button type="submit" className="admin-login-button" disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</button>
        </form>
        <button className="admin-back-button" onClick={onBack}>← Retour au site</button>
      </div>
    </main>
  );
}
export default AdminLogin;
