import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BricoLoopService, createSeed } from './service.js';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = resolve(projectDir, '.data', 'bricoloop.json');

function saveDatabase(db) {
  mkdirSync(dirname(dataFile), { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  writeFileSync(temporaryFile, `${JSON.stringify(db, null, 2)}\n`, 'utf8');
  renameSync(temporaryFile, dataFile);
}

export function createPersistentService() {
  let db;
  try {
    db = JSON.parse(readFileSync(dataFile, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`Impossible de lire les données BricoLoop : ${error.message}`);
    db = createSeed();
    saveDatabase(db);
  }

  return new BricoLoopService(db, saveDatabase);
}
