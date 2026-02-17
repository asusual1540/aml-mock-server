'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, CheckCircle, XCircle, Clock, Activity, Eye, Edit3, X, RotateCcw, ShieldAlert, ChevronDown, ChevronRight, AlertTriangle, Zap, Info, Save, Trash2, FolderOpen, Plus, Bookmark, Pencil } from 'lucide-react';

interface WebhookResponse {
    success: boolean;
    statusCode: number;
    statusText: string;
    responseTime: number;
    response: any;
    message: string;
    error?: string;
}

interface RuleInfo {
    code: string;
    name: string;
    category: string;
    subcategory: string;
    severity: string;
    riskScore: string;
    threshold: string;
    description: string;
    dataType: string;
}

interface RuleCategory {
    id: string;
    name: string;
    description: string;
    rules: RuleInfo[];
}

interface ViolationResult {
    rule: RuleInfo;
    dataType: string;
    records: any[];
    recordCount: number;
    explanation: string;
    note?: string;
}

interface SavedWebhookConfig {
    id: string;
    name: string;
    webhookUrl: string;
    token: string;
    createdAt: string;
    updatedAt: string;
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
    medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
    low: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
};

export default function WebhookCaller() {
    const router = useRouter();
    const [webhookUrl, setWebhookUrl] = useState('');
    const [token, setToken] = useState('');
    const [dataType, setDataType] = useState<'customer' | 'account' | 'transaction' | 'sanction' | 'trade' | 'credit'>('customer');
    const [amount, setAmount] = useState(1);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<WebhookResponse | null>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const [editedJson, setEditedJson] = useState('');
    const [showEditor, setShowEditor] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const editorRef = useRef<HTMLTextAreaElement>(null);

    // ── Rule Violation Mode state ──
    const [mode, setMode] = useState<'standard' | 'violation'>('standard');
    const [ruleCategories, setRuleCategories] = useState<RuleCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedRule, setSelectedRule] = useState<string>('');
    const [violationQuantity, setViolationQuantity] = useState<number>(1);
    const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
    const [violationResult, setViolationResult] = useState<ViolationResult | null>(null);
    const [violationLoading, setViolationLoading] = useState(false);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [ruleSearch, setRuleSearch] = useState('');

    // ── Saved Config state ──
    const [savedConfigs, setSavedConfigs] = useState<SavedWebhookConfig[]>([]);
    const [selectedConfigId, setSelectedConfigId] = useState<string>('');
    const [configName, setConfigName] = useState('');
    const [showSaveForm, setShowSaveForm] = useState(false);
    const [configLoading, setConfigLoading] = useState(false);
    const [showConfigDetails, setShowConfigDetails] = useState(true); // show URL/Token inputs

    // Load saved configs on mount
    useEffect(() => {
        loadSavedConfigs();
    }, []);

    const loadSavedConfigs = async () => {
        try {
            const res = await fetch('/api/webhook/configs');
            if (res.status === 401) { router.replace('/login'); return; }
            const data = await res.json();
            if (data.success) {
                setSavedConfigs(data.configs);
            }
        } catch (err: any) {
            console.error('Failed to load configs:', err);
        }
    };

    const handleSelectConfig = (configId: string) => {
        setSelectedConfigId(configId);
        if (configId === '') {
            // "New" — clear fields, show inputs
            setWebhookUrl('');
            setToken('');
            setConfigName('');
            setShowConfigDetails(true);
            return;
        }
        const cfg = savedConfigs.find(c => c.id === configId);
        if (cfg) {
            setWebhookUrl(cfg.webhookUrl);
            setToken(cfg.token);
            setConfigName(cfg.name);
            setShowConfigDetails(false); // hide inputs when config is loaded
        }
    };

    const handleSaveConfig = async () => {
        if (!configName.trim()) {
            alert('Please enter a config name');
            return;
        }
        if (!webhookUrl.trim() || !token.trim()) {
            alert('Webhook URL and Token are required');
            return;
        }

        setConfigLoading(true);
        try {
            const res = await fetch('/api/webhook/configs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedConfigId || undefined,
                    name: configName.trim(),
                    webhookUrl: webhookUrl.trim(),
                    token: token.trim(),
                }),
            });
            if (res.status === 401) { router.replace('/login'); return; }
            const data = await res.json();
            if (data.success) {
                await loadSavedConfigs();
                setSelectedConfigId(data.config.id);
                setShowSaveForm(false);
            } else {
                alert(data.error || 'Failed to save config');
            }
        } catch (err: any) {
            alert('Failed to save config: ' + err.message);
        } finally {
            setConfigLoading(false);
        }
    };

    const handleDeleteConfig = async () => {
        if (!selectedConfigId) return;
        const cfg = savedConfigs.find(c => c.id === selectedConfigId);
        if (!confirm(`Delete config "${cfg?.name}"?`)) return;

        setConfigLoading(true);
        try {
            const res = await fetch(`/api/webhook/configs?id=${selectedConfigId}`, { method: 'DELETE' });
            if (res.status === 401) { router.replace('/login'); return; }
            const data = await res.json();
            if (data.success) {
                setSelectedConfigId('');
                setWebhookUrl('');
                setToken('');
                setConfigName('');
                await loadSavedConfigs();
            } else {
                alert(data.error || 'Failed to delete config');
            }
        } catch (err: any) {
            alert('Failed to delete config: ' + err.message);
        } finally {
            setConfigLoading(false);
        }
    };

    // Load rule catalog when switching to violation mode
    useEffect(() => {
        if (mode === 'violation' && ruleCategories.length === 0) {
            loadRuleCatalog();
        }
    }, [mode]);

    const loadRuleCatalog = async () => {
        setCatalogLoading(true);
        try {
            const res = await fetch('/api/webhook/generate-violation');
            if (res.status === 401) { router.replace('/login'); return; }
            const data = await res.json();
            if (data.success) {
                setRuleCategories(data.categories);
                if (data.categories.length > 0) {
                    setSelectedCategory(data.categories[0].id);
                }
            }
        } catch (err: any) {
            console.error('Failed to load rule catalog:', err);
        } finally {
            setCatalogLoading(false);
        }
    };

    const handleGenerateViolation = async () => {
        if (!selectedRule) {
            alert('Please select a rule first');
            return;
        }
        setViolationLoading(true);
        setViolationResult(null);
        setJsonError(null);

        try {
            const res = await fetch('/api/webhook/generate-violation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ruleCode: selectedRule, quantity: violationQuantity }),
            });
            if (res.status === 401) { router.replace('/login'); return; }
            const data = await res.json();
            if (data.success) {
                setViolationResult(data);
                const payload = data.records.length === 1 ? data.records[0] : data.records;
                const formatted = JSON.stringify(payload, null, 2);
                setEditedJson(formatted);
                setPreviewData(payload);
                setShowEditor(true);
            } else {
                alert(data.error || 'Failed to generate violation data');
            }
        } catch (err: any) {
            alert('Failed to generate violation data: ' + err.message);
        } finally {
            setViolationLoading(false);
        }
    };

    const handleSendViolation = async () => {
        if (!webhookUrl || !token) {
            alert('Please enter both webhook URL and token');
            return;
        }
        if (!violationResult) {
            alert('Generate violation data first');
            return;
        }
        if (jsonError) {
            alert('Please fix JSON errors before sending');
            return;
        }

        let parsedData;
        try {
            parsedData = JSON.parse(editedJson);
        } catch {
            alert('Invalid JSON. Please fix errors before sending.');
            return;
        }

        setLoading(true);
        setResponse(null);

        try {
            const res = await fetch('/api/webhook/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    webhookUrl,
                    token,
                    dataType: violationResult.dataType,
                    amount: Array.isArray(parsedData) ? parsedData.length : 1,
                    customData: parsedData,
                }),
            });
            if (res.status === 401) { router.replace('/login'); return; }
            const data = await res.json();
            setResponse(data);
        } catch (error: any) {
            setResponse({
                success: false, statusCode: 0, statusText: 'Network Error',
                responseTime: 0, response: null, message: 'Failed to send request', error: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleSubcategory = (sub: string) => {
        const next = new Set(expandedSubcategories);
        if (next.has(sub)) next.delete(sub); else next.add(sub);
        setExpandedSubcategories(next);
    };

    const getSelectedRuleInfo = (): RuleInfo | undefined => {
        for (const cat of ruleCategories) {
            const r = cat.rules.find(r => r.code === selectedRule);
            if (r) return r;
        }
        return undefined;
    };

    const getFilteredRules = (rules: RuleInfo[]): RuleInfo[] => {
        if (!ruleSearch.trim()) return rules;
        const q = ruleSearch.toLowerCase();
        return rules.filter(r =>
            r.code.toLowerCase().includes(q) ||
            r.name.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.subcategory.toLowerCase().includes(q)
        );
    };

    // Validate JSON as user types
    const validateJson = useCallback((text: string) => {
        try {
            JSON.parse(text);
            setJsonError(null);
        } catch (e: any) {
            setJsonError(e.message);
        }
    }, []);

    const handleJsonChange = (value: string) => {
        setEditedJson(value);
        validateJson(value);
    };

    // Generate preview data
    const handleViewData = async () => {
        setPreviewLoading(true);
        setJsonError(null);

        try {
            const res = await fetch('/api/webhook/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataType, amount }),
            });

            if (res.status === 401) { router.replace('/login'); return; }
            const result = await res.json();

            if (result.success) {
                setPreviewData(result.data);
                const formatted = JSON.stringify(result.data, null, 2);
                setEditedJson(formatted);
                setShowEditor(true);
            } else {
                alert(result.error || 'Failed to generate preview data');
            }
        } catch (error: any) {
            alert('Failed to generate preview: ' + error.message);
        } finally {
            setPreviewLoading(false);
        }
    };

    // Regenerate preview data
    const handleRegenerate = async () => {
        if (mode === 'violation') {
            await handleGenerateViolation();
        } else {
            await handleViewData();
        }
    };

    // Send auto-generated data (original flow)
    const handleSend = async () => {
        if (!webhookUrl || !token) {
            alert('Please enter both webhook URL and token');
            return;
        }

        setLoading(true);
        setResponse(null);

        try {
            const res = await fetch('/api/webhook/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    webhookUrl,
                    token,
                    dataType,
                    amount,
                }),
            });

            if (res.status === 401) { router.replace('/login'); return; }
            const data = await res.json();
            setResponse(data);
        } catch (error: any) {
            setResponse({
                success: false,
                statusCode: 0,
                statusText: 'Network Error',
                responseTime: 0,
                response: null,
                message: 'Failed to send request',
                error: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    // Send edited/modified data
    const handleSendEdited = async () => {
        if (!webhookUrl || !token) {
            alert('Please enter both webhook URL and token');
            return;
        }

        if (jsonError) {
            alert('Please fix JSON errors before sending');
            return;
        }

        let parsedData;
        try {
            parsedData = JSON.parse(editedJson);
        } catch {
            alert('Invalid JSON. Please fix errors before sending.');
            return;
        }

        setLoading(true);
        setResponse(null);

        try {
            const res = await fetch('/api/webhook/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    webhookUrl,
                    token,
                    dataType: mode === 'violation' && violationResult ? violationResult.dataType : dataType,
                    amount: Array.isArray(parsedData) ? parsedData.length : 1,
                    customData: parsedData,
                }),
            });

            if (res.status === 401) { router.replace('/login'); return; }
            const data = await res.json();
            setResponse(data);
        } catch (error: any) {
            setResponse({
                success: false,
                statusCode: 0,
                statusText: 'Network Error',
                responseTime: 0,
                response: null,
                message: 'Failed to send request',
                error: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    // ── Render selected rule info badge ──
    const selectedRuleInfo = getSelectedRuleInfo();
    const sevColors = selectedRuleInfo ? SEVERITY_COLORS[selectedRuleInfo.severity] || SEVERITY_COLORS.medium : null;

    return (
        <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex gap-2">
                <button
                    onClick={() => { setMode('standard'); setShowEditor(false); setViolationResult(null); setResponse(null); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${mode === 'standard'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        }`}
                >
                    <Send size={16} />
                    Standard Data
                </button>
                <button
                    onClick={() => { setMode('violation'); setShowEditor(false); setResponse(null); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${mode === 'violation'
                        ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/30'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        }`}
                >
                    <ShieldAlert size={16} />
                    Rule Violation Generator
                </button>
            </div>

            {/* Configuration Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Webhook Configuration</h2>
                        <p className="text-slate-600">Send mock data to your webhook endpoint</p>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Saved Config Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <Bookmark size={14} className="inline mr-1.5 -mt-0.5" />
                            Saved Configurations
                        </label>
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedConfigId}
                                onChange={(e) => handleSelectConfig(e.target.value)}
                                className="flex-1 px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 font-medium cursor-pointer"
                            >
                                <option value="">— New Configuration —</option>
                                {savedConfigs.map(cfg => (
                                    <option key={cfg.id} value={cfg.id}>{cfg.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => { setShowSaveForm(!showSaveForm); if (!configName && !selectedConfigId) setConfigName(''); }}
                                className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all border-2 border-blue-200 hover:border-blue-300"
                                title={selectedConfigId ? 'Update config' : 'Save new config'}
                            >
                                <Save size={18} />
                            </button>
                            {selectedConfigId && (
                                <button
                                    onClick={handleDeleteConfig}
                                    disabled={configLoading}
                                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-all border-2 border-red-200 hover:border-red-300"
                                    title="Delete this config"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Save Config Form (collapsible) */}
                    {showSaveForm && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                            <div>
                                <label className="block text-sm font-semibold text-blue-800 mb-1">Config Name</label>
                                <input
                                    type="text"
                                    value={configName}
                                    onChange={(e) => setConfigName(e.target.value)}
                                    placeholder="e.g. Customer Webhook Prod"
                                    className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm bg-white"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveConfig}
                                    disabled={configLoading || !configName.trim()}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                >
                                    {configLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                    {selectedConfigId ? 'Update Config' : 'Save Config'}
                                </button>
                                <button
                                    onClick={() => setShowSaveForm(false)}
                                    className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Config Summary (shown when a saved config is selected and details are hidden) */}
                    {selectedConfigId && !showConfigDetails && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Endpoint</span>
                                    </div>
                                    <p className="font-mono text-sm text-slate-700 truncate">{webhookUrl || '—'}</p>
                                    <div className="flex items-center gap-2 mt-2 mb-1">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Token</span>
                                    </div>
                                    <p className="font-mono text-sm text-slate-500 truncate">{token ? token.slice(0, 12) + '••••••••' : '—'}</p>
                                </div>
                                <button
                                    onClick={() => setShowConfigDetails(true)}
                                    className="ml-4 flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-blue-600 bg-white border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all"
                                >
                                    <Pencil size={14} />
                                    Edit
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Webhook URL + Token inputs (shown for new config or when editing) */}
                    {showConfigDetails && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Webhook Endpoint Path
                                    <span className="text-slate-500 font-normal ml-2">
                                        (will be appended to base URL)
                                    </span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={webhookUrl}
                                        onChange={(e) => setWebhookUrl(e.target.value)}
                                        placeholder="/api/webhook/datasource/receive-customer-data"
                                        className="flex-1 px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Bearer Token
                                </label>
                                <input
                                    type="text"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="ds_mbex9h4r6u_1769112667984"
                                    className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                                />
                            </div>

                            {selectedConfigId && (
                                <button
                                    onClick={() => setShowConfigDetails(false)}
                                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    ← Collapse details
                                </button>
                            )}
                        </>
                    )}

                    {/* Standard Mode Controls */}
                    {mode === 'standard' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Data Type
                                    </label>
                                    <select
                                        value={dataType}
                                        onChange={(e) => setDataType(e.target.value as any)}
                                        className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 font-medium cursor-pointer"
                                    >
                                        <option value="customer" className="text-slate-900 bg-white">Customer</option>
                                        <option value="account" className="text-slate-900 bg-white">Account</option>
                                        <option value="transaction" className="text-slate-900 bg-white">Transaction</option>
                                        <option value="sanction" className="text-slate-900 bg-white">Sanction</option>
                                        <option value="trade" className="text-slate-900 bg-white">Trade (LC)</option>
                                        <option value="credit" className="text-slate-900 bg-white">Credit (Loan)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Number of Records (1-100,000)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100000"
                                        value={amount}
                                        onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
                                        className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleViewData}
                                    disabled={previewLoading || loading}
                                    className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                                >
                                    {previewLoading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Eye size={20} />
                                            View Data
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={loading || previewLoading}
                                    className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            Send to Webhook
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════ */}
            {/* RULE VIOLATION MODE                                   */}
            {/* ══════════════════════════════════════════════════════ */}
            {mode === 'violation' && (
                <div className="bg-white rounded-2xl shadow-xl border-2 border-red-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-red-100 rounded-xl">
                            <ShieldAlert className="text-red-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Rule Violation Generator</h2>
                            <p className="text-slate-500 text-sm">Select a monitoring rule to generate data that will trigger an alert</p>
                        </div>
                    </div>

                    {catalogLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-red-500" size={32} />
                            <span className="ml-3 text-slate-600">Loading rule catalog...</span>
                        </div>
                    ) : (
                        <>
                            {/* Category Tabs */}
                            <div className="flex gap-2 mb-5">
                                {ruleCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => { setSelectedCategory(cat.id); setSelectedRule(''); setRuleSearch(''); }}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${selectedCategory === cat.id
                                            ? cat.id === 'transaction' ? 'bg-blue-600 text-white border-blue-600'
                                                : cat.id === 'sanction' ? 'bg-purple-600 text-white border-purple-600'
                                                    : 'bg-amber-600 text-white border-amber-600'
                                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        {cat.name}
                                        <span className="ml-1.5 text-xs opacity-80">({cat.rules.length})</span>
                                    </button>
                                ))}
                            </div>

                            {/* Search */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={ruleSearch}
                                    onChange={(e) => setRuleSearch(e.target.value)}
                                    placeholder="Search rules by name, code, or description..."
                                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all text-sm"
                                />
                            </div>

                            {/* Rule List */}
                            <div className="max-h-[420px] overflow-y-auto border border-slate-200 rounded-xl">
                                {ruleCategories
                                    .filter(cat => cat.id === selectedCategory)
                                    .map(cat => {
                                        const filteredRules = getFilteredRules(cat.rules);
                                        const subcategories = [...new Set(filteredRules.map(r => r.subcategory))];

                                        return (
                                            <div key={cat.id}>
                                                {subcategories.map(sub => {
                                                    const subRules = filteredRules.filter(r => r.subcategory === sub);
                                                    const isExpanded = expandedSubcategories.has(sub) || ruleSearch.trim() !== '';

                                                    return (
                                                        <div key={sub} className="border-b border-slate-100 last:border-b-0">
                                                            <button
                                                                onClick={() => toggleSubcategory(sub)}
                                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                                                    <span className="font-semibold text-sm text-slate-700">{sub}</span>
                                                                    <span className="text-xs text-slate-400">({subRules.length})</span>
                                                                </div>
                                                            </button>

                                                            {isExpanded && (
                                                                <div className="pb-1">
                                                                    {subRules.map(rule => {
                                                                        const sev = SEVERITY_COLORS[rule.severity] || SEVERITY_COLORS.medium;
                                                                        const isSelected = selectedRule === rule.code;

                                                                        return (
                                                                            <button
                                                                                key={rule.code}
                                                                                onClick={() => setSelectedRule(rule.code)}
                                                                                className={`w-full text-left px-4 py-2.5 ml-4 mr-4 mb-1 rounded-lg transition-all border ${isSelected
                                                                                    ? 'bg-red-50 border-red-300 ring-2 ring-red-200'
                                                                                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                                                                                    }`}
                                                                                style={{ width: 'calc(100% - 2rem)' }}
                                                                            >
                                                                                <div className="flex items-center justify-between mb-1">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <code className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{rule.code}</code>
                                                                                        <span className="font-medium text-sm text-slate-800">{rule.name}</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${sev.bg} ${sev.text}`}>
                                                                                            <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`}></span>
                                                                                            {rule.severity}
                                                                                        </span>
                                                                                        <span className="text-xs text-slate-500">Risk: {rule.riskScore}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <p className="text-xs text-slate-500 leading-relaxed">{rule.description}</p>
                                                                                <p className="text-xs text-slate-400 mt-0.5">Threshold: {rule.threshold}</p>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                            </div>

                            {/* Selected Rule Summary + Generate Button */}
                            {selectedRuleInfo && sevColors && (
                                <div className={`mt-4 p-4 rounded-xl border-2 ${sevColors.border} ${sevColors.bg}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertTriangle size={16} className={sevColors.text} />
                                                <span className="font-bold text-slate-900">{selectedRuleInfo.name}</span>
                                                <code className="text-xs font-mono bg-white/60 px-1.5 py-0.5 rounded">{selectedRuleInfo.code}</code>
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sevColors.bg} ${sevColors.text} border ${sevColors.border}`}>
                                                    {selectedRuleInfo.severity}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600">{selectedRuleInfo.description}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                <strong>Threshold:</strong> {selectedRuleInfo.threshold} &nbsp;|&nbsp;
                                                <strong>Data type:</strong> <span className="capitalize">{selectedRuleInfo.dataType}</span> &nbsp;|&nbsp;
                                                <strong>Risk score:</strong> {selectedRuleInfo.riskScore}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quantity Input */}
                            {selectedRuleInfo && (
                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantity</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={violationQuantity}
                                            onChange={e => setViolationQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                            className="w-28 px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 font-semibold text-center focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                                        />
                                        <span className="text-sm text-slate-500">violation record set{violationQuantity > 1 ? 's' : ''} to generate (1–100)</span>
                                    </div>
                                </div>
                            )}

                            {/* Generate + Send Buttons */}
                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={handleGenerateViolation}
                                    disabled={!selectedRule || violationLoading || loading}
                                    className="flex-1 py-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                                >
                                    {violationLoading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Generating Violation...
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={20} />
                                            Generate Violation Data
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleSendViolation}
                                    disabled={!violationResult || loading || !!jsonError}
                                    className="flex-1 py-3.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            Send to Webhook
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Violation Explanation */}
                            {violationResult && (
                                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <div className="flex items-start gap-2">
                                        <Info size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-amber-800 text-sm mb-1">Generated {violationResult.recordCount} {violationResult.dataType} record{violationResult.recordCount > 1 ? 's' : ''}</p>
                                            <p className="text-sm text-amber-700">{violationResult.explanation}</p>
                                            {violationResult.note && (
                                                <p className="text-xs text-amber-600 mt-1.5 bg-amber-100/60 px-2 py-1 rounded">{violationResult.note}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* JSON Editor Card */}
            {showEditor && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Edit3 className="text-purple-600" size={22} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    Edit Payload
                                    <span className="ml-2 text-sm font-normal text-slate-500 capitalize">
                                        ({mode === 'violation' && violationResult ? `${violationResult.dataType} — ${violationResult.recordCount} record${violationResult.recordCount > 1 ? 's' : ''}` : `${dataType} — ${amount} record${amount > 1 ? 's' : ''}`})
                                    </span>
                                </h3>
                                <p className="text-sm text-slate-500">{mode === 'violation' ? 'Review and edit violation data before sending' : 'Modify the JSON payload before sending to webhook'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRegenerate}
                                disabled={previewLoading}
                                className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                title="Regenerate data"
                            >
                                <RotateCcw size={18} className={previewLoading ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={() => { setShowEditor(false); setPreviewData(null); setEditedJson(''); setJsonError(null); }}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Close editor"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* JSON Error Banner */}
                    {jsonError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                            <XCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-red-700">Invalid JSON</p>
                                <p className="text-xs text-red-600 font-mono mt-0.5">{jsonError}</p>
                            </div>
                        </div>
                    )}

                    {/* Textarea JSON Editor */}
                    <div className="relative">
                        <textarea
                            ref={editorRef}
                            value={editedJson}
                            onChange={(e) => handleJsonChange(e.target.value)}
                            spellCheck={false}
                            className={`w-full h-[500px] px-4 py-3 bg-slate-900 text-green-400 font-mono text-sm rounded-lg border-2 ${jsonError ? 'border-red-400' : 'border-slate-700'
                                } focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-y`}
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${jsonError ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                {jsonError ? 'Invalid JSON' : 'Valid JSON'}
                            </span>
                            <span className="text-xs text-slate-500">
                                {editedJson.length.toLocaleString()} chars
                            </span>
                        </div>
                    </div>

                    {/* Send Modified Data Button */}
                    <button
                        onClick={handleSendEdited}
                        disabled={loading || !!jsonError}
                        className="w-full mt-4 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Sending Modified Data...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Send Modified Data to Webhook
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Response Card */}
            {response && (
                <div className={`bg-white rounded-2xl shadow-xl border-2 ${response.success ? 'border-green-300' : 'border-red-300'
                    } p-8`}>
                    <div className="flex items-start gap-4 mb-6">
                        {response.success ? (
                            <div className="p-3 bg-green-100 rounded-full">
                                <CheckCircle className="text-green-600" size={28} />
                            </div>
                        ) : (
                            <div className="p-3 bg-red-100 rounded-full">
                                <XCircle className="text-red-600" size={28} />
                            </div>
                        )}
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-slate-900 mb-1">
                                {response.success ? 'Success' : 'Failed'}
                            </h3>
                            <p className={`text-lg ${response.success ? 'text-green-700' : 'text-red-700'} font-medium`}>
                                {response.message}
                            </p>
                        </div>
                    </div>

                    {/* Status and Timing Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Activity size={18} className="text-slate-600" />
                                <span className="text-sm font-semibold text-slate-600">Status Code</span>
                            </div>
                            <p className={`text-2xl font-bold ${response.statusCode >= 200 && response.statusCode < 300 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {response.statusCode}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{response.statusText}</p>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock size={18} className="text-slate-600" />
                                <span className="text-sm font-semibold text-slate-600">Response Time</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600">
                                {response.responseTime}ms
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {response.responseTime < 100 ? 'Excellent' : response.responseTime < 500 ? 'Good' : 'Slow'}
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Send size={18} className="text-slate-600" />
                                <span className="text-sm font-semibold text-slate-600">Records Sent</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-600">
                                {mode === 'violation' && violationResult ? violationResult.recordCount : amount}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 capitalize">{mode === 'violation' && violationResult ? violationResult.dataType : dataType} data</p>
                        </div>
                    </div>

                    {/* Response Body */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Response Body</h4>
                        <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-green-400 font-mono">
                                {JSON.stringify(response.response || response.error, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
