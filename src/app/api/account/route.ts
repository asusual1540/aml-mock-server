import { NextRequest, NextResponse } from 'next/server';
import { logRequest } from '@/lib/logger';
import { isCustomerIdPoolEmpty, addAccountsToPool, getRandomCustomerFromPool } from '@/lib/schema-manager';
import { generateAccountData, AccountProductType } from '@/lib/generators';

const VALID_ACCOUNT_TYPES: AccountProductType[] = [
    'SAVINGS', 'CURRENT', 'LOAN', 'CARD', 'MFS', 'DEPOSIT', 'CORPORATE_ACCOUNT', 'CAMPAIGN',
];

export async function GET(request: NextRequest) {
    // Validate ACCESS_TOKEN
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.nextUrl.searchParams.get('token');
    if (!token || token !== process.env.ACCESS_TOKEN) {
        return NextResponse.json(
            { error: 'Unauthorized: Invalid or missing access token' },
            { status: 401 }
        );
    }

    await logRequest(request);

    try {
        const { searchParams } = new URL(request.url);
        const amountParam = searchParams.get('amount');
        const amount = amountParam ? parseInt(amountParam, 10) : 1;

        // Optional: force a specific account product type
        const typeParam = searchParams.get('type')?.toUpperCase() as AccountProductType | undefined;
        const forceAccountType = typeParam && VALID_ACCOUNT_TYPES.includes(typeParam) ? typeParam : undefined;

        if (isNaN(amount) || amount < 1) {
            return NextResponse.json(
                { error: 'Invalid amount parameter. Must be >= 1' },
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

        // Generate account data using dedicated product generators
        const records = Array.from({ length: amount }, () => {
            const customer = getRandomCustomerFromPool();
            const customerId = customer?.customerId ?? 100000;
            return generateAccountData(customerId, forceAccountType);
        });
        const data = amount === 1 ? records[0] : records;

        // Add generated account IDs to the pool
        const accountIds = records
            .map(acc => acc.uniqueAccountNumber)
            .filter((id): id is string => typeof id === 'string' && id.length > 0);

        if (accountIds.length > 0) {
            addAccountsToPool(accountIds);
            console.log(`[ACCOUNT API] Added ${accountIds.length} accounts to pool`);
        }

        console.log(`[ACCOUNT API] Generated ${amount} account(s), type=${forceAccountType || 'MIXED'}`);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error generating account data:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
