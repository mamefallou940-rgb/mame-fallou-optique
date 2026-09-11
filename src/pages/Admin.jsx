import { useEffect, useMemo, useState } from "react";
import "./Admin.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Admin({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  adminToken,
  onLogout,
}) {
  // =========================================================
  // COMMANDES
  // =========================================================

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);

  // =========================================================
  // RECHERCHE / FILTRES
  // =========================================================

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] =
    useState("Tous");

  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState("Tous");

  const [paymentMethodFilter, setPaymentMethodFilter] =
    useState("Tous");

  // =========================================================
  // PERIODE DU GRAPHIQUE
  // =========================================================

  const [salesPeriod, setSalesPeriod] = useState("week");

  // =========================================================
  // PRODUITS
  // =========================================================

  const [editingProduct, setEditingProduct] = useState(null);

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    priceLabel: "",
    description: "",
    image: "",
    available: 1,
  });

  const [uploading, setUploading] = useState(false);

  // =========================================================
  // CHARGER LES COMMANDES
  // =========================================================

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError("");

      const response = await fetch(
        `${API_URL}/api/orders`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Impossible de récupérer les commandes."
        );
      }

      setOrders(
        Array.isArray(result.orders)
          ? result.orders
          : []
      );
    } catch (error) {
      console.error(
        "Erreur récupération commandes :",
        error
      );

      setOrdersError(
        error.message ||
          "Erreur récupération commandes."
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // =========================================================
  // IMAGE
  // =========================================================

  const getImageUrl = (image) => {
    if (!image) return "";

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    if (image.startsWith("/")) {
      return `${API_URL}${image}`;
    }

    return `${API_URL}/${image}`;
  };

  // =========================================================
  // ARTICLES D'UNE COMMANDE
  // =========================================================

  const getOrderItems = (order) => {
    if (!order) return [];

    if (Array.isArray(order.items)) {
      return order.items;
    }

    if (typeof order.items === "string") {
      try {
        const parsed = JSON.parse(order.items);

        return Array.isArray(parsed)
          ? parsed
          : [];
      } catch (error) {
        console.error(
          "Erreur parsing items :",
          error
        );

        return [];
      }
    }

    return [];
  };

  // =========================================================
  // STATISTIQUES
  // =========================================================

  const dashboardStats = useMemo(() => {
    const totalOrders = orders.length;

    const newOrders = orders.filter(
      (order) =>
        order.status === "Nouvelle"
    ).length;

    const preparingOrders = orders.filter(
      (order) =>
        order.status === "En préparation"
    ).length;

    const deliveryOrders = orders.filter(
      (order) =>
        order.status === "En livraison"
    ).length;

    const deliveredOrders = orders.filter(
      (order) =>
        order.status === "Livrée"
    ).length;

    const cancelledOrders = orders.filter(
      (order) =>
        order.status === "Annulée"
    ).length;

    const paidOrders = orders.filter(
      (order) =>
        order.paymentStatus === "Payée"
    ).length;

    const revenue = orders
      .filter(
        (order) =>
          order.status !== "Annulée"
      )
      .reduce(
        (total, order) =>
          total + Number(order.total || 0),
        0
      );

    return {
      totalOrders,
      newOrders,
      preparingOrders,
      deliveryOrders,
      deliveredOrders,
      cancelledOrders,
      paidOrders,
      revenue,
    };
  }, [orders]);

  // =========================================================
  // DONNEES DU GRAPHIQUE
  // =========================================================

  const chartData = useMemo(() => {
    const now = new Date();

    const validOrders = orders.filter(
      (order) =>
        order.status !== "Annulée"
    );

    // -------------------------------------------------------
    // JOUR
    // -------------------------------------------------------

    if (salesPeriod === "day") {
      const data = [];

      for (let hour = 0; hour < 24; hour++) {
        const revenue = validOrders
          .filter((order) => {
            if (!order.createdAt) return false;

            const date = new Date(
              order.createdAt
            );

            return (
              date.toDateString() ===
                now.toDateString() &&
              date.getHours() === hour
            );
          })
          .reduce(
            (sum, order) =>
              sum + Number(order.total || 0),
            0
          );

        const count = validOrders.filter(
          (order) => {
            if (!order.createdAt) return false;

            const date = new Date(
              order.createdAt
            );

            return (
              date.toDateString() ===
                now.toDateString() &&
              date.getHours() === hour
            );
          }
        ).length;

        data.push({
          label: `${String(hour).padStart(
            2,
            "0"
          )}h`,
          revenue,
          orders: count,
        });
      }

      return data;
    }

    // -------------------------------------------------------
    // SEMAINE
    // -------------------------------------------------------

    if (salesPeriod === "week") {
      const data = [];

      const days = [
        "Dim",
        "Lun",
        "Mar",
        "Mer",
        "Jeu",
        "Ven",
        "Sam",
      ];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);

        date.setDate(
          now.getDate() - i
        );

        const revenue =
          validOrders
            .filter((order) => {
              if (!order.createdAt)
                return false;

              const orderDate =
                new Date(
                  order.createdAt
                );

              return (
                orderDate.toDateString() ===
                date.toDateString()
              );
            })
            .reduce(
              (sum, order) =>
                sum +
                Number(
                  order.total || 0
                ),
              0
            );

        const count =
          validOrders.filter(
            (order) => {
              if (!order.createdAt)
                return false;

              const orderDate =
                new Date(
                  order.createdAt
                );

              return (
                orderDate.toDateString() ===
                date.toDateString()
              );
            }
          ).length;

        data.push({
          label: days[date.getDay()],
          revenue,
          orders: count,
        });
      }

      return data;
    }

    // -------------------------------------------------------
    // MOIS
    // -------------------------------------------------------

    const data = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);

      date.setDate(
        now.getDate() - i
      );

      const revenue =
        validOrders
          .filter((order) => {
            if (!order.createdAt)
              return false;

            const orderDate =
              new Date(
                order.createdAt
              );

            return (
              orderDate.toDateString() ===
              date.toDateString()
            );
          })
          .reduce(
            (sum, order) =>
              sum +
              Number(
                order.total || 0
              ),
            0
          );

      const count =
        validOrders.filter(
          (order) => {
            if (!order.createdAt)
              return false;

            const orderDate =
              new Date(
                order.createdAt
              );

            return (
              orderDate.toDateString() ===
              date.toDateString()
            );
          }
        ).length;

      data.push({
        label: `${String(
          date.getDate()
        ).padStart(2, "0")}/${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`,
        revenue,
        orders: count,
      });
    }

    return data;
  }, [orders, salesPeriod]);

  // =========================================================
  // MAX DU GRAPHIQUE
  // =========================================================

  const chartMax = useMemo(() => {
    const max = Math.max(
      ...chartData.map(
        (item) => item.revenue
      ),
      0
    );

    return max > 0 ? max : 1;
  }, [chartData]);

  // =========================================================
  // COMMANDES FILTREES
  // =========================================================

  const filteredOrders = useMemo(() => {
    const search =
      orderSearch
        .toLowerCase()
        .trim();

    return orders.filter(
      (order) => {
        const matchesSearch =
          !search ||
          String(order.id || "")
            .toLowerCase()
            .includes(search) ||
          String(
            order.customerName || ""
          )
            .toLowerCase()
            .includes(search) ||
          String(order.phone || "")
            .toLowerCase()
            .includes(search) ||
          String(order.city || "")
            .toLowerCase()
            .includes(search);

        const matchesOrderStatus =
          orderStatusFilter ===
            "Tous" ||
          order.status ===
            orderStatusFilter;

        const matchesPaymentStatus =
          paymentStatusFilter ===
            "Tous" ||
          (order.paymentStatus ||
            "À vérifier") ===
            paymentStatusFilter;

        const matchesPaymentMethod =
          paymentMethodFilter ===
            "Tous" ||
          order.paymentMethod ===
            paymentMethodFilter;

        return (
          matchesSearch &&
          matchesOrderStatus &&
          matchesPaymentStatus &&
          matchesPaymentMethod
        );
      }
    );
  }, [
    orders,
    orderSearch,
    orderStatusFilter,
    paymentStatusFilter,
    paymentMethodFilter,
  ]);

  // =========================================================
  // FORMULAIRE PRODUIT
  // =========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // UPLOAD IMAGE
  // =========================================================

  const handleImageUpload = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      const formData =
        new FormData();

      formData.append(
        "image",
        file
      );

      const response =
        await fetch(
          `${API_URL}/api/upload`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${adminToken}` },
            body: formData,
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
            "Erreur upload image."
        );
      }

      setForm((previous) => ({
        ...previous,
        image: result.image,
      }));
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Impossible d'envoyer l'image."
      );
    } finally {
      setUploading(false);
    }
  };

  // =========================================================
  // RESET PRODUIT
  // =========================================================

  const resetProductForm = () => {
    setEditingProduct(null);

    setForm({
      name: "",
      category: "",
      price: "",
      priceLabel: "",
      description: "",
      image: "",
      available: 1,
    });
  };

  // =========================================================
  // AJOUT / MODIFICATION PRODUIT
  // =========================================================

  const handleSubmitProduct = async (
    event
  ) => {
    event.preventDefault();

    try {
      const productData = {
        ...form,

        price:
          form.price === ""
            ? null
            : Number(form.price),

        available:
          Number(form.available) === 0
            ? 0
            : 1,
      };

      if (editingProduct) {
        await onUpdateProduct(
          editingProduct.id,
          productData
        );
      } else {
        await onAddProduct(
          productData
        );
      }

      resetProductForm();
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Erreur lors de l'enregistrement."
      );
    }
  };

  // =========================================================
  // MODIFIER PRODUIT
  // =========================================================

  const startEditProduct = (
    product
  ) => {
    setEditingProduct(product);

    setForm({
      name: product.name || "",
      category:
        product.category || "",
      price:
        product.price ?? "",
      priceLabel:
        product.priceLabel || "",
      description:
        product.description || "",
      image:
        product.image || "",
      available:
        Number(product.available) ===
        0
          ? 0
          : 1,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // SUPPRIMER PRODUIT
  // =========================================================

  const handleDeleteProduct = async (
    id
  ) => {
    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer ce produit ?"
      )
    ) {
      return;
    }

    try {
      await onDeleteProduct(id);
    } catch (error) {
      alert(
        error.message ||
          "Impossible de supprimer le produit."
      );
    }
  };

  // =========================================================
  // MODIFIER STATUT COMMANDE
  // =========================================================

  const updateOrderStatus = async (
    orderId,
    status
  ) => {
    try {
      const response =
        await fetch(
          `${API_URL}/api/orders/${orderId}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
              status,
            }),
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
            "Impossible de modifier le statut."
        );
      }

      await loadOrders();

      if (
        selectedOrder &&
        Number(
          selectedOrder.id
        ) === Number(orderId)
      ) {
        setSelectedOrder(
          result.order
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Erreur modification statut."
      );
    }
  };

  // =========================================================
  // MODIFIER PAIEMENT
  // =========================================================

  const updatePaymentStatus =
    async (
      orderId,
      paymentStatus
    ) => {
      try {
        const response =
          await fetch(
            `${API_URL}/api/orders/${orderId}/payment-status`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                paymentStatus,
              }),
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
              "Impossible de modifier le paiement."
          );
        }

        await loadOrders();

        if (
          selectedOrder &&
          Number(
            selectedOrder.id
          ) === Number(orderId)
        ) {
          setSelectedOrder(
            result.order
          );
        }
      } catch (error) {
        console.error(error);

        alert(
          error.message ||
            "Erreur modification paiement."
        );
      }
    };

  // =========================================================
  // SUPPRIMER COMMANDE
  // =========================================================

  const deleteOrder = async (
    orderId
  ) => {
    if (
      !window.confirm(
        `Voulez-vous supprimer définitivement la commande #${orderId} ?`
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/api/orders/${orderId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${adminToken}` },
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
            "Impossible de supprimer la commande."
        );
      }

      setSelectedOrder(null);

      await loadOrders();
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Erreur suppression commande."
      );
    }
  };

  // =========================================================
  // RESET FILTRES
  // =========================================================

  const resetFilters = () => {
    setOrderSearch("");
    setOrderStatusFilter("Tous");
    setPaymentStatusFilter("Tous");
    setPaymentMethodFilter("Tous");
  };

  // =========================================================
  // RENDU
  // =========================================================

  return (
    <main className="admin-page">
      <div className="admin-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="admin-header">
          <div>
            <p className="section-label">
              ESPACE ADMINISTRATEUR
            </p>

            <h1>
              MAME FALLOU OPTIQUE
            </h1>

            <p className="admin-subtitle">
              Tableau de bord et gestion de votre boutique
            </p>
          </div>

          <button
            type="button"
            className="refresh-button header-refresh"
            onClick={loadOrders}
            disabled={ordersLoading}
          >
            {ordersLoading
              ? "⏳ Chargement..."
              : "↻ Actualiser"}
          </button>
        </header>

        {/* =================================================
            STATISTIQUES
        ================================================= */}

        <section className="admin-dashboard">

          <div className="dashboard-card">
            <div className="dashboard-icon">
              📦
            </div>

            <div>
              <span>Total commandes</span>
              <strong>
                {dashboardStats.totalOrders}
              </strong>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">
              🆕
            </div>

            <div>
              <span>Nouvelles</span>
              <strong>
                {dashboardStats.newOrders}
              </strong>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">
              🚚
            </div>

            <div>
              <span>En livraison</span>
              <strong>
                {dashboardStats.deliveryOrders}
              </strong>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">
              ✅
            </div>

            <div>
              <span>Livrées</span>
              <strong>
                {dashboardStats.deliveredOrders}
              </strong>
            </div>
          </div>

          <div className="dashboard-card revenue-card">
            <div className="dashboard-icon">
              💰
            </div>

            <div>
              <span>Chiffre d'affaires</span>

              <strong>
                {dashboardStats.revenue.toLocaleString(
                  "fr-FR"
                )}{" "}
                FCFA
              </strong>
            </div>
          </div>

        </section>

        {/* =================================================
            GRAPHIQUE
        ================================================= */}

        <section className="admin-section sales-dashboard">

          <div className="sales-header">

            <div>
              <p className="section-label">
                ANALYSE
              </p>

              <h2>
                Ventes et commandes
              </h2>

              <p className="sales-description">
                Évolution de votre activité
              </p>
            </div>

            <div className="period-buttons">

              <button
                type="button"
                className={
                  salesPeriod === "day"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSalesPeriod("day")
                }
              >
                Jour
              </button>

              <button
                type="button"
                className={
                  salesPeriod === "week"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSalesPeriod("week")
                }
              >
                Semaine
              </button>

              <button
                type="button"
                className={
                  salesPeriod === "month"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSalesPeriod("month")
                }
              >
                Mois
              </button>

            </div>

          </div>

          <div className="chart-summary">

            <div>
              <span>
                Période
              </span>

              <strong>
                {salesPeriod === "day"
                  ? "Aujourd'hui"
                  : salesPeriod === "week"
                  ? "7 derniers jours"
                  : "30 derniers jours"}
              </strong>
            </div>

            <div>
              <span>
                Ventes
              </span>

              <strong>
                {chartData
                  .reduce(
                    (sum, item) =>
                      sum +
                      item.revenue,
                    0
                  )
                  .toLocaleString(
                    "fr-FR"
                  )}{" "}
                FCFA
              </strong>
            </div>

            <div>
              <span>
                Commandes
              </span>

              <strong>
                {chartData.reduce(
                  (sum, item) =>
                    sum +
                    item.orders,
                  0
                )}
              </strong>
            </div>

          </div>

          <div className="sales-chart">

            <div className="chart-y-axis">
              <span>
                {chartMax.toLocaleString(
                  "fr-FR"
                )}
              </span>

              <span>
                {Math.round(
                  chartMax / 2
                ).toLocaleString(
                  "fr-FR"
                )}
              </span>

              <span>0</span>
            </div>

            <div className="chart-area">

              <div className="chart-grid-line top"></div>
              <div className="chart-grid-line middle"></div>
              <div className="chart-grid-line bottom"></div>

              <div className="chart-bars">

                {chartData.map(
                  (
                    item,
                    index
                  ) => {
                    const height =
                      (item.revenue /
                        chartMax) *
                      100;

                    return (
                      <div
                        className="chart-column"
                        key={index}
                      >

                        <div className="chart-value">
                          {item.revenue >
                          0
                            ? `${Math.round(
                                item.revenue /
                                  1000
                              )}k`
                            : ""}
                        </div>

                        <div className="chart-bar-container">

                          <div
                            className="chart-bar"
                            style={{
                              height: `${Math.max(
                                height,
                                item.revenue >
                                  0
                                  ? 3
                                  : 0
                              )}%`,
                            }}
                            title={`${item.revenue.toLocaleString(
                              "fr-FR"
                            )} FCFA`}
                          ></div>

                        </div>

                        <span className="chart-label">
                          {item.label}
                        </span>

                        <small>
                          {item.orders} cmd
                        </small>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            PRODUITS
        ================================================= */}

        <section className="admin-section">

          <div className="admin-section-header">
            <div>
              <p className="section-label">
                CATALOGUE
              </p>

              <h2>
                {editingProduct
                  ? "Modifier le produit"
                  : "Ajouter un produit"}
              </h2>
            </div>
          </div>

          <form
            className="admin-product-form"
            onSubmit={
              handleSubmitProduct
            }
          >

            <div className="form-group">
              <label>
                Nom du produit
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={
                  handleChange
                }
                required
              />
            </div>

            <div className="form-group">
              <label>
                Catégorie
              </label>

              <input
                type="text"
                name="category"
                value={
                  form.category
                }
                onChange={
                  handleChange
                }
                required
              />
            </div>

            <div className="form-group">
              <label>
                Prix
              </label>

              <input
                type="number"
                name="price"
                value={
                  form.price
                }
                onChange={
                  handleChange
                }
                min="0"
              />
            </div>

            <div className="form-group">
              <label>
                Libellé prix
              </label>

              <input
                type="text"
                name="priceLabel"
                value={
                  form.priceLabel
                }
                onChange={
                  handleChange
                }
                placeholder="Ex : Sur ordonnance"
              />
            </div>

            <div className="form-group full-width">
              <label>
                Description
              </label>

              <textarea
                name="description"
                rows="4"
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="form-group">
              <label>
                Photo du produit
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleImageUpload
                }
              />

              {uploading && (
                <p className="upload-message">
                  ⏳ Envoi de l'image...
                </p>
              )}

              {form.image && (
                <div className="admin-image-preview">
                  <img
                    src={getImageUrl(
                      form.image
                    )}
                    alt="Aperçu"
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>
                Disponibilité
              </label>

              <select
                name="available"
                value={
                  form.available
                }
                onChange={
                  handleChange
                }
              >
                <option value={1}>
                  Disponible
                </option>

                <option value={0}>
                  Indisponible
                </option>
              </select>
            </div>

            <div className="admin-form-actions full-width">

              <button
                type="submit"
                className="primary-button"
                disabled={uploading}
              >
                {editingProduct
                  ? "✓ Enregistrer les modifications"
                  : "+ Ajouter le produit"}
              </button>

              {editingProduct && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    resetProductForm
                  }
                >
                  Annuler
                </button>
              )}

            </div>

          </form>
        </section>

        {/* =================================================
            LISTE PRODUITS
        ================================================= */}

        <section className="admin-section">

          <div className="section-title-row">

            <div>
              <p className="section-label">
                CATALOGUE
              </p>

              <h2>
                Produits
              </h2>
            </div>

            <span className="count-badge">
              {products?.length || 0} produit
              {(products?.length || 0) >
              1
                ? "s"
                : ""}
            </span>

          </div>

          <div className="admin-products-list">

            {products?.length > 0 ? (
              products.map(
                (product) => {
                  const imageUrl =
                    getImageUrl(
                      product.image
                    );

                  const available =
                    Number(
                      product.available
                    ) === 1 ||
                    product.available ===
                      true;

                  return (
                    <div
                      className="admin-product-card"
                      key={
                        product.id
                      }
                    >

                      <div className="admin-product-image">

                        {imageUrl ? (
                          <img
                            src={
                              imageUrl
                            }
                            alt={
                              product.name
                            }
                          />
                        ) : (
                          <span>
                            📷
                          </span>
                        )}

                      </div>

                      <div className="admin-product-info">

                        <span className="product-category">
                          {
                            product.category
                          }
                        </span>

                        <h3>
                          {
                            product.name
                          }
                        </h3>

                        <strong className="product-price">
                          {product.price !==
                            null &&
                          product.price !==
                            undefined &&
                          product.price !==
                            "" ? (
                            `${Number(
                              product.price
                            ).toLocaleString(
                              "fr-FR"
                            )} FCFA`
                          ) : (
                            product.priceLabel ||
                            "Sur ordonnance"
                          )}
                        </strong>

                        <span
                          className={
                            available
                              ? "availability available"
                              : "availability unavailable"
                          }
                        >
                          {available
                            ? "● Disponible"
                            : "● Indisponible"}
                        </span>

                      </div>

                      <div className="admin-product-actions">

                        <button
                          type="button"
                          className="edit-button"
                          onClick={() =>
                            startEditProduct(
                              product
                            )
                          }
                        >
                          Modifier
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() =>
                            handleDeleteProduct(
                              product.id
                            )
                          }
                        >
                          Supprimer
                        </button>

                      </div>

                    </div>
                  );
                }
              )
            ) : (
              <div className="empty-products">
                Aucun produit.
              </div>
            )}

          </div>
        </section>

        {/* =================================================
            COMMANDES
        ================================================= */}

        <section className="admin-section">

          <div className="orders-header">

            <div>
              <p className="section-label">
                VENTES
              </p>

              <h2>
                Commandes
              </h2>

              <p className="orders-description">
                Gérez les commandes de vos clients
              </p>
            </div>

            <button
              type="button"
              className="refresh-button"
              onClick={
                loadOrders
              }
              disabled={ordersLoading}
            >
              ↻ Actualiser
            </button>

          </div>

          {/* FILTRES */}

          <div className="orders-filters">

            <div className="order-search">
              <label>
                Rechercher
              </label>

              <div className="search-wrapper">
                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Nom, téléphone, ville ou N°..."
                  value={
                    orderSearch
                  }
                  onChange={(e) =>
                    setOrderSearch(
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="order-filter">
              <label>
                Statut commande
              </label>

              <select
                value={
                  orderStatusFilter
                }
                onChange={(e) =>
                  setOrderStatusFilter(
                    e.target.value
                  )
                }
              >
                <option value="Tous">
                  Tous
                </option>

                <option value="Nouvelle">
                  Nouvelle
                </option>

                <option value="Confirmée">
                  Confirmée
                </option>

                <option value="En préparation">
                  En préparation
                </option>

                <option value="Expédiée">
                  Expédiée
                </option>

                <option value="En livraison">
                  En livraison
                </option>

                <option value="Livrée">
                  Livrée
                </option>

                <option value="Annulée">
                  Annulée
                </option>
              </select>
            </div>

            <div className="order-filter">
              <label>
                Paiement
              </label>

              <select
                value={
                  paymentStatusFilter
                }
                onChange={(e) =>
                  setPaymentStatusFilter(
                    e.target.value
                  )
                }
              >
                <option value="Tous">
                  Tous
                </option>

                <option value="À vérifier">
                  À vérifier
                </option>

                <option value="Payée">
                  Payée
                </option>

                <option value="Non payée">
                  Non payée
                </option>

                <option value="Refusée">
                  Refusée
                </option>
              </select>
            </div>

            <div className="order-filter">
              <label>
                Moyen de paiement
              </label>

              <select
                value={
                  paymentMethodFilter
                }
                onChange={(e) =>
                  setPaymentMethodFilter(
                    e.target.value
                  )
                }
              >
                <option value="Tous">
                  Tous
                </option>

                <option value="wave">
                  Wave
                </option>

                <option value="orange-money">
                  Orange Money
                </option>
              </select>
            </div>

            <button
              type="button"
              className="reset-filters-button"
              onClick={
                resetFilters
              }
            >
              Réinitialiser
            </button>

          </div>

          {/* RESULTAT */}

          <div className="orders-results">

            <strong>
              {filteredOrders.length}
            </strong>

            <span>
              commande
              {filteredOrders.length >
              1
                ? "s"
                : ""}{" "}
              trouvée
              {filteredOrders.length >
              1
                ? "s"
                : ""}
            </span>

          </div>

          {/* CHARGEMENT */}

          {ordersLoading && (
            <div className="orders-message">
              <div className="loading-spinner"></div>
              Chargement des commandes...
            </div>
          )}

          {/* ERREUR */}

          {ordersError && (
            <div className="orders-error">
              <strong>
                Impossible de charger les commandes
              </strong>

              <p>
                {ordersError}
              </p>

              <button
                type="button"
                onClick={
                  loadOrders
                }
              >
                Réessayer
              </button>
            </div>
          )}

          {/* AUCUNE COMMANDE */}

          {!ordersLoading &&
            !ordersError &&
            orders.length === 0 && (
              <div className="orders-empty">
                <div className="empty-icon">
                  📦
                </div>

                <h3>
                  Aucune commande
                </h3>

                <p>
                  Les nouvelles commandes apparaîtront ici.
                </p>
              </div>
            )}

          {/* AUCUN RESULTAT */}

          {!ordersLoading &&
            !ordersError &&
            orders.length > 0 &&
            filteredOrders.length ===
              0 && (
              <div className="orders-empty">
                <div className="empty-icon">
                  🔎
                </div>

                <h3>
                  Aucune commande trouvée
                </h3>

                <p>
                  Modifiez vos critères de recherche.
                </p>

                <button
                  type="button"
                  className="reset-filters-button"
                  onClick={
                    resetFilters
                  }
                >
                  Réinitialiser
                </button>
              </div>
            )}

          {/* LISTE */}

          {!ordersLoading &&
            !ordersError &&
            filteredOrders.length >
              0 && (
              <div className="admin-orders-list">

                {filteredOrders.map(
                  (order) => {
                    const items =
                      getOrderItems(
                        order
                      );

                    return (
                      <article
                        className="admin-order-card"
                        key={
                          order.id
                        }
                      >

                        {/* HEADER */}

                        <div className="order-top">

                          <div>
                            <span className="order-number">
                              COMMANDE #
                              {
                                order.id
                              }
                            </span>

                            <h3>
                              {
                                order.customerName ||
                                "Client"
                              }
                            </h3>

                            <p className="order-date">
                              {order.createdAt
                                ? new Date(
                                    order.createdAt
                                  ).toLocaleString(
                                    "fr-FR"
                                  )
                                : "-"}
                            </p>
                          </div>

                          <div className="order-total">
                            <span>
                              Total
                            </span>

                            <strong>
                              {Number(
                                order.total ||
                                  0
                              ).toLocaleString(
                                "fr-FR"
                              )}{" "}
                              FCFA
                            </strong>
                          </div>

                        </div>

                        {/* CLIENT */}

                        <div className="order-client-info">

                          <div>
                            <span>
                              Téléphone
                            </span>

                            <strong>
                              {order.phone ||
                                "-"}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Ville
                            </span>

                            <strong>
                              {order.city ||
                                "-"}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Adresse
                            </span>

                            <strong>
                              {order.address ||
                                "-"}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Paiement
                            </span>

                            <strong>
                              {order.paymentMethod ===
                              "wave"
                                ? "Wave"
                                : "Orange Money"}
                            </strong>
                          </div>

                        </div>

                        {/* PRODUITS */}

                        <div className="ordered-products">

                          <div className="ordered-products-title">
                            <h4>
                              Produits commandés
                            </h4>

                            <span>
                              {
                                items.length
                              }{" "}
                              article
                              {items.length >
                              1
                                ? "s"
                                : ""}
                            </span>
                          </div>

                          <div className="ordered-products-grid">

                            {items.map(
                              (
                                item,
                                index
                              ) => {
                                const imageUrl =
                                  getImageUrl(
                                    item.image
                                  );

                                const quantity =
                                  Number(
                                    item.quantity ||
                                      1
                                  );

                                const price =
                                  Number(
                                    item.price ||
                                      0
                                  );

                                const subtotal =
                                  price *
                                  quantity;

                                return (
                                  <div
                                    className="ordered-product"
                                    key={`${order.id}-${item.id}-${index}`}
                                  >

                                    <button
                                      type="button"
                                      className="ordered-product-image"
                                      onClick={() =>
                                        imageUrl &&
                                        setZoomImage(
                                          imageUrl
                                        )
                                      }
                                    >
                                      {imageUrl ? (
                                        <img
                                          src={
                                            imageUrl
                                          }
                                          alt={
                                            item.name
                                          }
                                        />
                                      ) : (
                                        <span>
                                          📷
                                        </span>
                                      )}
                                    </button>

                                    <div className="ordered-product-info">

                                      <h5>
                                        {
                                          item.name
                                        }
                                      </h5>

                                      <p>
                                        Quantité :{" "}
                                        <strong>
                                          {
                                            quantity
                                          }
                                        </strong>
                                      </p>

                                      <p>
                                        Prix unitaire :{" "}
                                        {price.toLocaleString(
                                          "fr-FR"
                                        )}{" "}
                                        FCFA
                                      </p>

                                      <strong className="ordered-product-subtotal">
                                        {subtotal.toLocaleString(
                                          "fr-FR"
                                        )}{" "}
                                        FCFA
                                      </strong>

                                    </div>

                                  </div>
                                );
                              }
                            )}

                          </div>
                        </div>

                        {/* STATUTS */}

                        <div className="order-status-area">

                          <div className="status-field">
                            <label>
                              Statut commande
                            </label>

                            <select
                              value={
                                order.status ||
                                "Nouvelle"
                              }
                              onChange={(e) =>
                                updateOrderStatus(
                                  order.id,
                                  e.target.value
                                )
                              }
                            >
                              <option value="Nouvelle">
                                Nouvelle
                              </option>

                              <option value="Confirmée">
                                Confirmée
                              </option>

                              <option value="En préparation">
                                En préparation
                              </option>

                              <option value="Expédiée">
                                Expédiée
                              </option>

                              <option value="En livraison">
                                En livraison
                              </option>

                              <option value="Livrée">
                                Livrée
                              </option>

                              <option value="Annulée">
                                Annulée
                              </option>
                            </select>
                          </div>

                          <div className="status-field">
                            <label>
                              Paiement
                            </label>

                            <select
                              value={
                                order.paymentStatus ||
                                "À vérifier"
                              }
                              onChange={(e) =>
                                updatePaymentStatus(
                                  order.id,
                                  e.target.value
                                )
                              }
                            >
                              <option value="À vérifier">
                                À vérifier
                              </option>

                              <option value="Payée">
                                Payée
                              </option>

                              <option value="Non payée">
                                Non payée
                              </option>

                              <option value="Refusée">
                                Refusée
                              </option>
                            </select>
                          </div>

                        </div>

                        {/* ACTIONS */}

                        <div className="order-actions">

                          <button
                            type="button"
                            className="view-order-button"
                            onClick={() =>
                              setSelectedOrder(
                                order
                              )
                            }
                          >
                            👁 Voir les détails
                          </button>

                          <button
                            type="button"
                            className="delete-order-button"
                            onClick={() =>
                              deleteOrder(
                                order.id
                              )
                            }
                          >
                            🗑 Supprimer
                          </button>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>
            )}

        </section>

      </div>

      {/* =====================================================
          MODAL COMMANDE
      ===================================================== */}

      {selectedOrder && (
        <div
          className="order-modal-overlay"
          onClick={() =>
            setSelectedOrder(null)
          }
        >

          <div
            className="order-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="order-modal-header">

              <div>
                <span>
                  DÉTAIL DE LA COMMANDE
                </span>

                <h2>
                  Commande #
                  {
                    selectedOrder.id
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            <div className="modal-client">

              <h3>
                Informations client
              </h3>

              <div className="modal-client-grid">

                <div>
                  <span>
                    Nom
                  </span>

                  <strong>
                    {
                      selectedOrder.customerName ||
                      "-"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Téléphone
                  </span>

                  <strong>
                    {
                      selectedOrder.phone ||
                      "-"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Ville
                  </span>

                  <strong>
                    {
                      selectedOrder.city ||
                      "-"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Adresse
                  </span>

                  <strong>
                    {
                      selectedOrder.address ||
                      "-"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Moyen de paiement
                  </span>

                  <strong>
                    {selectedOrder.paymentMethod ===
                    "wave"
                      ? "Wave"
                      : "Orange Money"}
                  </strong>
                </div>

                <div>
                  <span>
                    Statut paiement
                  </span>

                  <strong>
                    {
                      selectedOrder.paymentStatus ||
                      "À vérifier"
                    }
                  </strong>
                </div>

              </div>
            </div>

            <div className="modal-products">

              <h3>
                Produits commandés
              </h3>

              {getOrderItems(
                selectedOrder
              ).map(
                (
                  item,
                  index
                ) => {
                  const imageUrl =
                    getImageUrl(
                      item.image
                    );

                  const quantity =
                    Number(
                      item.quantity ||
                        1
                    );

                  const price =
                    Number(
                      item.price ||
                        0
                    );

                  const subtotal =
                    price *
                    quantity;

                  return (
                    <div
                      className="modal-product"
                      key={index}
                    >

                      <button
                        type="button"
                        className="modal-product-image"
                        onClick={() =>
                          imageUrl &&
                          setZoomImage(
                            imageUrl
                          )
                        }
                      >
                        {imageUrl ? (
                          <img
                            src={
                              imageUrl
                            }
                            alt={
                              item.name
                            }
                          />
                        ) : (
                          <span>
                            📷
                          </span>
                        )}
                      </button>

                      <div className="modal-product-info">

                        <h4>
                          {
                            item.name
                          }
                        </h4>

                        <p>
                          Quantité :{" "}
                          {
                            quantity
                          }
                        </p>

                        <p>
                          Prix unitaire :{" "}
                          {price.toLocaleString(
                            "fr-FR"
                          )}{" "}
                          FCFA
                        </p>

                        <strong>
                          Sous-total :{" "}
                          {subtotal.toLocaleString(
                            "fr-FR"
                          )}{" "}
                          FCFA
                        </strong>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

            <div className="modal-total">

              <span>
                Total de la commande
              </span>

              <strong>
                {Number(
                  selectedOrder.total ||
                    0
                ).toLocaleString(
                  "fr-FR"
                )}{" "}
                FCFA
              </strong>

            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          ZOOM IMAGE
      ===================================================== */}

      {zoomImage && (
        <div
          className="image-zoom-overlay"
          onClick={() =>
            setZoomImage(null)
          }
        >

          <button
            type="button"
            className="image-zoom-close"
            onClick={() =>
              setZoomImage(null)
            }
          >
            ×
          </button>

          <img
            src={zoomImage}
            alt="Produit"
            onClick={(e) =>
              e.stopPropagation()
            }
          />

        </div>
      )}

    </main>
  );
}

export default Admin;