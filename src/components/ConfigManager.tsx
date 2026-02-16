'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Save, RotateCcw, Plus, Trash2, ChevronDown, ChevronUp, ArrowRight, Layers, Box } from 'lucide-react';

interface FieldDefinition {
    name: string;
    type: string;
    options?: string[];
    itemType?: string;
    count?: number;
    schema?: string;
    minCount?: number;
    maxCount?: number;
}

interface DataTypeSchema {
    fields: FieldDefinition[];
}

// Dynamic schemas — main types + any nested schemas
type Schemas = Record<string, DataTypeSchema>;

const MAIN_DATA_TYPES = ['customer', 'account', 'transaction', 'sanction', 'trade'];

const MAIN_TYPE_META: Record<string, { label: string; icon: string; activeGradient: string }> = {
    customer: { label: 'Customer', icon: '👤', activeGradient: 'from-blue-500 to-blue-600' },
    account: { label: 'Account', icon: '🏦', activeGradient: 'from-amber-500 to-amber-600' },
    transaction: { label: 'Transaction', icon: '💸', activeGradient: 'from-emerald-500 to-emerald-600' },
    sanction: { label: 'Sanction', icon: '🛡️', activeGradient: 'from-purple-500 to-purple-600' },
    trade: { label: 'Trade (LC)', icon: '📋', activeGradient: 'from-rose-500 to-rose-600' },
};

