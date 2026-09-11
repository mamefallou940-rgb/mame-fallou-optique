  function Cart({
  cart,
  onRemove,
  onUpdateQuantity,
  onClose,
  onCheckout
}) {
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-overlay">
      <div className="cart-panel">

        <div className="cart-header">
          <h2>Mon panier</h2>

          <button onClick={onClose} className="close-cart">
            ✕
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>

            <h3>Votre panier est vide</h3>

            <p>
              Ajoutez une paire de lunettes pour commencer votre commande.
            </p>
          </div>
        ) : (
          <>
            <div className="cart-items">

              {cart.map((item) => (
                <div className="cart-item" key={item.id}>

                  <div className="cart-item-image">
                    👓
                  </div>

                  <div className="cart-item-info">

                    <h3>{item.name}</h3>

                    <p>{item.priceLabel}</p>

                    <div className="quantity-control">

                      <button
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>

                    </div>

                    <button
                      className="remove-item"
                      onClick={() => onRemove(item.id)}
                    >
                      Supprimer
                    </button>

                  </div>

                </div>
              ))}

            </div>

            <div className="cart-total">

              <span>Total</span>

              <strong>
                {total.toLocaleString("fr-FR")} FCFA
              </strong>

            </div>

<button
  className="checkout-button"
  onClick={onCheckout}
>
  Passer la commande
</button>
            

          </>
        )}

      </div>
    </div>
  );
}

export default Cart;