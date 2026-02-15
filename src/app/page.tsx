'use client';

import { useState } from 'react';
import ConfigManager from '@/components/ConfigManager';
import WebhookCaller from '@/components/WebhookCaller';
import { Settings, Webhook } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'config' | 'webhook'>('config');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-[1600px]">
        {/* Compact Header */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow">
              AML
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Mock Server
            </h1>
          </div>

          {/* Compact Tab Navigation */}
          <div className="inline-flex bg-white rounded-lg shadow-md p-1 border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'config'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Config</span>
            </button>
            <button
              onClick={() => setActiveTab('webhook')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'webhook'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Webhook size={16} />
              <span className="hidden sm:inline">Webhook</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === 'config' && <ConfigManager />}
          {activeTab === 'webhook' && <WebhookCaller />}
        </div>
      </main>
    </div>
  );
}
