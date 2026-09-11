const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

import { useState } from "react";
import "./Checkout.css";

function Checkout({ cart, onBack, onOrderSuccess }) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("wave");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  // ======================================
  // TOTAL
  // ======================================

  const total = (cart || []).reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
        Number(item.quantity || 1),
    0
  );

  // ======================================
  // FORMAT PRIX
  // ======================================

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("fr-FR");
  };

  // ======================================
  // IMAGE
  // ======================================

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    const imageString = String(image).trim();

    if (!imageString) {
      return "";
    }

    if (
      imageString.startsWith("http://") ||
      imageString.startsWith("https://")
    ) {
      return imageString;
    }

    if (imageString.startsWith("/")) {
      return `${API_URL}${imageString}`;
    }

    if (imageString.startsWith("uploads/")) {
      return `${API_URL}/${imageString}`;
    }

    return `${API_URL}/uploads/${imageString}`;
  };

  // ======================================
  // NOM DU MOYEN DE PAIEMENT
  // ======================================

  const getPaymentMethodName = () => {
    return paymentMethod === "wave"
      ? "Wave"
      : "Orange Money";
  };

  

// ======================================
// OUVRIR WHATSAPP
// ======================================

const openWhatsApp = (message) => {
  const whatsappNumber = "221704661253";

  const encodedMessage = encodeURIComponent(message);

  // Lien pour l'application WhatsApp Windows
  const appUrl =
    `whatsapp://send?phone=${whatsappNumber}&text=${encodedMessage}`;

  // Lien WhatsApp Web en secours
  const webUrl =
    `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

  let fallbackTimer;

  const cancelFallback = () => {
    clearTimeout(fallbackTimer);

    document.removeEventListener(
      "visibilitychange",
      cancelFallback
    );
  };

  document.addEventListener(
    "visibilitychange",
    cancelFallback
  );

  // Essayer d'abord l'application WhatsApp
  window.location.href = appUrl;

  // Si l'application ne s'ouvre pas,
  // ouvrir WhatsApp Web après 2 secondes
  fallbackTimer = setTimeout(() => {
    document.removeEventListener(
      "visibilitychange",
      cancelFallback
    );

    window.open(
      webUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }, 2000);
};


// ======================================
// ENVOYER LA COMMANDE SUR WHATSAPP
// ======================================

const sendOrderToWhatsApp = () => {
  if (!success) return;

  const items = (cart || [])
    .map((item) => {
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const subtotal = price * quantity;

      return `• ${item.name} x${quantity} = ${formatPrice(
        subtotal
      )} FCFA`;
    })
    .join("\n");

  const payment =
    paymentMethod === "wave"
      ? "Wave"
      : "Orange Money";

  const message = `Bonjour MAME FALLOU OPTIQUE 👋

Je viens de passer une commande.

🛍️ COMMANDE #${success.orderId}

👤 Client : ${customerName}
📞 Téléphone : ${phone}
🏙️ Ville : ${city}
📍 Adresse : ${address}

💳 Moyen de paiement : ${payment}

📦 Produits :
${items}

💰 Total : ${formatPrice(total)} FCFA

Merci de confirmer ma commande.`;

  openWhatsApp(message);
};
 




  // ======================================
  // ENVOYER COMMANDE
  // ======================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess(null);

    if (!cart || cart.length === 0) {
      setError(
        "Votre panier est vide."
      );
      return;
    }

    if (
      !customerName.trim() ||
      !phone.trim() ||
      !city.trim() ||
      !address.trim()
    ) {
      setError(
        "Veuillez remplir toutes les informations."
      );
      return;
    }

    try {
      setLoading(true);

      // ==================================
      // ARTICLES
      // ==================================

      const orderItems = cart.map(
        (item) => ({
          id: Number(item.id),

          name: String(
            item.name || "Produit"
          ),

          productName: String(
            item.name || "Produit"
          ),

          price: Number(
            item.price || 0
          ),

          quantity: Number(
            item.quantity || 1
          ),

          image: item.image
            ? String(item.image)
            : "",
        })
      );

      // ==================================
      // DONNÉES COMMANDE
      // ==================================

      const orderData = {
        customerName:
          customerName.trim(),

        phone:
          phone.trim(),

        city:
          city.trim(),

        address:
          address.trim(),

        paymentMethod,

        items: orderItems,

        total: Number(total),
      };

      console.log(
        "Commande envoyée :",
        orderData
      );

      // ==================================
      // API
      // ==================================

      const response = await fetch(
        `${API_URL}/api/orders`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            orderData
          ),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Impossible d'enregistrer la commande."
        );
      }

      console.log(
        "Commande enregistrée :",
        result
      );

      setSuccess(result);

      if (onOrderSuccess) {
        onOrderSuccess(result);
      }
    } catch (err) {
      console.error(
        "Erreur commande :",
        err
      );

      setError(
        err.message ||
          "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // COMMANDE TERMINÉE
  // ======================================

  if (success) {
    return (
      <main className="checkout-page">

        <div className="checkout-container">

          <div className="checkout-success">

            {/* SUCCÈS */}

            <div className="success-icon">
              ✓
            </div>

            <p className="success-label">
              COMMANDE CONFIRMÉE
            </p>

            <h1>
              Commande enregistrée
            </h1>

            <p className="success-message">
              Merci pour votre commande.
              Votre demande a bien été
              enregistrée.
            </p>

            {/* NUMÉRO COMMANDE */}

            <div className="success-order-number">
              <span>
                Numéro de commande
              </span>

              <strong>
                #{success.orderId}
              </strong>
            </div>

            {/* PAIEMENT */}

            <div className="payment-box">

              <div className="payment-box-header">

                <div className="payment-icon">
                  💳
                </div>

                <div>
                  <h3>
                    Effectuer le paiement
                  </h3>

                  <p>
                    Utilisez le moyen de paiement
                    choisi lors de la commande.
                  </p>
                </div>

              </div>

              <div className="payment-details">

                <div className="payment-detail">

                  <span>
                    Moyen de paiement
                  </span>

                  <strong>
                    {getPaymentMethodName()}
                  </strong>

                </div>

                <div className="payment-detail">

                  <span>
                    Numéro de paiement
                  </span>

                  <strong className="payment-number">
                    70 466 12 53
                  </strong>

                </div>

                <div className="payment-detail payment-total">

                  <span>
                    Montant à payer
                  </span>

                  <strong>
                    {formatPrice(total)} FCFA
                  </strong>

                </div>

              </div>

              <div className="payment-note">
                <span>
                  ℹ️
                </span>

                <p>
                  Après avoir effectué le
                  paiement, envoyez la
                  confirmation sur WhatsApp
                  afin que notre équipe puisse
                  vérifier votre commande.
                </p>
              </div>

            </div>

            {/* WHATSAPP */}

            <div className="whatsapp-section">

              <div className="whatsapp-title">
                <span>
                  📱
                </span>

                <div>
                  <h3>
                    Confirmer sur WhatsApp
                  </h3>

                  <p>
                    Envoyez automatiquement les
                    détails de votre commande.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="whatsapp-order-button"
                onClick={
                  sendOrderToWhatsApp
                }
              >
                <span className="whatsapp-button-icon">
                  💬
                </span>

                <span>
                  Confirmer la commande
                  sur WhatsApp
                </span>
              </button>

            </div>

            {/* RETOUR */}

            <button
              type="button"
              className="checkout-back-button"
              onClick={onBack}
            >
              ← Retour à la boutique
            </button>

          </div>

        </div>

      </main>
    );
  }

  // ======================================
  // PAGE CHECKOUT
  // ======================================

  return (
    <main className="checkout-page">

      <div className="checkout-container">

        {/* HEADER */}

        <div className="checkout-header">

          <button
            type="button"
            className="checkout-back-link"
            onClick={onBack}
          >
            ← Retour au panier
          </button>

          <p className="checkout-label">
            COMMANDE
          </p>

          <h1>
            Finaliser ma commande
          </h1>

          <p>
            Remplissez vos informations
            pour terminer votre commande.
          </p>

        </div>

        {/* ERREUR */}

        {error && (
          <div className="checkout-error">
            <span>
              ⚠️
            </span>

            <p>
              {error}
            </p>
          </div>
        )}

        <div className="checkout-layout">

          {/* ==================================
              INFORMATIONS CLIENT
          ================================== */}

          <section className="checkout-card">

            <div className="checkout-card-title">

              <span className="checkout-number">
                1
              </span>

              <div>
                <h2>
                  Vos informations
                </h2>

                <p>
                  Où devons-nous livrer
                  votre commande ?
                </p>
              </div>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="checkout-form-grid">

                {/* NOM */}

                <div className="checkout-field">

                  <label>
                    Nom complet
                  </label>

                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) =>
                      setCustomerName(
                        e.target.value
                      )
                    }
                    placeholder="Votre nom complet"
                    required
                    disabled={loading}
                  />

                </div>

                {/* TELEPHONE */}

                <div className="checkout-field">

                  <label>
                    Téléphone
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value
                      )
                    }
                    placeholder="77 000 00 00"
                    required
                    disabled={loading}
                  />

                </div>

                {/* VILLE */}

                <div className="checkout-field">

                  <label>
                    Ville
                  </label>

                  <input
                    type="text"
                    value={city}
                    onChange={(e) =>
                      setCity(
                        e.target.value
                      )
                    }
                    placeholder="Dakar"
                    required
                    disabled={loading}
                  />

                </div>

                {/* ADRESSE */}

                <div className="checkout-field checkout-field-full">

                  <label>
                    Adresse
                  </label>

                  <textarea
                    value={address}
                    onChange={(e) =>
                      setAddress(
                        e.target.value
                      )
                    }
                    placeholder="Adresse complète de livraison"
                    rows="4"
                    required
                    disabled={loading}
                  />

                </div>

              </div>

              {/* ==================================
                  PAIEMENT
              ================================== */}

              <div className="checkout-payment-section">

                <div className="checkout-card-title">

                  <span className="checkout-number">
                    2
                  </span>

                  <div>
                    <h2>
                      Mode de paiement
                    </h2>

                    <p>
                      Choisissez votre moyen
                      de paiement.
                    </p>
                  </div>

                </div>

                <div className="payment-methods">

                  {/* WAVE */}

                  <label
                    className={`payment-option ${
                      paymentMethod === "wave"
                        ? "active"
                        : ""
                    }`}
                  >

                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wave"
                      checked={
                        paymentMethod ===
                        "wave"
                      }
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target.value
                        )
                      }
                      disabled={loading}
                    />

                    <div className="payment-option-icon wave-icon">
                      W
                    </div>

                    <div className="payment-option-info">

                      <strong>
                        Wave
                      </strong>

                      <span>
                        Paiement mobile
                      </span>

                    </div>

                    <span className="payment-check">
                      ✓
                    </span>

                  </label>

                  {/* ORANGE MONEY */}

                  <label
                    className={`payment-option ${
                      paymentMethod ===
                      "orange-money"
                        ? "active"
                        : ""
                    }`}
                  >

                    <input
                      type="radio"
                      name="paymentMethod"
                      value="orange-money"
                      checked={
                        paymentMethod ===
                        "orange-money"
                      }
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target.value
                        )
                      }
                      disabled={loading}
                    />

                    <div className="payment-option-icon orange-icon">
                      OM
                    </div>

                    <div className="payment-option-info">

                      <strong>
                        Orange Money
                      </strong>

                      <span>
                        Paiement mobile
                      </span>

                    </div>

                    <span className="payment-check">
                      ✓
                    </span>

                  </label>

                </div>

              </div>

              {/* ==================================
                  BOUTON COMMANDER
              ================================== */}

              <button
                type="submit"
                className="checkout-submit-button"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="checkout-spinner"></span>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    Commander
                    <span>
                      —
                    </span>
                    {formatPrice(total)}
                    FCFA
                  </>
                )}

              </button>

            </form>

          </section>

          {/* ==================================
              RÉSUMÉ
          ================================== */}

          <aside className="checkout-summary">

            <div className="summary-header">

              <div>
                <h2>
                  Votre commande
                </h2>

                <p>
                  Vérifiez vos articles
                </p>
              </div>

              <span>
                {cart.length} article
                {cart.length > 1
                  ? "s"
                  : ""}
              </span>

            </div>

            <div className="summary-products">

              {cart.map(
                (item, index) => {

                  const imageUrl =
                    getImageUrl(
                      item.image
                    );

                  const quantity =
                    Number(
                      item.quantity || 1
                    );

                  const price =
                    Number(
                      item.price || 0
                    );

                  const subtotal =
                    price * quantity;

                  return (
                    <div
                      className="summary-product"
                      key={`${item.id}-${index}`}
                    >

                      {/* IMAGE */}

                      <div className="summary-image">

                        {imageUrl ? (

                          <img
                            src={imageUrl}
                            alt={
                              item.name ||
                              "Produit"
                            }
                            onError={(e) => {
                              e.currentTarget.style.display =
                                "none";
                            }}
                          />

                        ) : (

                          <span>
                            👓
                          </span>

                        )}

                      </div>

                      {/* INFOS */}

                      <div className="summary-product-info">

                        <strong>
                          {item.name}
                        </strong>

                        <span>
                          Quantité : {quantity}
                        </span>

                        <small>
                          {formatPrice(price)}
                          {" "}FCFA / unité
                        </small>

                      </div>

                      {/* SOUS TOTAL */}

                      <strong className="summary-subtotal">
                        {formatPrice(subtotal)}
                        {" "}FCFA
                      </strong>

                    </div>
                  );
                }
              )}

            </div>

            {/* TOTAL */}

            <div className="summary-total">

              <span>
                Total
              </span>

              <strong>
                {formatPrice(total)} FCFA
              </strong>

            </div>

            {/* SÉCURITÉ */}

            <div className="summary-security">

              <span>
                🔒
              </span>

              <p>
                Vos informations sont
                utilisées uniquement pour
                traiter votre commande.
              </p>

            </div>

          </aside>

        </div>

      </div>

    </main>
  );
}

export default Checkout;