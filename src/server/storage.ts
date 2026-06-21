import fs from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import { createInitialDbState, DbState, initialAgents, initialServices } from "./seed";

const STORAGE_PATH = path.join(process.cwd(), "src", "data_store.json");
const REDIS_KEY = "vesta:db-state";

let memoryCache: DbState | null = null;
let warnedAboutEphemeralStorage = false;
let redisClient: Redis | null = null;

function cloneState(state: DbState): DbState {
  return JSON.parse(JSON.stringify(state)) as DbState;
}

function hasRedisConfig(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = Redis.fromEnv();
  }

  return redisClient;
}

function normalizeState(state?: Partial<DbState> | null): DbState {
  return {
    services: state?.services ?? initialServices,
    agents: state?.agents ?? initialAgents,
    bookings: state?.bookings ?? [],
    matchLogs: state?.matchLogs ?? [],
    chats: state?.chats ?? {}
  };
}

function warnAboutEphemeralStorage() {
  if (!warnedAboutEphemeralStorage) {
    warnedAboutEphemeralStorage = true;
    console.warn("Persistent Vercel storage is not configured. Falling back to in-memory state for this instance.");
  }
}

function readFileState(): DbState | null {
  try {
    if (!fs.existsSync(STORAGE_PATH)) {
      return null;
    }

    const parsed = JSON.parse(fs.readFileSync(STORAGE_PATH, "utf-8")) as Partial<DbState>;
    return normalizeState(parsed);
  } catch (error) {
    console.error("Failed to read local database file, using seed data", error);
    return null;
  }
}

function writeFileState(state: DbState) {
  try {
    const parentDir = path.dirname(STORAGE_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(STORAGE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write local database file", error);
  }
}

async function readRedisState(): Promise<DbState | null> {
  try {
    const stored = await getRedisClient().get<Partial<DbState>>(REDIS_KEY);
    return stored ? normalizeState(stored) : null;
  } catch (error) {
    console.error("Failed to read Redis database state", error);
    return null;
  }
}

async function writeRedisState(state: DbState) {
  try {
    await getRedisClient().set(REDIS_KEY, state);
  } catch (error) {
    console.error("Failed to write Redis database state", error);
    throw error;
  }
}

export async function getDbState(): Promise<DbState> {
  if (memoryCache) {
    return cloneState(memoryCache);
  }

  if (hasRedisConfig()) {
    const storedState = await readRedisState();
    memoryCache = storedState ?? createInitialDbState();

    if (!storedState) {
      await writeRedisState(memoryCache);
    }

    return cloneState(memoryCache);
  }

  if (!process.env.VERCEL) {
    const fileState = readFileState();
    memoryCache = fileState ?? createInitialDbState();

    if (!fileState) {
      writeFileState(memoryCache);
    }

    return cloneState(memoryCache);
  }

  warnAboutEphemeralStorage();
  memoryCache = createInitialDbState();
  return cloneState(memoryCache);
}

export async function saveDbState(state: DbState) {
  memoryCache = cloneState(state);

  if (hasRedisConfig()) {
    await writeRedisState(memoryCache);
    return;
  }

  if (!process.env.VERCEL) {
    writeFileState(memoryCache);
    return;
  }

  warnAboutEphemeralStorage();
}
