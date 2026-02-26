import { NextRequest, NextResponse } from 'next/server';
import { getSchemas, generateDataFromSchema, isCustomerIdPoolEmpty, getRandomCustomerFromPool } from '@/lib/schema-manager';
import { generateCustomerData, CustomerType, generateAccountData, AccountProductType } from '@/lib/generators';

const VALID_CUSTOMER_TYPES: CustomerType[] = ['INDIVIDUAL', 'CORPORATE', 'GOVERNMENT', 'NPO', 'JOINT'];
const VALID_ACCOUNT_TYPES: AccountProductType[] = ['SAVINGS', 'CURRENT', 'LOAN', 'CARD', 'MFS', 'DEPOSIT', 'CORPORATE_ACCOUNT', 'CAMPAIGN'];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { dataType, amount, customerType, accountType } = body;

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

        let data: any;

        if (dataType === 'customer') {
            const forceType = customerType && VALID_CUSTOMER_TYPES.includes(customerType.toUpperCase())
                ? customerType.toUpperCase() as CustomerType : undefined;
            const records = Array.from({ length: amountNum }, () => generateCustomerData(forceType));
            data = amountNum === 1 ? records[0] : records;
        } else if (dataType === 'account') {
            if (isCustomerIdPoolEmpty()) {
                return NextResponse.json(
                    { error: 'No customers available. Please generate customers first.' },
                    { status: 400 }
                );
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
            if (['transaction', 'account', 'sanction'].includes(dataType) && isCustomerIdPoolEmpty()) {
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
            data = amountNum === 1
                ? generateDataFromSchema(schema, schemas, {})
                : Array.from({ length: amountNum }, () => generateDataFromSchema(schema, schemas, {}));
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Preview generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate preview data', message: error.message },
            { status: 500 }
        );
    }
}
