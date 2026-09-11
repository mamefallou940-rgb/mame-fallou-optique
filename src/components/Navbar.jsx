function Navbar({
  cartCount,
  onCartClick,
  onAdminClick
}) {
  return (
    <header className="navbar">

      <div className="navbar-container">


        <div className="logo">

          <span className="logo-main">
            MAME FALLOU
          </span>

          <span className="logo-sub">
            OPTIQUE
          </span>

        </div>


        <nav className="nav-links">

          <a href="#accueil">
            Accueil
          </a>

          <a href="#produits">
            Nos lunettes
          </a>

          <a href="#apropos">
            À propos
          </a>

          <a href="#contact">
            Contact
          </a>

          <button
            className="admin-nav-button"
            onClick={onAdminClick}
            >
               ⚙️ Admin
           </button>

        </nav>


        <button
          className="cart-button"
          onClick={onCartClick}
        >

          🛒 Panier

          {cartCount > 0 && (
            <span className="cart-count">
              {cartCount}
            </span>
          )}

        </button>


      </div>

    </header>
  );
}

export default Navbar;