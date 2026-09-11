

import { useState, useEffect } from "react";

import Navbar from "./components/Navbar";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ProductDetails from "./pages/ProductDetails";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";


function App() {



const openWhatsAppContact = () => {
  const whatsappNumber = "221704661253";

  const message =
    "Bonjour MAME FALLOU OPTIQUE 👋\n\n" +
    "Je souhaite avoir des informations.";

  const encodedMessage =
    encodeURIComponent(message);

  const appUrl =
    `whatsapp://send?phone=${whatsappNumber}&text=${encodedMessage}`;

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

  window.location.href = appUrl;

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
  // PRODUITS
  // ======================================

  const [productsList, setProductsList] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  // ======================================
  // RÉCUPÉRER LES PRODUITS
  // ======================================

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      setProductsError("");

      const response = await fetch(
        `${API_URL}/api/products`
      );

      if (!response.ok) {
        throw new Error(
          "Impossible de récupérer les produits."
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "Les données reçues sont invalides."
        );
      }

      const normalizedProducts = data.map((product) => ({
        ...product,

        id: Number(product.id),

        price:
          product.price === null ||
          product.price === ""
            ? null
            : Number(product.price),

        available:
          Number(product.available) === 1,

        priceLabel:
          product.priceLabel || "",

        description:
          product.description || "",

        image:
          product.image || "",
      }));

      setProductsList(normalizedProducts);
    } catch (error) {
      console.error(
        "Impossible de récupérer les produits :",
        error
      );

      setProductsError(
        error.message ||
          "Impossible de charger les produits."
      );
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ======================================
  // PANIER
  // ======================================

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  // ======================================
  // CHECKOUT
  // ======================================

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // ======================================
  // PRODUIT SÉLECTIONNÉ
  // ======================================

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  // ======================================
  // ADMINISTRATION
  // ======================================

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem("mfo_admin_token") || "");

  // ======================================
  // AJOUTER UN PRODUIT
  // ======================================

  const addProduct = async (product) => {
    try {
      const response = await fetch(
        `${API_URL}/api/products`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },

          body: JSON.stringify(product),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
            "Erreur lors de l'ajout du produit."
        );
      }

      const serverProduct =
        result.product || result;

      const newProduct = {
        ...serverProduct,

        id: Number(serverProduct.id),

        price:
          serverProduct.price === null ||
          serverProduct.price === ""
            ? null
            : Number(serverProduct.price),

        available:
          Number(serverProduct.available) === 1,

        priceLabel:
          serverProduct.priceLabel || "",

        description:
          serverProduct.description || "",

        image:
          serverProduct.image || "",
      };

      setProductsList(
        (currentProducts) => [
          ...currentProducts,
          newProduct,
        ]
      );

      alert(
        "Produit ajouté avec succès !"
      );

      return newProduct;
    } catch (error) {
      console.error(
        "Erreur ajout produit :",
        error
      );

      alert(
        error.message ||
          "Impossible d'ajouter le produit."
      );

      throw error;
    }
  };

  // ======================================
  // MODIFIER UN PRODUIT
  // ======================================

  const updateProduct = async (
    productId,
    productData
  ) => {
    console.log(
      "========== MODIFICATION =========="
    );

    console.log(
      "ID envoyé :",
      productId
    );

    console.log(
      "Produit envoyé :",
      productData
    );

    try {
      const id = Number(productId);

      if (!Number.isInteger(id) || id <= 0) {
        throw new Error(
          "Identifiant du produit invalide."
        );
      }

      const response = await fetch(
        `${API_URL}/api/products/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },

          body: JSON.stringify({
            name: productData.name,
            category: productData.category,

            price:
              productData.price === "" ||
              productData.price === undefined
                ? null
                : productData.price,

            priceLabel:
              productData.priceLabel || "",

            description:
              productData.description || "",

            image:
              productData.image || "",

            available:
              productData.available ? 1 : 0,
          }),
        }
      );

      console.log(
        "Réponse serveur :",
        response.status
      );

      const result = await response.json();

      console.log(
        "Résultat serveur :",
        result
      );

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
            "Erreur lors de la modification."
        );
      }

      const serverProduct =
        result.product || result;

      const updated = {
        ...serverProduct,

        id: Number(serverProduct.id),

        price:
          serverProduct.price === null ||
          serverProduct.price === ""
            ? null
            : Number(serverProduct.price),

        available:
          Number(serverProduct.available) === 1,

        priceLabel:
          serverProduct.priceLabel || "",

        description:
          serverProduct.description || "",

        image:
          serverProduct.image || "",
      };

      // ==================================
      // METTRE À JOUR LA LISTE
      // ==================================

      setProductsList(
        (currentProducts) =>
          currentProducts.map((product) =>
            Number(product.id) ===
            Number(updated.id)
              ? updated
              : product
          )
      );

      // ==================================
      // METTRE À JOUR LE PANIER
      // ==================================

      setCart(
        (currentCart) =>
          currentCart.map((item) =>
            Number(item.id) ===
            Number(updated.id)
              ? {
                  ...updated,
                  quantity:
                    item.quantity,
                }
              : item
          )
      );

      // ==================================
      // METTRE À JOUR PRODUIT SÉLECTIONNÉ
      // ==================================

      if (
        selectedProduct &&
        Number(selectedProduct.id) ===
          Number(updated.id)
      ) {
        setSelectedProduct(updated);
      }

      console.log(
        "Produit modifié avec succès :",
        updated
      );

      alert(
        "Produit modifié avec succès !"
      );

      return updated;
    } catch (error) {
      console.error(
        "ERREUR UPDATE PRODUCT :",
        error
      );

      alert(
        error.message ||
          "Impossible de modifier le produit."
      );

      throw error;
    }
  };

  // ======================================
  // SUPPRIMER UN PRODUIT
  // ======================================

  const deleteProduct = async (
    productId
  ) => {
    try {
      const id = Number(productId);

      const response = await fetch(
        `${API_URL}/api/products/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
            "Erreur lors de la suppression."
        );
      }

      setProductsList(
        (currentProducts) =>
          currentProducts.filter(
            (product) =>
              Number(product.id) !== id
          )
      );

      setCart(
        (currentCart) =>
          currentCart.filter(
            (item) =>
              Number(item.id) !== id
          )
      );

      if (
        selectedProduct &&
        Number(selectedProduct.id) === id
      ) {
        setSelectedProduct(null);
      }

      alert(
        "Produit supprimé avec succès !"
      );
    } catch (error) {
      console.error(
        "Erreur suppression produit :",
        error
      );

      alert(
        error.message ||
          "Impossible de supprimer le produit."
      );
    }
  };

  // ======================================
  // AJOUTER AU PANIER
  // ======================================

  const addToCart = (product) => {
    if (
      product.price === null ||
      product.price === undefined ||
      Number.isNaN(Number(product.price))
    ) {
      alert(
        "Ce produit est disponible sur ordonnance. Veuillez nous contacter pour connaître le prix."
      );

      return;
    }

    if (!product.available) {
      alert(
        "Ce produit est actuellement indisponible."
      );

      return;
    }

    setCart(
      (currentCart) => {
        const existingProduct =
          currentCart.find(
            (item) =>
              Number(item.id) ===
              Number(product.id)
          );

        if (existingProduct) {
          return currentCart.map(
            (item) =>
              Number(item.id) ===
              Number(product.id)
                ? {
                    ...item,
                    quantity:
                      Number(item.quantity || 1) +
                      1,
                  }
                : item
          );
        }

        return [
          ...currentCart,
          {
            ...product,
            quantity: 1,
          },
        ];
      }
    );

    setCartOpen(true);
  };

  // ======================================
  // SUPPRIMER DU PANIER
  // ======================================

  const removeFromCart = (
    productId
  ) => {
    setCart(
      (currentCart) =>
        currentCart.filter(
          (item) =>
            Number(item.id) !==
            Number(productId)
        )
    );
  };

  // ======================================
  // MODIFIER QUANTITÉ
  // ======================================

  const updateQuantity = (
    productId,
    quantity
  ) => {
    const newQuantity =
      Number(quantity);

    if (
      !Number.isFinite(newQuantity) ||
      newQuantity <= 0
    ) {
      removeFromCart(productId);
      return;
    }

    setCart(
      (currentCart) =>
        currentCart.map((item) =>
          Number(item.id) ===
          Number(productId)
            ? {
                ...item,
                quantity: newQuantity,
              }
            : item
        )
    );
  };

  // ======================================
  // NOMBRE D'ARTICLES
  // ======================================

  const cartCount =
    cart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );

  // ======================================
  // AFFICHAGE
  // ======================================

  return (
    <>
      {/* ======================================
          MENU
      ====================================== */}

      <Navbar
        cartCount={cartCount}

        onCartClick={() =>
          setCartOpen(true)
        }

        onAdminClick={() => {
          setAdminOpen(true);
          setAdminLoggedIn(false);
        }}
      />

      {/* ======================================
          SITE
      ====================================== */}

      <main>

        {/* ======================================
            ACCUEIL
        ====================================== */}

        <section
          id="accueil"
          className="hero"
        >
          <div className="hero-content">

            <p className="hero-small">
              BIENVENUE CHEZ
            </p>

            <h1>
              MAME FALLOU{" "}
              <span>OPTIQUE</span>
            </h1>

            <p className="hero-description">
              Votre vision, notre priorité.
              Découvrez notre collection de
              lunettes élégantes et adaptées
              à vos besoins.
            </p>

            <a
              href="#produits"
              className="hero-button"
            >
              Découvrir nos lunettes
            </a>

          </div>
        </section>

        {/* ======================================
            PRODUITS
        ====================================== */}

        <section
          id="produits"
          className="products-section"
        >

          <div className="section-header">

            <p>
              NOTRE COLLECTION
            </p>

            <h2>
              Nos lunettes
            </h2>

            <span>
              Découvrez nos différents modèles
            </span>

          </div>

          {/* CHARGEMENT */}

          {productsLoading && (
            <div className="admin-empty">
              <div>⏳</div>

              <h3>
                Chargement des produits...
              </h3>
            </div>
          )}

          {/* ERREUR */}

          {!productsLoading &&
            productsError && (
              <div className="admin-login-error">

                {productsError}

                <br />

                <button
                  type="button"
                  onClick={loadProducts}
                  style={{
                    marginTop: "10px",
                  }}
                >
                  Réessayer
                </button>

              </div>
            )}

          {/* PRODUITS */}

          {!productsLoading &&
            !productsError && (

              <div className="products-grid">

                {productsList
                  .filter(
                    (product) =>
                      product.available
                  )
                  .map((product) => (

                    <article
                      className="product-card"
                      key={product.id}
                    >

                      <div className="product-image">

                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                          />
                        ) : (
                          <span>
                            👓
                          </span>
                        )}

                      </div>

                      <div className="product-info">

                        <span className="product-category">
                          {product.category}
                        </span>

                        <h3>
                          {product.name}
                        </h3>

                        <p>
                          {product.description}
                        </p>

                        <strong>
                          {product.priceLabel ||
                            (
                              product.price !== null
                                ? `${Number(
                                    product.price
                                  ).toLocaleString(
                                    "fr-FR"
                                  )} FCFA`
                                : "Sur ordonnance"
                            )}
                        </strong>

                        <div className="product-actions">

                          <button
                            className="product-details-button"
                            onClick={() =>
                              setSelectedProduct(
                                product
                              )
                            }
                          >
                            Voir le produit
                          </button>

                          <button
                            className="product-button"
                            onClick={() =>
                              addToCart(product)
                            }
                          >
                            Ajouter au panier
                          </button>

                        </div>

                      </div>

                    </article>

                  ))}

              </div>

            )}

          {/* AUCUN PRODUIT */}

          {!productsLoading &&
            !productsError &&
            productsList.filter(
              (product) =>
                product.available
            ).length === 0 && (

              <div className="admin-empty">

                <div>👓</div>

                <h3>
                  Aucun produit disponible
                </h3>

                <p>
                  Les produits disponibles
                  apparaîtront ici.
                </p>

              </div>

            )}

        </section>

        {/* ======================================
            À PROPOS
        ====================================== */}

        <section
          id="apropos"
          className="about-section"
        >

          <div>

            <p className="section-label">
              À PROPOS
            </p>

            <h2>
              MAME FALLOU OPTIQUE
            </h2>

            <p>
              Nous vous proposons une sélection
              de lunettes alliant style, confort
              et qualité.
            </p>

            <p>
              Que vous recherchiez des lunettes
              photogray, des noires fumées, des
              lunettes de soleil ou des lunettes
              médicales, sachez que vous êtes au
              bon endroit.
            </p>

            <p>
              Nous sommes à votre écoute.
            </p>

          </div>

        </section>

        {/* ======================================
            CONTACT
        ====================================== */}

        <section
          id="contact"
          className="contact-section"
        >

          <p className="section-label">
            CONTACT
          </p>

          <h2>
            Besoin d'informations ?
          </h2>

          <p>
            Contactez directement
            MAME FALLOU OPTIQUE.
          </p>

          
