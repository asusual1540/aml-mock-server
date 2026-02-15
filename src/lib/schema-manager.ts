import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker';

const CONFIG_DIR = path.join(process.cwd(), 'config');
const DEFAULT_SCHEMA_PATH = path.join(CONFIG_DIR, 'default-schemas.json');
const USER_SCHEMA_PATH = path.join(CONFIG_DIR, 'schemas.json');
const CUSTOMER_ID_POOL_PATH = path.join(CONFIG_DIR, 'customer-id-pool.json');
const ACCOUNT_ID_POOL_PATH = path.join(CONFIG_DIR, 'account-id-pool.json');

export interface CustomerPoolData {
    customerId: number;
    customerNameEng?: string;
    customerNameBen?: string;
    dateOfBirth?: string;
    nationality?: string;
}

// Customer pool for referencing in transactions and sanctions
let customerPool = new Map<number, CustomerPoolData>();

// Account ID pool for tracking generated accounts
let accountIdPool = new Set<string>();

// Load customer pool from file on startup
function loadCustomerIdPool(): void {
    try {
        if (fs.existsSync(CUSTOMER_ID_POOL_PATH)) {
            const data = fs.readFileSync(CUSTOMER_ID_POOL_PATH, 'utf-8');
            const poolArray: CustomerPoolData[] = JSON.parse(data);
            customerPool = new Map(poolArray.map(c => [c.customerId, c]));
            console.log(`Loaded ${customerPool.size} customers in pool`);
        }
    } catch (error) {
        console.error('Error loading customer pool:', error);
        customerPool = new Map<number, CustomerPoolData>();
    }
}

// Save customer pool to file
function saveCustomerIdPool(): void {
    try {
        const poolArray = Array.from(customerPool.values());
        fs.writeFileSync(CUSTOMER_ID_POOL_PATH, JSON.stringify(poolArray, null, 2));
    } catch (error) {
        console.error('Error saving customer pool:', error);
    }
}

// Load account pool from file on startup
function loadAccountIdPool(): void {
    try {
        if (fs.existsSync(ACCOUNT_ID_POOL_PATH)) {
            const data = fs.readFileSync(ACCOUNT_ID_POOL_PATH, 'utf-8');
            const poolArray: string[] = JSON.parse(data);
            accountIdPool = new Set(poolArray);
            console.log(`Loaded ${accountIdPool.size} accounts in pool`);
        }
    } catch (error) {
        console.error('Error loading account pool:', error);
        accountIdPool = new Set<string>();
    }
}

// Save account pool to file
function saveAccountIdPool(): void {
    try {
        const poolArray = Array.from(accountIdPool);
        fs.writeFileSync(ACCOUNT_ID_POOL_PATH, JSON.stringify(poolArray, null, 2));
    } catch (error) {
        console.error('Error saving account pool:', error);
    }
}

// Initialize pools on module load
loadCustomerIdPool();
loadAccountIdPool();

export interface FieldDefinition {
    name: string;
    type: string;
    options?: string[];
    itemType?: string;
    count?: number;
    schema?: string;
    minCount?: number;
    maxCount?: number;
}

export interface GenerationContext {
    customerId?: number | string;
    accountId?: string;
    accountNumber?: string;
}

export interface DataTypeSchema {
    fields: FieldDefinition[];
}

export interface Schemas {
    customer: DataTypeSchema;
    account: DataTypeSchema;
    transaction: DataTypeSchema;
    sanction: DataTypeSchema;
    // Nested schemas referenced by customer/account
    verificationScores?: DataTypeSchema;
    screeningInfo?: DataTypeSchema;
    transactionProfile?: DataTypeSchema;
    riskGrading?: DataTypeSchema;
    riskGradingScore?: DataTypeSchema;
    riskAssessment?: DataTypeSchema;
    branchRelatedInfo?: DataTypeSchema;
    introducer?: DataTypeSchema;
    otherBank?: DataTypeSchema;
    otherBankCard?: DataTypeSchema;
    otherInfo?: DataTypeSchema;
    nominee?: DataTypeSchema;
}

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Initialize user schema from default if it doesn't exist
if (!fs.existsSync(USER_SCHEMA_PATH)) {
    const defaultSchema = fs.readFileSync(DEFAULT_SCHEMA_PATH, 'utf-8');
    fs.writeFileSync(USER_SCHEMA_PATH, defaultSchema);
}

