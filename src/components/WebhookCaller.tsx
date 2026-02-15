'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';

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
    const [webhookUrl, setWebhookUrl] = useState('');
    const [token, setToken] = useState('');
    const [dataType, setDataType] = useState<'customer' | 'account' | 'transaction' | 'sanction'>('customer');
    const [amount, setAmount] = useState(1);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<WebhookResponse | null>(null);

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
                            <span className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg border-2 border-slate-300 font-mono text-sm whitespace-nowrap">
                                http://localhost:9000
                            </span>
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
                                className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white font-medium cursor-pointer"
                            >
                                <option value="customer">Customer</option>
                                <option value="account">Account</option>
                                <option value="transaction">Transaction</option>
                                <option value="sanction">Sanction</option>
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

                    {/* Send Button */}
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
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
