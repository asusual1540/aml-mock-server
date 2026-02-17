import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CONFIG_FILE = path.join(process.cwd(), 'config', 'webhook-configs.json');

interface WebhookConfig {
    id: string;
    name: string;
    webhookUrl: string;
    token: string;
    createdAt: string;
    updatedAt: string;
}

interface ConfigStore {
    configs: WebhookConfig[];
}

function readConfigs(): ConfigStore {
    try {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return { configs: [] };
    }
}

function writeConfigs(store: ConfigStore): void {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

// GET — return all saved configs
export async function GET() {
    try {
        const store = readConfigs();
        return NextResponse.json({ success: true, configs: store.configs });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Failed to read configs: ' + error.message },
            { status: 500 }
        );
    }
}

// POST — create or update a config
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, webhookUrl, token } = body;

        if (!name || !webhookUrl || !token) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: name, webhookUrl, token' },
                { status: 400 }
            );
        }

        const store = readConfigs();
        const now = new Date().toISOString();

        if (id) {
            // Update existing
            const idx = store.configs.findIndex(c => c.id === id);
            if (idx === -1) {
                return NextResponse.json(
                    { success: false, error: 'Config not found' },
                    { status: 404 }
                );
            }
            store.configs[idx] = { ...store.configs[idx], name, webhookUrl, token, updatedAt: now };
            writeConfigs(store);
            return NextResponse.json({ success: true, config: store.configs[idx], message: 'Config updated' });
        } else {
            // Create new
            const newConfig: WebhookConfig = {
                id: crypto.randomUUID(),
                name: name.trim(),
                webhookUrl: webhookUrl.trim(),
                token: token.trim(),
                createdAt: now,
                updatedAt: now,
            };
            store.configs.push(newConfig);
            writeConfigs(store);
            return NextResponse.json({ success: true, config: newConfig, message: 'Config saved' });
        }
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Failed to save config: ' + error.message },
            { status: 500 }
        );
    }
}

// DELETE — remove a config by id (passed as query param)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Missing config id' },
                { status: 400 }
            );
        }

        const store = readConfigs();
        const idx = store.configs.findIndex(c => c.id === id);
        if (idx === -1) {
            return NextResponse.json(
                { success: false, error: 'Config not found' },
                { status: 404 }
            );
        }

        const removed = store.configs.splice(idx, 1)[0];
        writeConfigs(store);
        return NextResponse.json({ success: true, message: `Deleted config "${removed.name}"` });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Failed to delete config: ' + error.message },
            { status: 500 }
        );
    }
}