export default function ConfigManager() {
    const router = useRouter();
    const [schemas, setSchemas] = useState<Schemas | null>(null);
    const [availableTypes, setAvailableTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeDataType, setActiveDataType] = useState<string>('customer');
    const [expandedNestedFields, setExpandedNestedFields] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadSchemas();
    }, []);

    const loadSchemas = async () => {
        try {
            const response = await fetch('/api/config');
            if (response.status === 401) { router.replace('/login'); return; }
            const data = await response.json();
            setSchemas(data.schemas);
            setAvailableTypes(data.availableTypes);
        } catch (error) {
            console.error('Failed to load schemas:', error);
        } finally {
            setLoading(false);
        }
    };

    // Derive nested schema keys from the schemas object
    const nestedSchemaKeys = useMemo(() => {
        if (!schemas) return [];
        return Object.keys(schemas).filter(key => !MAIN_DATA_TYPES.includes(key));
    }, [schemas]);

    // Build a map: nested schema key -> which main types reference it
    const nestedSchemaParents = useMemo(() => {
        if (!schemas) return {} as Record<string, string[]>;
        const map: Record<string, string[]> = {};
        for (const mainKey of MAIN_DATA_TYPES) {
            const s = schemas[mainKey];
            if (!s) continue;
            for (const field of s.fields) {
                if ((field.type === 'nestedObject' || field.type === 'nestedArray') && field.schema) {
                    if (!map[field.schema]) map[field.schema] = [];
                    if (!map[field.schema].includes(mainKey)) {
                        map[field.schema].push(mainKey);
                    }
                }
            }
        }
        return map;
    }, [schemas]);

    // Group nested schemas by their parent
    const nestedByParent = useMemo(() => {
        const result: Record<string, string[]> = {};
        for (const nk of nestedSchemaKeys) {
            const parents = nestedSchemaParents[nk];
            if (parents && parents.length > 0) {
                for (const p of parents) {
                    if (!result[p]) result[p] = [];
                    if (!result[p].includes(nk)) result[p].push(nk);
                }
            }
        }
        return result;
    }, [nestedSchemaKeys, nestedSchemaParents]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'save', schemas }),
            });
            if (response.status === 401) { router.replace('/login'); return; }
            if (response.ok) {
                alert('Configuration saved successfully!');
            }
        } catch (error) {
            console.error('Failed to save schemas:', error);
            alert('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('Are you sure you want to reset to default configuration?')) {
            return;
        }
        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset' }),
            });
            if (response.status === 401) { router.replace('/login'); return; }
            const data = await response.json();
            if (data.success) {
                setSchemas(data.schemas);
                alert('Configuration reset to defaults!');
            }
        } catch (error) {
            console.error('Failed to reset schemas:', error);
            alert('Failed to reset configuration');
        }
    };

    const addField = (dataType: string) => {
        if (!schemas) return;
        const newField: FieldDefinition = { name: 'new_field', type: 'string' };
        setSchemas({
            ...schemas,
            [dataType]: {
                ...schemas[dataType],
                fields: [...(schemas[dataType]?.fields || []), newField],
            },
        });
    };

    const removeField = (dataType: string, index: number) => {
        if (!schemas) return;
        const field = schemas[dataType]?.fields[index];
        const newFields = [...schemas[dataType].fields];
        newFields.splice(index, 1);

        const updated: Schemas = {
            ...schemas,
            [dataType]: { ...schemas[dataType], fields: newFields },
        };

        // If removing a nested field, also remove the referenced nested schema
        // only if no other field references it
        if (field && (field.type === 'nestedObject' || field.type === 'nestedArray') && field.schema) {
            const schemaKey = field.schema;
            const stillReferenced = Object.values(updated).some(dt =>
                dt.fields?.some(f => f.schema === schemaKey)
            );
            if (!stillReferenced && updated[schemaKey]) {
                delete updated[schemaKey];
            }
        }

        setSchemas(updated);
    };

    const updateField = (
        dataType: string,
        index: number,
        key: keyof FieldDefinition,
        value: any
    ) => {
        if (!schemas) return;
        const newFields = [...schemas[dataType].fields];
        newFields[index] = { ...newFields[index], [key]: value };

        // Handle type changes — reset irrelevant properties
        if (key === 'type') {
            if (value === 'select') {
                newFields[index].options = ['Option1', 'Option2'];
                delete newFields[index].itemType;
                delete newFields[index].count;
                delete newFields[index].schema;
                delete newFields[index].minCount;
                delete newFields[index].maxCount;
            } else if (value === 'array') {
                newFields[index].itemType = 'string';
                newFields[index].count = 2;
                delete newFields[index].options;
                delete newFields[index].schema;
                delete newFields[index].minCount;
                delete newFields[index].maxCount;
            } else if (value === 'nestedObject') {
                const schemaName = newFields[index].schema || newFields[index].name || 'newNestedSchema';
                newFields[index].schema = schemaName;
                delete newFields[index].options;
                delete newFields[index].itemType;
                delete newFields[index].count;
                delete newFields[index].minCount;
                delete newFields[index].maxCount;
                if (!schemas[schemaName]) {
                    setSchemas({
                        ...schemas,
                        [schemaName]: { fields: [{ name: 'id', type: 'string' }] },
                        [dataType]: { ...schemas[dataType], fields: newFields },
                    });
                    return;
                }
            } else if (value === 'nestedArray') {
                const schemaName = newFields[index].schema || newFields[index].name || 'newNestedSchema';
                newFields[index].schema = schemaName;
                newFields[index].minCount = newFields[index].minCount ?? 1;
                newFields[index].maxCount = newFields[index].maxCount ?? 3;
                delete newFields[index].options;
                delete newFields[index].itemType;
                delete newFields[index].count;
                if (!schemas[schemaName]) {
                    setSchemas({
                        ...schemas,
                        [schemaName]: { fields: [{ name: 'id', type: 'string' }] },
                        [dataType]: { ...schemas[dataType], fields: newFields },
                    });
                    return;
                }
            } else {
                delete newFields[index].options;
                delete newFields[index].itemType;
                delete newFields[index].count;
                delete newFields[index].schema;
                delete newFields[index].minCount;
                delete newFields[index].maxCount;
            }
        }

        // When schema reference changes to "__new__", prompt for new name
        if (key === 'schema' && value === '__new__') {
            const name = prompt('Enter new nested schema name (camelCase, e.g. "contactInfo"):');
            if (!name || !name.trim()) return;
            const trimmed = name.trim();
            newFields[index].schema = trimmed;
            if (!schemas[trimmed]) {
                setSchemas({
                    ...schemas,
                    [trimmed]: { fields: [{ name: 'id', type: 'string' }] },
                    [dataType]: { ...schemas[dataType], fields: newFields },
                });
                return;
            }
        }

        // When schema reference changes, create the new schema if needed
        if (key === 'schema' && value !== '__new__' && (newFields[index].type === 'nestedObject' || newFields[index].type === 'nestedArray')) {
            if (value && !schemas[value]) {
                setSchemas({
                    ...schemas,
                    [value]: { fields: [{ name: 'id', type: 'string' }] },
                    [dataType]: { ...schemas[dataType], fields: newFields },
                });
                return;
            }
        }

        setSchemas({
            ...schemas,
            [dataType]: { ...schemas[dataType], fields: newFields },
        });
    };

    const addNestedSchema = () => {
        if (!schemas) return;
        const name = prompt('Enter nested schema name (camelCase, e.g. "contactInfo"):');
        if (!name || !name.trim()) return;
        const key = name.trim();
        if (schemas[key]) {
            alert('A schema with this name already exists!');
            return;
        }
        setSchemas({
            ...schemas,
            [key]: { fields: [{ name: 'id', type: 'string' }] },
        });
        setActiveDataType(key);
    };

    const deleteNestedSchema = (key: string) => {
        if (!schemas) return;
        const refs: string[] = [];
        for (const [dtKey, dt] of Object.entries(schemas)) {
            for (const field of dt.fields || []) {
                if (field.schema === key) refs.push(`${dtKey}.${field.name}`);
            }
        }
        if (refs.length > 0) {
            alert(`Cannot delete: schema "${key}" is referenced by: ${refs.join(', ')}`);
            return;
        }
        if (!confirm(`Delete nested schema "${key}"? This cannot be undone.`)) return;
        const updated = { ...schemas };
        delete updated[key];
        setSchemas(updated);
        if (activeDataType === key) setActiveDataType('customer');
    };

    const toggleNestedField = (fieldKey: string) => {
        setExpandedNestedFields(prev => {
            const next = new Set(prev);
            if (next.has(fieldKey)) next.delete(fieldKey); else next.add(fieldKey);
            return next;
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading configuration...</p>
                </div>
            </div>
        );
    }

    if (!schemas) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                <p className="text-red-800 font-semibold">Failed to load configuration</p>
                <p className="text-red-600 text-sm mt-1">Please refresh the page or contact support</p>
            </div>
        );
    }

    const isMainType = MAIN_DATA_TYPES.includes(activeDataType);
    const activeMeta = MAIN_TYPE_META[activeDataType];
    const activeGradient = activeMeta?.activeGradient || 'from-indigo-500 to-indigo-600';
    const activeLabel = activeMeta?.label || activeDataType;
    const activeIcon = activeMeta?.icon || '📦';
    const activeFields = schemas[activeDataType]?.fields || [];

    const renderFieldRow = (dataType: string, field: FieldDefinition, index: number) => {
        const fieldKey = `${dataType}-${index}`;
        const isNested = field.type === 'nestedObject' || field.type === 'nestedArray';
        const isExpanded = expandedNestedFields.has(fieldKey);
        const refSchema = field.schema && schemas[field.schema] ? schemas[field.schema] : null;

        return (
            <div
                key={index}
                className={`group relative bg-white rounded-lg border transition-all ${isNested ? 'border-indigo-200 hover:border-indigo-400' : 'border-slate-200 hover:border-blue-300'} hover:shadow-sm`}
            >
                <div className="p-3 space-y-2">
                    {/* Main row */}
                    <div className="grid grid-cols-[1fr,auto,auto] gap-2 items-start">
                        <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateField(dataType, index, 'name', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 font-medium"
                            placeholder="Field name"
                        />
                        <select
                            value={field.type}
                            onChange={(e) => updateField(dataType, index, 'type', e.target.value)}
                            className={`w-36 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white font-medium cursor-pointer ${isNested ? 'border-indigo-300 text-indigo-700' : 'border-slate-300 text-slate-900'}`}
                        >
                            {availableTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => removeField(dataType, index)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Remove"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    {/* Select options */}
                    {field.type === 'select' && (
                        <input
                            type="text"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) =>
                                updateField(dataType, index, 'options', e.target.value.split(',').map((s) => s.trim()))
                            }
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-700"
                            placeholder="Options: A, B, C"
                        />
                    )}

                    {/* Array options */}
                    {field.type === 'array' && (
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={field.itemType || 'string'}
                                onChange={(e) => updateField(dataType, index, 'itemType', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-700 cursor-pointer"
                            >
                                {availableTypes
                                    .filter((t) => t !== 'array' && t !== 'nestedObject' && t !== 'nestedArray')
                                    .map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                            </select>
                            <input
                                type="number"
                                min="1"
                                value={field.count || 2}
                                onChange={(e) => updateField(dataType, index, 'count', parseInt(e.target.value))}
                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-700"
                                placeholder="Count"
                            />
                        </div>
                    )}

                    {/* Nested Object / Nested Array controls */}
                    {isNested && (
                        <div className="space-y-2">
                            <div className="flex items-end gap-2">
                                {/* Schema reference selector */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Layers size={12} className="text-indigo-500" />
                                        <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-semibold">Schema ref</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <select
                                            value={field.schema || ''}
                                            onChange={(e) => updateField(dataType, index, 'schema', e.target.value)}
                                            className="flex-1 px-2 py-1 text-xs border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-indigo-50 text-indigo-800 font-medium cursor-pointer"
                                        >
                                            <option value="">— select schema —</option>
                                            {nestedSchemaKeys.map((nk) => (
                                                <option key={nk} value={nk}>{nk}</option>
                                            ))}
                                            <option value="__new__">+ Create new schema...</option>
                                        </select>
                                        {field.schema && schemas[field.schema] && (
                                            <button
                                                onClick={() => setActiveDataType(field.schema!)}
                                                className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors font-medium flex items-center gap-1"
                                                title={`Edit ${field.schema} schema`}
                                            >
                                                <ArrowRight size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Min/Max count for nestedArray */}
                                {field.type === 'nestedArray' && (
                                    <div className="flex gap-2">
                                        <div>
                                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">Min</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={field.minCount ?? 1}
                                                onChange={(e) => updateField(dataType, index, 'minCount', parseInt(e.target.value))}
                                                className="w-14 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-700 text-center"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">Max</span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={field.maxCount ?? 3}
                                                onChange={(e) => updateField(dataType, index, 'maxCount', parseInt(e.target.value))}
                                                className="w-14 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-700 text-center"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Inline expandable nested schema preview */}
                            {refSchema && (
                                <div className="border border-indigo-200 rounded-lg overflow-hidden bg-indigo-50/50">
                                    <button
                                        onClick={() => toggleNestedField(fieldKey)}
                                        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <Box size={12} />
                                            {field.schema} — {refSchema.fields.length} field{refSchema.fields.length !== 1 ? 's' : ''}
                                        </span>
                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                    {isExpanded && (
                                        <div className="px-3 pb-2 space-y-1.5">
                                            {refSchema.fields.map((nf, ni) => (
                                                <div key={ni} className="flex items-center gap-1.5 text-xs bg-white rounded px-2 py-1 border border-indigo-100">
                                                    <span className="text-indigo-600 font-medium flex-1 truncate">{nf.name}</span>
                                                    <span className="text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] font-semibold">{nf.type}</span>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setActiveDataType(field.schema!)}
                                                className="w-full py-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded transition-colors font-medium flex items-center justify-center gap-1"
                                            >
                                                <ArrowRight size={12} />
                                                Edit {field.schema} schema
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-wrap gap-2 justify-end sticky top-0 z-20 bg-slate-50/80 backdrop-blur-sm py-2 px-1 rounded-lg">
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm font-medium"
                >
                    <RotateCcw size={16} />
                    <span className="hidden sm:inline">Reset</span>
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                            <span className="hidden sm:inline">Saving...</span>
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            <span className="hidden sm:inline">Save</span>
                        </>
                    )}
                </button>
            </div>

            {/* Main Data Type Tab Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 flex flex-wrap gap-1">
                {MAIN_DATA_TYPES.map((key) => {
                    const meta = MAIN_TYPE_META[key];
                    const isActive = activeDataType === key;
                    const childCount = nestedByParent[key]?.length || 0;
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveDataType(key)}
                            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive
                                ? `bg-gradient-to-r ${meta.activeGradient} text-white shadow-md scale-[1.02]`
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                                }`}
                        >
                            <span className="text-base">{meta.icon}</span>
                            <span>{meta.label}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                {schemas[key]?.fields?.length || 0}
                            </span>
                            {childCount > 0 && (
                                <span className={`text-[10px] px-1 py-0.5 rounded font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`} title={`${childCount} nested schema(s)`}>
                                    +{childCount}
                                </span>
                            )}
                            {isActive && (
                                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-sm border border-slate-200" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Nested Schemas Sub-tabs */}
            {nestedSchemaKeys.length > 0 && (
                <div className="bg-indigo-50/60 rounded-xl border border-indigo-200 p-1.5">
                    <div className="flex items-center gap-2 px-2 pb-1.5 mb-1 border-b border-indigo-200/60">
                        <Layers size={14} className="text-indigo-500" />
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Nested Schemas</span>
                        <button
                            onClick={addNestedSchema}
                            className="ml-auto text-xs px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded font-medium transition-colors flex items-center gap-1"
                        >
                            <Plus size={12} />
                            New
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {nestedSchemaKeys.map((nk) => {
                            const isActive = activeDataType === nk;
                            const parents = nestedSchemaParents[nk] || [];
                            return (
                                <button
                                    key={nk}
                                    onClick={() => setActiveDataType(nk)}
                                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${isActive
                                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                                        : 'text-indigo-700 hover:bg-indigo-100 bg-white/60'
                                        }`}
                                    title={parents.length > 0 ? `Used by: ${parents.map(p => MAIN_TYPE_META[p]?.label || p).join(', ')}` : 'Standalone nested schema'}
                                >
                                    <Box size={12} />
                                    <span>{nk}</span>
                                    <span className={`text-[10px] px-1 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/25' : 'bg-indigo-100 text-indigo-500'}`}>
                                        {schemas[nk]?.fields?.length || 0}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Active Schema Panel */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
                {/* Panel Header */}
                <div className={`bg-gradient-to-r ${activeGradient} text-white px-5 py-3`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{activeIcon}</span>
                            <div>
                                <h3 className="text-lg font-bold">
                                    {activeLabel}
                                    {!isMainType && <span className="text-white/60 text-sm font-normal ml-2">(nested schema)</span>}
                                </h3>
                                <p className="text-white/70 text-xs">
                                    {activeFields.length} field{activeFields.length !== 1 ? 's' : ''} configured
                                    {!isMainType && nestedSchemaParents[activeDataType] && (
                                        <span className="ml-2">
                                            • used by {nestedSchemaParents[activeDataType].map(p => MAIN_TYPE_META[p]?.label || p).join(', ')}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isMainType && (
                                <button
                                    onClick={() => deleteNestedSchema(activeDataType)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            )}
                            <button
                                onClick={() => addField(activeDataType)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus size={16} />
                                Add Field
                            </button>
                        </div>
                    </div>
                </div>

                {/* Fields List */}
                <div className="p-4 space-y-2 bg-slate-50 max-h-[calc(100vh-380px)] overflow-auto">
                    {activeFields.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <p className="text-sm font-medium">No fields configured</p>
                            <p className="text-xs mt-1">Click &ldquo;Add Field&rdquo; to get started</p>
                        </div>
                    )}

                    {activeFields.map((field, index) => renderFieldRow(activeDataType, field, index))}

                    {activeFields.length > 0 && (
                        <button
                            onClick={() => addField(activeDataType)}
                            className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center justify-center gap-1.5 text-sm font-medium"
                        >
                            <Plus size={16} />
                            Add Field
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
