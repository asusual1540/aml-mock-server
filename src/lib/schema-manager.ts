import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker';

// ═══════════════════════════════════════════════════════════════════
// Bangladeshi (BD) & US locale data for 70/30 customer split
// ═══════════════════════════════════════════════════════════════════

const BD_MALE_FIRST_NAMES = [
    'Mohammed', 'Abdul', 'Md', 'Sheikh', 'Rafiqul', 'Kamal', 'Jamal', 'Hasan', 'Hussain',
    'Rahim', 'Rashid', 'Tariq', 'Zaman', 'Faruk', 'Salam', 'Habib', 'Nasir', 'Kabir',
    'Murad', 'Ashraf', 'Iqbal', 'Monir', 'Shahid', 'Delwar', 'Masud', 'Nurul', 'Aminul',
    'Shafiq', 'Mahfuz', 'Anis', 'Sumon', 'Shakil', 'Tanvir', 'Parvez', 'Zahid', 'Kamrul',
    'Mizanur', 'Saiful', 'Jahangir', 'Khaled', 'Imran', 'Rashed', 'Sajjad', 'Arif',
    'Mominul', 'Tawhid', 'Jubayer', 'Nayeem', 'Fahim', 'Mushfiq',
];
const BD_FEMALE_FIRST_NAMES = [
    'Fatima', 'Aisha', 'Khadija', 'Nasima', 'Rahima', 'Sultana', 'Hasina', 'Shamima',
    'Taslima', 'Momena', 'Rabeya', 'Salma', 'Nargis', 'Jahanara', 'Ruksana', 'Parveen',
    'Shirin', 'Shahnaz', 'Rokeya', 'Rina', 'Lima', 'Tania', 'Nusrat', 'Farzana',
    'Rehana', 'Rozina', 'Moushumi', 'Laila', 'Jesmin', 'Shapla', 'Nahar', 'Monira',
    'Amina', 'Sadia', 'Jannatul', 'Shanta', 'Ruma', 'Sumaya', 'Tasnim', 'Maliha',
];
const BD_LAST_NAMES = [
    'Rahman', 'Islam', 'Hossain', 'Ahmed', 'Khatun', 'Begum', 'Akter', 'Khan', 'Uddin',
    'Ali', 'Miah', 'Chowdhury', 'Siddique', 'Hassan', 'Karim', 'Sheikh', 'Talukder',
    'Sarker', 'Alam', 'Haque', 'Bhuiyan', 'Sultana', 'Mahmud', 'Jahan', 'Khandaker',
    'Das', 'Roy', 'Barua', 'Mondal', 'Bhattacharjee',
];

// Bengali script names
const BD_MALE_FIRST_NAMES_BEN = [
    'মোহাম্মদ', 'আব্দুল', 'শেখ', 'রফিকুল', 'কামাল', 'জামাল', 'হাসান', 'হোসাইন',
    'রহিম', 'রশিদ', 'তারিক', 'ফারুক', 'সালাম', 'হাবিব', 'নাসির', 'কবির',
    'মুরাদ', 'আশরাফ', 'ইকবাল', 'মনির', 'শাহিদ', 'দেলোয়ার', 'মাসুদ', 'নুরুল',
    'আমিনুল', 'শফিক', 'মাহফুজ', 'আনিস', 'সুমন', 'শাকিল', 'তানভীর', 'পারভেজ',
    'জাহিদ', 'কামরুল', 'মিজানুর', 'সাইফুল', 'জাহাঙ্গীর', 'খালেদ', 'ইমরান', 'রাশেদ',
];
const BD_FEMALE_FIRST_NAMES_BEN = [
    'ফাতিমা', 'আয়েশা', 'খাদিজা', 'নাসিমা', 'রহিমা', 'সুলতানা', 'হাসিনা', 'শামীমা',
    'তাসলিমা', 'মোমেনা', 'রাবেয়া', 'সালমা', 'নার্গিস', 'জাহানারা', 'রুকসানা',
    'পারভীন', 'শিরিন', 'শাহনাজ', 'রোকেয়া', 'রিনা', 'তানিয়া', 'নুসরাত', 'ফারজানা',
    'রেহানা', 'রোজিনা', 'লাইলা', 'জেসমিন', 'শাপলা', 'নাহার', 'মনিরা', 'আমিনা',
    'সাদিয়া', 'জান্নাতুল', 'শান্তা', 'রুমা', 'সুমাইয়া', 'তাসনিম', 'মালিহা',
];
const BD_LAST_NAMES_BEN = [
    'রহমান', 'ইসলাম', 'হোসাইন', 'আহমেদ', 'খাতুন', 'বেগম', 'আক্তার', 'খান',
    'উদ্দিন', 'আলী', 'মিয়া', 'চৌধুরী', 'সিদ্দিকী', 'হাসান', 'করিম', 'শেখ',
    'তালুকদার', 'সরকার', 'আলম', 'হক', 'ভুইয়া', 'সুলতানা', 'মাহমুদ', 'জাহান', 'খন্দকার',
];

