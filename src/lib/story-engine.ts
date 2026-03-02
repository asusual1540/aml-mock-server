/**
 * Story Engine — AML Scenario Simulation
 *
 * Orchestrates a real-world AML data scenario by generating customer profiles
 * (Individual, Corporate, Government, NPO) with accounts, then periodically
 * producing transactions, trades, credits, and sanctions — with a configurable
 * percentage of bad actors performing rule violations.
 *
 * The engine is a server-side singleton: one story runs at a time.  All generated
 * data is pushed to the configured webhooks **and** persisted in the customer/account
 * pools so later manual webhook sends can reference the same entities.
 */

import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker';
import {
    generateCustomerData,
    generateIndividualProfile,
    generateCorporateProfile,
    generateGovernmentProfile,
    generateNPOProfile,
    type CustomerType,
} from './generators/customer-generators';
import {
    generateAccountData,
    type AccountProductType,
} from './generators/account-generators';
import {
    getSchemas,
    generateDataFromSchema,
    addCustomersToPool,
    addAccountsToPool,
    type CustomerPoolData,
} from './schema-manager';
import { generateViolationData, getRuleCatalog, type RuleInfo } from './rule-violation-generator';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface StoryConfig {
    name: string;
    place: string;
    intervalSeconds: number;
    players: {
        individual: number;
        corporate: number;
        government: number;
        npo: number;
    };
    badActorPercentage: number; // 0–100
}

export interface StoryPlayer {
    customerId: number;
    customerType: CustomerType;
    accountIds: string[];
    isBadActor: boolean;
    name: string;
    country: 'BD' | 'US';
}

export interface StoryLogEntry {
    timestamp: string;
    tick: number;
    type: 'info' | 'success' | 'warning' | 'error' | 'violation';
    message: string;
    dataType?: string;
    recordCount?: number;
    ruleCode?: string;
}

export interface WebhookMapping {
    webhookUrl: string;
    token: string;
}

export interface StoryState {
    id: string;
    config: StoryConfig;
    status: 'initializing' | 'running' | 'paused' | 'stopped' | 'error';
    players: StoryPlayer[];
    badActorCount: number;
    webhookMappings: Record<string, WebhookMapping>;
    startedAt: string;
    stoppedAt?: string;
    currentTick: number;
    totalRecordsSent: number;
    totalViolationsSent: number;
    recordsByType: Record<string, number>;
    logs: StoryLogEntry[];
    error?: string;
}

export interface StoryStatus {
    active: boolean;
    state: StoryState | null;
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const MAX_LOG_ENTRIES = 500;
const CONFIG_DIR = path.join(process.cwd(), 'config');
const WEBHOOK_CONFIGS_PATH = path.join(CONFIG_DIR, 'webhook-configs.json');
const STORY_STATE_PATH = path.join(CONFIG_DIR, 'story-state.json');

const PLACE_TO_COUNTRY: Record<string, 'BD' | 'US'> = {
    bangladesh: 'BD',
    bd: 'BD',
    dhaka: 'BD',
    chittagong: 'BD',
    rajshahi: 'BD',
    khulna: 'BD',
    sylhet: 'BD',
    usa: 'US',
    us: 'US',
    'united states': 'US',
    'new york': 'US',
    'los angeles': 'US',
};

// Data type activity weights — how frequently each type appears per tick
const ACTIVITY_WEIGHTS = {
    transaction: 0.85,  // 85% chance per tick
    trade: 0.20,        // 20% chance
    credit: 0.10,       // 10% chance
    sanction: 0.08,     // 8% chance
};

// Violation rule pools by category for bad actors
const TRANSACTION_RULES = [
    'CASH_THRESHOLD', 'STRUCTURING', 'VELOCITY_COUNT', 'RAPID_IN_OUT',
    'HIGH_RISK_COUNTRY', 'MULTI_COUNTRY', 'CUMULATIVE_AMOUNT',
    'FUNNEL_ACCOUNT', 'FLOW_THROUGH', 'ROUND_TRIP', 'SMALL_DEPOSIT_LARGE_WIRE',
];
const TRADE_RULES = [
    'TBML-001', 'TBML-002', 'TBML-004', 'TBML-006', 'TBML-010',
    'TBML-012', 'TBML-016', 'TBML-020', 'TBML-028', 'TBML-030',
    'ADV-001', 'ADV-003', 'ADV-005',
];
const SANCTION_RULES = [
    'SANCTION_INDIVIDUAL', 'SANCTION_CORPORATE', 'SANCTION_PEP',
    'SANCTION_VESSEL', 'SANCTION_ASSET', 'SANCTION_ADVERSE_MEDIA',
];

// ═══════════════════════════════════════════════════════════════════
// SINGLETON STATE
// ═══════════════════════════════════════════════════════════════════

let activeStory: StoryState | null = null;
let intervalHandle: ReturnType<typeof setInterval> | null = null;

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function uid(): string {
    return `story_${Date.now()}_${faker.string.alphanumeric(6)}`;
}

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, arr.length));
}

