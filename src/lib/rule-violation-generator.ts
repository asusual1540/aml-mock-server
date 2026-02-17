/**
 * Rule Violation Data Generator
 * Generates mock data that intentionally violates specific AML monitoring rules,
 * so that the backend's background workers will detect and create alerts.
 */

import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface CustomerPoolData {
    customerId: number;
    customerNameEng?: string;
    customerNameBen?: string;
    dateOfBirth?: string;
    nationality?: string;
    country?: 'BD' | 'US';
}

export interface RuleInfo {
    code: string;
    name: string;
    category: 'transaction' | 'sanction' | 'trade';
    subcategory: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    riskScore: string;
    threshold: string;
    description: string;
    dataType: 'transaction' | 'sanction' | 'trade';
}

export interface ViolationOutput {
    rule: RuleInfo;
    dataType: string;
    records: any[];
    recordCount: number;
    explanation: string;
    note?: string;
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const FATF_BLACKLIST = ['KP', 'IR', 'MM', 'SY', 'YE', 'AF'];
const FATF_GREYLIST = ['PK', 'JM', 'TR', 'VN', 'PH', 'NG', 'TZ', 'UG', 'ZW', 'HT', 'ML', 'BF', 'CM', 'MZ', 'SS', 'CD', 'SO', 'LY', 'LB', 'SA'];
const TAX_HAVENS = ['BM', 'BS', 'KY', 'VG', 'PA', 'JE', 'GG', 'IM', 'GI', 'MC', 'LI', 'AD', 'MU', 'SC', 'BZ', 'TC', 'AG', 'KN', 'WS', 'VU'];
const SANCTIONED_COUNTRIES = ['KP', 'IR', 'SY', 'CU', 'VE', 'RU', 'BY', 'MM'];
const SHELL_JURISDICTIONS = ['PA', 'VG', 'KY', 'BZ', 'SC', 'MH', 'LR', 'WS', 'VU'];
const LANDLOCKED = ['AF', 'AM', 'AZ', 'BT', 'BO', 'BW', 'BF', 'BI', 'CF', 'TD', 'ET', 'HU', 'KZ', 'KG', 'LA', 'LS', 'MW', 'ML', 'MN', 'NP', 'NE', 'PY', 'RW', 'RS', 'SK', 'SS', 'SZ', 'TJ', 'TM', 'UG', 'UZ', 'ZW'];
const FTZ_PORTS = ['Jebel Ali', 'Labuan', 'Colon Free Zone', 'Hong Kong', 'Singapore', 'Dubai'];
const BMPE_CORRIDORS = [['CO', 'US'], ['CO', 'MX'], ['CO', 'PA'], ['CO', 'EC'], ['CO', 'VE']];
const HIGH_RISK_GOODS_KEYWORDS = ['gold', 'diamond', 'weapon', 'tobacco', 'pharmaceutical', 'nuclear', 'chemical', 'explosives', 'arms', 'ammunition'];
const BD_BANKS = ['Sonali Bank', 'Janata Bank', 'Agrani Bank', 'Rupali Bank', 'BRAC Bank', 'Eastern Bank', 'Dutch-Bangla Bank', 'Islami Bank', 'Prime Bank', 'City Bank'];
const BD_NAMES_MALE = ['Mohammad Rahman', 'Abdul Karim', 'Rafiqul Islam', 'Shafiqul Haque', 'Kamrul Hassan', 'Mizanur Rahman', 'Shahidul Islam', 'Nurul Amin', 'Alamgir Hossain', 'Farid Ahmed'];
const BD_NAMES_FEMALE = ['Fatima Begum', 'Nasreen Akter', 'Rahima Khatun', 'Salma Begum', 'Hasina Akter', 'Ayesha Siddiqua', 'Jannatul Ferdous', 'Taslima Akter', 'Razia Sultana', 'Mst Halima'];
const PURPOSES = ['Business Payment', 'Import Settlement', 'Salary Transfer', 'Investment', 'Personal Transfer', 'Loan Repayment', 'Trade Settlement', 'Service Payment'];

// ═══════════════════════════════════════════════════════════════════
// POOL HELPERS
// ═══════════════════════════════════════════════════════════════════

const CONFIG_DIR = path.join(process.cwd(), 'config');

function readCustomerPool(): CustomerPoolData[] {
    try {
        const data = fs.readFileSync(path.join(CONFIG_DIR, 'customer-id-pool.json'), 'utf-8');
        return JSON.parse(data);
    } catch { return []; }
}

function readAccountPool(): string[] {
    try {
        const data = fs.readFileSync(path.join(CONFIG_DIR, 'account-id-pool.json'), 'utf-8');
        return JSON.parse(data);
    } catch { return []; }
}

function pickCustomer(pool: CustomerPoolData[]): CustomerPoolData {
    if (pool.length === 0) throw new Error('Customer pool is empty. Generate customers first.');
    return pool[Math.floor(Math.random() * pool.length)];
}

function pickAccount(pool: string[]): string {
    if (pool.length === 0) throw new Error('Account pool is empty. Generate accounts first.');
    return pool[Math.floor(Math.random() * pool.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, arr.length));
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════════════════════════════════

function uuid(): string { return faker.string.uuid(); }
function now(): Date { return new Date(); }

function hoursAgo(h: number): string {
    return new Date(now().getTime() - h * 3600_000).toISOString();
}

function randomHoursAgo(min: number, max: number): string {
    const h = min + Math.random() * (max - min);
    return new Date(now().getTime() - h * 3600_000).toISOString();
}

function daysAgo(d: number): string {
    return new Date(now().getTime() - d * 86400_000).toISOString().split('T')[0];
}

function futureDate(days: number): string {
    return new Date(now().getTime() + days * 86400_000).toISOString().split('T')[0];
}

function bdtAmt(min: number, max: number): number {
    return Math.round(min + Math.random() * (max - min));
}

function randomName(): string {
    const names = [...BD_NAMES_MALE, ...BD_NAMES_FEMALE];
    return names[Math.floor(Math.random() * names.length)];
}

function randomCompany(): string { return faker.company.name(); }
function randomAddress(): string { return `House ${faker.number.int({ min: 1, max: 99 })}, Road ${faker.number.int({ min: 1, max: 30 })}, ${faker.helpers.arrayElement(['Gulshan', 'Dhanmondi', 'Banani', 'Motijheel', 'Mirpur'])}, Dhaka`; }
function randomBank(): string { return faker.helpers.arrayElement(BD_BANKS); }
function randomSwift(): string { return faker.string.alpha({ length: 4 }).toUpperCase() + 'BD' + faker.string.alphanumeric({ length: 5 }).toUpperCase(); }
function randomPort(): string { return faker.helpers.arrayElement(['Shanghai', 'Singapore', 'Chittagong', 'Busan', 'Rotterdam', 'Hamburg', 'Dubai', 'Mumbai', 'Colombo', 'Hong Kong']); }
function randomHsCode(): string { return faker.helpers.arrayElement(['8471', '6204', '3004', '8517', '2710', '7108', '0901', '5209', '8703', '6110']); }

// ═══════════════════════════════════════════════════════════════════
// BASE RECORD BUILDERS
// ═══════════════════════════════════════════════════════════════════

function baseTxn(customerId: number, accountId: string, overrides: Record<string, any> = {}): any {
    return {
        reference: uuid(),
        customerId,
        accountId,
        amount: bdtAmt(10000, 100000),
        currency: 'BDT',
        exchangeRate: 1.0,
        fees: bdtAmt(0, 500),
        type: 'CASH_DEPOSIT',
        direction: 'IN',
        timestamp: randomHoursAgo(0, 12),
        sender: randomName(),
        receiver: randomName(),
        senderAccount: faker.finance.accountNumber(),
        receiverAccount: faker.finance.accountNumber(),
        senderCountry: 'BD',
        receiverCountry: 'BD',
        paymentMethod: 'Cash',
        purpose: faker.helpers.arrayElement(PURPOSES),
        status: 'Completed',
        riskScore: faker.number.int({ min: 10, max: 40 }),
        ...overrides,
    };
}

function baseInvoice(overrides: Record<string, any> = {}): any {
    return {
        invoiceNumber: `INV-${faker.number.int({ min: 10000, max: 99999 })}`,
        invoiceDate: daysAgo(faker.number.int({ min: 5, max: 30 })),
        sellerName: randomCompany(),
        sellerAddress: randomAddress(),
        sellerCountry: 'CN',
        buyerName: randomCompany(),
        buyerAddress: randomAddress(),
        buyerCountry: 'BD',
        currency: 'USD',
        totalAmount: bdtAmt(50000, 500000),
        taxAmount: bdtAmt(1000, 10000),
        freightAmount: bdtAmt(2000, 15000),
        insuranceAmount: bdtAmt(500, 5000),
        discountAmount: 0,
        netAmount: bdtAmt(50000, 500000),
        goodsDescription: 'Industrial machinery parts and components',
        hsCode: randomHsCode(),
        quantity: bdtAmt(100, 5000),
        quantityUnit: 'PCS',
        unitPrice: bdtAmt(10, 500),
        incoterms: 'FOB',
        marketPriceRef: bdtAmt(10, 500),
        priceDeviation: faker.number.float({ min: 0, max: 5, fractionDigits: 2 }),
        overInvoicingFlag: false,
        underInvoicingFlag: false,
        priceAnomalyScore: faker.number.float({ min: 0, max: 10, fractionDigits: 2 }),
        documentsReceived: true,
        documentsVerified: true,
        discrepancyFound: false,
        discrepancyDetails: '',
        sanctionScreened: true,
        complianceCleared: true,
        ...overrides,
    };
}

function baseShipment(overrides: Record<string, any> = {}): any {
    return {
        shipmentNumber: `SH-${faker.number.int({ min: 10000, max: 99999 })}`,
        blNumber: `BL-${faker.number.int({ min: 100000, max: 999999 })}`,
        awbNumber: '',
        shipmentDate: daysAgo(faker.number.int({ min: 5, max: 20 })),
        estimatedArrival: futureDate(faker.number.int({ min: 10, max: 40 })),
        actualArrival: null,
        shipmentMode: 'SEA',
        vesselName: `MV ${faker.company.name().split(' ')[0]} Star`,
        vesselImo: faker.number.int({ min: 9000000, max: 9999999 }),
        vesselFlag: 'SG',
        voyageNumber: `V${faker.number.int({ min: 100, max: 999 })}`,
        portOfLoading: 'Shanghai',
        portOfDischarge: 'Chittagong',
        transshipmentPort: '',
        originCountry: 'CN',
        destinationCountry: 'BD',
        goodsDescription: 'Industrial machinery parts',
        hsCode: randomHsCode(),
        totalWeight: bdtAmt(5000, 25000),
        weightUnit: 'KG',
        packageCount: faker.number.int({ min: 10, max: 200 }),
        containerNumbers: [`CONT${faker.number.int({ min: 100000, max: 999999 })}`],
        highRiskPortFlag: false,
        sanctionedPortFlag: false,
        sanctionedVesselFlag: false,
        circuitousRouteFlag: false,
        vesselScreened: true,
        portsScreened: true,
        customsClearance: false,
        ...overrides,
    };
}

function baseParty(role: string, overrides: Record<string, any> = {}): any {
    return {
        partyRole: role,
        partyType: role.includes('BANK') ? 'BANK' : 'ENTITY',
        partyName: randomCompany(),
        partyAddress: randomAddress(),
        city: faker.helpers.arrayElement(['Shanghai', 'Dhaka', 'Singapore', 'Dubai']),
        country: role === 'APPLICANT' ? 'BD' : (role === 'BENEFICIARY' ? 'CN' : 'BD'),
        registrationNumber: faker.number.int({ min: 10000000, max: 99999999 }),
        taxId: faker.number.int({ min: 10000000, max: 99999999 }),
        swiftCode: randomSwift(),
        contactPerson: randomName(),
        email: faker.internet.email(),
        phone: `+880 ${faker.number.int({ min: 1300000000, max: 1999999999 })}`,
        sanctionScreened: true,
        screeningResult: 'CLEAR',
        pepFlag: false,
        adverseMediaFlag: false,
        highRiskJurisdiction: false,
        riskRating: 'LOW',
        ...overrides,
    };
}

function baseDocument(docType: string, overrides: Record<string, any> = {}): any {
    return {
        documentType: docType,
        documentNumber: `DOC-${faker.number.int({ min: 10000, max: 99999 })}`,
        documentDate: daysAgo(faker.number.int({ min: 1, max: 15 })),
        description: `${docType.replace(/_/g, ' ').toLowerCase()} for LC trade`,
        issuerName: randomCompany(),
        issuerCountry: 'CN',
        fileName: `${docType.toLowerCase()}_${faker.number.int({ min: 1000, max: 9999 })}.pdf`,
        fileType: 'PDF',
        fileSize: faker.number.int({ min: 50000, max: 500000 }),
        verified: true,
        discrepancyFound: false,
        discrepancyNotes: '',
        ...overrides,
    };
}

function baseAmendment(overrides: Record<string, any> = {}): any {
    return {
        amendmentNumber: faker.number.int({ min: 1, max: 5 }),
        swiftReference: `MT707${faker.number.int({ min: 1000000000, max: 9999999999 })}`,
        amendmentDate: daysAgo(faker.number.int({ min: 1, max: 30 })),
        amendmentType: faker.helpers.arrayElement(['AMOUNT', 'EXPIRY', 'SHIPMENT', 'DOCUMENTS', 'TERMS']),
        amountChange: bdtAmt(-50000, 50000),
        oldAmount: bdtAmt(100000, 500000),
        newAmount: bdtAmt(100000, 500000),
        oldExpiryDate: daysAgo(10),
        newExpiryDate: futureDate(60),
        reason: faker.lorem.sentence(),
        requestedBy: randomCompany(),
        frequentAmendmentFlag: false,
        suspiciousChangeFlag: false,
        status: 'APPROVED',
        ...overrides,
    };
}

function baseLC(customerId: number, accountId: string, overrides: Record<string, any> = {}): any {
    const amount = overrides.amount || bdtAmt(100000, 2000000);
    const applicantName = overrides.applicantName || randomCompany();
    return {
        lcNumber: `LC${new Date().getFullYear()}-${faker.number.int({ min: 10000000, max: 99999999 })}`,
        swiftReference: `MT700${faker.number.int({ min: 1000000000, max: 9999999999 })}`,
        customerId,
        applicantAccount: accountId,
        lcType: 'IMPORT',
        status: 'OPENED',
        issueDate: daysAgo(30),
        expiryDate: futureDate(150),
        lastShipmentDate: futureDate(120),
        latestDocPresentationDate: futureDate(140),
        currency: 'USD',
        amount,
        tolerancePercent: 5,
        utilizedAmount: 0,
        balanceAmount: amount,
        paymentTerms: 'AT_SIGHT',
        tenorDays: 0,
        applicantName,
        applicantAddress: randomAddress(),
        applicantCountry: 'BD',
        beneficiaryName: randomCompany(),
        beneficiaryAddress: `${faker.number.int({ min: 1, max: 999 })} Industrial Rd, Shanghai`,
        beneficiaryCountry: 'CN',
        beneficiaryBank: 'Bank of China',
        beneficiaryBankSwift: 'BKCHCNBJ',
        issuingBankName: randomBank(),
        issuingBankSwift: randomSwift(),
        advisingBankName: 'Bank of China Shanghai Branch',
        advisingBankSwift: 'BKCHCNBJ110',
        confirmingBankName: '',
        goodsDescription: 'Industrial machinery parts and electronic components',
        hsCode: '8471',
        quantity: bdtAmt(500, 5000),
        quantityUnit: 'PCS',
        unitPrice: bdtAmt(50, 500),
        shipmentMode: 'SEA',
        portOfLoading: 'Shanghai',
        portOfDischarge: 'Chittagong',
        originCountry: 'CN',
        destinationCountry: 'BD',
        transshipmentAllowed: false,
        partialShipmentAllowed: false,
        incoterms: 'FOB',
        insuranceRequired: true,
        insuranceAmount: Math.round(amount * 1.1),
        transferableLc: false,
        paymentToThirdParty: false,
        paymentCountry: 'CN',
        collateralAmount: Math.round(amount * 0.2),
        contractReference: `CTR-${faker.number.int({ min: 10000, max: 99999 })}`,
        riskRating: 'LOW',
        sanctionScreened: true,
        dualUseGoodsFlag: false,
        highRiskCountryFlag: false,
        priceAnomalyFlag: false,
        amendments: [],
        invoices: [baseInvoice({ totalAmount: amount, netAmount: amount })],
        shipments: [baseShipment()],
        parties: [
            baseParty('APPLICANT', { partyName: applicantName, country: 'BD' }),
            baseParty('BENEFICIARY', { country: 'CN' }),
            baseParty('ISSUING_BANK', { partyType: 'BANK', country: 'BD' }),
        ],
        documents: [
            baseDocument('BILL_OF_LADING'),
            baseDocument('COMMERCIAL_INVOICE'),
            baseDocument('CERTIFICATE_OF_ORIGIN'),
        ],
        ...overrides,
    };
}

function baseSanctionEntry(overrides: Record<string, any> = {}): any {
    return {
        entityId: `SANC-${faker.number.int({ min: 100000, max: 999999 })}`,
        name: randomName(),
        caption: randomName(),
        aliases: [randomName(), randomName(), randomName()],
        dateOfBirth: `${faker.number.int({ min: 1950, max: 1990 })}-${String(faker.number.int({ min: 1, max: 12 })).padStart(2, '0')}-${String(faker.number.int({ min: 1, max: 28 })).padStart(2, '0')}`,
        citizenships: ['BD'],
        nationality: ['Bangladeshi'],
        countryCodes: ['BD'],
        organization: '',
        position: '',
        entityType: 'Individual',
        schema: 'Person',
        datasets: ['UN_SANCTIONS', 'OFAC_SDN'],
        topics: ['sanction', 'crime.terror', 'poi'],
        properties: { nationality: ['Bangladeshi'], gender: ['male'] },
        riskLevel: 'HIGH',
        firstSeen: daysAgo(365),
        lastSeen: daysAgo(1),
        lastChange: daysAgo(7),
        sourceUrl: 'https://sanctionslist.example.com/entity/',
        searchText: '',
        ...overrides,
    };
}

// ═══════════════════════════════════════════════════════════════════
// RULE CATALOG
// ═══════════════════════════════════════════════════════════════════

export const RULE_CATALOG: RuleInfo[] = [
    // ── Transaction: Cash ──
    { code: 'CASH_THRESHOLD', name: 'CTR Threshold', category: 'transaction', subcategory: 'Cash Transaction', severity: 'high', riskScore: '80', threshold: 'BDT 1,000,000 / 24h', description: 'Cash transactions exceeding CTR reporting threshold (BDT 10 Lakh). Triggers mandatory CTR filing.', dataType: 'transaction' },
    { code: 'CASH_DEPOSIT_ANOMALY', name: 'Cash Deposit Profile Anomaly', category: 'transaction', subcategory: 'Cash Transaction', severity: 'medium', riskScore: '65', threshold: 'BDT 500,000; 200% of 90-day avg', description: 'Single cash deposit significantly deviating from customer 90-day average pattern.', dataType: 'transaction' },
    { code: 'CASH_VS_INSTRUMENT_RATIO', name: 'Cash-Intensive Business Anomaly', category: 'transaction', subcategory: 'Cash Transaction', severity: 'medium', riskScore: '55', threshold: '80% cash ratio / 30 days (min 5 txns)', description: 'Customer where ≥80% of transactions are cash within 30 days.', dataType: 'transaction' },
    { code: 'DENOMINATION_EXCHANGE', name: 'Denomination Exchange', category: 'transaction', subcategory: 'Cash Transaction', severity: 'medium', riskScore: '60', threshold: 'BDT 500,000 / 24h', description: 'Large low-to-high denomination exchanges or FX conversions.', dataType: 'transaction' },
    { code: 'ATM_CASH_EVASION', name: 'ATM Cash Deposit (Staff Avoidance)', category: 'transaction', subcategory: 'Cash Transaction', severity: 'high', riskScore: '70', threshold: 'BDT 300,000 / 24h', description: 'Large ATM cash deposits — possible avoidance of teller reporting.', dataType: 'transaction' },
    // ── Transaction: Structuring ──
    { code: 'STRUCTURING', name: 'Below-CTR Structuring', category: 'transaction', subcategory: 'Structuring', severity: 'critical', riskScore: '85-95', threshold: '90% of BDT 1M, ≥2 txns / 48h', description: 'Multiple transactions just below the CTR threshold to avoid reporting.', dataType: 'transaction' },
    { code: 'AGGREGATE_STRUCTURING', name: 'Multiple Credit Slips', category: 'transaction', subcategory: 'Structuring', severity: 'high', riskScore: '80', threshold: 'BDT 1,000,000 cumulative, ≥3 deposits / 48h', description: 'Multiple small deposits that aggregate above the CTR threshold.', dataType: 'transaction' },
    { code: 'MULTI_ACCOUNT_STRUCTURING', name: 'Multi-Account Structuring', category: 'transaction', subcategory: 'Structuring', severity: 'critical', riskScore: '90', threshold: 'BDT 1,000,000 from ≥2 accounts / 48h', description: 'Same beneficiary receiving from multiple originating accounts above threshold.', dataType: 'transaction' },
    { code: 'COORDINATED_STRUCTURING', name: 'Same-Branch Coordinated', category: 'transaction', subcategory: 'Structuring', severity: 'critical', riskScore: '90', threshold: 'BDT 500,000, ≥2 customers, same branch / 2h', description: 'Multiple customers depositing cash at the same branch within short window.', dataType: 'transaction' },
    // ── Transaction: Velocity ──
    { code: 'VELOCITY_COUNT', name: 'High Frequency Transactions', category: 'transaction', subcategory: 'Velocity', severity: 'high', riskScore: '70-90', threshold: '>20 txns / 24h', description: 'Exceeding normal transaction count within 24 hours.', dataType: 'transaction' },
    { code: 'RAPID_IN_OUT', name: 'Rapid Fund Movement', category: 'transaction', subcategory: 'Velocity', severity: 'critical', riskScore: '85', threshold: 'BDT 1,000,000 in, ≥90% out / 24h', description: 'Large credit immediately followed by near-equal debit. Classic layering indicator.', dataType: 'transaction' },
    { code: 'SUDDEN_VOLUME_INCREASE', name: 'Week-over-Week Volume Spike', category: 'transaction', subcategory: 'Velocity', severity: 'high', riskScore: '75', threshold: '300% increase vs prior week', description: 'Transaction volume ≥300% of previous week.', dataType: 'transaction' },
    { code: 'WIRE_VELOCITY', name: 'Wire Transfer Velocity', category: 'transaction', subcategory: 'Velocity', severity: 'high', riskScore: '75', threshold: '>5 wires to >2 beneficiaries / 24h', description: 'High-velocity outgoing wire transfers to many different recipients.', dataType: 'transaction' },
    // ── Transaction: Amount Threshold ──
    { code: 'SINGLE_AMOUNT', name: 'Single Large Transaction', category: 'transaction', subcategory: 'Amount Threshold', severity: 'medium', riskScore: '60', threshold: 'BDT 5,000,000 / 24h', description: 'Any single transaction exceeding BDT 5M threshold.', dataType: 'transaction' },
    { code: 'CUMULATIVE_DAILY', name: 'Cumulative Daily Threshold', category: 'transaction', subcategory: 'Amount Threshold', severity: 'high', riskScore: '70', threshold: 'BDT 10,000,000 / 24h', description: 'Daily aggregate transaction amount across all types exceeds threshold.', dataType: 'transaction' },
    { code: 'CUMULATIVE_WEEKLY', name: 'Cumulative Weekly Threshold', category: 'transaction', subcategory: 'Amount Threshold', severity: 'medium', riskScore: '70', threshold: 'BDT 25,000,000 / 168h', description: 'Weekly aggregate transaction amount exceeds threshold.', dataType: 'transaction' },
    { code: 'CASH_INSTRUMENT_CONVERSION', name: 'Cash to Instrument Conversion', category: 'transaction', subcategory: 'Amount Threshold', severity: 'high', riskScore: '75', threshold: 'BDT 500,000 / 168h', description: 'Cash deposits followed by instrument purchases (pay orders, demand drafts). Instruments ≥80% of cash.', dataType: 'transaction' },
    // ── Transaction: Behavioral ──
    { code: 'KYC_MISMATCH', name: 'KYC Profile Inconsistency', category: 'transaction', subcategory: 'Behavioral', severity: 'high', riskScore: '70', threshold: 'BDT 5,000,000 / 30 days; 200% deviation', description: 'Monthly volume inconsistent with declared customer profile.', dataType: 'transaction' },
    { code: 'NON_EARNING_ACTIVITY', name: 'Non-Earning Member Activity', category: 'transaction', subcategory: 'Behavioral', severity: 'high', riskScore: '75', threshold: 'BDT 500,000 / 30 days', description: 'Housewife, student, minor, unemployed, or retired person with significant transactions.', dataType: 'transaction' },
    { code: 'SUDDEN_LOAN_PAYOFF', name: 'Sudden Loan Payoff', category: 'transaction', subcategory: 'Behavioral', severity: 'high', riskScore: '65', threshold: 'BDT 1,000,000 / 72h', description: 'Large unexpected loan payments from unknown sources.', dataType: 'transaction' },
    { code: 'THIRD_PARTY_UNEXPLAINED', name: 'Third-Party w/o Explanation', category: 'transaction', subcategory: 'Behavioral', severity: 'medium', riskScore: '55', threshold: 'BDT 500,000 / 24h', description: 'Inbound credits from third parties with no stated purpose.', dataType: 'transaction' },
    { code: 'DOCUMENT_RELUCTANCE', name: 'KYC Incomplete + Transacting', category: 'transaction', subcategory: 'Behavioral', severity: 'critical', riskScore: '80', threshold: 'BDT 100,000 / 30 days', description: 'Customer with INCOMPLETE/PENDING/REJECTED KYC still transacting. Auto-STR flag.', dataType: 'transaction' },
    { code: 'SHELL_COMPANY', name: 'Shell Company Pattern', category: 'transaction', subcategory: 'Behavioral', severity: 'critical', riskScore: '85', threshold: 'BDT 10,000,000, ≤10 active days / 90 days', description: 'High-risk corporate with high-volume low-activity-day pattern.', dataType: 'transaction' },
    // ── Transaction: Geographic ──
    { code: 'HIGH_RISK_COUNTRY', name: 'FATF High-Risk Jurisdiction', category: 'transaction', subcategory: 'Geographic Risk', severity: 'high', riskScore: '75', threshold: 'Any amount / 24h', description: 'Transaction involving FATF black/grey list countries.', dataType: 'transaction' },
    { code: 'TAX_HAVEN', name: 'Tax Haven Jurisdiction', category: 'transaction', subcategory: 'Geographic Risk', severity: 'medium', riskScore: '55', threshold: 'Any amount / 24h', description: 'Transaction involving known tax haven jurisdictions.', dataType: 'transaction' },
    { code: 'LANDLOCKED_ANOMALY', name: 'Landlocked Country Shipping', category: 'transaction', subcategory: 'Geographic Risk', severity: 'medium', riskScore: '55', threshold: 'Any with "ship" in purpose / 168h', description: 'Shipping-related transactions to landlocked countries where maritime shipping is implausible.', dataType: 'transaction' },
    { code: 'CROSS_BORDER_SUSPICIOUS', name: 'Suspicious Cross-Border', category: 'transaction', subcategory: 'Geographic Risk', severity: 'high', riskScore: '70', threshold: '≥3 countries OR ≥BDT 5M bidirectional / 24h', description: 'Multiple cross-border transactions or high-value bidirectional international flows.', dataType: 'transaction' },
    // ── Transaction: PEP & High-Risk ──
    { code: 'PEP_MONITORING', name: 'PEP Transaction Monitoring', category: 'transaction', subcategory: 'PEP & High-Risk', severity: 'high', riskScore: '75', threshold: 'BDT 100,000 / 24h', description: 'PEP or high-risk customer activity above lowered threshold. Triggers EDD.', dataType: 'transaction' },
    { code: 'PEP_LIFESTYLE', name: 'PEP Lifestyle Inconsistency', category: 'transaction', subcategory: 'PEP & High-Risk', severity: 'critical', riskScore: '80', threshold: 'BDT 5,000,000 outgoing / 30 days', description: 'PEP with high monthly spending requiring source-of-wealth verification.', dataType: 'transaction' },
    { code: 'PEP_ASSOCIATE', name: 'PEP Associate Transactions', category: 'transaction', subcategory: 'PEP & High-Risk', severity: 'high', riskScore: '70', threshold: 'Graph-based detection', description: 'Transactions involving known associates of PEPs (requires customer relationship graph).', dataType: 'transaction' },
    { code: 'HIGH_RISK_CUSTOMER', name: 'High-Risk Enhanced Monitoring', category: 'transaction', subcategory: 'PEP & High-Risk', severity: 'high', riskScore: '75', threshold: 'BDT 250,000 / 24h (50% of normal)', description: 'Lowered thresholds applied to HIGH/VERY_HIGH/CRITICAL risk customers.', dataType: 'transaction' },
    // ── Transaction: Account Activity ──
    { code: 'DORMANT_ACTIVATION', name: 'Dormant Account Activation', category: 'transaction', subcategory: 'Account Activity', severity: 'high', riskScore: '70', threshold: 'BDT 100,000 / 7 days; dormant ≥180 days', description: 'Account with no activity for 180+ days suddenly transacting.', dataType: 'transaction' },
    { code: 'NEW_ACCOUNT_ACTIVITY', name: 'New Account High Activity', category: 'transaction', subcategory: 'Account Activity', severity: 'medium', riskScore: '60', threshold: 'BDT 500,000; account ≤30 days old', description: 'Newly opened account with unusually high initial activity.', dataType: 'transaction' },
    { code: 'FUNNEL_ACCOUNT', name: 'Funnel Account Detection', category: 'transaction', subcategory: 'Account Activity', severity: 'critical', riskScore: '90', threshold: '≥5 inbound sources; outbound ≥70% / 168h', description: 'Multiple small inflows consolidated into single large outflow.', dataType: 'transaction' },
    { code: 'FLOW_THROUGH', name: 'Flow-Through Account', category: 'transaction', subcategory: 'Account Activity', severity: 'high', riskScore: '75', threshold: '≥BDT 1M in, ≥20 txns, in≈out (±10%) / 30 days', description: 'High-volume near-zero-balance account — classic money laundering conduit.', dataType: 'transaction' },
    { code: 'SAFE_DEPOSIT_SURGE', name: 'Safe Deposit Box Surge', category: 'transaction', subcategory: 'Account Activity', severity: 'medium', riskScore: '55', threshold: '≥3 accesses / 168h', description: 'Unusual frequency of safe deposit box access.', dataType: 'transaction' },
    // ── Transaction: Cross-Border & Remittance ──
    { code: 'REMITTANCE_ANOMALY', name: 'Unusual Remittance Pattern', category: 'transaction', subcategory: 'Cross-Border', severity: 'medium', riskScore: '60', threshold: '≥3 countries OR BDT 2,000,000 / 168h', description: 'Outbound remittances to many countries or in high volume.', dataType: 'transaction' },
    { code: 'SMALL_DEPOSIT_LARGE_WIRE', name: 'TF Indicator Pattern', category: 'transaction', subcategory: 'Cross-Border', severity: 'critical', riskScore: '85', threshold: '≥5 deposits <BDT 200K → wire ≥70% / 168h', description: 'Multiple small deposits aggregated then sent as international wire. Terrorism financing indicator.', dataType: 'transaction' },
    { code: 'CORRESPONDENT_ANOMALY', name: 'Correspondent Banking Anomaly', category: 'transaction', subcategory: 'Cross-Border', severity: 'high', riskScore: '70', threshold: 'BDT 50,000,000 OR ≥100 txns / 30 days', description: 'Unusual patterns in nostro/vostro/correspondent accounts.', dataType: 'transaction' },
    // ── Transaction: Layering ──
    { code: 'ROUND_TRIP', name: 'Circular Fund Flow', category: 'transaction', subcategory: 'Layering', severity: 'critical', riskScore: '90', threshold: '≥2 round-trips, amount ±5% / 30 days', description: 'Funds sent to a party and received back at similar amounts. Circular flow.', dataType: 'transaction' },
    { code: 'SAME_DAY_IN_OUT', name: 'Same-Day In/Out', category: 'transaction', subcategory: 'Layering', severity: 'high', riskScore: '75', threshold: 'BDT 500,000 in; out ≥80% / 24h', description: 'Large same-day credit followed by matching debit.', dataType: 'transaction' },
    { code: 'COMPLEX_CHAIN', name: 'Complex Transfer Chain', category: 'transaction', subcategory: 'Layering', severity: 'critical', riskScore: '90', threshold: '≥3 hops, amount ±10%, multi-country / 30 days', description: 'Multi-hop A→B→C→D transfer chains detected via recursive analysis.', dataType: 'transaction' },
    // ── Transaction: Regulatory ──
    { code: 'AUTO_CTR', name: 'Auto-CTR Filing', category: 'transaction', subcategory: 'Regulatory', severity: 'high', riskScore: '80', threshold: 'BDT 1,000,000 / 24h', description: 'Automatic CTR filing trigger. Report deadline: 24 hours.', dataType: 'transaction' },
    { code: 'STR_COMPOSITE', name: 'STR Composite Score', category: 'transaction', subcategory: 'Regulatory', severity: 'critical', riskScore: 'up to 100', threshold: '≥10 txns, composite ≥70/100 / 30 days', description: 'Multi-indicator composite scoring: high-risk txns, cash ratio, countries, volume.', dataType: 'transaction' },
    { code: 'NGO_MISUSE', name: 'NGO/NPO Fund Misuse', category: 'transaction', subcategory: 'Regulatory', severity: 'critical', riskScore: '80', threshold: 'BDT 1,000,000; non-operational >70% / 30 days', description: 'Charitable organizations spending >70% on non-operational items.', dataType: 'transaction' },
    { code: 'ADVERSE_MEDIA_TXN', name: 'Adverse Media Customer', category: 'transaction', subcategory: 'Regulatory', severity: 'high', riskScore: '70', threshold: 'BDT 250,000 / 24h', description: 'Customers with adverse_media_flag get lowered monitoring thresholds.', dataType: 'transaction' },
    // ── Transaction: SWIFT ──
    { code: 'SWIFT_SANCTION_RT', name: 'SWIFT Real-Time Screening', category: 'transaction', subcategory: 'SWIFT & Payments', severity: 'critical', riskScore: '95', threshold: 'Any SWIFT to sanctioned country / 1h', description: 'Near-real-time screening of SWIFT messages to KP, IR, SY, CU, VE, RU, BY. Action: FREEZE.', dataType: 'transaction' },
    { code: 'SANCTIONED_COUNTRY_PAYMENT', name: 'Sanctioned Country Payment', category: 'transaction', subcategory: 'SWIFT & Payments', severity: 'critical', riskScore: '95', threshold: 'Any outbound to sanctioned country / 24h', description: 'Any payment to sanctioned country. Action: block_and_report.', dataType: 'transaction' },
    { code: 'SWIFT_PATTERN_ANOMALY', name: 'SWIFT Pattern Anomaly', category: 'transaction', subcategory: 'SWIFT & Payments', severity: 'high', riskScore: '70', threshold: '≥10 SWIFT to ≥5 countries / 168h', description: 'Unusual SWIFT transfer pattern across many countries.', dataType: 'transaction' },

    // ══════════════════════════════
    // SANCTION RULES
    // ══════════════════════════════
    { code: 'SANCTION_INDIVIDUAL', name: 'Individual Sanction Screening', category: 'sanction', subcategory: 'Screening', severity: 'critical', riskScore: '85-95', threshold: 'Match score ≥85%', description: 'Screen individual customer names against sanction lists with fuzzy matching.', dataType: 'sanction' },
    { code: 'SANCTION_CORPORATE', name: 'Corporate Sanction Screening', category: 'sanction', subcategory: 'Screening', severity: 'critical', riskScore: '85-95', threshold: 'Match score ≥85%', description: 'Screen corporate/business names against sanction lists.', dataType: 'sanction' },
    { code: 'SANCTION_PEP', name: 'PEP Screening', category: 'sanction', subcategory: 'Screening', severity: 'high', riskScore: '80-90', threshold: 'Match score ≥85%', description: 'Screen customers against Politically Exposed Persons lists.', dataType: 'sanction' },
    { code: 'SANCTION_VESSEL', name: 'Vessel Screening', category: 'sanction', subcategory: 'Screening', severity: 'high', riskScore: '80', threshold: 'Match score ≥85%', description: 'Screen vessel names and IMO numbers against sanctioned vessel lists.', dataType: 'sanction' },
    { code: 'SANCTION_ASSET', name: 'Asset Screening', category: 'sanction', subcategory: 'Screening', severity: 'high', riskScore: '80', threshold: 'Match score ≥85%', description: 'Screen asset registrations against sanctioned asset databases.', dataType: 'sanction' },
    { code: 'SANCTION_ADVERSE_MEDIA', name: 'Adverse Media Screening', category: 'sanction', subcategory: 'Screening', severity: 'medium', riskScore: '70', threshold: 'Match score ≥85%', description: 'Screen for adverse media mentions related to customers.', dataType: 'sanction' },

    // ══════════════════════════════
    // TRADE (TBML) RULES
    // ══════════════════════════════
    // ── Cat 1: Applicant & Beneficiary ──
    { code: 'TBML-001', name: 'Related Party / Common Interest', category: 'trade', subcategory: 'Applicant & Beneficiary', severity: 'high', riskScore: '65-70', threshold: 'Same address or name similarity >70%', description: 'Applicant and beneficiary share address or have >70% name similarity.', dataType: 'trade' },
    { code: 'TBML-002', name: 'Residential/Agent Address', category: 'trade', subcategory: 'Applicant & Beneficiary', severity: 'medium', riskScore: '50', threshold: 'Residential keywords in address', description: 'Party address contains residential keywords (house, flat, apartment, বাড়ি).', dataType: 'trade' },
    { code: 'TBML-003', name: 'Suspicious Customer Behaviour', category: 'trade', subcategory: 'Applicant & Beneficiary', severity: 'critical', riskScore: '75', threshold: 'LC validity < 7 days', description: 'LC with extremely short validity period indicating extreme pressure.', dataType: 'trade' },
    { code: 'TBML-004', name: 'PEP/Influential Person', category: 'trade', subcategory: 'Applicant & Beneficiary', severity: 'critical', riskScore: '80', threshold: 'Any party with PEP flag', description: 'Any party in the LC has PEP flag set.', dataType: 'trade' },
    // ── Cat 2: Third Party ──
    { code: 'TBML-005', name: 'Unexplained Intermediary', category: 'trade', subcategory: 'Third Party', severity: 'high', riskScore: '65', threshold: 'Intermediary with missing info', description: 'Intermediary/agent/broker with missing address or country.', dataType: 'trade' },
    { code: 'TBML-006', name: 'Too Many Intermediaries', category: 'trade', subcategory: 'Third Party', severity: 'high', riskScore: '70', threshold: '>3 non-core parties', description: 'More than 3 non-core (intermediary/broker/agent) parties in the LC.', dataType: 'trade' },
    // ── Cat 3: Transaction Structure ──
    { code: 'TBML-007', name: 'Complex Structure', category: 'trade', subcategory: 'Transaction Structure', severity: 'high', riskScore: '70', threshold: '≥2 of: transferable, transshipment, >3 countries', description: 'LC has multiple complexity indicators simultaneously.', dataType: 'trade' },
    { code: 'TBML-008', name: 'Business Profile Mismatch', category: 'trade', subcategory: 'Transaction Structure', severity: 'high', riskScore: '70', threshold: 'Goods ≠ customer TTP', description: 'LC goods do not match customer trade transaction profile commodities.', dataType: 'trade' },
    { code: 'TBML-009', name: 'Non-Standard Terms', category: 'trade', subcategory: 'Transaction Structure', severity: 'medium', riskScore: '55', threshold: 'Suspicious clause keywords', description: 'LC contains suspicious clauses: assignable, bearer instrument, without recourse, etc.', dataType: 'trade' },
    { code: 'TBML-010', name: 'Frequent Amendment', category: 'trade', subcategory: 'Transaction Structure', severity: 'high', riskScore: '60-75', threshold: '≥3 amendments (≥5=high)', description: 'LC has been amended 3 or more times.', dataType: 'trade' },
    { code: 'TBML-011', name: 'Shell/Front Company', category: 'trade', subcategory: 'Transaction Structure', severity: 'critical', riskScore: '80', threshold: 'Party in shell jurisdictions', description: 'Party registered in shell company jurisdictions (PA, VG, KY, BZ, SC, MH, LR, WS, VU).', dataType: 'trade' },
    { code: 'TBML-012', name: 'Guarantee No Reference', category: 'trade', subcategory: 'Transaction Structure', severity: 'high', riskScore: '65', threshold: 'Guarantee/SBLC without contract ref', description: 'Guarantee or standby LC without underlying contract reference.', dataType: 'trade' },
    { code: 'TBML-013', name: 'Fake Underlying Transaction', category: 'trade', subcategory: 'Transaction Structure', severity: 'critical', riskScore: '75', threshold: 'Active LC with no invoices/shipments', description: 'Active/confirmed LC with zero invoices and zero shipments.', dataType: 'trade' },
    // ── Cat 4: Value & Price ──
    { code: 'TBML-014', name: 'Unusual Pricing', category: 'trade', subcategory: 'Value & Price', severity: 'high', riskScore: '55-75', threshold: 'Price deviation >50%', description: 'Significant price deviation from market reference in invoice.', dataType: 'trade' },
    { code: 'TBML-015', name: 'Under-Invoicing', category: 'trade', subcategory: 'Value & Price', severity: 'critical', riskScore: '85', threshold: 'Under-invoicing flag', description: 'Invoice flagged for under-invoicing compared to market prices.', dataType: 'trade' },
    { code: 'TBML-016', name: 'Over-Invoicing', category: 'trade', subcategory: 'Value & Price', severity: 'critical', riskScore: '85', threshold: 'Over-invoicing flag', description: 'Invoice flagged for over-invoicing compared to market prices.', dataType: 'trade' },
    { code: 'TBML-017', name: 'Excessive Misc Charges', category: 'trade', subcategory: 'Value & Price', severity: 'high', riskScore: '65', threshold: 'Misc charges >15% of LC value', description: 'Miscellaneous/handling/fee charges exceed 15% of the LC value.', dataType: 'trade' },
    { code: 'TBML-018', name: 'Double/Multiple Invoicing', category: 'trade', subcategory: 'Value & Price', severity: 'critical', riskScore: '85', threshold: 'Duplicate invoice (same amount + seller)', description: 'Two or more invoices with the same seller and amount — duplicate invoicing.', dataType: 'trade' },
    // ── Cat 5: Payment Anomalies ──
    { code: 'TBML-019', name: 'Inconsistent Payment Terms', category: 'trade', subcategory: 'Payment Anomalies', severity: 'high', riskScore: '60', threshold: 'Sight payment but tenor >0', description: 'LC says AT_SIGHT payment but tenor days is greater than zero.', dataType: 'trade' },
    { code: 'TBML-020', name: 'Third-Party Payment', category: 'trade', subcategory: 'Payment Anomalies', severity: 'high', riskScore: '70', threshold: 'Payment to non-LC party', description: 'Payment directed to a party not named in the LC.', dataType: 'trade' },
    { code: 'TBML-021', name: 'Payment Country Mismatch', category: 'trade', subcategory: 'Payment Anomalies', severity: 'high', riskScore: '70', threshold: 'Payment country ≠ beneficiary country', description: 'Payment routed to a country different from the beneficiary\'s country.', dataType: 'trade' },
    { code: 'TBML-022', name: 'Last-Minute Payment Change', category: 'trade', subcategory: 'Payment Anomalies', severity: 'critical', riskScore: '80', threshold: 'Amendment changing payment/beneficiary', description: 'Suspicious amendment changing payment details, beneficiary, account, or bank.', dataType: 'trade' },
    { code: 'TBML-023', name: 'Applicant Controls Payment', category: 'trade', subcategory: 'Payment Anomalies', severity: 'medium', riskScore: '50', threshold: '"Applicant approval" in terms', description: 'Payment terms contain "applicant approval" or "buyer discretion" clauses.', dataType: 'trade' },
    { code: 'TBML-024', name: 'Early Guarantee Claim', category: 'trade', subcategory: 'Payment Anomalies', severity: 'high', riskScore: '70', threshold: 'Guarantee claimed <30 days of issue', description: 'Bank guarantee claimed within less than 30 days of issuance.', dataType: 'trade' },
    { code: 'TBML-025', name: 'Fraudulent Letter of Undertaking', category: 'trade', subcategory: 'Payment Anomalies', severity: 'critical', riskScore: '90', threshold: 'LoU without collateral', description: 'Letter of Undertaking issued without any collateral backing.', dataType: 'trade' },
    // ── Cat 6: Goods & Shipment ──
    { code: 'TBML-026', name: 'Phantom Shipment', category: 'trade', subcategory: 'Goods & Shipment', severity: 'critical', riskScore: '90', threshold: 'Active LC, zero shipments + zero docs', description: 'Active LC with no shipments and no documents — purely fictitious trade.', dataType: 'trade' },
    { code: 'TBML-027', name: 'Unclear/No Goods Description', category: 'trade', subcategory: 'Goods & Shipment', severity: 'high', riskScore: '65-70', threshold: 'Vague goods description', description: 'LC goods description is empty or vague ("general merchandise", "various goods").', dataType: 'trade' },
    { code: 'TBML-028', name: 'Trade Pattern Deviation', category: 'trade', subcategory: 'Goods & Shipment', severity: 'high', riskScore: '70', threshold: 'LC amount >50% above customer avg', description: 'LC amount significantly exceeds customer historical average.', dataType: 'trade' },
    { code: 'TBML-029', name: 'Dual-Use Goods', category: 'trade', subcategory: 'Goods & Shipment', severity: 'critical', riskScore: '85', threshold: 'Dual-use flag or HS code match', description: 'LC involves dual-use goods that could have military applications.', dataType: 'trade' },
    { code: 'TBML-030', name: 'HS Code Mismatch', category: 'trade', subcategory: 'Goods & Shipment', severity: 'high', riskScore: '70', threshold: 'Invoice HS ≠ LC HS (4-digit prefix)', description: 'Invoice item HS code differs from the LC declared HS code.', dataType: 'trade' },
    { code: 'TBML-031', name: 'Quantity vs Container Capacity', category: 'trade', subcategory: 'Goods & Shipment', severity: 'high', riskScore: '75', threshold: 'Weight > 28000kg × packages × 1.1', description: 'Declared weight exceeds physical container capacity limits.', dataType: 'trade' },
    { code: 'TBML-032', name: 'High-Risk Goods', category: 'trade', subcategory: 'Goods & Shipment', severity: 'high', riskScore: '70', threshold: 'High-risk goods keywords', description: 'LC involves high-risk goods: gold, diamond, weapons, tobacco, pharmaceuticals.', dataType: 'trade' },
    // ── Cat 7: Transport & Routing ──
    { code: 'TBML-033', name: 'Inconsistent Route', category: 'trade', subcategory: 'Transport & Routing', severity: 'high', riskScore: '70', threshold: 'Circuitous route flag', description: 'Shipping route is unnecessarily circuitous or illogical.', dataType: 'trade' },
    { code: 'TBML-034', name: 'Unjustified Transshipment', category: 'trade', subcategory: 'Transport & Routing', severity: 'high', riskScore: '65', threshold: 'Transshipment with named port, no justification', description: 'Transshipment allowed with a named port but no documented justification.', dataType: 'trade' },
    { code: 'TBML-035', name: 'Unclear Shipping', category: 'trade', subcategory: 'Transport & Routing', severity: 'medium', riskScore: '50', threshold: 'Missing shipping mode or ports', description: 'Missing shipping mode, port of loading, or port of discharge.', dataType: 'trade' },
    { code: 'TBML-036', name: 'Origin ≠ Beneficiary Country', category: 'trade', subcategory: 'Transport & Routing', severity: 'high', riskScore: '65', threshold: 'Shipment origin ≠ beneficiary/seller', description: 'Shipment origin country does not match beneficiary or seller country.', dataType: 'trade' },
    { code: 'TBML-037', name: 'Untrackable/Sanctioned Vessel', category: 'trade', subcategory: 'Transport & Routing', severity: 'critical', riskScore: '80-95', threshold: 'No vessel name/IMO or sanctioned vessel', description: 'Sea shipment with no vessel name/IMO number, or vessel is on sanctioned list.', dataType: 'trade' },
    { code: 'TBML-038', name: 'Missing Container Numbers', category: 'trade', subcategory: 'Transport & Routing', severity: 'high', riskScore: '65', threshold: 'Packages declared but no container refs', description: 'Packages are declared but no container numbers provided.', dataType: 'trade' },
    // ── Cat 8: Country & Jurisdiction ──
    { code: 'TBML-039', name: 'FATF High-Risk/Grey-List Country', category: 'trade', subcategory: 'Country & Jurisdiction', severity: 'critical', riskScore: '70-90', threshold: 'Party from FATF list', description: 'Party from FATF black list (90) or grey list (70).', dataType: 'trade' },
    { code: 'TBML-040', name: 'High-Risk Country Trade', category: 'trade', subcategory: 'Country & Jurisdiction', severity: 'high', riskScore: '75', threshold: 'high_risk_country_flag set', description: 'LC has the high_risk_country_flag set.', dataType: 'trade' },
    { code: 'TBML-041', name: 'Sanctioned Entity in Trade', category: 'trade', subcategory: 'Country & Jurisdiction', severity: 'critical', riskScore: '75-95', threshold: 'Screening result HIT or POTENTIAL_MATCH', description: 'Party screening result is HIT (95) or POTENTIAL_MATCH (75).', dataType: 'trade' },
    // ── Cat 9: Document Discrepancies ──
    { code: 'TBML-042', name: 'Goods Description Discrepancy', category: 'trade', subcategory: 'Document Discrepancies', severity: 'high', riskScore: '70', threshold: 'discrepancy_found = true', description: 'Trade document has discrepancy_found flag set.', dataType: 'trade' },
    { code: 'TBML-043', name: 'LC Clause Abuse', category: 'trade', subcategory: 'Document Discrepancies', severity: 'high', riskScore: '70', threshold: '"all discrepancy acceptable" clause', description: 'LC contains clauses like "all discrepancy acceptable" to bypass controls.', dataType: 'trade' },
    { code: 'TBML-044', name: 'Essential Documents Missing', category: 'trade', subcategory: 'Document Discrepancies', severity: 'high', riskScore: '65', threshold: 'Missing BL, invoice, or CoO', description: 'Missing bill of lading, commercial invoice, or certificate of origin for non-draft LC.', dataType: 'trade' },
    { code: 'TBML-045', name: 'Excessive Waivers / Overdrawn LC', category: 'trade', subcategory: 'Document Discrepancies', severity: 'high', riskScore: '65-70', threshold: '>3 waivers or utilized >110% of LC', description: 'More than 3 waivers granted, or utilized amount exceeds 110% of LC limit.', dataType: 'trade' },
    { code: 'TBML-046', name: 'Excessive Discrepancy Acceptance', category: 'trade', subcategory: 'Document Discrepancies', severity: 'medium', riskScore: '55', threshold: '>3 discrepancies accepted without query', description: 'Multiple document discrepancies accepted without proper review.', dataType: 'trade' },
    // ── Cat 10: Unusual Documentation ──
    { code: 'TBML-047', name: 'Altered/Suspicious Documents', category: 'trade', subcategory: 'Unusual Documentation', severity: 'critical', riskScore: '85', threshold: 'Discrepancy AND failed verification', description: 'Document has discrepancy AND failed verification check.', dataType: 'trade' },
    { code: 'TBML-048', name: 'Reused Documents', category: 'trade', subcategory: 'Unusual Documentation', severity: 'critical', riskScore: '90', threshold: 'Document hash matches another LC', description: 'Document hash matches a document from another LC — reuse of trade documents.', dataType: 'trade' },
    // ── Advanced Typologies ──
    { code: 'ADV-001', name: 'Carousel/Circular Trading', category: 'trade', subcategory: 'Advanced Typology', severity: 'critical', riskScore: '85', threshold: '≥3 reverse-direction LCs same countries / 90d', description: 'Circular trading pattern: goods flowing back and forth between same countries.', dataType: 'trade' },
    { code: 'ADV-002', name: 'Trade-Based Layering', category: 'trade', subcategory: 'Advanced Typology', severity: 'critical', riskScore: '80', threshold: '≥4 parties across ≥4 jurisdictions', description: 'Complex multi-jurisdiction LC with many parties to obscure beneficial ownership.', dataType: 'trade' },
    { code: 'ADV-003', name: 'Free Trade Zone Abuse', category: 'trade', subcategory: 'Advanced Typology', severity: 'high', riskScore: '70', threshold: 'Route through FTZ ports', description: 'Trade routed through Free Trade Zone ports (Jebel Ali, Labuan, Colon, HK, SG, Dubai).', dataType: 'trade' },
    { code: 'ADV-004', name: 'Mirror Trade Detection', category: 'trade', subcategory: 'Advanced Typology', severity: 'critical', riskScore: '85', threshold: 'Matching opposite-direction LC (±5%) / 7d', description: 'Two LCs with matching amounts in opposite directions within 7 days.', dataType: 'trade' },
    { code: 'ADV-005', name: 'BMPE Pattern', category: 'trade', subcategory: 'Advanced Typology', severity: 'critical', riskScore: '75', threshold: 'Trade on BMPE corridors', description: 'Trade on Black Market Peso Exchange corridors (Colombia ↔ US/Mexico/Panama).', dataType: 'trade' },
    { code: 'ADV-006', name: 'Quantity Misrepresentation', category: 'trade', subcategory: 'Advanced Typology', severity: 'high', riskScore: '70', threshold: 'Invoice qty deviates >10% from LC qty', description: 'Invoice quantity differs from LC declared quantity by more than 10%.', dataType: 'trade' },
    { code: 'ADV-007', name: 'LCAF Value Excess', category: 'trade', subcategory: 'Advanced Typology', severity: 'high', riskScore: '65', threshold: 'LC amount >LCAF value by >5%', description: 'LC amount exceeds LCAF (LC Application Form) authorized value.', dataType: 'trade' },
    { code: 'ADV-008', name: 'Export Basket Mismatch', category: 'trade', subcategory: 'Advanced Typology', severity: 'high', riskScore: '60', threshold: 'HS code not in origin export basket', description: 'HS code of goods not in the exporting country\'s typical export basket.', dataType: 'trade' },
    { code: 'ADV-009', name: 'Multiple LC Same Collateral', category: 'trade', subcategory: 'Advanced Typology', severity: 'critical', riskScore: '90', threshold: 'Same collateral ref in multiple active LCs', description: 'Same collateral reference used for multiple active LCs.', dataType: 'trade' },
    { code: 'ADV-010', name: 'Hawala/Advance Payment', category: 'trade', subcategory: 'Advanced Typology', severity: 'critical', riskScore: '75', threshold: 'Advance payment >50% of LC value', description: 'Advance payment exceeds 50% of the LC value — potential hawala indicator.', dataType: 'trade' },
];

// ═══════════════════════════════════════════════════════════════════
// TRANSACTION VIOLATION GENERATORS
// ═══════════════════════════════════════════════════════════════════

function txnLargeAmount(c: CustomerPoolData, acc: string, opts: { amount: number; type: string; paymentMethod: string; direction?: string; purpose?: string; receiverCountry?: string; senderCountry?: string }): any[] {
    return [baseTxn(c.customerId, acc, {
        amount: opts.amount,
        type: opts.type,
        direction: opts.direction || 'IN',
        paymentMethod: opts.paymentMethod,
        timestamp: randomHoursAgo(1, 6),
        purpose: opts.purpose || faker.helpers.arrayElement(PURPOSES),
        senderCountry: opts.senderCountry || 'BD',
        receiverCountry: opts.receiverCountry || 'BD',
        sender: c.customerNameEng || randomName(),
        receiver: randomName(),
    })];
}

function txnStructuring(c: CustomerPoolData, acc: string, opts: { count: number; minAmt: number; maxAmt: number; hoursSpan: number }): any[] {
    return Array.from({ length: opts.count }, (_, i) => baseTxn(c.customerId, acc, {
        amount: bdtAmt(opts.minAmt, opts.maxAmt),
        type: 'CASH_DEPOSIT',
        direction: 'IN',
        paymentMethod: 'Cash',
        timestamp: randomHoursAgo(i * (opts.hoursSpan / opts.count), (i + 1) * (opts.hoursSpan / opts.count)),
        sender: c.customerNameEng || randomName(),
        receiver: c.customerNameEng || randomName(),
    }));
}

function txnVelocity(c: CustomerPoolData, acc: string, count: number): any[] {
    return Array.from({ length: count }, (_, i) => baseTxn(c.customerId, acc, {
        amount: bdtAmt(5000, 80000),
        type: faker.helpers.arrayElement(['CASH_DEPOSIT', 'CASH_WITHDRAWAL', 'WIRE_TRANSFER']),
        direction: faker.helpers.arrayElement(['IN', 'OUT']),
        paymentMethod: faker.helpers.arrayElement(['Cash', 'Wire Transfer', 'Online']),
        timestamp: randomHoursAgo(0, 20),
        sender: c.customerNameEng || randomName(),
    }));
}

function txnRapidInOut(c: CustomerPoolData, acc: string, inAmount: number): any[] {
    const outAmount = Math.round(inAmount * (0.91 + Math.random() * 0.05));
    return [
        baseTxn(c.customerId, acc, { amount: inAmount, type: 'WIRE_TRANSFER', direction: 'IN', paymentMethod: 'Wire Transfer', timestamp: randomHoursAgo(8, 16), sender: randomName(), receiver: c.customerNameEng || randomName() }),
        baseTxn(c.customerId, acc, { amount: outAmount, type: 'WIRE_TRANSFER', direction: 'OUT', paymentMethod: 'Wire Transfer', timestamp: randomHoursAgo(1, 6), sender: c.customerNameEng || randomName(), receiver: randomName() }),
    ];
}

function txnGeographic(c: CustomerPoolData, acc: string, countries: string[], opts: { amount?: number; paymentMethod?: string; type?: string; purpose?: string }): any[] {
    const country = faker.helpers.arrayElement(countries);
    return [baseTxn(c.customerId, acc, {
        amount: opts.amount || bdtAmt(100000, 2000000),
        type: opts.type || 'WIRE_TRANSFER',
        direction: 'OUT',
        paymentMethod: opts.paymentMethod || 'Wire Transfer',
        senderCountry: 'BD',
        receiverCountry: country,
        purpose: opts.purpose || 'International Transfer',
        timestamp: randomHoursAgo(1, 12),
    })];
}

function txnMultiCountry(c: CustomerPoolData, acc: string, countryList: string[], count: number, opts: { type?: string; paymentMethod?: string }): any[] {
    const countries = pickN(countryList, count);
    return countries.map(country => baseTxn(c.customerId, acc, {
        amount: bdtAmt(200000, 2000000),
        type: opts.type || 'WIRE_TRANSFER',
        direction: 'OUT',
        paymentMethod: opts.paymentMethod || 'Wire Transfer',
        senderCountry: 'BD',
        receiverCountry: country,
        purpose: 'International Transfer',
        timestamp: randomHoursAgo(0, 24),
    }));
}

function txnCumulativeAmount(c: CustomerPoolData, acc: string, total: number, count: number, hoursSpan: number): any[] {
    const perTxn = Math.round(total / count) + bdtAmt(-10000, 10000);
    return Array.from({ length: count }, (_, i) => baseTxn(c.customerId, acc, {
        amount: i === count - 1 ? (total - perTxn * (count - 1)) : perTxn,
        type: faker.helpers.arrayElement(['CASH_DEPOSIT', 'WIRE_TRANSFER', 'CASH_WITHDRAWAL']),
        direction: 'IN',
        paymentMethod: faker.helpers.arrayElement(['Cash', 'Wire Transfer', 'Transfer']),
        timestamp: randomHoursAgo(i * (hoursSpan / count), (i + 1) * (hoursSpan / count)),
    }));
}

function txnFunnel(c: CustomerPoolData, acc: string): any[] {
    const senders = Array.from({ length: 6 }, () => randomName());
    const totalIn = senders.reduce((sum) => sum + bdtAmt(80000, 180000), 0);
    const txns: any[] = senders.map((sender, i) => baseTxn(c.customerId, acc, {
        amount: bdtAmt(80000, 180000),
        type: 'WIRE_TRANSFER',
        direction: 'IN',
        paymentMethod: 'Wire Transfer',
        timestamp: randomHoursAgo(24 + i * 12, 36 + i * 12),
        sender,
        senderAccount: faker.finance.accountNumber(),
    }));
    txns.push(baseTxn(c.customerId, acc, {
        amount: Math.round(totalIn * 0.85),
        type: 'WIRE_TRANSFER',
        direction: 'OUT',
        paymentMethod: 'Wire Transfer',
        timestamp: randomHoursAgo(1, 6),
        receiver: randomName(),
        receiverCountry: faker.helpers.arrayElement(['AE', 'SG', 'HK']),
    }));
    return txns;
}

function txnFlowThrough(c: CustomerPoolData, acc: string): any[] {
    const txns: any[] = [];
    let totalIn = 0, totalOut = 0;
    for (let i = 0; i < 25; i++) {
        const amt = bdtAmt(40000, 120000);
        const isCredit = totalIn <= totalOut || Math.random() > 0.5;
        if (isCredit) totalIn += amt; else totalOut += amt;
        txns.push(baseTxn(c.customerId, acc, {
            amount: amt,
            type: 'WIRE_TRANSFER',
            direction: isCredit ? 'IN' : 'OUT',
            paymentMethod: 'Wire Transfer',
            timestamp: randomHoursAgo(i * 24, (i + 1) * 24),
        }));
    }
    // Balance to within 10%
    if (totalOut < totalIn * 0.9) {
        txns.push(baseTxn(c.customerId, acc, {
            amount: totalIn - totalOut - bdtAmt(1000, 10000),
            type: 'WIRE_TRANSFER', direction: 'OUT', paymentMethod: 'Wire Transfer',
            timestamp: randomHoursAgo(0, 12),
        }));
    }
    return txns;
}

function txnRoundTrip(c: CustomerPoolData, acc: string): any[] {
    const counterparty = randomName();
    const counterAccount = faker.finance.accountNumber();
    const amount1 = bdtAmt(500000, 2000000);
    const amount2 = Math.round(amount1 * (0.96 + Math.random() * 0.08));
    return [
        baseTxn(c.customerId, acc, { amount: amount1, type: 'WIRE_TRANSFER', direction: 'OUT', paymentMethod: 'Wire Transfer', timestamp: randomHoursAgo(480, 600), receiver: counterparty, receiverAccount: counterAccount }),
        baseTxn(c.customerId, acc, { amount: amount2, type: 'WIRE_TRANSFER', direction: 'IN', paymentMethod: 'Wire Transfer', timestamp: randomHoursAgo(360, 480), sender: counterparty, senderAccount: counterAccount }),
        baseTxn(c.customerId, acc, { amount: Math.round(amount1 * (0.97 + Math.random() * 0.06)), type: 'WIRE_TRANSFER', direction: 'OUT', paymentMethod: 'Wire Transfer', timestamp: randomHoursAgo(200, 300), receiver: counterparty, receiverAccount: counterAccount }),
        baseTxn(c.customerId, acc, { amount: Math.round(amount1 * (0.95 + Math.random() * 0.1)), type: 'WIRE_TRANSFER', direction: 'IN', paymentMethod: 'Wire Transfer', timestamp: randomHoursAgo(50, 150), sender: counterparty, senderAccount: counterAccount }),
    ];
}

function txnSmallDepositLargeWire(c: CustomerPoolData, acc: string): any[] {
    const deposits = Array.from({ length: 6 }, (_, i) => baseTxn(c.customerId, acc, {
        amount: bdtAmt(80000, 190000),
        type: 'CASH_DEPOSIT', direction: 'IN', paymentMethod: 'Cash',
        timestamp: randomHoursAgo(24 + i * 18, 36 + i * 18),
    }));
    const totalDeposits = deposits.reduce((s, d) => s + d.amount, 0);
    deposits.push(baseTxn(c.customerId, acc, {
        amount: Math.round(totalDeposits * 0.85),
        type: 'WIRE_TRANSFER', direction: 'OUT', paymentMethod: 'Wire Transfer',
        timestamp: randomHoursAgo(1, 12),
        receiverCountry: faker.helpers.arrayElement(['AE', 'MY', 'SG']),
        purpose: 'Family remittance',
    }));
    return deposits;
}

function txnComplexChain(c: CustomerPoolData, acc: string): any[] {
    const parties = [c.customerNameEng || randomName(), randomName(), randomName(), randomName()];
    const amount = bdtAmt(1000000, 3000000);
    const countries = ['BD', 'AE', 'SG', 'HK'];
    return parties.slice(0, -1).map((sender, i) => baseTxn(c.customerId, acc, {
        amount: Math.round(amount * (0.92 + Math.random() * 0.16)),
        type: 'WIRE_TRANSFER', direction: i === 0 ? 'OUT' : 'IN',
        paymentMethod: 'Wire Transfer',
        timestamp: randomHoursAgo(i * 72, (i + 1) * 72),
        sender, receiver: parties[i + 1],
        senderCountry: countries[i], receiverCountry: countries[i + 1],
    }));
}

function txnSWIFT(c: CustomerPoolData, acc: string, countries: string[], count: number): any[] {
    return Array.from({ length: count }, () => baseTxn(c.customerId, acc, {
        amount: bdtAmt(500000, 5000000),
        type: 'SWIFT', direction: 'OUT',
        paymentMethod: 'SWIFT',
        senderCountry: 'BD',
        receiverCountry: faker.helpers.arrayElement(countries),
        timestamp: randomHoursAgo(0, 12),
        purpose: 'SWIFT Transfer',
    }));
}

// ═══════════════════════════════════════════════════════════════════
// SANCTION VIOLATION GENERATORS
// ═══════════════════════════════════════════════════════════════════

function sanctionIndividual(pool: CustomerPoolData[]): any[] {
    const c = pickCustomer(pool);
    const name = c.customerNameEng || randomName();
    return [baseSanctionEntry({
        name,
        caption: name,
        aliases: [name, name.split(' ').reverse().join(' '), name.replace(/a/gi, 'e')],
        dateOfBirth: c.dateOfBirth || '1980-01-15',
        nationality: [c.nationality || 'Bangladeshi'],
        citizenships: [c.country || 'BD'],
        countryCodes: [c.country || 'BD'],
        entityType: 'Individual',
        schema: 'Person',
        searchText: name,
        riskLevel: 'CRITICAL',
    })];
}

function sanctionCorporate(pool: CustomerPoolData[]): any[] {
    const c = pickCustomer(pool);
    const bizName = c.customerNameEng ? `${c.customerNameEng} Enterprises Ltd` : `${randomCompany()} Trading Ltd`;
    return [baseSanctionEntry({
        name: bizName,
        caption: bizName,
        aliases: [bizName, bizName.replace('Ltd', 'Limited'), bizName.split(' ')[0] + ' Corp'],
        entityType: 'Company',
        schema: 'Company',
        organization: bizName,
        searchText: bizName,
        topics: ['sanction', 'crime.fin', 'entity'],
    })];
}

function sanctionPEP(pool: CustomerPoolData[]): any[] {
    const c = pickCustomer(pool);
    const name = c.customerNameEng || randomName();
    return [baseSanctionEntry({
        name,
        caption: `${name} - Politically Exposed Person`,
        aliases: [name],
        dateOfBirth: c.dateOfBirth || '1965-03-20',
        position: faker.helpers.arrayElement(['Member of Parliament', 'Minister of Finance', 'Central Bank Governor', 'Senior Military Officer', 'State Enterprise Director']),
        entityType: 'Individual',
        schema: 'Person',
        topics: ['role.pep', 'gov.national', 'poi'],
        datasets: ['PEP_DATABASE', 'WORLD_CHECK'],
        searchText: name,
        riskLevel: 'HIGH',
    })];
}

function sanctionVessel(): any[] {
    return [baseSanctionEntry({
        name: `MV ${faker.company.name().split(' ')[0]} Star`,
        caption: 'Sanctioned Vessel',
        entityType: 'Vessel',
        schema: 'Thing',
        properties: { imoNumber: [String(faker.number.int({ min: 9000000, max: 9999999 }))], flag: ['KP'], vesselType: ['Cargo'] },
        topics: ['sanction', 'transport', 'debarment'],
        datasets: ['OFAC_SDN', 'UN_VESSELS'],
        countryCodes: ['KP'],
        searchText: 'MV Star vessel sanctioned',
    })];
}

function sanctionAsset(): any[] {
    return [baseSanctionEntry({
        name: `Property ${faker.location.streetAddress()}`,
        caption: 'Sanctioned Asset',
        entityType: 'Asset',
        schema: 'Thing',
        properties: { type: ['Real Estate'], registrationCountry: ['IR'] },
        topics: ['sanction', 'asset.frozen', 'debarment'],
        datasets: ['OFAC_SDN', 'EU_SANCTIONS'],
        countryCodes: ['IR'],
        searchText: 'property asset frozen sanctioned',
    })];
}

function sanctionAdverseMedia(pool: CustomerPoolData[]): any[] {
    const c = pickCustomer(pool);
    const name = c.customerNameEng || randomName();
    return [baseSanctionEntry({
        name,
        caption: `${name} - Adverse Media`,
        aliases: [name],
        entityType: 'Individual',
        schema: 'Person',
        topics: ['crime.fraud', 'crime.fin', 'media'],
        datasets: ['ADVERSE_MEDIA_DB', 'WORLD_CHECK'],
        searchText: `${name} fraud money laundering investigation`,
        riskLevel: 'MEDIUM',
        sourceUrl: 'https://news.example.com/financial-crime-investigation',
    })];
}

// ═══════════════════════════════════════════════════════════════════
// TRADE VIOLATION GENERATORS
// ═══════════════════════════════════════════════════════════════════

function tradeRelatedParty(c: CustomerPoolData, acc: string): any[] {
    const sharedAddress = randomAddress();
    const applicantName = c.customerNameEng ? `${c.customerNameEng} Trading` : randomCompany();
    return [baseLC(c.customerId, acc, {
        applicantName, applicantAddress: sharedAddress,
        beneficiaryAddress: sharedAddress, // Same address triggers TBML-001
        parties: [
            baseParty('APPLICANT', { partyName: applicantName, partyAddress: sharedAddress, country: 'BD' }),
            baseParty('BENEFICIARY', { partyAddress: sharedAddress, country: 'CN' }),
            baseParty('ISSUING_BANK', { partyType: 'BANK', country: 'BD' }),
        ],
    })];
}

function tradeResidentialAddress(c: CustomerPoolData, acc: string): any[] {
    const residentialAddr = 'House 42, Flat 3B, Apartment Complex, Dhanmondi, Dhaka';
    return [baseLC(c.customerId, acc, {
        beneficiaryAddress: residentialAddr,
        parties: [
            baseParty('APPLICANT', { country: 'BD' }),
            baseParty('BENEFICIARY', { partyAddress: residentialAddr, country: 'CN' }),
            baseParty('ISSUING_BANK', { partyType: 'BANK' }),
        ],
    })];
}

function tradeShortValidity(c: CustomerPoolData, acc: string): any[] {
    const today = daysAgo(0);
    const expiry = futureDate(5); // < 7 days validity
    return [baseLC(c.customerId, acc, { issueDate: today, expiryDate: expiry })];
}

function tradePEP(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        parties: [
            baseParty('APPLICANT', { pepFlag: true, riskRating: 'HIGH', country: 'BD' }),
            baseParty('BENEFICIARY', { country: 'CN' }),
            baseParty('ISSUING_BANK', { partyType: 'BANK' }),
        ],
    })];
}

