import { NextRequest, NextResponse } from 'next/server';
import { getSchemas, generateDataFromSchema, addCustomersToPool, isCustomerIdPoolEmpty, getCustomerIdPoolSize, addAccountsToPool, CustomerPoolData, GenerationContext, getRandomCustomerFromPool } from '@/lib/schema-manager';
import { generateCustomerData, CustomerType, generateAccountData, AccountProductType } from '@/lib/generators';

const VALID_CUSTOMER_TYPES: CustomerType[] = ['INDIVIDUAL', 'CORPORATE', 'GOVERNMENT', 'NPO', 'JOINT'];
const VALID_ACCOUNT_TYPES: AccountProductType[] = ['SAVINGS', 'CURRENT', 'LOAN', 'CARD', 'MFS', 'DEPOSIT', 'CORPORATE_ACCOUNT', 'CAMPAIGN'];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { webhookUrl, token, dataType, amount, customData, customerType, accountType } = body;

        console.log('[WEBHOOK] Received request:', { webhookUrl, token, dataType, amount, hasCustomData: !!customData, customerType, accountType });

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

        if (!['customer', 'account', 'transaction', 'sanction', 'trade', 'credit'].includes(dataType)) {
            return NextResponse.json(
                { error: 'Invalid dataType. Must be customer, account, transaction, sanction, trade, or credit' },
                { status: 400 }
            );
        }

        // Log customer pool status
        console.log(`[WEBHOOK] Generating ${dataType}, Customer pool size:`, getCustomerIdPoolSize());

        // Generate data
        let data: any;

        if (customData !== undefined && customData !== null) {
            data = customData;
            console.log('[WEBHOOK] Using custom data provided by user');
        } else if (dataType === 'customer') {
            // Use dedicated customer profile generators
            const forceType = customerType && VALID_CUSTOMER_TYPES.includes(customerType.toUpperCase())
                ? customerType.toUpperCase() as CustomerType : undefined;
            const records = Array.from({ length: amountNum }, () => generateCustomerData(forceType));
            data = amountNum === 1 ? records[0] : records;
        } else if (dataType === 'account') {
            // Use dedicated account product generators
            if (isCustomerIdPoolEmpty()) {
                return NextResponse.json({ error: 'No customers available. Please generate customers first.' }, { status: 400 });
            }
            const forceAcct = accountType && VALID_ACCOUNT_TYPES.includes(accountType.toUpperCase())
                ? accountType.toUpperCase() as AccountProductType : undefined;
            const records = Array.from({ length: amountNum }, () => {
                const cust = getRandomCustomerFromPool();
                return generateAccountData(cust?.customerId ?? 100000, forceAcct);
            });
            data = amountNum === 1 ? records[0] : records;
        } else {
            // transaction, sanction, trade, credit — use schema-based generation
            if (['transaction', 'sanction'].includes(dataType) && isCustomerIdPoolEmpty()) {
                return NextResponse.json({ error: 'No customers available. Please generate customers first.' }, { status: 400 });
            }
            const schemas = getSchemas();
            const schema = schemas[dataType as keyof typeof schemas];
            if (!schema) {
                return NextResponse.json({ error: `No schema found for data type: ${dataType}` }, { status: 400 });
            }
            data = amountNum === 1
                ? generateDataFromSchema(schema, schemas, {})
                : Array.from({ length: amountNum }, () => generateDataFromSchema(schema, schemas, {}));
        }

        // If customers were generated, add them to the pool
        if (dataType === 'customer') {
            const records = Array.isArray(data) ? data : [data];
            const customers: CustomerPoolData[] = records.map(customer => {
                const customerId = typeof customer.customerId === 'number'
                    ? customer.customerId
                    : parseInt(customer.customerId, 10);

                if (isNaN(customerId)) {
                    console.error('[WEBHOOK] Invalid customerId:', customer.customerId);
                    throw new Error(`Invalid customerId: ${customer.customerId}`);
                }

                return {
                    customerId,
                    customerNameEng: customer.customerNameEng,
                    customerNameBen: customer.customerNameBen || '',
                    dateOfBirth: customer['individual.dob'] || '',
                    nationality: customer.nationality,
                };
            });
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

        console.log('full url:', fullUrl);

        // Send to webhook with retry logic
        const MAX_RETRIES = 3;
        const RETRY_DELAY_MS = 1000;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const startTime = Date.now();
                const webhookResponse = await fetch(fullUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(data),
                    signal: AbortSignal.timeout(30000), // 30s timeout
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
            } catch (fetchError: any) {
                lastError = fetchError;
                const causeMsg = fetchError?.cause?.message || fetchError?.cause?.code || '';
                console.error(`[WEBHOOK] Attempt ${attempt}/${MAX_RETRIES} failed:`, fetchError.message, causeMsg);

                if (attempt < MAX_RETRIES) {
                    console.log(`[WEBHOOK] Retrying in ${RETRY_DELAY_MS}ms...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
                }
            }
        }

        // All retries exhausted
        const causeCode = (lastError as any)?.cause?.code || '';
        const causeMessage = (lastError as any)?.cause?.message || '';
        let hint = '';
        if (causeCode === 'ECONNRESET' || causeCode === 'ECONNREFUSED') {
            hint = ` Hint: The target server at ${fullUrl} is not reachable (${causeCode}). Ensure it is running and accessible.`;
            if (fullUrl.includes('localhost')) {
                hint += ' If running inside Docker, use host.docker.internal instead of localhost.';
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to send webhook request after all retries',
                message: `${lastError?.message || 'Unknown error'}. Cause: ${causeMessage || causeCode || 'unknown'}.${hint}`,
                url: fullUrl,
            },
            { status: 502 }
        );

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
