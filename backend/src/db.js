import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, "snapy.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS sellers (
    phone TEXT PRIMARY KEY,
    pin_hash TEXT NOT NULL,
    store_name TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Autres',
    image_url TEXT NOT NULL,
    audio_url TEXT,
    description TEXT NOT NULL,
    seller_phone TEXT NOT NULL REFERENCES sellers(phone) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_phone);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    role TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_chat_product ON chat_messages(product_id);
`);

// CREATE TABLE IF NOT EXISTS only applies to brand-new databases — existing
// snapy.db files predate the audio_url column and need it added by hand.
const hasAudioColumn = db.prepare("SELECT 1 FROM pragma_table_info('products') WHERE name = 'audio_url'").get();
if (!hasAudioColumn) {
  db.exec("ALTER TABLE products ADD COLUMN audio_url TEXT");
}
