const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");
require("dotenv").config();

const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

// ======================================
// MIDDLEWARE
// ======================================

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================
// UPLOADS
// ======================================

const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use("/uploads", express.static(uploadsPath));

// ======================================
// DATABASE
// ======================================

const dbPath = path.join(
  __dirname,
  "mame-fallou-optique.db"
);

const db = new DatabaseSync(dbPath);

db.exec(`PRAGMA foreign_keys = ON`);

// ======================================
// AUTHENTIFICATION ADMIN
// ======================================

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const AUTH_SECRET = process.env.AUTH_SECRET || "";
const ADMIN_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

function createAdminToken() {
  const payload = `${ADMIN_USERNAME}:${Date.now()}:${crypto.randomBytes(16).toString("hex")}`;
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

function verifyAdminToken(token) {
  try {
    if (!token || !AUTH_SECRET) return false;
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const dot = decoded.lastIndexOf(".");
    if (dot < 1) return false;
    const payload = decoded.slice(0, dot);
    const signature = decoded.slice(dot + 1);
    const expected = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
    const parts = payload.split(":");
    const issuedAt = Number(parts[1]);
    return parts[0] === ADMIN_USERNAME && Number.isFinite(issuedAt) && Date.now() - issuedAt < ADMIN_TOKEN_TTL_MS;
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const auth = req.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!verifyAdminToken(token)) {
    return res.status(401).json({ success: false, message: "Accès administrateur non autorisé." });
  }
  next();
}

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!ADMIN_PASSWORD || !AUTH_SECRET) {
    return res.status(503).json({ success: false, message: "Authentification administrateur non configurée sur le serveur." });
  }
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: "Identifiant ou mot de passe incorrect." });
  }
  res.json({ success: true, token: createAdminToken(), expiresIn: ADMIN_TOKEN_TTL_MS });
});

app.get("/api/admin/verify", requireAdmin, (req, res) => {
  res.json({ success: true });
});

// ======================================
// COLONNE EXISTE
// ======================================

function columnExists(tableName, columnName) {
  const columns = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all();

  return columns.some(
    (column) => column.name === columnName
  );
}

// ======================================
// TABLE PRODUCTS
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
// COLONNES PRODUCTS
// ======================================

const productColumns = [
  {
    name: "priceLabel",
    sql: "ALTER TABLE products ADD COLUMN priceLabel TEXT",
  },
  {
    name: "description",
    sql: "ALTER TABLE products ADD COLUMN description TEXT",
  },
  {
    name: "image",
    sql: "ALTER TABLE products ADD COLUMN image TEXT",
  },
  {
    name: "available",
    sql: "ALTER TABLE products ADD COLUMN available INTEGER DEFAULT 1",
  },
  {
    name: "createdAt",
    sql: "ALTER TABLE products ADD COLUMN createdAt TEXT DEFAULT CURRENT_TIMESTAMP",
  },
];

for (const column of productColumns) {
  if (!columnExists("products", column.name)) {
    try {
      db.exec(column.sql);
      console.log(
        `Colonne products.${column.name} ajoutée.`
      );
    } catch (error) {
      console.log(
        `Impossible d'ajouter products.${column.name}:`,
        error.message
      );
    }
  }
}

// ======================================
// TABLE ORDERS
// ======================================

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerName TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    paymentMethod TEXT NOT NULL,
    paymentStatus TEXT DEFAULT 'À vérifier',
    items TEXT NOT NULL,
    total INTEGER NOT NULL,
    status TEXT DEFAULT 'Nouvelle',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// ======================================
// COLONNES ORDERS
// ======================================

const orderColumns = [
  {
    name: "customerName",
    sql: "ALTER TABLE orders ADD COLUMN customerName TEXT",
  },
  {
    name: "phone",
    sql: "ALTER TABLE orders ADD COLUMN phone TEXT",
  },
  {
    name: "city",
    sql: "ALTER TABLE orders ADD COLUMN city TEXT",
  },
  {
    name: "address",
    sql: "ALTER TABLE orders ADD COLUMN address TEXT",
  },
  {
    name: "paymentMethod",
    sql: "ALTER TABLE orders ADD COLUMN paymentMethod TEXT",
  },
  {
    name: "paymentStatus",
    sql: "ALTER TABLE orders ADD COLUMN paymentStatus TEXT DEFAULT 'À vérifier'",
  },
  {
    name: "items",
    sql: "ALTER TABLE orders ADD COLUMN items TEXT DEFAULT '[]'",
  },
  {
    name: "total",
    sql: "ALTER TABLE orders ADD COLUMN total INTEGER DEFAULT 0",
  },
  {
    name: "status",
    sql: "ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'Nouvelle'",
  },
  {
    name: "createdAt",
    sql: "ALTER TABLE orders ADD COLUMN createdAt TEXT DEFAULT CURRENT_TIMESTAMP",
  },
];