function tradeUnexplainedIntermediary(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        parties: [
            baseParty('APPLICANT', { country: 'BD' }),
            baseParty('BENEFICIARY', { country: 'CN' }),
            baseParty('BROKER', { partyAddress: '', country: '', partyName: 'Unknown Agent' }),
            baseParty('ISSUING_BANK', { partyType: 'BANK' }),
        ],
    })];
}

function tradeTooManyIntermediaries(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        parties: [
            baseParty('APPLICANT', { country: 'BD' }),
            baseParty('BENEFICIARY', { country: 'CN' }),
            baseParty('ISSUING_BANK', { partyType: 'BANK' }),
            baseParty('BROKER', { country: 'SG' }),
            baseParty('FREIGHT_FORWARDER', { country: 'AE' }),
            baseParty('INTERMEDIARY', { country: 'HK' }),
            baseParty('THIRD_PARTY_BENEFICIARY', { country: 'MY' }),
        ],
    })];
}

function tradeComplexStructure(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        transferableLc: true,
        transshipmentAllowed: true,
        parties: [
            baseParty('APPLICANT', { country: 'BD' }),
            baseParty('BENEFICIARY', { country: 'CN' }),
            baseParty('ISSUING_BANK', { partyType: 'BANK', country: 'BD' }),
            baseParty('CONFIRMING_BANK', { partyType: 'BANK', country: 'SG' }),
            baseParty('BROKER', { country: 'AE' }),
        ],
    })];
}

