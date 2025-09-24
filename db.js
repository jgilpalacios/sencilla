const sqlite3 = require("sqlite3").verbose();
const { Client } = require("@neondatabase/serverless");

const bcrypt = require("bcrypt");

// Detecta entorno de producción
const useNeon = process.env.VERCEL === "1" || process.env.USE_NEON === "true";

let sqliteDb;
let neonClient;

if (useNeon) {
  neonClient = new Client({
    connectionString: process.env.AGENDA_URL,
  });
} else {
  sqliteDb = new sqlite3.Database("./contacts.db");
  sqliteDb.serialize(() => {
    sqliteDb.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);
    sqliteDb.run(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT
    )`);
  });
}

// Inicializar tablas y usuario por defecto
async function createTablesAndDefaultUser() {
  const hashedPassword = bcrypt.hashSync("1234", 10);

  if (useNeon) {
    await neonClient.connect();
    await neonClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
      )
    `);
    await neonClient.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name TEXT,
        phone TEXT
      )
    `);
    await neonClient.query(
      `INSERT INTO users (username, password)
       VALUES ($1, $2)
       ON CONFLICT (username) DO NOTHING`,
      ["admin", hashedPassword]
    );
  } else {
    sqliteDb.run(
      `INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`,
      ["admin", hashedPassword]
    );
  }
}

// Funciones de la DB
async function getUser(username) {
  if (useNeon) {
    const { rows } = await neonClient.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );
    return rows[0];
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(
        "SELECT * FROM users WHERE username=?",
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
}

async function getContacts() {
  if (useNeon) {
    const { rows } = await neonClient.query("SELECT * FROM contacts");
    return rows;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM contacts", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

async function insertContact(name, phone) {
  if (useNeon) {
    await neonClient.query(
      "INSERT INTO contacts (name, phone) VALUES ($1, $2)",
      [name, phone]
    );
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(
        "INSERT INTO contacts (name, phone) VALUES (?, ?)",
        [name, phone],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}

async function getContact(id) {
  if (useNeon) {
    const { rows } = await neonClient.query(
      "SELECT * FROM contacts WHERE id=$1",
      [id]
    );
    return rows[0];
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(
        "SELECT * FROM contacts WHERE id=?",
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
}

async function updateContact(id, name, phone) {
  if (useNeon) {
    await neonClient.query(
      "UPDATE contacts SET name=$1, phone=$2 WHERE id=$3",
      [name, phone, id]
    );
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(
        "UPDATE contacts SET name=?, phone=? WHERE id=?",
        [name, phone, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}

async function deleteContact(id) {
  if (useNeon) {
    await neonClient.query("DELETE FROM contacts WHERE id=$1", [id]);
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run("DELETE FROM contacts WHERE id=?", [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = {
  createTablesAndDefaultUser,
  getUser,
  getContacts,
  insertContact,
  getContact,
  updateContact,
  deleteContact,
  neonClient,
};