for (const column of orderColumns) {
  if (!columnExists("orders", column.name)) {
    try {
      db.exec(column.sql);
      console.log(
        `Colonne orders.${column.name} ajoutée.`
      );
    } catch (error) {
      console.log(
        `Impossible d'ajouter orders.${column.name}:`,
        error.message
      );
    }
  }
}

// ======================================
// RÉPARATION ANCIENNES COMMANDES
// ======================================

try {
  db.exec(`
    UPDATE orders
    SET items = '[]'
    WHERE items IS NULL OR items = ''
  `);
} catch (error) {
  console.log(
    "Erreur réparation items :",
    error.message
  );
}

// ======================================
// PRODUITS INITIAUX
// ======================================

const productCount = db
  .prepare("SELECT COUNT(*) AS count FROM products")
  .get();

if (Number(productCount.count) === 0) {
  const insertProduct = db.prepare(`
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

  insertProduct.run(
    "Lunettes Photogray Homme",
    "Photogray",
    12000,
    "",
    "Lunettes photogray élégantes pour homme.",
    "",
    1
  );

  insertProduct.run(
    "Lunettes Photogray Femme",
    "Photogray",
    12000,
    "",
    "Lunettes photogray élégantes pour femme.",
    "",
    1
  );

  insertProduct.run(
    "Lunettes Médicales",
    "Médicales",
    null,
    "Sur ordonnance",
    "Lunettes médicales adaptées à votre ordonnance.",
    "",
    1
  );

  insertProduct.run(
    "Lunettes noirs fumées",
    "Solaire",
    7000,
    "À partir de 7 000 FCFA",
    "Lunettes noires fumées élégantes.",
    "",
    1
  );

  console.log("Produits initiaux ajoutés.");
}

// ======================================
// FORMAT ORDER
// ======================================

function formatOrder(order) {
  let parsedItems = [];

  try {
    if (order.items) {
      parsedItems = JSON.parse(order.items);
    }
  } catch (error) {
    parsedItems = [];
  }

  return {
    ...order,
    items: Array.isArray(parsedItems)
      ? parsedItems
      : [],
    paymentNumber: "70 466 12 53",
  };
}

// ======================================
// ROUTE PRINCIPALE
// ======================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Serveur MAME FALLOU OPTIQUE opérationnel.",
  });
});

// ======================================
// TEST
// ======================================

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API fonctionnelle.",
  });
});

// ======================================
// PRODUITS
// ======================================

app.get("/api/products", (req, res) => {
  try {
    const products = db
      .prepare(`
        SELECT *
        FROM products
        ORDER BY id DESC
      `)
      .all();

    res.json(products);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Impossible de récupérer les produits.",
    });
  }
});

// ======================================
// AJOUT PRODUIT
// ======================================

app.post("/api/products", requireAdmin, (req, res) => {
  try {
    const {
      name,
      category,
      price,
      priceLabel,
      description,
      image,
      available,
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message:
          "Le nom et la catégorie sont obligatoires.",
      });
    }

    const numericPrice =
      price === null ||
      price === undefined ||
      price === ""
        ? null
        : Number(price);

    if (
      numericPrice !== null &&
      !Number.isFinite(numericPrice)
    ) {
      return res.status(400).json({
        success: false,
        message: "Prix invalide.",
      });
    }

    const numericAvailable =
      Number(available) === 0 ? 0 : 1;

    const result = db
      .prepare(`
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
      `)
      .run(
        String(name).trim(),
        String(category).trim(),
        numericPrice,
        priceLabel || "",
        description || "",
        image || "",
        numericAvailable
      );

    const product = db
      .prepare(`
        SELECT *
        FROM products
        WHERE id = ?
      `)
      .get(Number(result.lastInsertRowid));

    res.status(201).json(product);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Impossible d'ajouter le produit.",
    });
  }
});

// ======================================
// MODIFIER PRODUIT
// ======================================

app.put("/api/products/:id", requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      name,
      category,
      price,
      priceLabel,
      description,
      image,
      available,
    } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant produit invalide.",
      });
    }

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message:
          "Le nom et la catégorie sont obligatoires.",
      });
    }

    const numericPrice =
      price === null ||
      price === undefined ||
      price === ""
        ? null
        : Number(price);

    if (
      numericPrice !== null &&
      !Number.isFinite(numericPrice)
    ) {
      return res.status(400).json({
        success: false,
        message: "Prix invalide.",
      });
    }

    const numericAvailable =
      Number(available) === 0 ? 0 : 1;

    const result = db
      .prepare(`
        UPDATE products
        SET
          name = ?,
          category = ?,
          price = ?,
          priceLabel = ?,
          description = ?,
          image = ?,
          available = ?
        WHERE id = ?
      `)
      .run(
        String(name).trim(),
        String(category).trim(),
        numericPrice,
        priceLabel || "",
        description || "",
        image || "",
        numericAvailable,
        id
      );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Produit introuvable.",
      });
    }

    const product = db
      .prepare(`
        SELECT *
        FROM products
        WHERE id = ?
      `)
      .get(id);

    res.json(product);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Impossible de modifier le produit.",
    });
  }
});

// ======================================
// SUPPRIMER PRODUIT
// ======================================

app.delete("/api/products/:id", requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);

    const result = db
      .prepare(`
        DELETE FROM products
        WHERE id = ?
      `)
      .run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Produit introuvable.",
      });
    }

    res.json({
      success: true,
      message:
        "Produit supprimé avec succès.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Impossible de supprimer le produit.",
    });
  }
});

// ======================================
// UPLOAD IMAGE
// ======================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },

  filename: (req, file, cb) => {
    const extension =
      path.extname(file.originalname);

    cb(
      null,
      `image-${Date.now()}${extension}`
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

app.post(
  "/api/upload",
  requireAdmin,
  upload.single("image"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Aucune image reçue.",
        });
      }

      const imageUrl =
        `/uploads/${req.file.filename}`;

      res.json({
        success: true,
        image: imageUrl,
        filename: req.file.filename,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Erreur lors de l'envoi de l'image.",
      });
    }
  }
);

// ======================================
// CRÉER COMMANDE
// ======================================

app.post("/api/orders", (req, res) => {
  try {
    const {
      customerName,
      phone,
      city,
      address,
      paymentMethod,
      items,
      total,
    } = req.body;

    if (
      !customerName ||
      !phone ||
      !city ||
      !address ||
      !paymentMethod ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Veuillez remplir toutes les informations obligatoires.",
      });
    }

    const allowedPaymentMethods = [
      "wave",
      "orange-money",
    ];

    if (
      !allowedPaymentMethods.includes(
        paymentMethod
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Mode de paiement invalide.",
      });
    }

    const numericTotal = Number(total);

    if (
      !Number.isFinite(numericTotal) ||
      numericTotal <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Le montant de la commande est invalide.",
      });
    }

    // ==================================
    // NETTOYAGE ARTICLES
    // ==================================

    const cleanItems = items.map((item) => {
      const itemPrice = Number(
        item.price ??
        item.productPrice ??
        0
      );

      const quantity = Number(
        item.quantity ?? 1
      );

      const id = Number(
        item.id ??
        item.productId ??
        0
      );

      const name = String(
        item.name ??
        item.productName ??
        "Produit"
      ).trim();

      // IMPORTANT :
      // ON CONSERVE L'IMAGE EXACTE
      // DU PRODUIT AU MOMENT DE LA COMMANDE
      const image = String(
        item.image ??
        ""
      ).trim();

      return {
        id,
        name,
        productName: name,
        price: itemPrice,
        quantity,
        image,
      };
    });

    // ==================================
    // VALIDATION ARTICLES
    // ==================================

    for (const item of cleanItems) {
      if (
        !Number.isInteger(item.id) ||
        item.id <= 0 ||
        !item.name ||
        !Number.isFinite(item.price) ||
        item.price < 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Un article de la commande est invalide.",
        });
      }
    }

    // ==================================
    // VÉRIFIER PRODUITS
    // ==================================

    for (const item of cleanItems) {
      const product = db
        .prepare(`
          SELECT id, name, price, image, available
          FROM products
          WHERE id = ?
        `)
        .get(item.id);

      if (!product) {
        return res.status(400).json({
          success: false,
          message:
            `Le produit "${item.name}" n'existe plus.`,
        });
      }

      if (Number(product.available) === 0) {
        return res.status(400).json({
          success: false,
          message:
            `Le produit "${product.name}" n'est plus disponible.`,
        });
      }

      // Si Checkout n'a pas envoyé l'image,
      // on la récupère directement depuis le produit.
      if (!item.image && product.image) {
        item.image = product.image;
      }
    }

    // ==================================
    // INSERT COMMANDE
    // ==================================

    const result = db
      .prepare(`
        INSERT INTO orders
        (
          customerName,
          phone,
          city,
          address,
          paymentMethod,
          paymentStatus,
          items,
          total,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        String(customerName).trim(),
        String(phone).trim(),
        String(city).trim(),
        String(address).trim(),
        paymentMethod,
        "À vérifier",
        JSON.stringify(cleanItems),
        numericTotal,
        "Nouvelle"
      );

    const orderId =
      Number(result.lastInsertRowid);

    console.log(
      `Nouvelle commande #${orderId}`
    );

    console.log(
      `Photo(s) enregistrée(s) dans la commande.`
    );

    const newOrder = db
      .prepare(`
        SELECT *
        FROM orders
        WHERE id = ?
      `)
      .get(orderId);

    const formattedOrder =
      formatOrder(newOrder);

    res.status(201).json({
      success: true,
      message:
        "Commande enregistrée avec succès.",
      orderId,
      paymentStatus: "À vérifier",
      paymentNumber: "70 466 12 53",
      order: formattedOrder,
    });
  } catch (error) {
    console.error(
      "Erreur création commande :",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Erreur lors de la création de la commande.",
    });
  }
});

