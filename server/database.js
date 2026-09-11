const { DatabaseSync } = require("node:sqlite");
const path = require("path");

// ======================================
// CONNEXION À LA BASE DE DONNÉES
// ======================================

const dbPath = path.join(__dirname, "mame-fallou-optique.db");

const db = new DatabaseSync(dbPath);


// ======================================
// TABLE DES PRODUITS
// ======================================

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER,
    priceLabel TEXT,
    description TEXT,
    image TEXT,
    available INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);


// ======================================
// TABLE DES COMMANDES
// ======================================

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerName TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    paymentMethod TEXT NOT NULL,
    total INTEGER NOT NULL,
    status TEXT DEFAULT 'Nouvelle',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);


// ======================================
// TABLE DES PRODUITS COMMANDÉS
// ======================================

db.exec(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    productName TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,

    FOREIGN KEY (orderId)
      REFERENCES orders(id)
      ON DELETE CASCADE,

    FOREIGN KEY (productId)
      REFERENCES products(id)
  )
`);


// ======================================
// PRODUITS DE DÉPART
// ======================================

const countResult = db
  .prepare("SELECT COUNT(*) AS count FROM products")
  .get();


if (countResult.count === 0) {

  const insert = db.prepare(`
    INSERT INTO products
    (
      name,
      category,
      price,
      priceLabel,
      description,
      image,
      available
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);


  // --------------------------------------
  // PRODUIT 1
  // --------------------------------------

  insert.run(
    "Lunettes Photogray Homme",
    "Photogray",
    12000,
    "12 000 FCFA",
    "Lunettes photogray élégantes pour homme.",
    "/images/lunettes-photogray-homme.jpg",
    1
  );


  // --------------------------------------
  // PRODUIT 2
  // --------------------------------------

  insert.run(
    "Lunettes Photogray Femme",
    "Photogray",
    12000,
    "12 000 FCFA",
    "Lunettes photogray élégantes pour femme.",
    "/images/lunettes-photogray-femme.jpg",
    1
  );


  // --------------------------------------
  // PRODUIT 3
  // --------------------------------------

  insert.run(
    "Lunettes Médicales",
    "Médicales",
    null,
    "Sur ordonnance",
    "Lunettes médicales réalisées selon les besoins et l'ordonnance du client.",
    "/images/lunettes-medicales.jpg",
    1
  );


  // --------------------------------------
  // PRODUIT 4
  // --------------------------------------

  insert.run(
    "Lunettes Noires Fumées",
    "Fumées",
    7000,
    "À partir de 7 000 FCFA",
    "Lunettes noires fumées élégantes, disponibles à partir de 7 000 FCFA.",
    "/images/lunettes-fumees.jpg",
    1
  );


  console.log("✅ Produits de départ ajoutés.");
}


// ======================================
// MESSAGE DE DÉMARRAGE
// ======================================

console.log(
  "✅ Base de données MAME FALLOU OPTIQUE prête."
);


// ======================================
// EXPORT
// ======================================

module.exports = db;