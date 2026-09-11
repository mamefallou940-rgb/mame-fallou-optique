const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

import { useEffect, useState } from "react";

function WavePaymentResult({ onFinish }) {
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState(
    "Vérification de votre paiement..."
  );

  useEffect(() => {
    const checkPayment = async () => {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const orderId =
          params.get("orderId");

        if (!orderId) {
          setStatus("error");
          setMessage(
            "Impossible de retrouver votre commande."
          );
          return;
        }

        const response = await fetch(
          `${API_URL}/api/payment/wave/order/${orderId}`
        );

        const result =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Impossible de vérifier le paiement."
          );
        }

        if (result.paid) {
          setStatus("success");

          setMessage(
            `Paiement confirmé pour la commande #${orderId}.`
          );
        } else {
          setStatus("pending");

          setMessage(
            "Le paiement n'est pas encore confirmé."
          );
        }

      } catch (error) {
        console.error(
          "Erreur vérification paiement :",
          error
        );

        setStatus("error");

        setMessage(
          error.message ||
            "Une erreur est survenue."
        );
      }
    };

    checkPayment();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
          padding: "40px",
          borderRadius: "15px",
          background: "#fff",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >

        {status === "checking" && (
          <>
            <div style={{ fontSize: "50px" }}>
              ⏳
            </div>

            <h1>
              Vérification du paiement
            </h1>

            <p>
              {message}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: "60px" }}>
              ✅
            </div>

            <h1>
              Paiement réussi !
            </h1>

            <p>
              {message}
            </p>

            <button
              onClick={onFinish}
              style={{
                marginTop: "20px",
                padding: "12px 25px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Retour à la boutique
            </button>
          </>
        )}

        {status === "pending" && (
          <>
            <div style={{ fontSize: "60px" }}>
              ⏳
            </div>

            <h1>
              Paiement en attente
            </h1>

            <p>
              {message}
            </p>

            <button
              onClick={onFinish}
              style={{
                marginTop: "20px",
                padding: "12px 25px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Retour à la boutique
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: "60px" }}>
              ❌
            </div>

            <h1>
              Problème de paiement
            </h1>

            <p>
              {message}
            </p>

            <button
              onClick={onFinish}
              style={{
                marginTop: "20px",
                padding: "12px 25px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Retour à la boutique
            </button>
          </>
        )}

      </div>
    </main>
  );
}

export default WavePaymentResult;