const BD_CITIES = [
    'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Sylhet', 'Rangpur', 'Barisal',
    'Comilla', 'Gazipur', 'Narayanganj', 'Mymensingh', 'Bogra', "Cox's Bazar",
    'Jessore', 'Dinajpur', 'Tangail', 'Brahmanbaria', 'Narsingdi', 'Savar', 'Tongi',
];
const BD_CITIES_BEN = [
    'ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'সিলেট', 'রংপুর', 'বরিশাল',
    'কুমিল্লা', 'গাজীপুর', 'নারায়ণগঞ্জ', 'ময়মনসিংহ', 'বগুড়া', 'কক্সবাজার',
    'যশোর', 'দিনাজপুর', 'টাঙ্গাইল', 'ব্রাহ্মণবাড়িয়া', 'নরসিংদী', 'সাভার', 'টঙ্গী',
];
const BD_AREAS = [
    'Dhanmondi', 'Gulshan', 'Banani', 'Uttara', 'Mirpur', 'Mohammadpur', 'Motijheel',
    'Panthapath', 'Farmgate', 'Kakrail', 'Wari', 'Lalbagh', 'Tejgaon', 'Badda',
    'Rampura', 'Khilgaon', 'Basundhara', 'Nikunja', 'Baridhara', 'Shantinagar',
];
const BD_AREAS_BEN = [
    'ধানমন্ডি', 'গুলশান', 'বনানী', 'উত্তরা', 'মিরপুর', 'মোহাম্মদপুর', 'মতিঝিল',
    'পান্থপথ', 'ফার্মগেট', 'কাকরাইল', 'ওয়ারী', 'লালবাগ', 'তেজগাঁও', 'বাড্ডা',
    'রামপুরা', 'খিলগাঁও', 'বসুন্ধরা', 'নিকুঞ্জ', 'বারিধারা', 'শান্তিনগর',
];

const BD_BANK_NAMES = [
    'Sonali Bank', 'Janata Bank', 'Agrani Bank', 'Rupali Bank', 'Bangladesh Krishi Bank',
    'Pubali Bank', 'Uttara Bank', 'National Bank', 'The City Bank', 'IFIC Bank',
    'United Commercial Bank', 'Eastern Bank', 'BRAC Bank', 'Dutch-Bangla Bank',
    'Prime Bank', 'Southeast Bank', 'Dhaka Bank', 'Islami Bank Bangladesh',
    'AB Bank', 'NCC Bank', 'One Bank', 'Bank Asia', 'Trust Bank',
    'Shahjalal Islami Bank', 'Exim Bank', 'Jamuna Bank', 'Standard Bank',
    'Mercantile Bank', 'Mutual Trust Bank', 'First Security Islami Bank',
];
const US_BANK_NAMES = [
    'JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'U.S. Bancorp',
    'Truist Financial', 'TD Bank', 'PNC Financial', 'Capital One', 'Goldman Sachs',
    'Morgan Stanley', 'Fifth Third Bank', 'Citizens Bank', 'KeyBank', 'Regions Bank',
    'M&T Bank', 'Huntington Bank', 'Ally Financial', 'Synchrony Financial', 'Discover Financial',
];

// ═══════════════════════════════════════════════════════════════════
// Locale-aware generation helpers
// ═══════════════════════════════════════════════════════════════════

function determineCountry(): 'BD' | 'US' {
    return Math.random() < 0.7 ? 'BD' : 'US';
}