export function getSchemas(): Schemas {
    try {
        const data = fs.readFileSync(USER_SCHEMA_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading schemas:', error);
        // Fallback to default
        const data = fs.readFileSync(DEFAULT_SCHEMA_PATH, 'utf-8');
        return JSON.parse(data);
    }
}

export function saveSchemas(schemas: Schemas): void {
    fs.writeFileSync(USER_SCHEMA_PATH, JSON.stringify(schemas, null, 2));
}

export function resetToDefaults(): Schemas {
    const defaultSchema = fs.readFileSync(DEFAULT_SCHEMA_PATH, 'utf-8');
    fs.writeFileSync(USER_SCHEMA_PATH, defaultSchema);
    return JSON.parse(defaultSchema);
}

export function generateDataFromSchema(schema: DataTypeSchema, allSchemas?: Schemas, context?: GenerationContext): any {
    const result: any = {};
    const currentContext: GenerationContext = { ...context };

    for (const field of schema.fields) {
        try {
            result[field.name] = generateFieldValue(field, allSchemas, currentContext);
        } catch (error) {
            console.error(`Error generating field '${field.name}' of type '${field.type}':`, error);
            throw error; // Re-throw to prevent silent failures
        }

        // Update context as we generate fields so nested objects can use parent IDs
        if (field.name === 'customerId' && result.customerId) {
            currentContext.customerId = result.customerId;
        }
        if (field.name === 'accountNumber' && result.accountNumber) {
            currentContext.accountNumber = result.accountNumber;
            currentContext.accountId = result.accountNumber; // Use account number as ID
        }
        if (field.name === 'uuid' && result.uuid && !currentContext.accountId) {
            currentContext.accountId = result.uuid; // Use UUID as account ID if no account number yet
        }
    }

    return result;
}

// Helper function to generate a unique customer ID in the range 100000-999999
function generateCustomerId(): number {
    const customerId = faker.number.int({ min: 100000, max: 999999 });
    // Don't add to pool here - only add when customer is actually served
    return customerId;
}

// Helper function to add customer to the pool (called when customer is served)
export function addCustomerToPool(customer: CustomerPoolData): void {
    customerPool.set(customer.customerId, customer);
    saveCustomerIdPool();
}

// Helper function to add multiple customers to the pool
export function addCustomersToPool(customers: CustomerPoolData[]): void {
    customers.forEach(c => customerPool.set(c.customerId, c));
    saveCustomerIdPool();
}

// Helper function to add account ID to the pool (called when account is served)
export function addAccountToPool(accountId: string): void {
    accountIdPool.add(accountId);
    saveAccountIdPool();
}

// Helper function to add multiple account IDs to the pool
export function addAccountsToPool(accountIds: string[]): void {
    accountIds.forEach(id => accountIdPool.add(id));
    saveAccountIdPool();
}

// Helper function to get a random account ID from the pool
function getRandomAccountIdFromPool(): string {
    console.log('getRandomAccountIdFromPool called, pool size:', accountIdPool.size);
    if (accountIdPool.size === 0) {
        console.error('Account pool is empty!');
        throw new Error('No accounts available. Please generate accounts first.');
    }
    const poolArray = Array.from(accountIdPool);
    console.log('Account pool IDs (first 3):', poolArray.slice(0, 3));
    const selectedId = faker.helpers.arrayElement(poolArray);
    console.log('Selected account ID from pool:', selectedId);
    return selectedId;
}

// Helper function to check if account pool is empty
export function isAccountIdPoolEmpty(): boolean {
    return accountIdPool.size === 0;
}

// Export function to get account pool size (for debugging)
export function getAccountIdPoolSize(): number {
    return accountIdPool.size;
}

// Helper function to get a random customer ID from the pool
function getRandomCustomerIdFromPool(): number {
    console.log('getRandomCustomerIdFromPool called, pool size:', customerPool.size);
    if (customerPool.size === 0) {
        console.error('Customer pool is empty!');
        throw new Error('No customers available. Please generate customers first.');
    }
    const poolArray = Array.from(customerPool.keys());
    console.log('Pool keys (first 5):', poolArray.slice(0, 5));
    const selectedId = faker.helpers.arrayElement(poolArray);
    console.log('Selected customer ID from pool:', selectedId, 'Type:', typeof selectedId);
    return selectedId;
}

// Helper function to get a random customer from pool
function getRandomCustomerFromPool(): CustomerPoolData | null {
    if (customerPool.size === 0) {
        return null;
    }
    const poolArray = Array.from(customerPool.values());
    return faker.helpers.arrayElement(poolArray);
}

// Helper functions for fuzzy matching
function applyFuzzyName(name: string): string {
    const operations = [
        () => name.replace(/[aeiou]/i, () => faker.helpers.arrayElement(['a', 'e', 'i', 'o', 'u'])), // Random vowel swap
        () => name.replace(/(.)(.)/, '$2$1'), // Transpose first two chars
        () => name.slice(0, -1) + faker.helpers.arrayElement(['a', 'h', 'n', 'e']), // Change last char
        () => name.replace(/ /g, ''), // Remove spaces
    ];
    return faker.helpers.arrayElement(operations)();
}

function applyPartialDob(dob: string): string {
    const date = new Date(dob);
    const yearsOffset = faker.number.int({ min: -2, max: 2 });
    date.setFullYear(date.getFullYear() + yearsOffset);
    return date.toISOString().split('T')[0];
}

// Get customer name from pool with matching strategy (exact/partial/fuzzy)
function getCustomerNameFromPool(): string {
    const customer = getRandomCustomerFromPool();
    if (!customer || !customer.customerNameEng) {
        return faker.person.fullName();
    }

    const matchType = faker.number.int({ min: 1, max: 10 });
    if (matchType <= 3) {
        // 30% exact match
        return customer.customerNameEng;
    } else if (matchType <= 6) {
        // 30% partial match (keep same)
        return customer.customerNameEng;
    } else {
        // 40% fuzzy match
        return applyFuzzyName(customer.customerNameEng);
    }
}

// Get customer DOB from pool with matching strategy
function getCustomerDobFromPool(): string {
    const customer = getRandomCustomerFromPool();
    if (!customer || !customer.dateOfBirth) {
        return faker.date.past().toISOString().split('T')[0];
    }

    const matchType = faker.number.int({ min: 1, max: 10 });
    if (matchType <= 3) {
        // 30% exact match
        return customer.dateOfBirth;
    } else if (matchType <= 6) {
        // 30% partial match (different year)
        return applyPartialDob(customer.dateOfBirth);
    } else {
        // 40% completely different
        return faker.date.past().toISOString().split('T')[0];
    }
}

// Get customer nationality from pool
function getCustomerNationalityFromPool(): string {
    const customer = getRandomCustomerFromPool();
    if (!customer || !customer.nationality) {
        return faker.location.country();
    }

    const matchType = faker.number.int({ min: 1, max: 10 });
    if (matchType <= 6) {
        // 60% match
        return customer.nationality;
    } else {
        // 40% different
        return faker.location.country();
    }
}

// Check if customer pool is empty
export function isCustomerIdPoolEmpty(): boolean {
    return customerPool.size === 0;
}

// Export function to get customer pool size (for debugging)
export function getCustomerIdPoolSize(): number {
    return customerPool.size;
}

// Export function to clear customer pool (for testing)
export function clearCustomerIdPool(): void {
    customerPool.clear();
}

// Helper function to generate account ID
function generateAccountId(): string {
    return faker.string.alphanumeric(10).toUpperCase();
}

function generateFieldValue(field: FieldDefinition, allSchemas?: Schemas, context?: GenerationContext): any {
    // Debug logging for customerId field
    if (field.name === 'customerId') {
        console.log('Generating customerId field:', { type: field.type, name: field.name, hasContext: !!context?.customerId });
    }

    switch (field.type) {
        case 'customerId':
            return generateCustomerId();
        case 'customerIdRef':
            // Use context customerId if available, otherwise get from pool
            if (context?.customerId) {
                return context.customerId;
            }
            try {
                return getRandomCustomerIdFromPool();
            } catch (error) {
                console.error('Error getting customer from pool for customerIdRef:', error);
                throw error; // Re-throw so it's visible
            }
        case 'accountIdRef':
            // Use context accountId if available, otherwise get from pool
            if (context?.accountId) {
                return context.accountId;
            }
            try {
                return getRandomAccountIdFromPool();
            } catch (error) {
                console.error('Error getting account from pool for accountIdRef:', error);
                throw error; // Re-throw so it's visible
            }
        case 'customerNameFromPool':
            return getCustomerNameFromPool();
        case 'customerDobFromPool':
            return getCustomerDobFromPool();
        case 'customerNationalityFromPool':
            return getCustomerNationalityFromPool();
        case 'uuid':
            return faker.string.uuid();
        case 'string':
            return faker.lorem.word();
        case 'number':
            return faker.number.int({ min: 1, max: 1000 });
        case 'boolean':
            return faker.datatype.boolean();
        case 'email':
            return faker.internet.email();
        case 'phone':
            return faker.phone.number();
        case 'date':
            return faker.date.past().toISOString().split('T')[0];
        case 'datetime':
            return faker.date.recent().toISOString();
        case 'dateOrNull':
            return faker.datatype.boolean() ? faker.date.recent().toISOString().split('T')[0] : null;
        case 'address':
            return faker.location.streetAddress();
        case 'streetAddress':
            return faker.location.streetAddress();
        case 'city':
            return faker.location.city();
        case 'country':
            return faker.location.country();
        case 'countryCode':
            return faker.location.countryCode('alpha-2');
        case 'currency':
            return faker.finance.amount();
        case 'currencyCode':
            return faker.finance.currencyCode();
        case 'firstName':
            return faker.person.firstName();
        case 'lastName':
            return faker.person.lastName();
        case 'fullName':
            return faker.person.fullName();
        case 'companyName':
            return faker.company.name();
        case 'sentence':
            return faker.lorem.sentence();
        case 'paragraph':
            return faker.lorem.paragraph();
        case 'url':
            return faker.internet.url();
        case 'numericId':
            return faker.number.int({ min: 10000000, max: 99999999 }).toString();
        case 'riskScore':
            return faker.number.int({ min: 0, max: 100 });
        case 'exchangeRate':
            return parseFloat(faker.finance.amount({ min: 0.5, max: 2.0, dec: 4 }));
        case 'accountNumber':
            return faker.finance.accountNumber();
        case 'word':
            return faker.lorem.word();
        case 'jobTitle':
            return faker.person.jobTitle();
        case 'select':
            if (field.options && field.options.length > 0) {
                return faker.helpers.arrayElement(field.options);
            }
            return null;
        case 'array':
            if (field.itemType && field.count) {
                return Array.from({ length: field.count }, () =>
                    generateFieldValue({ name: '', type: field.itemType! }, allSchemas, context)
                );
            }
            return [];
        case 'arrayOfStrings':
            const stringCount = field.count || 3;
            return Array.from({ length: stringCount }, () => faker.lorem.word());
        case 'arrayOfCountries':
            const countryCount = field.count || 2;
            return Array.from({ length: countryCount }, () => faker.location.country());
        case 'arrayOfCountryCodes':
            const codeCount = field.count || 2;
            return Array.from({ length: codeCount }, () => faker.location.countryCode('alpha-2'));
        case 'arrayOfNames':
            const nameCount = field.count || 3;
            return Array.from({ length: nameCount }, () => faker.person.fullName());
        case 'nestedObject':
            // Generate a nested object from a schema
            if (field.schema && allSchemas) {
                const nestedSchema = (allSchemas as any)[field.schema];
                if (nestedSchema) {
                    return generateDataFromSchema(nestedSchema, allSchemas, context);
                }
            }
            return {};
        case 'nestedArray':
            // Generate an array of nested objects from a schema
            if (field.schema && allSchemas) {
                const nestedSchema = (allSchemas as any)[field.schema];
                if (nestedSchema) {
                    const minCount = field.minCount || 1;
                    const maxCount = field.maxCount || 3;
                    const count = faker.number.int({ min: minCount, max: maxCount });
                    return Array.from({ length: count }, () =>
                        generateDataFromSchema(nestedSchema, allSchemas, context)
                    );
                }
            }
            return [];
        default:
            // Debug logging for unrecognized types
            if (field.name === 'customerId') {
                console.error('customerId field fell through to default case! Type:', field.type);
            }
            return faker.lorem.word();
    }
}

// Available field types for the UI
export const AVAILABLE_FIELD_TYPES = [
    'customerId',
    'customerIdRef',
    'customerNameFromPool',
    'customerDobFromPool',
    'customerNationalityFromPool',
    'uuid',
    'string',
    'number',
    'boolean',
    'email',
    'phone',
    'date',
    'datetime',
    'dateOrNull',
    'address',
    'streetAddress',
    'city',
    'country',
    'countryCode',
    'currency',
    'currencyCode',
    'firstName',
    'lastName',
    'fullName',
    'companyName',
    'sentence',
    'paragraph',
    'url',
    'numericId',
    'riskScore',
    'exchangeRate',
    'accountNumber',
    'word',
    'jobTitle',
    'select',
    'array',
    'arrayOfStrings',
    'arrayOfCountries',
    'arrayOfCountryCodes',
    'arrayOfNames',
];