function tradeNonStandardTerms(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        goodsDescription: 'Various goods as per proforma invoice - assignable - bearer instrument - without recourse to drawer',
    })];
}

function tradeFrequentAmendment(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        status: 'AMENDED',
        amendments: Array.from({ length: 5 }, (_, i) => baseAmendment({
            amendmentNumber: i + 1,
            frequentAmendmentFlag: i >= 2,
            suspiciousChangeFlag: i >= 3,
            amendmentType: faker.helpers.arrayElement(['AMOUNT', 'BENEFICIARY', 'TERMS', 'EXPIRY', 'GOODS']),
        })),
    })];
}

function tradeShellCompany(c: CustomerPoolData, acc: string): any[] {
    const shellCountry = faker.helpers.arrayElement(SHELL_JURISDICTIONS);
    return [baseLC(c.customerId, acc, {
        beneficiaryCountry: shellCountry,
        parties: [
            baseParty('APPLICANT', { country: 'BD' }),
            baseParty('BENEFICIARY', { country: shellCountry, highRiskJurisdiction: true }),
            baseParty('ISSUING_BANK', { partyType: 'BANK' }),
        ],
    })];
}

function tradeGuaranteeNoRef(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        lcType: 'STANDBY',
        contractReference: '',
    })];
}

function tradeFakeUnderlying(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        status: 'OPENED',
        invoices: [],
        shipments: [],
    })];
}

