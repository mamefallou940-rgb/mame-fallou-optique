function ProductDetails({
  product,
  onBack,
  onAddToCart,
}) {
  if (!product) {
    return null;
  }

  return (
    <main className="product-details-page">

      <div className="product-details-container">

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Retour aux produits
        </button>


        <div className="product-details">

          {/* IMAGE */}

          <div className="product-details-image">

            <img
              src={product.image}
              alt={product.name}
            />

          </div>


          {/* INFORMATIONS */}

          <div className="product-details-info">

            <span className="product-category">
              {product.category}
            </span>

            <h1>
              {product.name}
            </h1>

            <div className="product-details-price">
              {product.priceLabel}
            </div>

            <p className="product-details-description">
              {product.description}
            </p>


            {/* CAS DES LUNETTES MÉDICALES */}

            {product.prescriptionRequired && (

              <div className="prescription-notice">

                <strong>
                  📋 Produit sur ordonnance
                </strong>

                <p>
                  Une ordonnance médicale est nécessaire
                  pour ce produit.
                </p>

              </div>

            )}


            <button
              className="details-add-button"
              onClick={() => onAddToCart(product)}
            >
              🛒 Ajouter au panier
            </button>


            <div className="product-features">

              <div>
                <span>✓</span>
                Qualité et confort
              </div>

              <div>
                <span>✓</span>
                Service client disponible
              </div>

              <div>
                <span>✓</span>
                Commande simple et rapide
              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

export default ProductDetails;