<button
  type="button"
  className="whatsapp-button"
  onClick={openWhatsAppContact}
>
  💬 Nous contacter sur WhatsApp
</button>


        </section>

      </main>

      {/* ======================================
          FICHE PRODUIT
      ====================================== */}

      {selectedProduct && (

        <ProductDetails
          product={selectedProduct}

          onBack={() => {
            setSelectedProduct(null);
          }}

          onAddToCart={(product) => {
            addToCart(product);
          }}
        />

      )}

      {/* ======================================
          ADMINISTRATION - CONNEXION
      ====================================== */}

      {adminOpen &&
        !adminLoggedIn && (

          <AdminLogin

            onLogin={(token) => {
              sessionStorage.setItem("mfo_admin_token", token);
              setAdminToken(token);
              setAdminLoggedIn(true);
            }}

            onBack={() => {
              setAdminOpen(false);
            }}

          />

        )}

      {/* ======================================
          ADMINISTRATION
      ====================================== */}

      {adminOpen &&
        adminLoggedIn && (

          <Admin
            products={productsList}

            onAddProduct={addProduct}

            onUpdateProduct={
              updateProduct
            }

            onDeleteProduct={
              deleteProduct
            }
            adminToken={adminToken}
            onLogout={() => {
              sessionStorage.removeItem("mfo_admin_token");
              setAdminToken("");
              setAdminLoggedIn(false);
            }}

          />

        )}

      {/* ======================================
          PANIER
      ====================================== */}

      {cartOpen && (

        <Cart
          cart={cart}

          onRemove={
            removeFromCart
          }

          onUpdateQuantity={
            updateQuantity
          }

          onClose={() =>
            setCartOpen(false)
          }

          onCheckout={() => {

            if (cart.length === 0) {
              alert(
                "Votre panier est vide."
              );

              return;
            }

            setCartOpen(false);
            setCheckoutOpen(true);

          }}

        />

      )}

      {/* ======================================
          CHECKOUT
      ====================================== */}



{checkoutOpen && (

  <Checkout

    cart={cart}

    onBack={() => {
      setCheckoutOpen(false);
      setCartOpen(true);
    }}

    onOrderSuccess={(result) => {

      console.log(
        "Commande réussie :",
        result
      );

      // IMPORTANT :
      // On NE ferme PAS Checkout ici.
      // Cela permet à Checkout.jsx d'afficher
      // la confirmation + le bouton WhatsApp.

    }}

  />

)}


    </>
  );
}

export default App;