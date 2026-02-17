import { NextRequest, NextResponse } from 'next/server';
import { logRequest } from '@/lib/logger';
import { getSchemas, generateDataFromSchema } from '@/lib/schema-manager';

// ─── Route Handler ───

export async function GET(request: NextRequest) {
    // Validate ACCESS_TOKEN
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.nextUrl.searchParams.get('token');
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
        const creditSchema = schemas.credit;

        if (!creditSchema) {
            return NextResponse.json(
                { error: 'Credit schema not found. Please check configuration.' },
                { status: 500 }
            );
        }

        const data = amount === 1
            ? generateDataFromSchema(creditSchema, schemas)
            : Array.from({ length: amount }, () => generateDataFromSchema(creditSchema, schemas));

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error generating credit data:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