function tradePricingAnomaly(c: CustomerPoolData, acc: string, type: 'over' | 'under' | 'unusual'): any[] {
    const overrides: Record<string, any> = { priceAnomalyFlag: true };
    const invOverrides: Record<string, any> = { priceDeviation: type === 'unusual' ? 65 : 85, priceAnomalyScore: 80 };
    if (type === 'over') { invOverrides.overInvoicingFlag = true; invOverrides.unitPrice = 5000; invOverrides.marketPriceRef = 500; }
    if (type === 'under') { invOverrides.underInvoicingFlag = true; invOverrides.unitPrice = 50; invOverrides.marketPriceRef = 500; }
    if (type === 'unusual') { invOverrides.unitPrice = 2500; invOverrides.marketPriceRef = 500; }
    overrides.invoices = [baseInvoice(invOverrides)];
    return [baseLC(c.customerId, acc, overrides)];
}

function tradeExcessiveCharges(c: CustomerPoolData, acc: string): any[] {
    const lcAmount = 500000;
    return [baseLC(c.customerId, acc, {
        amount: lcAmount,
        invoices: [baseInvoice({
            totalAmount: lcAmount,
            freightAmount: Math.round(lcAmount * 0.10),
            insuranceAmount: Math.round(lcAmount * 0.08),
            taxAmount: Math.round(lcAmount * 0.05),
        })],
    })];
}