// ======================================
// TOUTES LES COMMANDES
// ======================================

app.get("/api/orders", requireAdmin, (req, res) => {
  try {
    const orders = db
      .prepare(`
        SELECT *
        FROM orders
        ORDER BY id DESC
      `)
      .all();

    res.json({
      success: true,
      orders: orders.map(formatOrder),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Impossible de récupérer les commandes.",
    });
  }
});

// ======================================
// UNE COMMANDE
// ======================================

app.get("/api/orders/:id", requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);

    const order = db
      .prepare(`
        SELECT *
        FROM orders
        WHERE id = ?
      `)
      .get(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable.",
      });
    }

    res.json({
      success: true,
      order: formatOrder(order),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Impossible de récupérer la commande.",
    });
  }
});

// ======================================
// STATUT COMMANDE
// ======================================

app.put(
  "/api/orders/:id/status",
  requireAdmin,
  (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      const allowedStatuses = [
        "Nouvelle",
        "Confirmée",
        "En préparation",
        "Expédiée",
        "En livraison",
        "Livrée",
        "Annulée",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Statut de commande invalide.",
        });
      }

      const result = db
        .prepare(`
          UPDATE orders
          SET status = ?
          WHERE id = ?
        `)
        .run(status, id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Commande introuvable.",
        });
      }

      const order = db
        .prepare(`
          SELECT *
          FROM orders
          WHERE id = ?
        `)
        .get(id);

      res.json({
        success: true,
        message:
          "Statut de la commande modifié.",
        order: formatOrder(order),
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Impossible de modifier le statut.",
      });
    }
  }
);

