import { NextRequest, NextResponse } from 'next/server';
import { logRequest } from '@/lib/logger';
import { addCustomersToPool, CustomerPoolData } from '@/lib/schema-manager';
import { generateCustomerData, CustomerType } from '@/lib/generators';

const VALID_CUSTOMER_TYPES: CustomerType[] = ['INDIVIDUAL', 'CORPORATE', 'GOVERNMENT', 'NPO', 'JOINT'];

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

        // Optional: force a specific customer type
        const typeParam = searchParams.get('type')?.toUpperCase() as CustomerType | undefined;
        const forceCustomerType = typeParam && VALID_CUSTOMER_TYPES.includes(typeParam) ? typeParam : undefined;

        if (isNaN(amount) || amount < 1) {
            return NextResponse.json(
                { error: 'Invalid amount parameter. Must be >= 1' },
                { status: 400 }
            );
        }

        // Generate customer data using dedicated profile generators
        const records = Array.from({ length: amount }, () => generateCustomerData(forceCustomerType));
        const data = amount === 1 ? records[0] : records;

        // Add generated customers to the pool for cross-referencing
        const customers: CustomerPoolData[] = records.map(customer => {
            const customerId = typeof customer.customerId === 'number'
                ? customer.customerId
                : parseInt(customer.customerId, 10);

            if (isNaN(customerId)) {
                console.error('[CUSTOMER API] Invalid customerId generated:', customer.customerId);
                throw new Error(`Invalid customerId: ${customer.customerId}`);
            }

            const country: 'BD' | 'US' = customer.nationality === 'Bangladesh' ? 'BD' : 'US';

            return {
                customerId,
                customerNameEng: customer.customerNameEng,
                customerNameBen: customer.customerNameBen || '',
                dateOfBirth: customer['individual.dob'] || '',
                nationality: customer.nationality,
                country,
            };
        });
        addCustomersToPool(customers);

        console.log(`[CUSTOMER API] Generated ${amount} customer(s), type=${forceCustomerType || 'MIXED'}`);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error generating customer data:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