function countryFromPlace(place: string): 'BD' | 'US' {
    const normalized = place.trim().toLowerCase();
    return PLACE_TO_COUNTRY[normalized] || 'BD';
}

function addLog(entry: Omit<StoryLogEntry, 'timestamp'>) {
    if (!activeStory) return;
    activeStory.logs.push({ ...entry, timestamp: new Date().toISOString() });
    if (activeStory.logs.length > MAX_LOG_ENTRIES) {
        activeStory.logs = activeStory.logs.slice(-MAX_LOG_ENTRIES);
    }
}

function incrementRecords(dataType: string, count: number) {
    if (!activeStory) return;
    activeStory.totalRecordsSent += count;
    activeStory.recordsByType[dataType] = (activeStory.recordsByType[dataType] || 0) + count;
}

// ═══════════════════════════════════════════════════════════════════
// WEBHOOK AUTO-DETECTION
// ═══════════════════════════════════════════════════════════════════

function loadWebhookMappings(): Record<string, WebhookMapping> {
    const mappings: Record<string, WebhookMapping> = {};
    try {
        const raw = fs.readFileSync(WEBHOOK_CONFIGS_PATH, 'utf-8');
        const data = JSON.parse(raw);
        const configs: Array<{ name: string; webhookUrl: string; token: string }> = data.configs || [];

        // Auto-detect by name pattern
        const patterns: Array<{ type: string; keywords: string[] }> = [
            { type: 'customer', keywords: ['customer'] },
            { type: 'account', keywords: ['account'] },
            { type: 'transaction', keywords: ['transaction'] },
            { type: 'trade', keywords: ['trade'] },
            { type: 'credit', keywords: ['credit', 'loan'] },
            { type: 'sanction', keywords: ['sanction'] },
        ];

        for (const cfg of configs) {
            const nameLower = cfg.name.toLowerCase();
            for (const p of patterns) {
                if (p.keywords.some(k => nameLower.includes(k))) {
                    mappings[p.type] = { webhookUrl: cfg.webhookUrl, token: cfg.token };
                    break;
                }
            }
        }
    } catch (err) {
        console.error('[StoryEngine] Failed to load webhook configs:', err);
    }
    return mappings;
}

// ═══════════════════════════════════════════════════════════════════
// WEBHOOK SENDER
// ═══════════════════════════════════════════════════════════════════