function tradeDoubleInvoice(c: CustomerPoolData, acc: string): any[] {
    const seller = randomCompany();
    const amount = bdtAmt(100000, 500000);
    return [baseLC(c.customerId, acc, {
        invoices: [
            baseInvoice({ sellerName: seller, totalAmount: amount, netAmount: amount }),
            baseInvoice({ sellerName: seller, totalAmount: amount, netAmount: amount }),
        ],
    })];
}

function tradeInconsistentPayment(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, { paymentTerms: 'AT_SIGHT', tenorDays: 90 })];
}

function tradeThirdPartyPayment(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, { paymentToThirdParty: true })];
}

function tradePaymentCountryMismatch(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        beneficiaryCountry: 'CN',
        paymentCountry: 'AE', // Different from beneficiary
    })];
}

function tradeLastMinuteChange(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        amendments: [baseAmendment({
            amendmentType: 'BENEFICIARY',
            suspiciousChangeFlag: true,
            reason: 'Change of beneficiary bank account and payment routing',
        })],
    })];
}

function tradeApplicantControlsPayment(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        goodsDescription: 'Electronic components as per contract - payment subject to applicant approval and buyer discretion',
    })];
}

function tradeEarlyGuaranteeClaim(c: CustomerPoolData, acc: string): any[] {
    const issDate = daysAgo(15);
    return [baseLC(c.customerId, acc, {
        lcType: 'STANDBY',
        issueDate: issDate,
        status: 'UTILIZED',
        utilizedAmount: bdtAmt(300000, 800000),
    })];
}

