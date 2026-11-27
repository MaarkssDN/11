import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createInitialSeedDatabase, loadDatabase, resolveDbFilePath, saveDatabase } from './db';

const ENV_KEY = 'B360_AOC_DB_PATH';

function useTempDatabase(t: { after: (fn: () => void) => void }): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b360-aoc-db-'));
  const dbPath = path.join(dir, 'b360-aoc-db.json');
  const previous = process.env[ENV_KEY];
  process.env[ENV_KEY] = dbPath;
  t.after(() => {
    if (previous === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = previous;
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dbPath;
}

function captureConsoleError(t: { after: (fn: () => void) => void }): string[] {
  const lines: string[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    lines.push(args.map((arg) => String(arg)).join(' '));
  };
  t.after(() => {
    console.error = original;
  });
  return lines;
}

describe('persistência local do JSON', { concurrency: 1 }, () => {
  test('resolveDbFilePath lê B360_AOC_DB_PATH a cada chamada', (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b360-aoc-db-'));
    const previous = process.env[ENV_KEY];
    t.after(() => {
      if (previous === undefined) {
        delete process.env[ENV_KEY];
      } else {
        process.env[ENV_KEY] = previous;
      }
      fs.rmSync(dir, { recursive: true, force: true });
    });

    const first = path.join(dir, 'a.json');
    const second = path.join(dir, 'b.json');
    process.env[ENV_KEY] = first;
    assert.equal(resolveDbFilePath(), path.resolve(first));
    process.env[ENV_KEY] = second;
    assert.equal(resolveDbFilePath(), path.resolve(second));
    delete process.env[ENV_KEY];
    assert.equal(resolveDbFilePath(), path.resolve(path.join('data', 'b360-aoc-db.json')));
  });

  test('JSON corrompido não é sobrescrito e loadDatabase falha fechado', (t) => {
    const dbPath = useTempDatabase(t);
    const sentinel = 'SENTINEL_DB_BYTES_7f3a_DO_NOT_LEAK';
    const payload = Buffer.from(`{"leak":"${sentinel}"`, 'utf-8');
    fs.writeFileSync(dbPath, payload);
    const logs = captureConsoleError(t);

    assert.throws(
      () => loadDatabase(),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /invalid JSON/);
        assert.match(error.message, /Refusing to overwrite or reseed/);
        assert.equal(error.message.includes(sentinel), false);
        return true;
      }
    );

    assert.deepEqual(fs.readFileSync(dbPath), payload);
    const logged = logs.join('\n');
    assert.match(logged, /failed closed \(invalid JSON\)/);
    assert.equal(logged.includes(sentinel), false);
    assert.equal(fs.readdirSync(path.dirname(dbPath)).some((name) => name.endsWith('.tmp')), false);
  });

  test('arquivo vazio existente não é ressemeado', (t) => {
    const dbPath = useTempDatabase(t);
    const payload = Buffer.alloc(0);
    fs.writeFileSync(dbPath, payload);
    captureConsoleError(t);

    assert.throws(() => loadDatabase(), /invalid JSON/);
    assert.deepEqual(fs.readFileSync(dbPath), payload);
  });

  test('erro de I/O em caminho existente não apaga nem ressemeia', (t) => {
    const dbPath = useTempDatabase(t);
    fs.mkdirSync(dbPath);
    const logs = captureConsoleError(t);

    assert.throws(
      () => loadDatabase(),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /could not be read \(EISDIR\)/);
        assert.match(error.message, /Refusing to overwrite or reseed/);
        return true;
      }
    );

    assert.equal(fs.statSync(dbPath).isDirectory(), true);
    assert.deepEqual(fs.readdirSync(dbPath), []);
    assert.match(logs.join('\n'), /failed closed \(read EISDIR\)/);
  });

  test('arquivo ausente é semeado uma vez e a leitura seguinte não regrava', (t) => {
    const dbPath = useTempDatabase(t);
    assert.equal(fs.existsSync(dbPath), false);

    const seeded = loadDatabase();
    assert.equal(fs.existsSync(dbPath), true);
    assert.equal(seeded.providers.length, 10);
    assert.equal(seeded.governance.devinBridgeEnabled, true);

    const written = fs.readFileSync(dbPath);
    const loaded = loadDatabase();
    assert.deepEqual(fs.readFileSync(dbPath), written);
    assert.equal(loaded.providers.length, seeded.providers.length);
    assert.equal(loaded.governance.devinContractVerified, seeded.governance.devinContractVerified);
    assert.deepEqual(JSON.parse(written.toString('utf-8')), loaded);

    const nested = path.join(path.dirname(dbPath), 'nested', 'missing', 'b360-aoc-db.json');
    process.env[ENV_KEY] = nested;
    assert.equal(fs.existsSync(nested), false);
    const nestedSeed = loadDatabase();
    assert.equal(fs.existsSync(nested), true);
    assert.equal(nestedSeed.providers.length, 10);
  });

  test('caminho feliz grava e relê o estado sem substituir por seed', (t) => {
    const dbPath = useTempDatabase(t);
    const seed = createInitialSeedDatabase();
    seed.governance.emergencyKillSwitchReason = 'happy-path-marker';
    saveDatabase(seed);

    const written = fs.readFileSync(dbPath);
    const loaded = loadDatabase();
    assert.deepEqual(fs.readFileSync(dbPath), written);
    assert.equal(loaded.governance.emergencyKillSwitchReason, 'happy-path-marker');
    assert.equal(loaded.providers.length, seed.providers.length);
    assert.equal(loaded.governance.devinBridgeEnabled, seed.governance.devinBridgeEnabled);

    loaded.governance.emergencyKillSwitchReason = 'happy-path-updated';
    saveDatabase(loaded);
    const reloaded = loadDatabase();
    assert.equal(reloaded.governance.emergencyKillSwitchReason, 'happy-path-updated');
    assert.equal(
      fs.readdirSync(path.dirname(dbPath)).some((name) => name.endsWith('.tmp')),
      false
    );
    const roundTrip = fs.readFileSync(dbPath, 'utf-8');
    assert.equal(JSON.parse(roundTrip).governance.emergencyKillSwitchReason, 'happy-path-updated');
  });
});