function generateBDFullName(): string {
    const isMale = Math.random() > 0.5;
    const firstName = faker.helpers.arrayElement(isMale ? BD_MALE_FIRST_NAMES : BD_FEMALE_FIRST_NAMES);
    const lastName = faker.helpers.arrayElement(BD_LAST_NAMES);
    return `${firstName} ${lastName}`;
}

function generateBDFullNameBen(): string {
    const isMale = Math.random() > 0.5;
    const firstName = faker.helpers.arrayElement(isMale ? BD_MALE_FIRST_NAMES_BEN : BD_FEMALE_FIRST_NAMES_BEN);
    const lastName = faker.helpers.arrayElement(BD_LAST_NAMES_BEN);
    return `${firstName} ${lastName}`;
}

function generateBDAddress(): string {
    const houseNo = faker.number.int({ min: 1, max: 200 });
    const roadNo = faker.number.int({ min: 1, max: 50 });
    const area = faker.helpers.arrayElement(BD_AREAS);
    const city = faker.helpers.arrayElement(BD_CITIES);
    const postal = faker.number.int({ min: 1000, max: 9999 });
    return `House #${houseNo}, Road #${roadNo}, ${area}, ${city} ${postal}`;
}

function generateBDAddressBen(): string {
    const houseNo = faker.number.int({ min: 1, max: 200 });
    const roadNo = faker.number.int({ min: 1, max: 50 });
    const area = faker.helpers.arrayElement(BD_AREAS_BEN);
    const city = faker.helpers.arrayElement(BD_CITIES_BEN);
    const postal = faker.number.int({ min: 1000, max: 9999 });
    return `বাড়ি #${houseNo}, রাস্তা #${roadNo}, ${area}, ${city} ${postal}`;
}

function generateBDPhone(): string {
    const prefix = faker.helpers.arrayElement(['013', '014', '015', '016', '017', '018', '019']);
    const number = faker.string.numeric(8);
    return `+880${prefix}${number}`;
}

function generateLocaleFullName(country?: 'BD' | 'US', fieldName?: string): string {
    if (country === 'BD') {
        if (fieldName && fieldName.toLowerCase().endsWith('ben')) {
            return generateBDFullNameBen();
        }
        return generateBDFullName();
    }
    // US or default
    return faker.person.fullName();
}

function generateLocaleFirstName(country?: 'BD' | 'US'): string {
    if (country === 'BD') {
        const isMale = Math.random() > 0.5;
        return faker.helpers.arrayElement(isMale ? BD_MALE_FIRST_NAMES : BD_FEMALE_FIRST_NAMES);
    }
    return faker.person.firstName();
}

function generateLocaleLastName(country?: 'BD' | 'US'): string {
    if (country === 'BD') return faker.helpers.arrayElement(BD_LAST_NAMES);
    return faker.person.lastName();
}

function generateLocaleAddress(country?: 'BD' | 'US', fieldName?: string): string {
    if (country === 'BD') {
        if (fieldName && fieldName.toLowerCase().endsWith('ben')) {
            return generateBDAddressBen();
        }
        return generateBDAddress();
    }
    return faker.location.streetAddress();
}

function generateLocaleCity(country?: 'BD' | 'US'): string {
    if (country === 'BD') return faker.helpers.arrayElement(BD_CITIES);
    return faker.location.city();
}

function generateLocaleCountry(country?: 'BD' | 'US'): string {
    if (country === 'BD') return 'Bangladesh';
    if (country === 'US') return 'United States';
    return faker.location.country();
}

function generateLocaleCountryCode(country?: 'BD' | 'US'): string {
    if (country === 'BD') return 'BD';
    if (country === 'US') return 'US';
    return faker.location.countryCode('alpha-2');
}

function generateLocalePhone(country?: 'BD' | 'US'): string {
    if (country === 'BD') return generateBDPhone();
    return faker.phone.number();
}

function generateLocaleBankName(country?: 'BD' | 'US'): string {
    if (country === 'BD') return faker.helpers.arrayElement(BD_BANK_NAMES);
    if (country === 'US') return faker.helpers.arrayElement(US_BANK_NAMES);
    return faker.helpers.arrayElement([...BD_BANK_NAMES, ...US_BANK_NAMES]);
}

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
    country?: 'BD' | 'US';
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
    country?: 'BD' | 'US';
    selectedCustomer?: CustomerPoolData;
}

export interface DataTypeSchema {
    fields: FieldDefinition[];
}

