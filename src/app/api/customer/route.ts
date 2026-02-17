import { NextRequest, NextResponse } from 'next/server';
import { logRequest } from '@/lib/logger';
import { getSchemas, generateDataFromSchema, addCustomersToPool, CustomerPoolData } from '@/lib/schema-manager';

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

        const schemas = getSchemas();
        const data = amount === 1
            ? generateDataFromSchema(schemas.customer, schemas)
            : Array.from({ length: amount }, () => generateDataFromSchema(schemas.customer, schemas));

        // Add generated customers to the pool with full data
        const customers: CustomerPoolData[] = (Array.isArray(data) ? data : [data]).map(customer => {
            // Ensure customerId is a number, not a string
            const customerId = typeof customer.customerId === 'number'
                ? customer.customerId
                : parseInt(customer.customerId, 10);

            if (isNaN(customerId)) {
                console.error('[CUSTOMER API] Invalid customerId generated:', customer.customerId, 'Type:', typeof customer.customerId);
                throw new Error(`Invalid customerId: ${customer.customerId}. Customer schema may be misconfigured.`);
            }

            // Determine country from nationality (set by locale-aware generation)
            const country: 'BD' | 'US' = customer.nationality === 'Bangladesh' ? 'BD' : 'US';

            return {
                customerId,
                customerNameEng: customer.customerNameEng,
                customerNameBen: customer.customerNameBen,
                dateOfBirth: customer.dob,
                nationality: customer.nationality,
                country,
            };
        });
        addCustomersToPool(customers);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error generating customer data:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
