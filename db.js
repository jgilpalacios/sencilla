const sqlite3 = require("sqlite3").verbose();
//const { sql } = require("@vercel/postgres");
const { sql } = require("@neondatabase/serverless");
const isProd = process.env.VERCEL === "1"; // Vercel setea esta variable

let db;
if (!isProd) {
  // SQLite en local
  db = new sqlite3.Database("./contacts.db");
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT
    )`);
  });
}

module.exports = {
  async createTablesAndDefaultUser(bcrypt) {
    if (isProd) {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE,
          password TEXT
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS contacts (
          id SERIAL PRIMARY KEY,
          name TEXT,
          phone TEXT
        )
      `;
      const hashedPassword = bcrypt.hashSync("1234", 10);
      await sql`
        INSERT INTO users (username, password)
        VALUES ('admin', ${hashedPassword})
        ON CONFLICT (username) DO NOTHING
      `;
    } else {
      const hashedPassword = bcrypt.hashSync("1234", 10);
      db.run(
        `INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`,
        ["admin", hashedPassword]
      );
    }
  },

  async getUser(username) {
    if (isProd) {
      const { rows } = await sql`SELECT * FROM users WHERE username = ${username}`;
      return rows[0];
    } else {
      return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
  },

  async getContacts() {
    if (isProd) {
      const { rows } = await sql`SELECT * FROM contacts`;
      return rows;
    } else {
      return new Promise((resolve, reject) => {
        db.all("SELECT * FROM contacts", [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  },

  async insertContact(name, phone) {
    if (isProd) {
      await sql`INSERT INTO contacts (name, phone) VALUES (${name}, ${phone})`;
    } else {
      return new Promise((resolve, reject) => {
        db.run("INSERT INTO contacts (name, phone) VALUES (?, ?)", [name, phone], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  },

  async getContact(id) {
    if (isProd) {
      const { rows } = await sql`SELECT * FROM contacts WHERE id = ${id}`;
      return rows[0];
    } else {
      return new Promise((resolve, reject) => {
        db.get("SELECT * FROM contacts WHERE id = ?", [id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
  },

  async updateContact(id, name, phone) {
    if (isProd) {
      await sql`UPDATE contacts SET name = ${name}, phone = ${phone} WHERE id = ${id}`;
    } else {
      return new Promise((resolve, reject) => {
        db.run(
          "UPDATE contacts SET name = ?, phone = ? WHERE id = ?",
          [name, phone, id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
  },

  async deleteContact(id) {
    if (isProd) {
      await sql`DELETE FROM contacts WHERE id = ${id}`;
    } else {
      return new Promise((resolve, reject) => {
        db.run("DELETE FROM contacts WHERE id = ?", [id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
};