function tradeFraudulentLoU(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        lcType: 'STANDBY',
        collateralAmount: 0,
        amount: bdtAmt(5000000, 20000000),
    })];
}

function tradePhantomShipment(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        status: 'OPENED',
        shipments: [],
        documents: [],
    })];
}

function tradeUnclearGoods(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        goodsDescription: 'General merchandise and various goods as described',
    })];
}

function tradePatternDeviation(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        amount: bdtAmt(5000000, 15000000), // Unusually high
    })];
}

function tradeDualUse(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        dualUseGoodsFlag: true,
        goodsDescription: 'Centrifuge equipment and precision machining tools for industrial use',
        hsCode: '8456', // Machine tools HS code
    })];
}

function tradeHSCodeMismatch(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        hsCode: '8471', // LC says computer equipment
        invoices: [baseInvoice({ hsCode: '6204' })], // Invoice says clothing
    })];
}

function tradeQuantityOverload(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        shipments: [baseShipment({
            totalWeight: 35000, // Exceeds 28000 * 1 * 1.1 = 30800
            weightUnit: 'KG',
            packageCount: 1,
        })],
    })];
}

function tradeHighRiskGoods(c: CustomerPoolData, acc: string): any[] {
    const keyword = faker.helpers.arrayElement(HIGH_RISK_GOODS_KEYWORDS);
    return [baseLC(c.customerId, acc, {
        goodsDescription: `Refined ${keyword} bars and ${keyword} products for export`,
    })];
}

function tradeInconsistentRoute(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        shipments: [baseShipment({ circuitousRouteFlag: true, originCountry: 'CN', destinationCountry: 'BD', transshipmentPort: 'Durban' })],
    })];
}

function tradeUnjustifiedTransshipment(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        transshipmentAllowed: true,
        shipments: [baseShipment({ transshipmentPort: 'Colombo', originCountry: 'CN', destinationCountry: 'BD' })],
    })];
}

function tradeUnclearShipping(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        shipmentMode: '',
        portOfLoading: '',
        portOfDischarge: '',
    })];
}

function tradeOriginMismatch(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        beneficiaryCountry: 'CN',
        shipments: [baseShipment({ originCountry: 'VN', destinationCountry: 'BD' })],
    })];
}

function tradeUntrackableVessel(c: CustomerPoolData, acc: string, sanctioned: boolean): any[] {
    const shipOverrides = sanctioned
        ? { sanctionedVesselFlag: true, vesselName: 'MV Sanctioned Vessel', vesselFlag: 'KP' }
        : { vesselName: '', vesselImo: 0 };
    return [baseLC(c.customerId, acc, {
        shipmentMode: 'SEA',
        shipments: [baseShipment(shipOverrides)],
    })];
}

function tradeMissingContainers(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        shipments: [baseShipment({ containerNumbers: [], packageCount: 50 })],
    })];
}

function tradeFATFCountry(c: CustomerPoolData, acc: string, blacklist: boolean): any[] {
    const country = faker.helpers.arrayElement(blacklist ? FATF_BLACKLIST : FATF_GREYLIST);
    return [baseLC(c.customerId, acc, {
        beneficiaryCountry: country,
        highRiskCountryFlag: true,
        parties: [
            baseParty('APPLICANT', { country: 'BD' }),
            baseParty('BENEFICIARY', { country, highRiskJurisdiction: true, riskRating: blacklist ? 'CRITICAL' : 'HIGH' }),
            baseParty('ISSUING_BANK', { partyType: 'BANK' }),
        ],
    })];
}

function tradeHighRiskCountryFlag(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, { highRiskCountryFlag: true })];
}

function tradeSanctionedEntity(c: CustomerPoolData, acc: string, hit: boolean): any[] {
    return [baseLC(c.customerId, acc, {
        parties: [
            baseParty('APPLICANT', { country: 'BD' }),
            baseParty('BENEFICIARY', {
                screeningResult: hit ? 'HIT' : 'POTENTIAL_MATCH',
                sanctionScreened: true,
                riskRating: 'CRITICAL',
                country: faker.helpers.arrayElement(SANCTIONED_COUNTRIES),
            }),
            baseParty('ISSUING_BANK', { partyType: 'BANK' }),
        ],
    })];
}

function tradeDocDiscrepancy(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        invoices: [baseInvoice({ discrepancyFound: true, discrepancyDetails: 'Goods description does not match BL' })],
        documents: [baseDocument('COMMERCIAL_INVOICE', { discrepancyFound: true, discrepancyNotes: 'Amount mismatch between invoice and LC' })],
    })];
}

function tradeLCClauseAbuse(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        goodsDescription: 'Goods per contract - all discrepancy acceptable - documents may be presented in any form',
    })];
}

function tradeEssentialDocsMissing(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        status: 'DOCUMENTS_RECEIVED',
        documents: [baseDocument('PACKING_LIST')], // Missing BL, Invoice, and CoO
    })];
}

function tradeExcessiveWaivers(c: CustomerPoolData, acc: string): any[] {
    const lcAmount = 500000;
    return [baseLC(c.customerId, acc, {
        amount: lcAmount,
        utilizedAmount: Math.round(lcAmount * 1.15), // 115% > 110% threshold
        balanceAmount: -Math.round(lcAmount * 0.15),
    })];
}

function tradeExcessiveDiscrepancyAcceptance(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        documents: [
            baseDocument('COMMERCIAL_INVOICE', { discrepancyFound: true, discrepancyNotes: 'Minor amount discrepancy' }),
            baseDocument('BILL_OF_LADING', { discrepancyFound: true, discrepancyNotes: 'Date inconsistency' }),
            baseDocument('CERTIFICATE_OF_ORIGIN', { discrepancyFound: true, discrepancyNotes: 'Country code mismatch' }),
            baseDocument('PACKING_LIST', { discrepancyFound: true, discrepancyNotes: 'Weight discrepancy' }),
        ],
    })];
}

function tradeAlteredDocs(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        documents: [baseDocument('COMMERCIAL_INVOICE', { discrepancyFound: true, verified: false, discrepancyNotes: 'Document appears altered' })],
    })];
}

function tradeReusedDocs(c: CustomerPoolData, acc: string): any[] {
    const hash = faker.string.alphanumeric(64);
    return [baseLC(c.customerId, acc, {
        documents: [
            baseDocument('BILL_OF_LADING', { documentHash: hash }),
            baseDocument('COMMERCIAL_INVOICE', { documentHash: hash }), // Same hash = reused
        ],
    })];
}

function tradeCarousel(c: CustomerPoolData, acc: string): any[] {
    // 3 LCs between BD and CN in opposite directions
    return [
        baseLC(c.customerId, acc, { lcType: 'IMPORT', originCountry: 'CN', destinationCountry: 'BD', issueDate: daysAgo(80) }),
        baseLC(c.customerId, acc, { lcType: 'EXPORT', originCountry: 'BD', destinationCountry: 'CN', issueDate: daysAgo(50) }),
        baseLC(c.customerId, acc, { lcType: 'IMPORT', originCountry: 'CN', destinationCountry: 'BD', issueDate: daysAgo(20) }),
    ];
}

function tradeLayering(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        parties: [
            baseParty('APPLICANT', { country: 'BD' }),
            baseParty('BENEFICIARY', { country: 'AE' }),
            baseParty('BROKER', { country: 'SG' }),
            baseParty('FREIGHT_FORWARDER', { country: 'PA' }),
            baseParty('THIRD_PARTY_BENEFICIARY', { country: 'HK' }),
            baseParty('ISSUING_BANK', { partyType: 'BANK', country: 'BD' }),
        ],
    })];
}

function tradeFTZAbuse(c: CustomerPoolData, acc: string): any[] {
    const ftzPort = faker.helpers.arrayElement(FTZ_PORTS);
    return [baseLC(c.customerId, acc, {
        shipments: [baseShipment({ transshipmentPort: ftzPort, portOfLoading: ftzPort })],
        transshipmentAllowed: true,
    })];
}

function tradeMirror(c: CustomerPoolData, acc: string): any[] {
    const amount = bdtAmt(500000, 2000000);
    return [
        baseLC(c.customerId, acc, { lcType: 'IMPORT', amount, originCountry: 'CN', destinationCountry: 'BD', issueDate: daysAgo(3) }),
        baseLC(c.customerId, acc, { lcType: 'EXPORT', amount: Math.round(amount * (0.96 + Math.random() * 0.08)), originCountry: 'BD', destinationCountry: 'CN', issueDate: daysAgo(1) }),
    ];
}

function tradeBMPE(c: CustomerPoolData, acc: string): any[] {
    const corridor = faker.helpers.arrayElement(BMPE_CORRIDORS);
    return [baseLC(c.customerId, acc, {
        applicantCountry: corridor[0],
        beneficiaryCountry: corridor[1],
        originCountry: corridor[0],
        destinationCountry: corridor[1],
    })];
}

function tradeQuantityMisrep(c: CustomerPoolData, acc: string): any[] {
    const lcQty = 1000;
    return [baseLC(c.customerId, acc, {
        quantity: lcQty,
        invoices: [baseInvoice({ quantity: Math.round(lcQty * 1.25) })], // 25% deviation > 10%
    })];
}

function tradeLCAFExcess(c: CustomerPoolData, acc: string): any[] {
    const lcafValue = 500000;
    return [baseLC(c.customerId, acc, {
        amount: Math.round(lcafValue * 1.12), // 12% > 5% threshold
    })];
}

function tradeExportBasketMismatch(c: CustomerPoolData, acc: string): any[] {
    return [baseLC(c.customerId, acc, {
        originCountry: 'BD', // Bangladesh typically exports garments
        hsCode: '8471', // But LC is for computer equipment — mismatch
        goodsDescription: 'Advanced computer servers and networking equipment',
    })];
}

function tradeMultipleLCSameCollateral(c: CustomerPoolData, acc: string): any[] {
    const collateralRef = `CLT-${faker.number.int({ min: 10000, max: 99999 })}`;
    return [
        baseLC(c.customerId, acc, { contractReference: collateralRef, collateralAmount: 200000, status: 'OPENED' }),
        baseLC(c.customerId, acc, { contractReference: collateralRef, collateralAmount: 200000, status: 'OPENED' }),
    ];
}

function tradeHawalaAdvance(c: CustomerPoolData, acc: string): any[] {
    const lcAmount = bdtAmt(1000000, 5000000);
    return [baseLC(c.customerId, acc, {
        amount: lcAmount,
        utilizedAmount: Math.round(lcAmount * 0.6), // 60% advance > 50% threshold
        paymentTerms: 'RED_CLAUSE',
    })];
}

// ═══════════════════════════════════════════════════════════════════
// MAIN DISPATCH
// ═══════════════════════════════════════════════════════════════════

export function getRuleCatalog(): RuleInfo[] {
    return RULE_CATALOG;
}

