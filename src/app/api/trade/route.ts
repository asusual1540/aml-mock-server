import { NextRequest, NextResponse } from 'next/server';
import { logRequest } from '@/lib/logger';
import { getSchemas, generateDataFromSchema } from '@/lib/schema-manager';

// ─── Route Handler ───

export async function GET(request: NextRequest) {
    // Validate ACCESS_TOKEN
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.nextUrl.searchParams.get('token');
    console.log('Received token:', token);
    console.log('Expected token:', process.env.ACCESS_TOKEN);
    if (!token || token !== process.env.ACCESS_TOKEN) {
        return NextResponse.json(
            { error: 'Unauthorized: Invalid or missing access token' },
            { status: 401 }
        );
    }

    // Log the request
    await logRequest(request);

    try {
        const { searchParams } = new URL(request.url);
        const amountParam = searchParams.get('amount');
        const amount = amountParam ? parseInt(amountParam, 10) : 1;

        // Validate amount
        if (isNaN(amount) || amount < 1) {
            return NextResponse.json(
                { error: 'Invalid amount parameter' },
                { status: 400 }
            );
        }

        const schemas = getSchemas();
        const tradeSchema = schemas.trade;

        if (!tradeSchema) {
            return NextResponse.json(
                { error: 'Trade schema not found. Please check configuration.' },
                { status: 500 }
            );
        }

        const data = amount === 1
            ? generateDataFromSchema(tradeSchema, schemas)
            : Array.from({ length: amount }, () => generateDataFromSchema(tradeSchema, schemas));

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error generating trade finance data:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
