import { NextRequest, NextResponse } from 'next/server';
import { getSchemas, generateDataFromSchema, addCustomersToPool, isCustomerIdPoolEmpty, getCustomerIdPoolSize, addAccountsToPool, CustomerPoolData } from '@/lib/schema-manager';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { webhookUrl, token, dataType, amount } = body;

        // Validation
        if (!webhookUrl || !token || !dataType) {
            return NextResponse.json(
                { error: 'Missing required fields: webhookUrl, token, or dataType' },
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

        if (!['customer', 'account', 'transaction', 'sanction', 'trade'].includes(dataType)) {
            return NextResponse.json(
                { error: 'Invalid dataType. Must be customer, account, transaction, sanction, or trade' },
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

        // Log customer pool status
        console.log(`[WEBHOOK] Generating ${dataType}, Customer pool size:`, getCustomerIdPoolSize());

        // Generate data
        const schemas = getSchemas();

        // Debug logging for account generation
        if (dataType === 'account') {
            const accountFields = schemas.account.fields.map(f => `${f.name}:${f.type}`);
            console.log('[WEBHOOK] Account schema fields:', accountFields);
            const customerIdField = schemas.account.fields.find(f => f.name === 'customerId');
            console.log('[WEBHOOK] customerId field config:', customerIdField);
        }

        const schema = schemas[dataType as keyof typeof schemas];
        if (!schema) {
            return NextResponse.json({ error: `No schema found for data type: ${dataType}` }, { status: 400 });
        }

        const data = amountNum === 1
            ? generateDataFromSchema(schema, schemas)
            : Array.from({ length: amountNum }, () =>
                generateDataFromSchema(schema, schemas)
            );

        // Debug: Log generated data structure
        if (dataType === 'account') {
            const firstRecord = Array.isArray(data) ? data[0] : data;
            console.log('[WEBHOOK] Generated account data has customerId:', 'customerId' in firstRecord, 'value:', firstRecord.customerId);
        }

        // If customers were generated, add them to the pool with full data
        if (dataType === 'customer') {
            const customers: CustomerPoolData[] = (Array.isArray(data) ? data : [data]).map(customer => {
                // Ensure customerId is a number, not a string
                const customerId = typeof customer.customerId === 'number'
                    ? customer.customerId
                    : parseInt(customer.customerId, 10);

                if (isNaN(customerId)) {
                    console.error('[WEBHOOK] Invalid customerId generated:', customer.customerId, 'Type:', typeof customer.customerId);
                    throw new Error(`Invalid customerId: ${customer.customerId}. Customer schema may be misconfigured.`);
                }

                return {
                    customerId,
                    customerNameEng: customer.customerNameEng,
                    customerNameBen: customer.customerNameBen,
                    dateOfBirth: customer.dob,
                    nationality: customer.nationality,
                };
            });
            console.log('[WEBHOOK] Adding customers to pool:', customers.map(c => ({ id: c.customerId, type: typeof c.customerId })));
            addCustomersToPool(customers);
            console.log('[WEBHOOK] Customer pool size after adding:', getCustomerIdPoolSize());
        }

        // If accounts were generated, add them to the pool
        if (dataType === 'account') {
            const accounts = Array.isArray(data) ? data : [data];
            const accountIds = accounts
                .map(acc => acc.uniqueAccountNumber)
                .filter((id): id is string => typeof id === 'string' && id.length > 0);

            if (accountIds.length > 0) {
                addAccountsToPool(accountIds);
                console.log('[WEBHOOK] Added accounts to pool:', accountIds.length);
            }
        }

        // Construct full URL
        const baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:9000';
        const fullUrl = `${baseUrl}${webhookUrl}`;

        // Send to webhook
        const startTime = Date.now();
        const webhookResponse = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        const responseData = await webhookResponse.text();
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(responseData);
        } catch {
            parsedResponse = responseData;
        }

        return NextResponse.json({
            success: webhookResponse.ok,
            statusCode: webhookResponse.status,
            statusText: webhookResponse.statusText,
            responseTime,
            response: parsedResponse,
            message: webhookResponse.ok
                ? `Successfully sent ${amountNum} ${dataType} record(s) to webhook`
                : `Webhook request failed with status ${webhookResponse.status}`,
        });

    } catch (error: any) {
        console.error('Webhook call error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to send webhook request',
                message: error.message
            },
            { status: 500 }
        );
    }
}
