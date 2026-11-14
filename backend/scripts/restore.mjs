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

export async function runClinicRestore(targetFolder) {
  console.log('================================================================');
  console.log('       SMART OPD MANAGEMENT SYSTEM - DATABASE RESTORE UTILITY   ');
  console.log('================================================================');

  let selectedFolder = targetFolder;

  // If no folder passed, find most recent backup in backups directory
  if (!selectedFolder) {
    if (!fs.existsSync(BACKUPS_DIR)) {
      throw new Error(`Backups directory does not exist: ${BACKUPS_DIR}`);
    }
    const entries = fs.readdirSync(BACKUPS_DIR)
      .filter((f) => f.startsWith('backup-'))
      .sort()
      .reverse();

    if (entries.length === 0) {
      throw new Error('No backup snapshots located in backups directory.');
    }
    selectedFolder = path.join(BACKUPS_DIR, entries[0]);
  }

  console.log(`[Restore] Target backup snapshot: ${selectedFolder}`);

  const manifestPath = path.join(selectedFolder, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Invalid backup: missing manifest.json at ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  console.log(`[Restore] Verified manifest: ${manifest.backupTimestamp} (${manifest.totalRecords} records)`);

  // Integrity Check: Validate SHA-256 for each collection file
  console.log('[Restore] Running pre-restore cryptographic checksum verification...');
  for (const [colName, meta] of Object.entries(manifest.collections)) {
    const filePath = path.join(selectedFolder, meta.file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Corrupted backup: Missing collection file ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const computedHash = crypto.createHash('sha256').update(content).digest('hex');

    if (computedHash !== meta.sha256) {
      throw new Error(`Checksum mismatch on '${colName}'! Expected: ${meta.sha256}, Computed: ${computedHash}`);
    }
    console.log(`  ✓ Verified '${colName}' integrity (SHA-256 match)`);
  }
  console.log('[Restore] Checksum verification 100% PASSED.');

  try {
    console.log(`[Restore] Connecting to MongoDB: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database handle not available');

    console.log('[Restore] Connected. Reconstituting collection data...');

    let totalRestored = 0;
    for (const [colName, meta] of Object.entries(manifest.collections)) {
      const filePath = path.join(selectedFolder, meta.file);
      const records = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (records.length > 0) {
        // Convert string $oid and $date if needed
        const collection = db.collection(colName);
        for (const doc of records) {
          if (doc._id && typeof doc._id === 'string' && mongoose.isValidObjectId(doc._id)) {
            doc._id = new mongoose.Types.ObjectId(doc._id);
          }
          await collection.updateOne(
            { _id: doc._id },
            { $set: doc },
            { upsert: true }
          );
        }
        totalRestored += records.length;
        console.log(`  ✓ Restored/Upserted ${records.length} records into '${colName}'`);
      }
    }

    console.log(`\n[Restore] Restore completed successfully. Total records processed: ${totalRestored}`);
    console.log('================================================================');

    return {
      success: true,
      totalRestored,
      selectedFolder
    };
  } catch (err) {
    console.error('[Restore Error] Failed to restore database snapshot:', err);
    throw err;
  } finally {
    await mongoose.disconnect();
    console.log('[Restore] Disconnected from MongoDB.');
  }
}

// Allow direct CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const argDir = process.argv.find((a) => a.startsWith('--dir='))?.split('=')[1];
  runClinicRestore(argDir).catch(() => process.exit(1));
}
