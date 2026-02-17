'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, CheckCircle, XCircle, Clock, Activity, Eye, Edit3, X, RotateCcw } from 'lucide-react';

interface WebhookResponse {
    success: boolean;
    statusCode: number;
    statusText: string;
    responseTime: number;
    response: any;
    message: string;
    error?: string;
}

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
        await handleViewData();
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
                    dataType,
                    amount,
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

    return (
        <div className="space-y-6">
            {/* Configuration Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Webhook Configuration</h2>
                    <p className="text-slate-600">Send mock data to your webhook endpoint</p>
                </div>

                <div className="space-y-5">
                    {/* Webhook URL */}
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

                    {/* Token */}
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

                    {/* Data Type and Amount */}
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
                </div>
            </div>

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
                                        ({dataType} — {amount} record{amount > 1 ? 's' : ''})
                                    </span>
                                </h3>
                                <p className="text-sm text-slate-500">Modify the JSON payload before sending to webhook</p>
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
                                {amount}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 capitalize">{dataType} data</p>
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
