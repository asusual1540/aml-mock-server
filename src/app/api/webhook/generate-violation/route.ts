import { NextRequest, NextResponse } from 'next/server';
import { getRuleCatalog, generateViolationData } from '@/lib/rule-violation-generator';

/**
 * GET  → Returns the full rule catalog for the frontend dropdown
 * POST → Generates violation data for a specific rule code
 */

export async function GET() {
    try {
        const catalog = getRuleCatalog();

        // Group by category for easier frontend consumption
        const categories = [
            {
                id: 'transaction',
                name: 'Transaction Monitoring',
                description: '49 rules monitoring transaction patterns',
                rules: catalog.filter(r => r.category === 'transaction'),
            },
            {
                id: 'sanction',
                name: 'Sanction Screening',
                description: '6 rule types for sanction/PEP screening',
                rules: catalog.filter(r => r.category === 'sanction'),
            },
            {
                id: 'trade',
                name: 'Trade-Based ML (TBML)',
                description: '58 rules for trade/LC monitoring',
                rules: catalog.filter(r => r.category === 'trade'),
            },
        ];

        return NextResponse.json({ success: true, categories, totalRules: catalog.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ruleCode, quantity = 1 } = body;

        if (!ruleCode) {
            return NextResponse.json(
                { error: 'Missing required field: ruleCode' },
                { status: 400 }
            );
        }

        const count = Math.max(1, Math.min(100, Number(quantity) || 1));

        if (count === 1) {
            const result = generateViolationData(ruleCode);
            return NextResponse.json({
                success: true,
                ...result,
            });
        }

        // Generate multiple batches and merge records
        const allRecords: any[] = [];
        let lastResult: ReturnType<typeof generateViolationData> | null = null;
        const explanations: string[] = [];

        for (let i = 0; i < count; i++) {
            const result = generateViolationData(ruleCode);
            allRecords.push(...result.records);
            explanations.push(result.explanation);
            lastResult = result;
        }

        return NextResponse.json({
            success: true,
            rule: lastResult!.rule,
            dataType: lastResult!.dataType,
            records: allRecords,
            recordCount: allRecords.length,
            explanation: `Generated ${count} batches (${allRecords.length} total records). ${explanations[0]}`,
            note: lastResult!.note || '',
        });
    } catch (error: any) {
        console.error('[VIOLATION] Generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate violation data' },
            { status: error.message?.includes('pool is empty') ? 400 : 500 }
        );
    }
}
