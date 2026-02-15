import { NextRequest, NextResponse } from 'next/server';
import { logRequest } from '@/lib/logger';
import { getSchemas, generateDataFromSchema, isCustomerIdPoolEmpty, addAccountsToPool } from '@/lib/schema-manager';

export async function GET(request: NextRequest) {
    // Validate ACCESS_TOKEN
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.nextUrl.searchParams.get('token');
    console.log("Received token:", token);
    console.log("Expected token:", process.env.ACCESS_TOKEN);
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

        // Check if customers exist in the pool
        if (isCustomerIdPoolEmpty()) {
            return NextResponse.json(
                { error: 'No customers available. Please generate customers first before generating accounts.' },
                { status: 400 }
            );
        }

        const schemas = getSchemas();

        // Debug: Log the account schema fields to verify customerId field exists
        const accountFields = schemas.account.fields.map(f => `${f.name}:${f.type}`);
        console.log('Account schema fields:', accountFields);
        const customerIdField = schemas.account.fields.find(f => f.name === 'customerId');
        console.log('customerId field:', customerIdField);

        const data = amount === 1
            ? generateDataFromSchema(schemas.account, schemas)
            : Array.from({ length: amount }, () => generateDataFromSchema(schemas.account, schemas));

        // Add generated account IDs to the pool
        const accounts = Array.isArray(data) ? data : [data];
        const accountIds = accounts
            .map(acc => acc.uniqueAccountNumber)
            .filter((id): id is string => typeof id === 'string' && id.length > 0);

        if (accountIds.length > 0) {
            addAccountsToPool(accountIds);
            console.log(`Added ${accountIds.length} accounts to pool`);
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error generating account data:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