export function generateViolationData(ruleCode: string): ViolationOutput {
    const rule = RULE_CATALOG.find(r => r.code === ruleCode);
    if (!rule) throw new Error(`Unknown rule code: ${ruleCode}`);

    const customerPool = readCustomerPool();
    const accountPool = readAccountPool();

    if (customerPool.length === 0) {
        throw new Error('Customer pool is empty. Please generate and send customers first via the standard webhook flow.');
    }

    const c = pickCustomer(customerPool);
    const acc = accountPool.length > 0 ? pickAccount(accountPool) : faker.finance.accountNumber();
    const accNote = accountPool.length === 0 ? ' (Note: No accounts in pool — using random account number. Generate accounts first for accurate matching.)' : '';

    let records: any[];
    let explanation: string;
    let note: string = accNote;

    switch (ruleCode) {
        // ══════════════ TRANSACTION RULES ══════════════
        case 'CASH_THRESHOLD':
            records = txnLargeAmount(c, acc, { amount: bdtAmt(1100000, 1500000), type: 'CASH_DEPOSIT', paymentMethod: 'Cash' });
            explanation = `Single cash deposit of BDT ${records[0].amount.toLocaleString()} exceeds CTR threshold (BDT 1,000,000). Customer: ${c.customerNameEng || c.customerId}.`;
            break;
        case 'CASH_DEPOSIT_ANOMALY':
            records = txnLargeAmount(c, acc, { amount: bdtAmt(600000, 900000), type: 'CASH_DEPOSIT', paymentMethod: 'Cash' });
            explanation = `Large cash deposit of BDT ${records[0].amount.toLocaleString()} — expected to exceed 200% of 90-day average for customer ${c.customerId}.`;
            break;
        case 'CASH_VS_INSTRUMENT_RATIO':
            records = Array.from({ length: 7 }, () => baseTxn(c.customerId, acc, {
                amount: bdtAmt(50000, 200000), type: 'CASH_DEPOSIT', direction: 'IN', paymentMethod: 'Cash', timestamp: randomHoursAgo(0, 600),
            }));
            explanation = `7 cash transactions out of 7 total (100% cash ratio > 80% threshold) within 30 days for customer ${c.customerId}.`;
            break;
        case 'DENOMINATION_EXCHANGE':
            records = txnLargeAmount(c, acc, { amount: bdtAmt(550000, 800000), type: 'DENOMINATION_EXCHANGE', paymentMethod: 'Cash', purpose: 'Denomination exchange - small to large bills' });
            explanation = `Denomination exchange of BDT ${records[0].amount.toLocaleString()} exceeds BDT 500,000 threshold.`;
            break;
        case 'ATM_CASH_EVASION':
            records = txnLargeAmount(c, acc, { amount: bdtAmt(350000, 500000), type: 'ATM_DEPOSIT', paymentMethod: 'ATM', purpose: 'ATM Cash Deposit' });
            explanation = `ATM cash deposit of BDT ${records[0].amount.toLocaleString()} exceeds BDT 300,000 — possible staff avoidance.`;
            break;
        case 'STRUCTURING':
            records = txnStructuring(c, acc, { count: 3, minAmt: 900000, maxAmt: 990000, hoursSpan: 36 });
            explanation = `${records.length} cash deposits each BDT 900K-990K (just below 1M CTR) within 48h. Total: BDT ${records.reduce((s, r) => s + r.amount, 0).toLocaleString()}.`;
            break;
        case 'AGGREGATE_STRUCTURING':
            records = txnStructuring(c, acc, { count: 5, minAmt: 200000, maxAmt: 350000, hoursSpan: 40 });
            explanation = `${records.length} small deposits aggregating BDT ${records.reduce((s, r) => s + r.amount, 0).toLocaleString()} (exceeds BDT 1M) within 48h.`;
            break;
        case 'MULTI_ACCOUNT_STRUCTURING': {
            const accs = accountPool.length >= 2 ? pickN(accountPool, 2) : [acc, faker.finance.accountNumber()];
            const receiver = c.customerNameEng || randomName();
            records = accs.map(a => baseTxn(c.customerId, a, {
                amount: bdtAmt(550000, 700000), type: 'WIRE_TRANSFER', direction: 'OUT', paymentMethod: 'Wire Transfer',
                timestamp: randomHoursAgo(1, 24), receiver, receiverAccount: acc,
            }));
            explanation = `Transfers from ${accs.length} different accounts to same beneficiary totaling BDT ${records.reduce((s, r) => s + r.amount, 0).toLocaleString()}.`;
            break;
        }
        case 'COORDINATED_STRUCTURING': {
            const customers = pickN(customerPool, Math.min(3, customerPool.length));
            records = customers.map(cust => baseTxn(cust.customerId, acc, {
                amount: bdtAmt(200000, 350000), type: 'CASH_DEPOSIT', direction: 'IN', paymentMethod: 'Cash',
                timestamp: randomHoursAgo(0, 1.5),
                sender: cust.customerNameEng || randomName(),
            }));
            explanation = `${customers.length} customers depositing cash at same branch within 2 hours. Total: BDT ${records.reduce((s, r) => s + r.amount, 0).toLocaleString()}.`;
            break;
        }
        case 'VELOCITY_COUNT':
            records = txnVelocity(c, acc, 25);
            explanation = `25 transactions within 24 hours (threshold: 20) for customer ${c.customerId}.`;
            break;
        case 'RAPID_IN_OUT':
            records = txnRapidInOut(c, acc, bdtAmt(1200000, 2000000));
            explanation = `BDT ${records[0].amount.toLocaleString()} credit followed by BDT ${records[1].amount.toLocaleString()} debit (${Math.round(records[1].amount / records[0].amount * 100)}%) within 24h.`;
            break;
        case 'SUDDEN_VOLUME_INCREASE':
            records = txnCumulativeAmount(c, acc, bdtAmt(5000000, 10000000), 15, 120);
            explanation = `15 transactions totaling BDT ${records.reduce((s, r) => s + r.amount, 0).toLocaleString()} — designed to create 300%+ spike over prior week.`;
            note += ' Ensure prior week has minimal activity for this customer to trigger the 300% spike.';
            break;
        case 'WIRE_VELOCITY': {
            const beneficiaries = [randomName(), randomName(), randomName()];
            records = Array.from({ length: 7 }, (_, i) => baseTxn(c.customerId, acc, {
                amount: bdtAmt(200000, 800000), type: 'WIRE_TRANSFER', direction: 'OUT', paymentMethod: 'Wire Transfer',
                timestamp: randomHoursAgo(i * 3, (i + 1) * 3),
                receiver: beneficiaries[i % 3], receiverAccount: faker.finance.accountNumber(),
            }));
            explanation = `7 wire transfers to 3 different beneficiaries within 24h (threshold: >5 wires, >2 beneficiaries).`;
            break;
        }
        case 'SINGLE_AMOUNT':
            records = txnLargeAmount(c, acc, { amount: bdtAmt(5500000, 8000000), type: 'WIRE_TRANSFER', paymentMethod: 'Wire Transfer' });
            explanation = `Single transaction of BDT ${records[0].amount.toLocaleString()} exceeds BDT 5,000,000 threshold.`;
            break;
        case 'CUMULATIVE_DAILY':
            records = txnCumulativeAmount(c, acc, bdtAmt(11000000, 15000000), 6, 20);
            explanation = `6 transactions totaling BDT ${records.reduce((s, r) => s + r.amount, 0).toLocaleString()} in 24h (threshold: BDT 10,000,000).`;
            break;
        case 'CUMULATIVE_WEEKLY':
            records = txnCumulativeAmount(c, acc, bdtAmt(26000000, 35000000), 12, 150);
            explanation = `12 transactions totaling BDT ${records.reduce((s, r) => s + r.amount, 0).toLocaleString()} in 7 days (threshold: BDT 25,000,000).`;
            break;
        case 'CASH_INSTRUMENT_CONVERSION': {
            const cashAmt = bdtAmt(500000, 800000);
            records = [
                ...Array.from({ length: 3 }, () => baseTxn(c.customerId, acc, {
                    amount: Math.round(cashAmt / 3), type: 'CASH_DEPOSIT', direction: 'IN', paymentMethod: 'Cash',
                    timestamp: randomHoursAgo(48, 120),
                })),
                baseTxn(c.customerId, acc, {
                    amount: Math.round(cashAmt * 0.9), type: 'PAY_ORDER', direction: 'OUT', paymentMethod: 'Pay Order',
                    timestamp: randomHoursAgo(1, 24), purpose: 'Purchase of pay order',
                }),
            ];
            explanation = `Cash deposits of ~BDT ${cashAmt.toLocaleString()} followed by pay order purchase of 90% within 168h.`;
            break;
        }
        case 'KYC_MISMATCH':
            records = txnCumulativeAmount(c, acc, bdtAmt(6000000, 10000000), 8, 600);
            explanation = `BDT ${records.reduce((s, r) => s + r.amount, 0).toLocaleString()} in 30 days — rule checks if this exceeds 200% of customer's declared profile.`;
            note += ' This rule depends on the customer\'s declared income/profile already existing in the system.';
            break;
        case 'NON_EARNING_ACTIVITY':
            records = txnCumulativeAmount(c, acc, bdtAmt(600000, 1000000), 4, 500);
            explanation = `BDT ${records.reduce((s, r) => s + r.amount, 0).toLocaleString()} in 30 days for customer ${c.customerId}.`;
            note += ' PREREQUISITE: Customer must have a non-earning occupation (Housewife, Student, Unemployed, Retired) in their profile.';
            break;
        case 'SUDDEN_LOAN_PAYOFF':
            records = txnLargeAmount(c, acc, { amount: bdtAmt(1200000, 2000000), type: 'LOAN_PAYMENT', paymentMethod: 'Cash', purpose: 'Loan repayment' });
            explanation = `Sudden loan payment of BDT ${records[0].amount.toLocaleString()} (threshold: BDT 1,000,000 in 72h).`;
            break;
        case 'THIRD_PARTY_UNEXPLAINED':
            records = [baseTxn(c.customerId, acc, {
                amount: bdtAmt(600000, 1000000), type: 'WIRE_TRANSFER', direction: 'IN', paymentMethod: 'Wire Transfer',
                timestamp: randomHoursAgo(2, 12), sender: randomName(), purpose: '',
            })];
            explanation = `Third-party credit of BDT ${records[0].amount.toLocaleString()} with no stated purpose.`;
            break;
        case 'DOCUMENT_RELUCTANCE':
            records = txnCumulativeAmount(c, acc, bdtAmt(150000, 300000), 3, 500);
            explanation = `Transactions totaling BDT ${records.reduce((s, r) => s + r.amount, 0).toLocaleString()} for customer with incomplete KYC.`;
            note += ' PREREQUISITE: Customer must have KYC status = INCOMPLETE/PENDING/REJECTED in the system.';
            break;
        case 'SHELL_COMPANY':
            records = txnCumulativeAmount(c, acc, bdtAmt(12000000, 20000000), 5, 200);
            explanation = `BDT ${records.reduce((s, r) => s + r.amount, 0).toLocaleString()} volume in only ${records.length} active days within 90 days.`;
            note += ' PREREQUISITE: Customer must be a CORPORATE type with high-risk rating.';
            break;
        case 'HIGH_RISK_COUNTRY':
            records = txnGeographic(c, acc, FATF_BLACKLIST, { amount: bdtAmt(100000, 1000000) });
            explanation = `Transfer to FATF blacklist country ${records[0].receiverCountry} (amount: BDT ${records[0].amount.toLocaleString()}).`;
            break;
        case 'TAX_HAVEN':
            records = txnGeographic(c, acc, TAX_HAVENS, { amount: bdtAmt(500000, 3000000) });
            explanation = `Transfer to tax haven ${records[0].receiverCountry} (amount: BDT ${records[0].amount.toLocaleString()}).`;
            break;
        case 'LANDLOCKED_ANOMALY':
            records = txnGeographic(c, acc, LANDLOCKED, { purpose: 'Shipping payment for goods transport', amount: bdtAmt(200000, 800000) });
            explanation = `Shipping-related payment to landlocked country ${records[0].receiverCountry} — maritime shipping implausible.`;
            break;
        case 'CROSS_BORDER_SUSPICIOUS':
            records = txnMultiCountry(c, acc, ['AE', 'SG', 'HK', 'MY', 'TH'], 4, { paymentMethod: 'Wire Transfer' });
            explanation = `Cross-border transfers to ${records.length} different countries within 24h (threshold: ≥3 countries).`;
            break;
        case 'PEP_MONITORING':
            records = txnLargeAmount(c, acc, { amount: bdtAmt(150000, 500000), type: 'WIRE_TRANSFER', paymentMethod: 'Wire Transfer' });
            explanation = `Transaction of BDT ${records[0].amount.toLocaleString()} (PEP threshold: BDT 100,000).`;
            note += ' PREREQUISITE: Customer must be flagged as PEP in the system.';
            break;
        case 'PEP_LIFESTYLE':
            records = txnCumulativeAmount(c, acc, bdtAmt(6000000, 10000000), 8, 600).map(r => ({ ...r, direction: 'OUT' }));
            explanation = `BDT ${records.reduce((s, r) => s + r.amount, 0).toLocaleString()} outgoing spending in 30 days for PEP customer.`;
            note += ' PREREQUISITE: Customer must be flagged as PEP.';
            break;
        case 'PEP_ASSOCIATE':
            records = txnLargeAmount(c, acc, { amount: bdtAmt(500000, 2000000), type: 'WIRE_TRANSFER', paymentMethod: 'Wire Transfer' });
            explanation = `Transfer of BDT ${records[0].amount.toLocaleString()} — rule requires customer relationship graph linking to PEP.`;
            note += ' This rule depends on the customer relationship graph in the system.';
            break;
        case 'HIGH_RISK_CUSTOMER':
            records = txnLargeAmount(c, acc, { amount: bdtAmt(300000, 600000), type: 'WIRE_TRANSFER', paymentMethod: 'Wire Transfer' });
            explanation = `Transaction of BDT ${records[0].amount.toLocaleString()} (high-risk threshold: BDT 250,000 = 50% of normal BDT 500,000).`;
            note += ' PREREQUISITE: Customer must have HIGH/VERY_HIGH/CRITICAL risk rating.';
            break;
        case 'DORMANT_ACTIVATION':
            records = txnLargeAmount(c, acc, { amount: bdtAmt(150000, 500000), type: 'CASH_DEPOSIT', paymentMethod: 'Cash' });
            explanation = `Deposit of BDT ${records[0].amount.toLocaleString()} on account.`;
            note += ' PREREQUISITE: The account must have been dormant (no activity) for ≥180 days in the system.';
            break;
        case 'NEW_ACCOUNT_ACTIVITY':
            records = txnCumulativeAmount(c, acc, bdtAmt(600000, 1200000), 4, 48);
            explanation = `BDT ${records.reduce((s, r) => s + r.amount, 0).toLocaleString()} activity on new account.`;
            note += ' PREREQUISITE: Account must be ≤30 days old in the system.';
            break;
        case 'FUNNEL_ACCOUNT':
            records = txnFunnel(c, acc);
            explanation = `${records.length - 1} inbound transfers from different senders consolidated into 1 large outbound (funnel pattern).`;
            break;
        case 'FLOW_THROUGH':
            records = txnFlowThrough(c, acc);
            explanation = `${records.length} transactions with near-balanced in/out flow — flow-through account pattern.`;
            break;
        case 'SAFE_DEPOSIT_SURGE':
            records = Array.from({ length: 4 }, (_, i) => baseTxn(c.customerId, acc, {
                amount: 0, type: 'SAFE_DEPOSIT', direction: 'IN', paymentMethod: 'Other',
                timestamp: randomHoursAgo(i * 24, (i + 1) * 24), purpose: 'Safe deposit box access',
            }));
            explanation = `4 safe deposit box accesses in 7 days (threshold: ≥3 accesses per 168h).`;
            break;
        case 'REMITTANCE_ANOMALY':
            records = txnMultiCountry(c, acc, ['AE', 'MY', 'SG', 'SA', 'QA'], 4, { type: 'REMITTANCE', paymentMethod: 'Wire Transfer' });
            explanation = `Outbound remittances to ${records.length} different countries within 168h (threshold: ≥3).`;
            break;
        case 'SMALL_DEPOSIT_LARGE_WIRE':
            records = txnSmallDepositLargeWire(c, acc);
            explanation = `${records.length - 1} small cash deposits totaling BDT ${records.slice(0, -1).reduce((s, r) => s + r.amount, 0).toLocaleString()} → 1 international wire of BDT ${records[records.length - 1].amount.toLocaleString()}. TF indicator.`;
            break;
        case 'CORRESPONDENT_ANOMALY':
            records = txnLargeAmount(c, acc, { amount: bdtAmt(55000000, 80000000), type: 'NOSTRO', paymentMethod: 'Nostro Transfer', purpose: 'Nostro account settlement' });
            explanation = `Correspondent banking transfer of BDT ${records[0].amount.toLocaleString()} (threshold: BDT 50,000,000).`;
            break;
        case 'ROUND_TRIP':
            records = txnRoundTrip(c, acc);
            explanation = `Circular fund flow: 2 round-trips with same counterparty at ±5% amounts within 30 days.`;
            break;
        case 'SAME_DAY_IN_OUT':
            records = txnRapidInOut(c, acc, bdtAmt(600000, 1000000));
            explanation = `Same-day in BDT ${records[0].amount.toLocaleString()} / out BDT ${records[1].amount.toLocaleString()} (${Math.round(records[1].amount / records[0].amount * 100)}% matching).`;
            break;
        case 'COMPLEX_CHAIN':
            records = txnComplexChain(c, acc);
            explanation = `${records.length}-hop transfer chain across ${new Set(records.map(r => r.senderCountry).concat(records.map(r => r.receiverCountry))).size} countries.`;
            break;
        case 'AUTO_CTR':
            records = txnLargeAmount(c, acc, { amount: bdtAmt(1100000, 2000000), type: 'CASH_DEPOSIT', paymentMethod: 'Cash' });
            explanation = `Cash transaction of BDT ${records[0].amount.toLocaleString()} triggers automatic CTR filing.`;
            break;
        case 'STR_COMPOSITE': {
            const highRiskTxns = txnGeographic(c, acc, FATF_BLACKLIST, { amount: bdtAmt(2000000, 3000000) });
            const cashTxns = Array.from({ length: 8 }, () => baseTxn(c.customerId, acc, { amount: bdtAmt(100000, 500000), type: 'CASH_DEPOSIT', paymentMethod: 'Cash', timestamp: randomHoursAgo(0, 600) }));
            const intlTxns = txnMultiCountry(c, acc, ['AE', 'SG', 'HK', 'MY', 'TR', 'KE'], 6, {});
            records = [...highRiskTxns, ...cashTxns, ...intlTxns];
            explanation = `Composite STR indicators: high-risk country txns, 80%+ cash ratio, 6+ countries, high volume. ${records.length} total transactions.`;
            break;
        }
        case 'NGO_MISUSE':
            records = [
                ...Array.from({ length: 3 }, () => baseTxn(c.customerId, acc, {
                    amount: bdtAmt(300000, 500000), type: 'Payment', direction: 'OUT', paymentMethod: 'Wire Transfer',
                    timestamp: randomHoursAgo(0, 600), purpose: 'Luxury vehicle purchase',
                })),
                baseTxn(c.customerId, acc, {
                    amount: bdtAmt(100000, 200000), type: 'Payment', direction: 'OUT', paymentMethod: 'Transfer',
                    timestamp: randomHoursAgo(0, 600), purpose: 'Program operational expenses',
                }),
            ];
            explanation = `NGO spending: 75%+ on non-operational items (vehicles, travel) vs 25% on operations.`;
            note += ' PREREQUISITE: Customer must be an NGO/NPO type entity in the system.';
            break;
        case 'ADVERSE_MEDIA_TXN':
            records = txnLargeAmount(c, acc, { amount: bdtAmt(300000, 600000), type: 'WIRE_TRANSFER', paymentMethod: 'Wire Transfer' });
            explanation = `Transaction of BDT ${records[0].amount.toLocaleString()} for customer with adverse media flag (threshold: BDT 250,000).`;
            note += ' PREREQUISITE: Customer must have adverse_media_flag = true in the system.';
            break;
        case 'SWIFT_SANCTION_RT':
            records = txnSWIFT(c, acc, SANCTIONED_COUNTRIES, 1);
            explanation = `SWIFT transfer to sanctioned country ${records[0].receiverCountry}. Action: FREEZE.`;
            break;
        case 'SANCTIONED_COUNTRY_PAYMENT':
            records = txnGeographic(c, acc, SANCTIONED_COUNTRIES, { paymentMethod: 'Wire Transfer', amount: bdtAmt(100000, 1000000) });
            explanation = `Payment to sanctioned country ${records[0].receiverCountry}. Action: block_and_report.`;
            break;
        case 'SWIFT_PATTERN_ANOMALY': {
            const swiftCountries = pickN(['AE', 'SG', 'HK', 'GB', 'DE', 'JP', 'AU', 'CA'], 6);
            records = Array.from({ length: 12 }, (_, i) => baseTxn(c.customerId, acc, {
                amount: bdtAmt(200000, 1000000), type: 'SWIFT', direction: 'OUT', paymentMethod: 'SWIFT',
                senderCountry: 'BD', receiverCountry: swiftCountries[i % 6],
                timestamp: randomHoursAgo(i * 12, (i + 1) * 12),
            }));
            explanation = `12 SWIFT transfers to 6 different countries within 168h (threshold: ≥10 SWIFT, ≥5 countries).`;
            break;
        }

        // ══════════════ SANCTION RULES ══════════════
        case 'SANCTION_INDIVIDUAL':
            records = sanctionIndividual(customerPool);
            explanation = `Sanction entry matching customer "${records[0].name}" from pool. Fuzzy matching will trigger individual screening alert.`;
            break;
        case 'SANCTION_CORPORATE':
            records = sanctionCorporate(customerPool);
            explanation = `Corporate sanction entry matching pool customer: "${records[0].name}".`;
            break;
        case 'SANCTION_PEP':
            records = sanctionPEP(customerPool);
            explanation = `PEP entry matching customer "${records[0].name}" — position: ${records[0].position}.`;
            break;
        case 'SANCTION_VESSEL':
            records = sanctionVessel();
            explanation = `Sanctioned vessel entry: "${records[0].name}" with IMO ${records[0].properties.imoNumber?.[0]}.`;
            break;
        case 'SANCTION_ASSET':
            records = sanctionAsset();
            explanation = `Frozen asset entry: "${records[0].name}" in ${records[0].countryCodes[0]}.`;
            break;
        case 'SANCTION_ADVERSE_MEDIA':
            records = sanctionAdverseMedia(customerPool);
            explanation = `Adverse media entry for "${records[0].name}" — linked to financial crime investigation.`;
            break;

        // ══════════════ TRADE RULES ══════════════
        case 'TBML-001': records = tradeRelatedParty(c, acc); explanation = 'Applicant and beneficiary share the same address — related party indicator.'; break;
        case 'TBML-002': records = tradeResidentialAddress(c, acc); explanation = 'Beneficiary address contains residential keywords (House, Flat, Apartment).'; break;
        case 'TBML-003': records = tradeShortValidity(c, acc); explanation = `LC validity < 7 days (issued ${records[0]?.issueDate}, expires ${records[0]?.expiryDate}) — extreme pressure.`; break;
        case 'TBML-004': records = tradePEP(c, acc); explanation = 'LC applicant has PEP flag set.'; break;
        case 'TBML-005': records = tradeUnexplainedIntermediary(c, acc); explanation = 'Broker/intermediary party with missing address and country.'; break;
        case 'TBML-006': records = tradeTooManyIntermediaries(c, acc); explanation = `LC has ${records[0]?.parties?.length || 7} parties including 4 non-core intermediaries (threshold: >3).`; break;
        case 'TBML-007': records = tradeComplexStructure(c, acc); explanation = 'LC is transferable + transshipment allowed + 5 countries involved — complex structure.'; break;
        case 'TBML-008': records = [baseLC(c.customerId, acc, { goodsDescription: 'Live cattle and livestock', hsCode: '0102' })]; explanation = 'LC goods (livestock) unlikely to match customer trade profile.'; break;
        case 'TBML-009': records = tradeNonStandardTerms(c, acc); explanation = 'LC contains suspicious terms: "assignable", "bearer instrument", "without recourse".'; break;
        case 'TBML-010': records = tradeFrequentAmendment(c, acc); explanation = 'LC has 5 amendments (threshold: ≥3 medium, ≥5 high).'; break;
        case 'TBML-011': records = tradeShellCompany(c, acc); explanation = `Beneficiary registered in shell jurisdiction: ${records[0]?.beneficiaryCountry}.`; break;
        case 'TBML-012': records = tradeGuaranteeNoRef(c, acc); explanation = 'Standby LC (guarantee) without underlying contract reference.'; break;
        case 'TBML-013': records = tradeFakeUnderlying(c, acc); explanation = 'Active LC with zero invoices and zero shipments — possible fake trade.'; break;
        case 'TBML-014': records = tradePricingAnomaly(c, acc, 'unusual'); explanation = 'Invoice unit price deviates >50% from market reference price.'; break;
        case 'TBML-015': records = tradePricingAnomaly(c, acc, 'under'); explanation = 'Invoice flagged for under-invoicing (unit price 10% of market).'; break;
        case 'TBML-016': records = tradePricingAnomaly(c, acc, 'over'); explanation = 'Invoice flagged for over-invoicing (unit price 10x market).'; break;
        case 'TBML-017': records = tradeExcessiveCharges(c, acc); explanation = 'Freight + insurance + tax charges exceed 23% of LC value (threshold: 15%).'; break;
        case 'TBML-018': records = tradeDoubleInvoice(c, acc); explanation = 'Two invoices with identical seller and amount — double invoicing.'; break;
        case 'TBML-019': records = tradeInconsistentPayment(c, acc); explanation = 'Payment terms say AT_SIGHT but tenor is 90 days — inconsistent.'; break;
        case 'TBML-020': records = tradeThirdPartyPayment(c, acc); explanation = 'Payment directed to third party (paymentToThirdParty = true).'; break;
        case 'TBML-021': records = tradePaymentCountryMismatch(c, acc); explanation = 'Payment country (AE) differs from beneficiary country (CN).'; break;
        case 'TBML-022': records = tradeLastMinuteChange(c, acc); explanation = 'Suspicious amendment changing beneficiary bank routing.'; break;
        case 'TBML-023': records = tradeApplicantControlsPayment(c, acc); explanation = 'Terms contain "applicant approval" and "buyer discretion" clauses.'; break;
        case 'TBML-024': records = tradeEarlyGuaranteeClaim(c, acc); explanation = 'Standby LC utilized within 15 days of issue (threshold: <30 days).'; break;
        case 'TBML-025': records = tradeFraudulentLoU(c, acc); explanation = 'Letter of Undertaking with zero collateral amount.'; break;
        case 'TBML-026': records = tradePhantomShipment(c, acc); explanation = 'Active LC with empty shipments[] and empty documents[] — phantom shipment.'; break;
        case 'TBML-027': records = tradeUnclearGoods(c, acc); explanation = 'Vague goods description: "General merchandise and various goods".'; break;
        case 'TBML-028': records = tradePatternDeviation(c, acc); explanation = `LC amount BDT ${records[0]?.amount?.toLocaleString()} — expected to exceed >50% of customer average.`; break;
        case 'TBML-029': records = tradeDualUse(c, acc); explanation = 'Dual-use goods flag set. Goods: centrifuge equipment and precision machining tools.'; break;
        case 'TBML-030': records = tradeHSCodeMismatch(c, acc); explanation = 'LC HS code 8471 (computers) but invoice HS code 6204 (clothing) — mismatch.'; break;
        case 'TBML-031': records = tradeQuantityOverload(c, acc); explanation = `Declared weight 35,000 KG in 1 package exceeds capacity (28,000 × 1 × 1.1 = 30,800 KG).`; break;
        case 'TBML-032': records = tradeHighRiskGoods(c, acc); explanation = `Goods description contains high-risk keyword.`; break;
        case 'TBML-033': records = tradeInconsistentRoute(c, acc); explanation = 'Circuitous route flag set — CN→BD shipment via Durban (South Africa).'; break;
        case 'TBML-034': records = tradeUnjustifiedTransshipment(c, acc); explanation = 'Transshipment via Colombo with no documented justification.'; break;
        case 'TBML-035': records = tradeUnclearShipping(c, acc); explanation = 'Missing shipping mode, port of loading, and port of discharge.'; break;
        case 'TBML-036': records = tradeOriginMismatch(c, acc); explanation = 'Beneficiary in CN but shipment origin is VN — country mismatch.'; break;
        case 'TBML-037': records = tradeUntrackableVessel(c, acc, false); explanation = 'Sea shipment with empty vessel name and zero IMO — untrackable.'; break;
        case 'TBML-038': records = tradeMissingContainers(c, acc); explanation = '50 packages declared but no container numbers provided.'; break;
        case 'TBML-039': records = tradeFATFCountry(c, acc, true); explanation = `Beneficiary from FATF blacklist country: ${records[0]?.beneficiaryCountry}.`; break;
        case 'TBML-040': records = tradeHighRiskCountryFlag(c, acc); explanation = 'LC highRiskCountryFlag is set to true.'; break;
        case 'TBML-041': records = tradeSanctionedEntity(c, acc, true); explanation = 'Beneficiary screening result: HIT — sanctioned entity.'; break;
        case 'TBML-042': records = tradeDocDiscrepancy(c, acc); explanation = 'Invoice and document have discrepancyFound = true.'; break;
        case 'TBML-043': records = tradeLCClauseAbuse(c, acc); explanation = 'LC goods description includes "all discrepancy acceptable" clause.'; break;
        case 'TBML-044': records = tradeEssentialDocsMissing(c, acc); explanation = 'Only packing list present — missing bill of lading, invoice, and certificate of origin.'; break;
        case 'TBML-045': records = tradeExcessiveWaivers(c, acc); explanation = 'Utilized amount is 115% of LC amount (threshold: 110%).'; break;
        case 'TBML-046': records = tradeExcessiveDiscrepancyAcceptance(c, acc); explanation = '4 documents with discrepancies accepted (threshold: >3).'; break;
        case 'TBML-047': records = tradeAlteredDocs(c, acc); explanation = 'Document has discrepancy AND failed verification — possibly altered.'; break;
        case 'TBML-048': records = tradeReusedDocs(c, acc); explanation = 'Two documents share the same hash — document reuse across documents.'; break;
        case 'ADV-001': records = tradeCarousel(c, acc); explanation = '3 LCs between BD↔CN in alternating directions within 90 days — carousel trading.'; break;
        case 'ADV-002': records = tradeLayering(c, acc); explanation = 'LC with 6 parties across 5 jurisdictions (BD, AE, SG, PA, HK) — trade-based layering.'; break;
        case 'ADV-003': records = tradeFTZAbuse(c, acc); explanation = `Trade routed through Free Trade Zone port: ${records[0]?.shipments?.[0]?.portOfLoading || 'FTZ'}.`; break;
        case 'ADV-004': records = tradeMirror(c, acc); explanation = `Mirror trade: 2 LCs with matching amounts in opposite directions within 7 days.`; break;
        case 'ADV-005': records = tradeBMPE(c, acc); explanation = `Trade on BMPE corridor: ${records[0]?.applicantCountry} → ${records[0]?.beneficiaryCountry}.`; break;
        case 'ADV-006': records = tradeQuantityMisrep(c, acc); explanation = 'Invoice quantity 25% higher than LC declared quantity (threshold: >10%).'; break;
        case 'ADV-007': records = tradeLCAFExcess(c, acc); explanation = 'LC amount exceeds authorized LCAF value by 12% (threshold: >5%).'; break;
        case 'ADV-008': records = tradeExportBasketMismatch(c, acc); explanation = 'Computer equipment (HS 8471) exported from BD — not in typical export basket.'; break;
        case 'ADV-009': records = tradeMultipleLCSameCollateral(c, acc); explanation = 'Two active LCs using the same collateral reference.'; break;
        case 'ADV-010': records = tradeHawalaAdvance(c, acc); explanation = '60% advance payment on RED_CLAUSE LC (threshold: >50%).'; break;
        default:
            throw new Error(`No generator implemented for rule: ${ruleCode}`);
    }

    return {
        rule,
        dataType: rule.dataType,
        records: Array.isArray(records) ? records : [records],
        recordCount: Array.isArray(records) ? records.length : 1,
        explanation,
        note: note.trim() || undefined,
    };
}
