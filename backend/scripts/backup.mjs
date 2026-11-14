import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_opd';
const BACKUPS_DIR = path.join(__dirname, '../backups');

export async function runClinicBackup() {
  console.log('================================================================');
  console.log('       SMART OPD MANAGEMENT SYSTEM - DATABASE BACKUP UTILITY    ');
  console.log('================================================================');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFolder = path.join(BACKUPS_DIR, `backup-${timestamp}`);

  if (!fs.existsSync(backupFolder)) {
    fs.mkdirSync(backupFolder, { recursive: true });
  }

  try {
    console.log(`[Backup] Connecting to MongoDB: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('[Backup] Connected successfully.');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database handle not available');
    }

    const collections = await db.listCollections().toArray();
    console.log(`[Backup] Located ${collections.length} collections in database.`);

    const manifest = {
      product: 'Smart OPD - Single Clinic Management System',
      backupTimestamp: new Date().toISOString(),
      backupFolder: path.basename(backupFolder),
      collections: {},
      totalRecords: 0
    };

    for (const col of collections) {
      const colName = col.name;
      // Skip system indexes
      if (colName.startsWith('system.')) continue;

      const records = await db.collection(colName).find({}).toArray();
      const jsonContent = JSON.stringify(records, null, 2);

      // Compute SHA-256 Checksum
      const hash = crypto.createHash('sha256').update(jsonContent).digest('hex');
      const filePath = path.join(backupFolder, `${colName}.json`);

      fs.writeFileSync(filePath, jsonContent, 'utf-8');

      manifest.collections[colName] = {
        count: records.length,
        sha256: hash,
        file: `${colName}.json`
      };
      manifest.totalRecords += records.length;

      console.log(`  ✓ Dumped '${colName}': ${records.length} records (SHA-256: ${hash.slice(0, 12)}...)`);
    }

    // Write manifest
    const manifestPath = path.join(backupFolder, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    console.log('\n[Backup] Manifest written to manifest.json');
    console.log(`[Backup] Backup completed successfully. Total records archived: ${manifest.totalRecords}`);
    console.log(`[Backup] Destination: ${backupFolder}`);
    console.log('================================================================');

    return {
      success: true,
      backupFolder,
      manifest
    };
  } catch (err) {
    console.error('[Backup Error] Failed to generate database backup:', err);
    throw err;
  } finally {
    await mongoose.disconnect();
    console.log('[Backup] Disconnected from MongoDB.');
  }
}

// Allow direct CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runClinicBackup().catch(() => process.exit(1));
}

