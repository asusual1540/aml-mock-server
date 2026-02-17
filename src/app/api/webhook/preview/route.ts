import { NextRequest, NextResponse } from 'next/server';
import { getSchemas, generateDataFromSchema, isCustomerIdPoolEmpty } from '@/lib/schema-manager';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { dataType, amount } = body;

        if (!dataType) {
            return NextResponse.json(
                { error: 'Missing required field: dataType' },
                { status: 400 }
            );
        }

        const amountNum = parseInt(amount) || 1;
        if (amountNum < 1 || amountNum > 100000) {
            return NextResponse.json(
                { error: 'Amount must be between 1 and 100000' },
                { status: 400 }
            );
        }

        if (!['customer', 'account', 'transaction', 'sanction', 'trade', 'credit'].includes(dataType)) {
            return NextResponse.json(
                { error: 'Invalid dataType. Must be customer, account, transaction, sanction, trade, or credit' },
                { status: 400 }
            );
        }

        // Check if trying to generate transactions, accounts, or sanctions without customers
        if ((dataType === 'transaction' || dataType === 'account' || dataType === 'sanction') && isCustomerIdPoolEmpty()) {
            return NextResponse.json(
                { error: 'No customers available. Please generate customers first.' },
                { status: 400 }
            );
        }

        const schemas = getSchemas();
        const schema = schemas[dataType as keyof typeof schemas];
        if (!schema) {
            return NextResponse.json({ error: `No schema found for data type: ${dataType}` }, { status: 400 });
        }

        const data = amountNum === 1
            ? generateDataFromSchema(schema, schemas)
            : Array.from({ length: amountNum }, () =>
                generateDataFromSchema(schema, schemas)
            );

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Preview generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate preview data', message: error.message },
            { status: 500 }
        );
    }
}
