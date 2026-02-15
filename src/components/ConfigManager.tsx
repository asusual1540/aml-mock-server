'use client';

import { useState, useEffect } from 'react';
import { Save, RotateCcw, Plus, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface FieldDefinition {
    name: string;
    type: string;
    options?: string[];
    itemType?: string;
    count?: number;
}

interface DataTypeSchema {
    fields: FieldDefinition[];
}

interface Schemas {
    customer: DataTypeSchema;
    account: DataTypeSchema;
    transaction: DataTypeSchema;
    sanction: DataTypeSchema;
}

export default function ConfigManager() {
    const [schemas, setSchemas] = useState<Schemas | null>(null);
    const [availableTypes, setAvailableTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        customer: true,
        account: true,
        transaction: true,
        sanction: true,
    });

    useEffect(() => {
        loadSchemas();
    }, []);

    const loadSchemas = async () => {
        try {
            const response = await fetch('/api/config');
            const data = await response.json();
            setSchemas(data.schemas);
            setAvailableTypes(data.availableTypes);
        } catch (error) {
            console.error('Failed to load schemas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'save', schemas }),
            });
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

    const addField = (dataType: keyof Schemas) => {
        if (!schemas) return;
        const newField: FieldDefinition = {
            name: 'new_field',
            type: 'string',
        };
        setSchemas({
            ...schemas,
            [dataType]: {
                ...schemas[dataType],
                fields: [...schemas[dataType].fields, newField],
            },
        });
    };

    const removeField = (dataType: keyof Schemas, index: number) => {
        if (!schemas) return;
        const newFields = [...schemas[dataType].fields];
        newFields.splice(index, 1);
        setSchemas({
            ...schemas,
            [dataType]: {
                ...schemas[dataType],
                fields: newFields,
            },
        });
    };

    const updateField = (
        dataType: keyof Schemas,
        index: number,
        key: keyof FieldDefinition,
        value: any
    ) => {
        if (!schemas) return;
        const newFields = [...schemas[dataType].fields];
        newFields[index] = { ...newFields[index], [key]: value };

        // Clear options/itemType/count when type changes
        if (key === 'type') {
            if (value === 'select') {
                newFields[index].options = ['Option1', 'Option2'];
                delete newFields[index].itemType;
                delete newFields[index].count;
            } else if (value === 'array') {
                newFields[index].itemType = 'string';
                newFields[index].count = 2;
                delete newFields[index].options;
            } else {
                delete newFields[index].options;
                delete newFields[index].itemType;
                delete newFields[index].count;
            }
        }

        setSchemas({
            ...schemas,
            [dataType]: {
                ...schemas[dataType],
                fields: newFields,
            },
        });
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections({
            ...expandedSections,
            [section]: !expandedSections[section],
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

    const dataTypes: { key: keyof Schemas; label: string; gradient: string; badgeColor: string }[] = [
        {
            key: 'customer',
            label: 'Customer',
            gradient: 'from-blue-500 to-blue-600',
            badgeColor: 'bg-blue-100 text-blue-700'
        },
        {
            key: 'account',
            label: 'Account',
            gradient: 'from-amber-500 to-amber-600',
            badgeColor: 'bg-amber-100 text-amber-700'
        },
        {
            key: 'transaction',
            label: 'Transaction',
            gradient: 'from-emerald-500 to-emerald-600',
            badgeColor: 'bg-emerald-100 text-emerald-700'
        },
        {
            key: 'sanction',
            label: 'Sanction',
            gradient: 'from-purple-500 to-purple-600',
            badgeColor: 'bg-purple-100 text-purple-700'
        },
    ];

    return (
        <div className="space-y-3">
            {/* Compact Action Bar */}
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

            {/* Compact Schema Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {dataTypes.map(({ key, label, gradient, badgeColor }) => (
                    <div key={key} className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 hover:shadow-lg transition-all duration-200 flex flex-col">
                        <div
                            className={`bg-gradient-to-r ${gradient} text-white px-3 py-2 cursor-pointer hover:opacity-90 transition-opacity`}
                            onClick={() => toggleSection(key)}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 min-w-0">
                                    <h3 className="text-lg font-bold truncate">{label}</h3>
                                    <span className="text-xs bg-white/25 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                                        {schemas[key].fields.length}
                                    </span>
                                </div>
                                <button className="hover:bg-white/20 p-1 rounded transition-colors flex-shrink-0">
                                    {expandedSections[key] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                            </div>
                        </div>

                        {expandedSections[key] && (
                            <div className="p-3 space-y-2 bg-slate-50 flex-1 overflow-auto max-h-[600px]">
                                {schemas[key].fields.map((field, index) => (
                                    <div
                                        key={index}
                                        className="group relative bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all p-3"
                                    >
                                        <div className="space-y-2">
                                            {/* Compact Field Row */}
                                            <div className="grid grid-cols-[1fr,auto,auto] gap-2 items-start">
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={field.name}
                                                        onChange={(e) => updateField(key, index, 'name', e.target.value)}
                                                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 font-medium"
                                                        placeholder="Field name"
                                                    />
                                                </div>
                                                <div className="w-32">
                                                    <select
                                                        value={field.type}
                                                        onChange={(e) => updateField(key, index, 'type', e.target.value)}
                                                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 font-medium cursor-pointer"
                                                    >
                                                        {availableTypes.map((type) => (
                                                            <option key={type} value={type}>
                                                                {type}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={() => removeField(key, index)}
                                                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Conditional Options */}
                                            {field.type === 'select' && (
                                                <input
                                                    type="text"
                                                    value={field.options?.join(', ') || ''}
                                                    onChange={(e) =>
                                                        updateField(
                                                            key,
                                                            index,
                                                            'options',
                                                            e.target.value.split(',').map((s) => s.trim())
                                                        )
                                                    }
                                                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-700"
                                                    placeholder="Options: A, B, C"
                                                />
                                            )}

                                            {field.type === 'array' && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <select
                                                        value={field.itemType || 'string'}
                                                        onChange={(e) => updateField(key, index, 'itemType', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-700 cursor-pointer"
                                                    >
                                                        {availableTypes
                                                            .filter((t) => t !== 'array')
                                                            .map((type) => (
                                                                <option key={type} value={type}>
                                                                    {type}
                                                                </option>
                                                            ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={field.count || 2}
                                                        onChange={(e) =>
                                                            updateField(key, index, 'count', parseInt(e.target.value))
                                                        }
                                                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-700"
                                                        placeholder="Length"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Compact Add Button */}
                                <button
                                    onClick={() => addField(key)}
                                    className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center justify-center gap-1.5 text-sm font-medium"
                                >
                                    <Plus size={16} />
                                    Add Field
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