// ======================================
// STATUT PAIEMENT
// ======================================

app.put(
  "/api/orders/:id/payment-status",
  requireAdmin,
  (req, res) => {
    try {
      const id = Number(req.params.id);
      const { paymentStatus } = req.body;

      const allowedPaymentStatuses = [
        "À vérifier",
        "Payée",
        "Non payée",
        "Refusée",
      ];

      if (
        !allowedPaymentStatuses.includes(
          paymentStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Statut de paiement invalide.",
        });
      }

      const result = db
        .prepare(`
          UPDATE orders
          SET paymentStatus = ?
          WHERE id = ?
        `)
        .run(paymentStatus, id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Commande introuvable.",
        });
      }

      const order = db
        .prepare(`
          SELECT *
          FROM orders
          WHERE id = ?
        `)
        .get(id);

      res.json({
        success: true,
        message:
          "Statut du paiement modifié.",
        order: formatOrder(order),
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Impossible de modifier le paiement.",
      });
    }
  }
);

// ======================================
// SUPPRIMER COMMANDE
// ======================================

app.delete(
  "/api/orders/:id",
  requireAdmin,
  (req, res) => {
    try {
      const id = Number(req.params.id);

      const result = db
        .prepare(`
          DELETE FROM orders
          WHERE id = ?
        `)
        .run(id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Commande introuvable.",
        });
      }

      res.json({
        success: true,
        message:
          "Commande supprimée avec succès.",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Impossible de supprimer la commande.",
      });
    }
  }
);

// ======================================
// ERREURS MULTER
// ======================================

app.use(
  (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (
        error.code === "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "L'image ne doit pas dépasser 5 Mo.",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          "Erreur lors de l'envoi de l'image.",
      });
    }

    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Erreur interne du serveur.",
    });
  }
);

// ======================================
// START
// ======================================

app.listen(PORT, HOST, () => {
  console.log(
    "======================================"
  );
  console.log(
    "       MAME FALLOU OPTIQUE"
  );
  console.log(
    "======================================"
  );
  console.log(
    `Serveur lancé sur le port ${PORT}`
  );
  console.log(
    "Wave / Orange Money : 70 466 12 53"
  );
  console.log(
    "======================================"
  );
});