export interface Schemas {
    customer: DataTypeSchema;
    account: DataTypeSchema;
    transaction: DataTypeSchema;
    sanction: DataTypeSchema;
    trade: DataTypeSchema;
    credit: DataTypeSchema;
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
    // Nested schemas referenced by trade
    tradeAmendment?: DataTypeSchema;
    tradeInvoice?: DataTypeSchema;
    tradeShipment?: DataTypeSchema;
    tradeParty?: DataTypeSchema;
    tradeDocument?: DataTypeSchema;
    // Nested schemas referenced by credit
    loanRepayment?: DataTypeSchema;
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

    // Auto-determine country for new customer records (70% BD, 30% US)
    if (!currentContext.country) {
        const isNewCustomer = schema.fields.some(f => f.type === 'customerId');
        if (isNewCustomer) {
            currentContext.country = determineCountry();
        }
    }

    // Pre-select customer for schemas that use pool data (e.g. sanction)
    if (!currentContext.country && !currentContext.customerId) {
        const usesPoolData = schema.fields.some(f =>
            ['customerNameFromPool', 'customerDobFromPool', 'customerNationalityFromPool'].includes(f.type)
        );
        if (usesPoolData && customerPool.size > 0) {
            const customer = getRandomCustomerFromPool();
            if (customer) {
                currentContext.selectedCustomer = customer;
                currentContext.country = customer.country;
            }
        }
    }

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
            // If this is a customerIdRef, look up the customer's country from pool
            if (field.type === 'customerIdRef') {
                const poolCustomer = customerPool.get(result.customerId);
                if (poolCustomer?.country) {
                    currentContext.country = poolCustomer.country;
                }
            }
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

/**
 * Generate an array of integer percentages (1–100) that sum to exactly 100.
 * Each value is returned as a string, e.g. ["50", "30", "20"].
 */
function generateSharePercentages(count: number): string[] {
    if (count === 1) return ['100'];
    // Generate (count - 1) random cut points in [1, 99], then derive segments
    const cuts: number[] = [];
    const usedCuts = new Set<number>();
    while (cuts.length < count - 1) {
        const cut = faker.number.int({ min: 1, max: 99 });
        if (!usedCuts.has(cut)) {
            usedCuts.add(cut);
            cuts.push(cut);
        }
    }
    cuts.sort((a, b) => a - b);
    const percentages: number[] = [];
    let prev = 0;
    for (const cut of cuts) {
        percentages.push(cut - prev);
        prev = cut;
    }
    percentages.push(100 - prev);
    return percentages.map(p => String(p));
}

function applyPartialDob(dob: string): string {
    const date = new Date(dob);
    const yearsOffset = faker.number.int({ min: -2, max: 2 });
    date.setFullYear(date.getFullYear() + yearsOffset);
    return date.toISOString().split('T')[0];
}

// Get customer name from pool with matching strategy (exact/partial/fuzzy)
function getCustomerNameFromPool(selectedCustomer?: CustomerPoolData | null): string {
    const customer = selectedCustomer || getRandomCustomerFromPool();
    if (!customer || !customer.customerNameEng) {
        return generateBDFullName(); // fallback to BD name since 70% are BD
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
function getCustomerDobFromPool(selectedCustomer?: CustomerPoolData | null): string {
    const customer = selectedCustomer || getRandomCustomerFromPool();
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
function getCustomerNationalityFromPool(selectedCustomer?: CustomerPoolData | null, country?: 'BD' | 'US'): string {
    const customer = selectedCustomer || getRandomCustomerFromPool();
    if (!customer || !customer.nationality) {
        return generateLocaleCountry(country);
    }

    const matchType = faker.number.int({ min: 1, max: 10 });
    if (matchType <= 6) {
        // 60% match
        return customer.nationality;
    } else {
        // 40% different
        return generateLocaleCountry(country);
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
            return getCustomerNameFromPool(context?.selectedCustomer);
        case 'customerDobFromPool':
            return getCustomerDobFromPool(context?.selectedCustomer);
        case 'customerNationalityFromPool':
            return getCustomerNationalityFromPool(context?.selectedCustomer, context?.country);
        case 'uuid':
            return faker.string.uuid();
        case 'string':
            return faker.lorem.word();
        case 'number':
            return faker.number.int({ min: 1, max: 1000 });
        case 'boolean':
            return faker.datatype.boolean();
        case 'email':
            return faker.internet.email().replace(/[^a-zA-Z0-9@.]/g, '').toLowerCase();
        case 'phone':
            return generateLocalePhone(context?.country);
        case 'date':
            return faker.date.past().toISOString().split('T')[0];
        case 'datetime':
            return faker.date.recent().toISOString();
        case 'dateOrNull':
            return faker.datatype.boolean() ? faker.date.recent().toISOString().split('T')[0] : null;
        case 'address':
            return generateLocaleAddress(context?.country, field.name);
        case 'streetAddress':
            return generateLocaleAddress(context?.country, field.name);
        case 'city':
            return generateLocaleCity(context?.country);
        case 'country':
            return generateLocaleCountry(context?.country);
        case 'countryCode':
            return generateLocaleCountryCode(context?.country);
        case 'currency':
            return faker.finance.amount();
        case 'currencyCode':
            return faker.finance.currencyCode();
        case 'firstName':
            return generateLocaleFirstName(context?.country);
        case 'lastName':
            return generateLocaleLastName(context?.country);
        case 'fullName':
            return generateLocaleFullName(context?.country, field.name);
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
        case 'lcNumber':
            return 'LC' + new Date().getFullYear() + faker.string.numeric(8);
        case 'swiftReference':
            return 'MT700' + faker.string.numeric(10);
        case 'swiftCode':
            return faker.string.alpha({ length: 4, casing: 'upper' }) +
                faker.location.countryCode('alpha-2') +
                faker.string.alphanumeric({ length: 2, casing: 'upper' }) +
                faker.string.alphanumeric({ length: 3, casing: 'upper' });
        case 'tradeAmount':
            return parseFloat(faker.finance.amount({ min: 1000, max: 5000000, dec: 2 }));
        case 'percentage':
            return faker.number.float({ min: 0, max: 100, fractionDigits: 2 });
        case 'hsCode': {
            const hsCodes = ['8471.30', '6204.62', '8703.23', '2710.19', '8517.12', '8542.31', '0901.11', '5208.12', '7108.12', '3004.90'];
            return faker.helpers.arrayElement(hsCodes);
        }
        case 'port': {
            const ports = ['Shanghai', 'Singapore', 'Rotterdam', 'Antwerp', 'Hamburg', 'Los Angeles', 'Chittagong', 'Dubai', 'Hong Kong', 'Busan', 'Mumbai', 'Colombo', 'Felixstowe', 'Jeddah', 'Yokohama'];
            return faker.helpers.arrayElement(ports);
        }
        case 'bankName':
            return generateLocaleBankName(context?.country);
        case 'futureDate':
            return faker.date.future({ years: 1 }).toISOString().split('T')[0];
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
            if (context?.country) {
                const mainCountry = generateLocaleCountry(context.country);
                const others = Array.from({ length: countryCount - 1 }, () => faker.location.country());
                return [mainCountry, ...others];
            }
            return Array.from({ length: countryCount }, () => faker.location.country());
        case 'arrayOfCountryCodes':
            const codeCount = field.count || 2;
            if (context?.country) {
                const mainCode = generateLocaleCountryCode(context.country);
                const otherCodes = Array.from({ length: codeCount - 1 }, () => faker.location.countryCode('alpha-2'));
                return [mainCode, ...otherCodes];
            }
            return Array.from({ length: codeCount }, () => faker.location.countryCode('alpha-2'));
        case 'arrayOfNames':
            const nameCount = field.count || 3;
            return Array.from({ length: nameCount }, () => generateLocaleFullName(context?.country));
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
                    const items = Array.from({ length: count }, () =>
                        generateDataFromSchema(nestedSchema, allSchemas, context)
                    );
                    // Ensure nominee share percentages sum to 100
                    if (field.schema === 'nominee' && items.length > 0) {
                        const shares = generateSharePercentages(items.length);
                        items.forEach((item: any, idx: number) => {
                            if ('nomineeSharePercentage' in item) {
                                item.nomineeSharePercentage = shares[idx];
                            }
                        });
                    }
                    return items;
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
    'lcNumber',
    'swiftReference',
    'swiftCode',
    'tradeAmount',
    'percentage',
    'hsCode',
    'port',
    'bankName',
    'futureDate',
    'nestedObject',
    'nestedArray',
];
