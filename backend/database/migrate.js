import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Defina DATABASE_URL no arquivo .env');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  const schemaPath = path.join(__dirname, 'schema.sql');
  await client.query(fs.readFileSync(schemaPath, 'utf8'));

  const patchesDir = path.join(__dirname, 'patches');
  if (fs.existsSync(patchesDir)) {
    const patchFiles = fs.readdirSync(patchesDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of patchFiles) {
      const patchSql = fs.readFileSync(path.join(patchesDir, file), 'utf8');
      await client.query(patchSql);
      console.log(`Patch aplicado: ${file}`);
    }
  }

  console.log('Migração aplicada com sucesso.');
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
