'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Play, Square, Trash2, RefreshCw, Users, Shield, ShieldAlert, Clock,
    Activity, AlertTriangle, CheckCircle, XCircle, Info, ChevronDown,
    ChevronUp, Zap, Globe, BarChart3, TrendingUp, UserCheck, Building2,
    Landmark, Heart, Loader2,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface StoryConfig {
    name: string;
    place: string;
    intervalSeconds: number;
    players: { individual: number; corporate: number; government: number; npo: number };
    badActorPercentage: number;
}

interface StoryPlayer {
    customerId: number;
    customerType: string;
    accountIds: string[];
    isBadActor: boolean;
    name: string;
    country: string;
}

interface StoryLogEntry {
    timestamp: string;
    tick: number;
    type: 'info' | 'success' | 'warning' | 'error' | 'violation';
    message: string;
    dataType?: string;
    recordCount?: number;
    ruleCode?: string;
}

interface StoryState {
    id: string;
    config: StoryConfig;
    status: 'initializing' | 'running' | 'paused' | 'stopped' | 'error';
    players: StoryPlayer[];
    badActorCount: number;
    startedAt: string;
    stoppedAt?: string;
    currentTick: number;
    totalRecordsSent: number;
    totalViolationsSent: number;
    recordsByType: Record<string, number>;
    logs: StoryLogEntry[];
    error?: string;
}

interface WebhookMapping {
    webhookUrl: string;
    token: string;
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const PLACES = [
    { value: 'Bangladesh', label: 'Bangladesh', flag: '🇧🇩' },
    { value: 'Dhaka', label: 'Dhaka, Bangladesh', flag: '🇧🇩' },
    { value: 'Chittagong', label: 'Chittagong, Bangladesh', flag: '🇧🇩' },
    { value: 'USA', label: 'United States', flag: '🇺🇸' },
    { value: 'New York', label: 'New York, USA', flag: '🇺🇸' },
];

const LOG_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
    info: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Info },
    success: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
    warning: { bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertTriangle },
    error: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
    violation: { bg: 'bg-purple-50', text: 'text-purple-700', icon: ShieldAlert },
};