async function sendToWebhook(dataType: string, data: any): Promise<boolean> {
    if (!activeStory) return false;
    const mapping = activeStory.webhookMappings[dataType];
    if (!mapping) {
        addLog({ tick: activeStory.currentTick, type: 'warning', message: `No webhook config for "${dataType}" — skipping`, dataType });
        return false;
    }

    const baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:9000';
    const fullUrl = `${baseUrl}${mapping.webhookUrl}`;

    try {
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mapping.token}`,
            },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            addLog({
                tick: activeStory.currentTick,
                type: 'error',
                message: `Webhook ${dataType} returned ${response.status}`,
                dataType,
            });
            return false;
        }
        return true;
    } catch (err: any) {
        addLog({
            tick: activeStory.currentTick,
            type: 'error',
            message: `Webhook ${dataType} failed: ${err.message}`,
            dataType,
        });
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════
// PLAYER GENERATION (Phase 1 — Initialization)
// ═══════════════════════════════════════════════════════════════════

function generatePlayers(config: StoryConfig): StoryPlayer[] {
    const country = countryFromPlace(config.place);
    const players: StoryPlayer[] = [];

    const divisions: Array<{ type: CustomerType; count: number }> = [
        { type: 'INDIVIDUAL', count: config.players.individual },
        { type: 'CORPORATE', count: config.players.corporate },
        { type: 'GOVERNMENT', count: config.players.government },
        { type: 'NPO', count: config.players.npo },
    ];

    for (const div of divisions) {
        for (let i = 0; i < div.count; i++) {
            const customerData = generateCustomerData(div.type, country);
            const customerId = customerData.customerId;
            const name = customerData.customerNameEng || `Player-${customerId}`;

            players.push({
                customerId,
                customerType: div.type,
                accountIds: [],
                isBadActor: false,
                name,
                country,
            });
        }
    }

    // Designate bad actors
    const totalPlayers = players.length;
    const badActorCount = Math.round((config.badActorPercentage / 100) * totalPlayers);
    const badActorIndices = pickN(
        Array.from({ length: totalPlayers }, (_, i) => i),
        badActorCount
    );
    for (const idx of badActorIndices) {
        players[idx].isBadActor = true;
    }

    return players;
}

async function initializePlayers(config: StoryConfig): Promise<void> {
    if (!activeStory) return;
    const country = countryFromPlace(config.place);

    addLog({ tick: 0, type: 'info', message: `Generating ${activeStory.players.length} customer profiles...` });

    // Generate and send customers in batches by type
    const customerRecords: any[] = [];
    for (const player of activeStory.players) {
        let customerData: Record<string, any>;
        switch (player.customerType) {
            case 'INDIVIDUAL':
                customerData = generateIndividualProfile(country);
                break;
            case 'CORPORATE':
                customerData = generateCorporateProfile(country);
                break;
            case 'GOVERNMENT':
                customerData = generateGovernmentProfile(country);
                break;
            case 'NPO':
                customerData = generateNPOProfile(country);
                break;
            default:
                customerData = generateCustomerData(player.customerType, country);
        }

        // Override customerId to match player
        customerData.customerId = player.customerId;
        customerData.customerNameEng = player.name;
        customerRecords.push(customerData);
    }

    // Add to pool
    const poolCustomers: CustomerPoolData[] = customerRecords.map(c => ({
        customerId: c.customerId,
        customerNameEng: c.customerNameEng,
        customerNameBen: c.customerNameBen || '',
        dateOfBirth: c['individual.dob'] || '',
        nationality: c.nationality,
        country,
    }));
    addCustomersToPool(poolCustomers);

    // Send customers to webhook (batch of 10)
    const BATCH_SIZE = 10;
    let sentCustomers = 0;
    for (let i = 0; i < customerRecords.length; i += BATCH_SIZE) {
        const batch = customerRecords.slice(i, i + BATCH_SIZE);
        const payload = batch.length === 1 ? batch[0] : batch;
        const ok = await sendToWebhook('customer', payload);
        if (ok) sentCustomers += batch.length;
    }

    incrementRecords('customer', sentCustomers);
    addLog({
        tick: 0,
        type: 'success',
        message: `Sent ${sentCustomers} customer profiles to webhook`,
        dataType: 'customer',
        recordCount: sentCustomers,
    });

    // Generate accounts (1–3 per customer)
    addLog({ tick: 0, type: 'info', message: 'Generating accounts for each player...' });
    const accountRecords: any[] = [];
    for (const player of activeStory.players) {
        const numAccounts = faker.number.int({ min: 1, max: 3 });
        for (let j = 0; j < numAccounts; j++) {
            const accountData = generateAccountData(player.customerId, undefined, country);
            player.accountIds.push(accountData.uniqueAccountNumber);
            accountRecords.push(accountData);
        }
    }

    // Add to pool
    const accountIds = accountRecords
        .map(a => a.uniqueAccountNumber)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);
    addAccountsToPool(accountIds);

    // Send accounts to webhook
    let sentAccounts = 0;
    for (let i = 0; i < accountRecords.length; i += BATCH_SIZE) {
        const batch = accountRecords.slice(i, i + BATCH_SIZE);
        const payload = batch.length === 1 ? batch[0] : batch;
        const ok = await sendToWebhook('account', payload);
        if (ok) sentAccounts += batch.length;
    }

    incrementRecords('account', sentAccounts);
    addLog({
        tick: 0,
        type: 'success',
        message: `Sent ${sentAccounts} accounts to webhook (${accountIds.length} added to pool)`,
        dataType: 'account',
        recordCount: sentAccounts,
    });
}

// ═══════════════════════════════════════════════════════════════════
// TICK LOGIC (Phase 2 — Ongoing Activity)
// ═══════════════════════════════════════════════════════════════════

async function executeTick(): Promise<void> {
    if (!activeStory || activeStory.status !== 'running') return;

    // Re-read webhook configs from file each tick so that any updates
    // made through the UI (Webhook tab) are picked up automatically.
    const freshMappings = loadWebhookMappings();
    activeStory.webhookMappings = { ...activeStory.webhookMappings, ...freshMappings };

    activeStory.currentTick += 1;
    const tick = activeStory.currentTick;
    const schemas = getSchemas();

    addLog({ tick, type: 'info', message: `── Tick #${tick} ──` });

    // Determine how many players are active this tick (30%–70% of total)
    const totalPlayers = activeStory.players.length;
    const activeCount = Math.max(1, Math.round(totalPlayers * faker.number.float({ min: 0.3, max: 0.7 })));
    const activePlayers = pickN(activeStory.players, activeCount);

    // Separate good actors and bad actors for this tick
    const goodActors = activePlayers.filter(p => !p.isBadActor);
    const badActors = activePlayers.filter(p => p.isBadActor);

    // ── LEGITIMATE ACTIVITY from good actors ──
    for (const dataType of ['transaction', 'trade', 'credit', 'sanction'] as const) {
        const weight = ACTIVITY_WEIGHTS[dataType];
        const actorsForType = goodActors.filter(() => Math.random() < weight);
        if (actorsForType.length === 0) continue;

        const records: any[] = [];
        for (const player of actorsForType) {
            if (player.accountIds.length === 0) continue;
            const schema = schemas[dataType];
            if (!schema) continue;

            const numRecords = dataType === 'transaction'
                ? faker.number.int({ min: 1, max: 3 })
                : 1;

            for (let r = 0; r < numRecords; r++) {
                const record = generateDataFromSchema(schema, schemas, {
                    customerId: player.customerId,
                    accountId: pick(player.accountIds),
                    country: player.country,
                });
                records.push(record);
            }
        }

        if (records.length > 0) {
            const payload = records.length === 1 ? records[0] : records;
            const ok = await sendToWebhook(dataType, payload);
            if (ok) {
                incrementRecords(dataType, records.length);
                addLog({
                    tick,
                    type: 'success',
                    message: `Sent ${records.length} legitimate ${dataType} record(s)`,
                    dataType,
                    recordCount: records.length,
                });
            }
        }
    }

    // ── VIOLATION ACTIVITY from bad actors ──
    if (badActors.length > 0) {
        // Determine violation probability per tick (50%–80% chance a bad actor violates)
        const violatingActors = badActors.filter(() => Math.random() < 0.65);

        for (const actor of violatingActors) {
            // Pick a random violation category
            const categoryRoll = Math.random();
            let ruleCode: string;
            let vDataType: string;

            if (categoryRoll < 0.55) {
                // Transaction violation (55%)
                ruleCode = pick(TRANSACTION_RULES);
                vDataType = 'transaction';
            } else if (categoryRoll < 0.85) {
                // Trade violation (30%)
                ruleCode = pick(TRADE_RULES);
                vDataType = 'trade';
            } else {
                // Sanction violation (15%)
                ruleCode = pick(SANCTION_RULES);
                vDataType = 'sanction';
            }

            try {
                const violation = generateViolationData(ruleCode);
                if (violation && violation.records.length > 0) {
                    const payload = violation.records.length === 1
                        ? violation.records[0]
                        : violation.records;
                    const ok = await sendToWebhook(vDataType, payload);
                    if (ok) {
                        activeStory.totalViolationsSent += violation.records.length;
                        incrementRecords(vDataType, violation.records.length);
                        addLog({
                            tick,
                            type: 'violation',
                            message: `Bad actor "${actor.name}" violated rule ${ruleCode}: ${violation.explanation}`,
                            dataType: vDataType,
                            recordCount: violation.records.length,
                            ruleCode,
                        });
                    }
                }
            } catch (err: any) {
                addLog({
                    tick,
                    type: 'error',
                    message: `Violation generation failed for ${ruleCode}: ${err.message}`,
                    dataType: vDataType,
                    ruleCode,
                });
            }
        }
    }

    // Persist state periodically (every 5 ticks)
    if (tick % 5 === 0) {
        persistState();
    }
}