const DEFAULT_CONFIG: StoryConfig = {
    name: '',
    place: 'Bangladesh',
    intervalSeconds: 5,
    players: { individual: 5, corporate: 3, government: 1, npo: 1 },
    badActorPercentage: 15,
};

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function StoryManager() {
    // Config form state
    const [config, setConfig] = useState<StoryConfig>(DEFAULT_CONFIG);

    // Story runtime state
    const [storyState, setStoryState] = useState<StoryState | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [starting, setStarting] = useState(false);
    const [stopping, setStopping] = useState(false);

    // Webhook status
    const [webhookMappings, setWebhookMappings] = useState<Record<string, WebhookMapping>>({});
    const [missingWebhooks, setMissingWebhooks] = useState<string[]>([]);
    const [webhookChecked, setWebhookChecked] = useState(false);

    // UI state
    const [showLogs, setShowLogs] = useState(true);
    const [showPlayers, setShowPlayers] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const logEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Webhook Check ──
    const checkWebhooks = useCallback(async () => {
        try {
            const res = await fetch('/api/story?check=webhooks');
            const data = await res.json();
            if (data.success) {
                setWebhookMappings(data.mappings || {});
                setMissingWebhooks(data.missing || []);
            }
        } catch { /* ignore */ }
        setWebhookChecked(true);
    }, []);

    // ── Poll Status ──
    const pollStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/story');
            const data = await res.json();
            if (data.success) {
                setIsActive(data.active);
                setStoryState(data.state);
            }
        } catch { /* ignore */ }
    }, []);

    // Initial load
    useEffect(() => {
        checkWebhooks();
        pollStatus();
    }, [checkWebhooks, pollStatus]);

    // Polling when story is active
    useEffect(() => {
        if (isActive) {
            pollRef.current = setInterval(pollStatus, 2000);
        } else if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [isActive, pollStatus]);

    // Auto-scroll logs
    useEffect(() => {
        if (autoScroll && logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [storyState?.logs, autoScroll]);

    // ── Handlers ──
    const handleStart = async () => {
        setStarting(true);
        try {
            const res = await fetch('/api/story', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.error || 'Failed to start story');
            } else {
                setShowLogs(true);
                // Start polling immediately
                pollStatus();
                setIsActive(true);
            }
        } catch (err: any) {
            alert('Failed to start story: ' + err.message);
        } finally {
            setStarting(false);
        }
    };

    const handleStop = async () => {
        setStopping(true);
        try {
            const res = await fetch('/api/story', { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                await pollStatus();
            }
        } catch { /* ignore */ }
        finally { setStopping(false); }
    };

    const handleClear = async () => {
        try {
            await fetch('/api/story?action=clear', { method: 'DELETE' });
            setStoryState(null);
            setIsActive(false);
        } catch { /* ignore */ }
    };

    const updatePlayers = (key: keyof StoryConfig['players'], value: number) => {
        setConfig(prev => ({
            ...prev,
            players: { ...prev.players, [key]: Math.max(0, Math.min(100, value)) },
        }));
    };

    const totalPlayers = config.players.individual + config.players.corporate +
        config.players.government + config.players.npo;
    const badActorCount = Math.round((config.badActorPercentage / 100) * totalPlayers);
    const isRunning = storyState?.status === 'running' || storyState?.status === 'initializing';
    const hasRequiredWebhooks = missingWebhooks.length === 0 || !missingWebhooks.some(m => ['customer', 'account', 'transaction'].includes(m));

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════

    return (
        <div className="space-y-4">
            {/* ── Webhook Status Banner ── */}
            {webhookChecked && missingWebhooks.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Missing Webhook Configurations</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                            No saved webhook config detected for: <strong>{missingWebhooks.join(', ')}</strong>.
                            The story will skip these data types. Configure them in the <em>Webhook</em> tab.
                        </p>
                    </div>
                    <button onClick={checkWebhooks} className="ml-auto text-amber-600 hover:text-amber-800" title="Re-check">
                        <RefreshCw size={14} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* ═══ LEFT COLUMN: Configuration ═══ */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Story Config Card */}
                    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
                            <h2 className="text-white font-bold text-sm flex items-center gap-2">
                                <Zap size={16} />
                                Story Configuration
                            </h2>
                        </div>
                        <div className="p-4 space-y-3">
                            {/* Story Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Story Name</label>
                                <input
                                    type="text"
                                    value={config.name}
                                    onChange={e => setConfig(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Bangladesh Banking Scenario"
                                    disabled={isRunning}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                                />
                            </div>

                            {/* Place */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    <Globe size={12} className="inline mr-1" />
                                    Location
                                </label>
                                <select
                                    value={config.place}
                                    onChange={e => setConfig(p => ({ ...p, place: e.target.value }))}
                                    disabled={isRunning}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                                >
                                    {PLACES.map(p => (
                                        <option key={p.value} value={p.value}>{p.flag} {p.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Interval */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    <Clock size={12} className="inline mr-1" />
                                    Interval (seconds)
                                </label>
                                <input
                                    type="number"
                                    min={3}
                                    max={300}
                                    value={config.intervalSeconds}
                                    onChange={e => setConfig(p => ({ ...p, intervalSeconds: parseInt(e.target.value) || 5 }))}
                                    disabled={isRunning}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                                />
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-100 pt-3">
                                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                                    <Users size={12} />
                                    Players by Division
                                    <span className="ml-auto font-normal text-slate-400">Total: {totalPlayers}</span>
                                </label>

                                <div className="grid grid-cols-2 gap-2">
                                    {/* Individual */}
                                    <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                                        <div className="flex items-center gap-1 mb-1">
                                            <UserCheck size={12} className="text-blue-600" />
                                            <span className="text-xs font-semibold text-blue-800">Individual</span>
                                        </div>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={config.players.individual}
                                            onChange={e => updatePlayers('individual', parseInt(e.target.value) || 0)}
                                            disabled={isRunning}
                                            className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:ring-1 focus:ring-blue-400 bg-white disabled:bg-blue-50 disabled:text-blue-400"
                                        />
                                    </div>

                                    {/* Corporate */}
                                    <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                                        <div className="flex items-center gap-1 mb-1">
                                            <Building2 size={12} className="text-emerald-600" />
                                            <span className="text-xs font-semibold text-emerald-800">Corporate</span>
                                        </div>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={config.players.corporate}
                                            onChange={e => updatePlayers('corporate', parseInt(e.target.value) || 0)}
                                            disabled={isRunning}
                                            className="w-full px-2 py-1 text-sm border border-emerald-200 rounded focus:ring-1 focus:ring-emerald-400 bg-white disabled:bg-emerald-50 disabled:text-emerald-400"
                                        />
                                    </div>

                                    {/* Government */}
                                    <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                                        <div className="flex items-center gap-1 mb-1">
                                            <Landmark size={12} className="text-amber-600" />
                                            <span className="text-xs font-semibold text-amber-800">Government</span>
                                        </div>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={config.players.government}
                                            onChange={e => updatePlayers('government', parseInt(e.target.value) || 0)}
                                            disabled={isRunning}
                                            className="w-full px-2 py-1 text-sm border border-amber-200 rounded focus:ring-1 focus:ring-amber-400 bg-white disabled:bg-amber-50 disabled:text-amber-400"
                                        />
                                    </div>

                                    {/* NPO */}
                                    <div className="bg-rose-50 rounded-lg p-2 border border-rose-100">
                                        <div className="flex items-center gap-1 mb-1">
                                            <Heart size={12} className="text-rose-600" />
                                            <span className="text-xs font-semibold text-rose-800">NPO</span>
                                        </div>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={config.players.npo}
                                            onChange={e => updatePlayers('npo', parseInt(e.target.value) || 0)}
                                            disabled={isRunning}
                                            className="w-full px-2 py-1 text-sm border border-rose-200 rounded focus:ring-1 focus:ring-rose-400 bg-white disabled:bg-rose-50 disabled:text-rose-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bad Actor Percentage */}
                            <div className="border-t border-slate-100 pt-3">
                                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                                    <ShieldAlert size={12} className="text-red-500" />
                                    Bad Actors
                                    <span className="ml-auto font-normal text-red-500">{badActorCount} of {totalPlayers}</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min={0}
                                        max={50}
                                        step={1}
                                        value={config.badActorPercentage}
                                        onChange={e => setConfig(p => ({ ...p, badActorPercentage: parseInt(e.target.value) }))}
                                        disabled={isRunning}
                                        className="flex-1 accent-red-500"
                                    />
                                    <span className="text-sm font-bold text-red-600 w-12 text-right">
                                        {config.badActorPercentage}%
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="border-t border-slate-100 pt-3 flex gap-2">
                                {!isRunning ? (
                                    <button
                                        onClick={handleStart}
                                        disabled={starting || !config.name.trim() || totalPlayers < 1 || !hasRequiredWebhooks}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
                                    >
                                        {starting ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Starting...
                                            </>
                                        ) : (
                                            <>
                                                <Play size={16} />
                                                Start Story
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStop}
                                        disabled={stopping}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50"
                                    >
                                        {stopping ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Stopping...
                                            </>
                                        ) : (
                                            <>
                                                <Square size={16} />
                                                Stop Story
                                            </>
                                        )}
                                    </button>
                                )}
                                {storyState && storyState.status === 'stopped' && (
                                    <button
                                        onClick={handleClear}
                                        className="px-3 py-2.5 text-slate-500 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                                        title="Clear story data"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Players Panel (collapsible) ── */}
                    {storyState && storyState.players.length > 0 && (
                        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                            <button
                                onClick={() => setShowPlayers(!showPlayers)}
                                className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Users size={14} />
                                    Players ({storyState.players.length})
                                </span>
                                {showPlayers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {showPlayers && (
                                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                                    {storyState.players.map((player, idx) => (
                                        <div
                                            key={idx}
                                            className={`px-4 py-2 flex items-center gap-2 text-xs ${player.isBadActor ? 'bg-red-50/50' : ''}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${player.isBadActor ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                            <span className="font-medium text-slate-700 truncate flex-1">{player.name}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${player.customerType === 'INDIVIDUAL' ? 'bg-blue-100 text-blue-700' :
                                                player.customerType === 'CORPORATE' ? 'bg-emerald-100 text-emerald-700' :
                                                    player.customerType === 'GOVERNMENT' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-rose-100 text-rose-700'
                                                }`}>
                                                {player.customerType.slice(0, 4)}
                                            </span>
                                            <span className="text-slate-400">{player.accountIds.length} acc</span>
                                            {player.isBadActor && (
                                                <ShieldAlert size={12} className="text-red-500" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ═══ RIGHT COLUMNS: Dashboard + Logs ═══ */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Status Dashboard */}
                    {storyState && (
                        <>
                            {/* Status Bar */}
                            <div className={`rounded-xl shadow-md border overflow-hidden ${storyState.status === 'running' ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50' :
                                storyState.status === 'initializing' ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50' :
                                    storyState.status === 'stopped' ? 'border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100' :
                                        'border-red-200 bg-gradient-to-r from-red-50 to-orange-50'
                                }`}>
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${storyState.status === 'running' ? 'bg-emerald-500 animate-pulse' :
                                            storyState.status === 'initializing' ? 'bg-blue-500 animate-pulse' :
                                                storyState.status === 'stopped' ? 'bg-slate-400' :
                                                    'bg-red-500'
                                            }`} />
                                        <div>
                                            <h3 className="font-bold text-sm text-slate-800">{storyState.config.name}</h3>
                                            <p className="text-xs text-slate-500">
                                                {storyState.status === 'running' ?
                                                    `Running — Tick #${storyState.currentTick} — ${storyState.config.intervalSeconds}s interval` :
                                                    storyState.status === 'initializing' ? 'Initializing players...' :
                                                        storyState.status === 'stopped' ? `Stopped after ${storyState.currentTick} ticks` :
                                                            `Error: ${storyState.error}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Started {new Date(storyState.startedAt).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatCard
                                    icon={<BarChart3 size={16} />}
                                    label="Total Sent"
                                    value={storyState.totalRecordsSent}
                                    color="blue"
                                />
                                <StatCard
                                    icon={<ShieldAlert size={16} />}
                                    label="Violations"
                                    value={storyState.totalViolationsSent}
                                    color="red"
                                />
                                <StatCard
                                    icon={<Activity size={16} />}
                                    label="Current Tick"
                                    value={storyState.currentTick}
                                    color="indigo"
                                />
                                <StatCard
                                    icon={<TrendingUp size={16} />}
                                    label="Avg / Tick"
                                    value={storyState.currentTick > 0
                                        ? (storyState.totalRecordsSent / storyState.currentTick).toFixed(1)
                                        : '0'}
                                    color="emerald"
                                />
                            </div>

                            {/* Records by Type */}
                            {Object.keys(storyState.recordsByType).length > 0 && (
                                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-3">
                                    <h4 className="text-xs font-bold text-slate-600 mb-2">Records by Type</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(storyState.recordsByType).map(([type, count]) => (
                                            <div
                                                key={type}
                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200"
                                            >
                                                <span className="text-xs font-semibold text-slate-700 capitalize">{type}</span>
                                                <span className="text-xs font-bold text-indigo-600">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* No Story State — Empty Prompt */}
                    {!storyState && (
                        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 mb-4">
                                <Zap size={28} className="text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">AML Story Simulator</h3>
                            <p className="text-sm text-slate-500 max-w-md mx-auto">
                                Configure a scenario and start a story to simulate real-world AML activity.
                                The engine will generate customer profiles, accounts, and periodic financial
                                activity — including rule violations by designated bad actors.
                            </p>
                            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> Customers</span>
                                <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> Accounts</span>
                                <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> Transactions</span>
                                <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> Violations</span>
                            </div>
                        </div>
                    )}

                    {/* ── Activity Log ── */}
                    {storyState && storyState.logs.length > 0 && (
                        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                            <button
                                onClick={() => setShowLogs(!showLogs)}
                                className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Activity size={14} />
                                    Activity Log ({storyState.logs.length})
                                </span>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-1 text-xs text-slate-500" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={autoScroll}
                                            onChange={e => setAutoScroll(e.target.checked)}
                                            className="rounded text-indigo-600 w-3 h-3"
                                        />
                                        Auto-scroll
                                    </label>
                                    {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                            </button>
                            {showLogs && (
                                <div className="max-h-[440px] overflow-y-auto divide-y divide-slate-50 font-mono text-xs">
                                    {storyState.logs.map((log, idx) => {
                                        const style = LOG_COLORS[log.type] || LOG_COLORS.info;
                                        const Icon = style.icon;
                                        return (
                                            <div key={idx} className={`px-3 py-1.5 flex items-start gap-2 ${style.bg}`}>
                                                <Icon size={12} className={`${style.text} mt-0.5 shrink-0`} />
                                                <span className="text-slate-400 shrink-0 w-14">
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                                {log.tick > 0 && (
                                                    <span className="text-slate-300 shrink-0 w-8">T{log.tick}</span>
                                                )}
                                                <span className={`${style.text} flex-1 break-words`}>{log.message}</span>
                                                {log.recordCount && (
                                                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-slate-200/50 text-slate-500">
                                                        {log.recordCount}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div ref={logEndRef} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function StatCard({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: 'blue' | 'red' | 'indigo' | 'emerald';
}) {
    const colors = {
        blue: 'from-blue-500 to-blue-600 bg-blue-50 text-blue-700 border-blue-200',
        red: 'from-red-500 to-red-600 bg-red-50 text-red-700 border-red-200',
        indigo: 'from-indigo-500 to-indigo-600 bg-indigo-50 text-indigo-700 border-indigo-200',
        emerald: 'from-emerald-500 to-emerald-600 bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    const c = colors[color];
    return (
        <div className={`rounded-xl border shadow-sm p-3 ${c.split(' ').slice(2).join(' ')}`}>
            <div className="flex items-center gap-1.5 mb-1">
                <span className={`${c.split(' ')[3]}`}>{icon}</span>
                <span className="text-xs font-semibold text-slate-500">{label}</span>
            </div>
            <p className={`text-xl font-bold ${c.split(' ')[3]}`}>{value}</p>
        </div>
    );
}