// ═══════════════════════════════════════════════════════════════════
// STATE PERSISTENCE
// ═══════════════════════════════════════════════════════════════════

function persistState(): void {
    if (!activeStory) return;
    try {
        // Save a lightweight version (no logs beyond last 50)
        const lightweight: any = {
            ...activeStory,
            logs: activeStory.logs.slice(-50),
        };
        fs.writeFileSync(STORY_STATE_PATH, JSON.stringify(lightweight, null, 2));
    } catch { /* silently fail */ }
}

function clearPersistedState(): void {
    try {
        if (fs.existsSync(STORY_STATE_PATH)) {
            fs.unlinkSync(STORY_STATE_PATH);
        }
    } catch { /* silently fail */ }
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

export function getStoryStatus(): StoryStatus {
    if (!activeStory) {
        return { active: false, state: null };
    }
    return {
        active: activeStory.status === 'running' || activeStory.status === 'initializing',
        state: {
            ...activeStory,
            // Trim logs for API response
            logs: activeStory.logs.slice(-100),
        },
    };
}

export function getWebhookMappingStatus(): { mappings: Record<string, WebhookMapping>; missing: string[] } {
    const mappings = loadWebhookMappings();
    const required = ['customer', 'account', 'transaction', 'trade', 'credit', 'sanction'];
    const missing = required.filter(t => !mappings[t]);
    return { mappings, missing };
}

export async function startStory(config: StoryConfig): Promise<{ success: boolean; error?: string }> {
    // Prevent concurrent stories
    if (activeStory && (activeStory.status === 'running' || activeStory.status === 'initializing')) {
        return { success: false, error: 'A story is already running. Stop it first.' };
    }

    // Validate config
    if (!config.name?.trim()) {
        return { success: false, error: 'Story name is required.' };
    }
    if (config.intervalSeconds < 3 || config.intervalSeconds > 300) {
        return { success: false, error: 'Interval must be between 3 and 300 seconds.' };
    }
    const totalPlayers = config.players.individual + config.players.corporate +
        config.players.government + config.players.npo;
    if (totalPlayers < 1 || totalPlayers > 500) {
        return { success: false, error: 'Total players must be between 1 and 500.' };
    }
    if (config.badActorPercentage < 0 || config.badActorPercentage > 100) {
        return { success: false, error: 'Bad actor percentage must be between 0 and 100.' };
    }

    // Load webhook mappings
    const webhookMappings = loadWebhookMappings();
    const requiredHooks = ['customer', 'account', 'transaction'];
    const missingHooks = requiredHooks.filter(t => !webhookMappings[t]);
    if (missingHooks.length > 0) {
        return {
            success: false,
            error: `Missing webhook configs for: ${missingHooks.join(', ')}. Please configure them in the Webhook tab first.`,
        };
    }

    // Build players
    const players = generatePlayers(config);
    const badActorCount = players.filter(p => p.isBadActor).length;

    // Initialize state
    activeStory = {
        id: uid(),
        config,
        status: 'initializing',
        players,
        badActorCount,
        webhookMappings,
        startedAt: new Date().toISOString(),
        currentTick: 0,
        totalRecordsSent: 0,
        totalViolationsSent: 0,
        recordsByType: {},
        logs: [],
    };

    addLog({
        tick: 0,
        type: 'info',
        message: `Story "${config.name}" starting — ${players.length} players, ${badActorCount} bad actors, ${config.intervalSeconds}s interval`,
    });

    console.log(`[StoryEngine] Starting story "${config.name}" with ${players.length} players`);

    // Phase 1 — Generate and push customers + accounts
    try {
        await initializePlayers(config);
    } catch (err: any) {
        activeStory.status = 'error';
        activeStory.error = err.message;
        addLog({ tick: 0, type: 'error', message: `Initialization failed: ${err.message}` });
        return { success: false, error: `Initialization failed: ${err.message}` };
    }

    // Phase 2 — Start interval
    activeStory.status = 'running';
    addLog({ tick: 0, type: 'success', message: 'Story is now running. Periodic activity started.' });

    intervalHandle = setInterval(async () => {
        try {
            await executeTick();
        } catch (err: any) {
            console.error('[StoryEngine] Tick error:', err);
            addLog({
                tick: activeStory?.currentTick || 0,
                type: 'error',
                message: `Tick error: ${err.message}`,
            });
        }
    }, config.intervalSeconds * 1000);

    return { success: true };
}

export function stopStory(): { success: boolean; summary?: any } {
    if (!activeStory) {
        return { success: false };
    }

    // Clear interval
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
    }

    activeStory.status = 'stopped';
    activeStory.stoppedAt = new Date().toISOString();

    const summary = {
        name: activeStory.config.name,
        totalTicks: activeStory.currentTick,
        totalRecordsSent: activeStory.totalRecordsSent,
        totalViolationsSent: activeStory.totalViolationsSent,
        recordsByType: { ...activeStory.recordsByType },
        duration: activeStory.stoppedAt
            ? `${Math.round((new Date(activeStory.stoppedAt).getTime() - new Date(activeStory.startedAt).getTime()) / 1000)}s`
            : 'unknown',
        players: activeStory.players.length,
        badActors: activeStory.badActorCount,
    };

    addLog({
        tick: activeStory.currentTick,
        type: 'info',
        message: `Story stopped. ${summary.totalRecordsSent} records sent, ${summary.totalViolationsSent} violations over ${summary.totalTicks} ticks.`,
    });

    console.log('[StoryEngine] Story stopped:', summary);

    persistState();

    // Keep state available for viewing but mark as stopped
    // User can start a new story which will replace this one

    return { success: true, summary };
}

export function clearStory(): void {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
    }
    activeStory = null;
    clearPersistedState();
}
