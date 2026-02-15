import { NextRequest, NextResponse } from 'next/server';
import { logRequest } from '@/lib/logger';
import { faker } from '@faker-js/faker';

// ─── Enums matching backend trade model constants ───

const LC_TYPES = ['IMPORT', 'EXPORT', 'BACK_TO_BACK', 'STANDBY', 'TRANSFERABLE', 'DOMESTIC', 'DOCUMENTARY_COLLECTION'];
const LC_STATUSES = ['DRAFT', 'PENDING_AUTHORIZATION', 'AUTHORIZED', 'OPENED', 'ADVISED', 'ACCEPTED', 'DOCUMENTS_RECEIVED', 'DISCREPANCY', 'UTILIZED', 'EXPIRED', 'CANCELLED', 'CLOSED', 'AMENDED', 'SUSPENDED'];
const PAYMENT_TERMS = ['AT_SIGHT', 'USANCE', 'DEFERRED_PAYMENT', 'ACCEPTANCE', 'NEGOTIATION', 'MIXED_PAYMENT', 'RED_CLAUSE', 'GREEN_CLAUSE'];
const SHIPMENT_MODES = ['SEA', 'AIR', 'LAND', 'RAIL', 'COURIER', 'MULTIMODAL'];
const INCOTERMS = ['FOB', 'CFR', 'CIF', 'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
const RISK_RATINGS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const AMENDMENT_TYPES = ['AMOUNT', 'EXPIRY', 'SHIPMENT', 'BENEFICIARY', 'DOCUMENTS', 'TERMS', 'GOODS', 'TOLERANCE'];
const AMENDMENT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];
const PARTY_ROLES = ['APPLICANT', 'BENEFICIARY', 'ISSUING_BANK', 'ADVISING_BANK', 'CONFIRMING_BANK', 'NEGOTIATING_BANK', 'REIMBURSING_BANK', 'SHIPPING_COMPANY', 'INSURANCE_COMPANY', 'FREIGHT_FORWARDER', 'BROKER', 'NOTIFY_PARTY', 'CONSIGNEE', 'INSPECTION_AGENCY', 'THIRD_PARTY_BENEFICIARY'];
const PARTY_TYPES = ['INDIVIDUAL', 'ENTITY', 'BANK'];
const SCREENING_RESULTS = ['CLEAR', 'HIT', 'POTENTIAL_MATCH'];
const DOCUMENT_TYPES = ['LETTER_OF_CREDIT', 'COMMERCIAL_INVOICE', 'PACKING_LIST', 'BILL_OF_LADING', 'AIR_WAYBILL', 'INSURANCE_CERTIFICATE', 'CERTIFICATE_OF_ORIGIN', 'INSPECTION_CERTIFICATE', 'CUSTOMS_DECLARATION', 'BANK_GUARANTEE', 'SWIFT_MESSAGE', 'OTHER'];
const HS_CODES = ['8471.30', '6204.62', '8703.23', '2710.19', '8517.12', '8542.31', '0901.11', '5208.12', '7108.12', '3004.90'];
const QUANTITY_UNITS = ['KG', 'MT', 'PCS', 'CBM', 'LBS', 'CARTONS', 'BAGS', 'DRUMS', 'ROLLS', 'SETS'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'BDT', 'CNY', 'SGD', 'AED', 'INR', 'CHF'];
const PORTS = ['Shanghai', 'Singapore', 'Rotterdam', 'Antwerp', 'Hamburg', 'Los Angeles', 'Chittagong', 'Dubai', 'Hong Kong', 'Busan', 'Mumbai', 'Colombo', 'Felixstowe', 'Jeddah', 'Yokohama'];

// ─── Helper Generators ───

function generateSWIFT(): string {
    return faker.string.alpha({ length: 4, casing: 'upper' }) +
        faker.location.countryCode('alpha-2') +
        faker.string.alphanumeric({ length: 2, casing: 'upper' }) +
        faker.string.alphanumeric({ length: 3, casing: 'upper' });
}

function generateLCNumber(): string {
    return 'LC' + faker.date.recent().getFullYear() + faker.string.numeric(8);
}

function pastDate(months = 6): string {
    return faker.date.past({ years: months / 12 }).toISOString().split('T')[0];
}

function futureDate(months = 12): string {
    return faker.date.future({ years: months / 12 }).toISOString().split('T')[0];
}

function recentDate(): string {
    return faker.date.recent({ days: 30 }).toISOString().split('T')[0];
}

// ─── Nested Object Generators ───

function generateAmendment(idx: number) {
    const oldAmount = parseFloat(faker.finance.amount({ min: 10000, max: 500000, dec: 2 }));
    const amountChange = parseFloat(faker.finance.amount({ min: -50000, max: 100000, dec: 2 }));
    return {
        amendmentNumber: idx + 1,
        swiftReference: 'MT707' + faker.string.numeric(10),
        amendmentDate: recentDate(),
        amendmentType: faker.helpers.arrayElement(AMENDMENT_TYPES),
        amountChange,
        oldAmount,
        newAmount: oldAmount + amountChange,
        oldExpiryDate: pastDate(3),
        newExpiryDate: futureDate(6),
        reason: faker.lorem.sentence(),
        requestedBy: faker.company.name(),
        frequentAmendmentFlag: faker.datatype.boolean({ probability: 0.15 }),
        suspiciousChangeFlag: faker.datatype.boolean({ probability: 0.1 }),
        status: faker.helpers.arrayElement(AMENDMENT_STATUSES),
    };
}

function generateInvoice() {
    const currency = faker.helpers.arrayElement(CURRENCIES);
    const quantity = parseFloat(faker.finance.amount({ min: 10, max: 5000, dec: 2 }));
    const unitPrice = parseFloat(faker.finance.amount({ min: 1, max: 2000, dec: 4 }));
    const totalAmount = Math.round(quantity * unitPrice * 100) / 100;
    const taxAmount = Math.round(totalAmount * 0.05 * 100) / 100;
    const freightAmount = parseFloat(faker.finance.amount({ min: 500, max: 10000, dec: 2 }));
    const insuranceAmount = parseFloat(faker.finance.amount({ min: 100, max: 5000, dec: 2 }));
    const discountAmount = parseFloat(faker.finance.amount({ min: 0, max: 2000, dec: 2 }));
    const netAmount = Math.round((totalAmount + taxAmount + freightAmount + insuranceAmount - discountAmount) * 100) / 100;

    return {
        invoiceNumber: 'INV-' + faker.string.numeric(8),
        invoiceDate: recentDate(),
        sellerName: faker.company.name(),
        sellerAddress: faker.location.streetAddress(true),
        sellerCountry: faker.location.countryCode('alpha-2'),
        buyerName: faker.company.name(),
        buyerAddress: faker.location.streetAddress(true),
        buyerCountry: faker.location.countryCode('alpha-2'),
        currency,
        totalAmount,
        taxAmount,
        freightAmount,
        insuranceAmount,
        discountAmount,
        netAmount,
        goodsDescription: faker.commerce.productDescription(),
        hsCode: faker.helpers.arrayElement(HS_CODES),
        quantity,
        quantityUnit: faker.helpers.arrayElement(QUANTITY_UNITS),
        unitPrice,
        incoterms: faker.helpers.arrayElement(INCOTERMS),
        marketPriceRef: parseFloat(faker.finance.amount({ min: 1, max: 2000, dec: 4 })),
        priceDeviation: parseFloat(faker.finance.amount({ min: -20, max: 30, dec: 2 })),
        overInvoicingFlag: faker.datatype.boolean({ probability: 0.1 }),
        underInvoicingFlag: faker.datatype.boolean({ probability: 0.08 }),
        priceAnomalyScore: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
        documentsReceived: faker.datatype.boolean({ probability: 0.7 }),
        documentsVerified: faker.datatype.boolean({ probability: 0.5 }),
        discrepancyFound: faker.datatype.boolean({ probability: 0.15 }),
        discrepancyDetails: faker.datatype.boolean({ probability: 0.15 }) ? faker.lorem.sentence() : '',
        sanctionScreened: faker.datatype.boolean({ probability: 0.8 }),
        complianceCleared: faker.datatype.boolean({ probability: 0.7 }),
    };
}

function generateShipment() {
    const portOfLoading = faker.helpers.arrayElement(PORTS);
    const portOfDischarge = faker.helpers.arrayElement(PORTS.filter(p => p !== portOfLoading));
    return {
        shipmentNumber: 'SHP-' + faker.string.numeric(8),
        blNumber: faker.datatype.boolean({ probability: 0.7 }) ? ('BL' + faker.string.numeric(10)) : '',
        awbNumber: faker.datatype.boolean({ probability: 0.3 }) ? ('AWB-' + faker.string.numeric(8)) : '',
        shipmentDate: recentDate(),
        estimatedArrival: futureDate(2),
        actualArrival: faker.datatype.boolean({ probability: 0.4 }) ? recentDate() : null,
        shipmentMode: faker.helpers.arrayElement(SHIPMENT_MODES),
        vesselName: faker.airline.airplane().name + ' ' + faker.string.alpha({ length: 3, casing: 'upper' }),
        vesselImo: faker.string.numeric(7),
        vesselFlag: faker.location.countryCode('alpha-2'),
        voyageNumber: 'V' + faker.string.numeric(5),
        portOfLoading,
        portOfDischarge,
        transshipmentPort: faker.datatype.boolean({ probability: 0.3 }) ? faker.helpers.arrayElement(PORTS) : '',
        originCountry: faker.location.countryCode('alpha-2'),
        destinationCountry: faker.location.countryCode('alpha-2'),
        goodsDescription: faker.commerce.productDescription(),
        hsCode: faker.helpers.arrayElement(HS_CODES),
        totalWeight: parseFloat(faker.finance.amount({ min: 100, max: 50000, dec: 2 })),
        weightUnit: faker.helpers.arrayElement(['KG', 'MT']),
        packageCount: faker.number.int({ min: 1, max: 500 }),
        containerNumbers: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.string.alphanumeric({ length: 11, casing: 'upper' })),
        highRiskPortFlag: faker.datatype.boolean({ probability: 0.12 }),
        sanctionedPortFlag: faker.datatype.boolean({ probability: 0.05 }),
        sanctionedVesselFlag: faker.datatype.boolean({ probability: 0.03 }),
        circuitousRouteFlag: faker.datatype.boolean({ probability: 0.08 }),
        vesselScreened: faker.datatype.boolean({ probability: 0.75 }),
        portsScreened: faker.datatype.boolean({ probability: 0.8 }),
        customsClearance: faker.datatype.boolean({ probability: 0.6 }),
    };
}

function generateParty() {
    const partyType = faker.helpers.arrayElement(PARTY_TYPES);
    return {
        partyRole: faker.helpers.arrayElement(PARTY_ROLES),
        partyType,
        partyName: partyType === 'INDIVIDUAL' ? faker.person.fullName() : faker.company.name(),
        partyAddress: faker.location.streetAddress(true),
        city: faker.location.city(),
        country: faker.location.countryCode('alpha-2'),
        registrationNumber: partyType !== 'INDIVIDUAL' ? faker.string.alphanumeric(12).toUpperCase() : '',
        taxId: faker.string.numeric(10),
        swiftCode: partyType === 'BANK' ? generateSWIFT() : '',
        contactPerson: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        sanctionScreened: faker.datatype.boolean({ probability: 0.8 }),
        screeningResult: faker.helpers.arrayElement(SCREENING_RESULTS),
        pepFlag: faker.datatype.boolean({ probability: 0.05 }),
        adverseMediaFlag: faker.datatype.boolean({ probability: 0.08 }),
        highRiskJurisdiction: faker.datatype.boolean({ probability: 0.1 }),
        riskRating: faker.helpers.arrayElement(RISK_RATINGS),
    };
}

function generateDocument() {
    return {
        documentType: faker.helpers.arrayElement(DOCUMENT_TYPES),
        documentNumber: 'DOC-' + faker.string.numeric(8),
        documentDate: recentDate(),
        description: faker.lorem.sentence(),
        issuerName: faker.company.name(),
        issuerCountry: faker.location.countryCode('alpha-2'),
        fileName: faker.system.fileName(),
        fileType: faker.helpers.arrayElement(['PDF', 'JPEG', 'PNG', 'TIFF', 'DOCX']),
        fileSize: faker.number.int({ min: 10240, max: 10485760 }),
        verified: faker.datatype.boolean({ probability: 0.6 }),
        discrepancyFound: faker.datatype.boolean({ probability: 0.1 }),
        discrepancyNotes: faker.datatype.boolean({ probability: 0.1 }) ? faker.lorem.sentence() : '',
    };
}

// ─── Main LC Generator ───

function generateTradeData() {
    const currency = faker.helpers.arrayElement(CURRENCIES);
    const amount = parseFloat(faker.finance.amount({ min: 10000, max: 5000000, dec: 2 }));
    const tolerancePercent = faker.number.float({ min: 0, max: 10, fractionDigits: 2 });
    const utilizedAmount = parseFloat(faker.finance.amount({ min: 0, max: amount, dec: 2 }));
    const portOfLoading = faker.helpers.arrayElement(PORTS);
    const portOfDischarge = faker.helpers.arrayElement(PORTS.filter(p => p !== portOfLoading));
    const originCountry = faker.location.countryCode('alpha-2');
    const destinationCountry = faker.location.countryCode('alpha-2');
    const quantity = parseFloat(faker.finance.amount({ min: 10, max: 50000, dec: 4 }));
    const unitPrice = parseFloat(faker.finance.amount({ min: 0.5, max: 5000, dec: 6 }));

    // Core LC fields — camelCase keys matching backend default field mapping
    const lc: Record<string, unknown> = {
        lcNumber: generateLCNumber(),
        swiftReference: 'MT700' + faker.string.numeric(10),
        lcType: faker.helpers.arrayElement(LC_TYPES),
        status: faker.helpers.arrayElement(LC_STATUSES),

        // Dates
        issueDate: pastDate(6),
        expiryDate: futureDate(12),
        lastShipmentDate: futureDate(9),
        latestDocPresentationDate: futureDate(10),

        // Financial
        currency,
        amount,
        tolerancePercent,
        utilizedAmount,
        balanceAmount: Math.round((amount - utilizedAmount) * 100) / 100,

        // Payment Terms
        paymentTerms: faker.helpers.arrayElement(PAYMENT_TERMS),
        tenorDays: faker.datatype.boolean({ probability: 0.5 }) ? faker.number.int({ min: 30, max: 180 }) : null,

        // Applicant
        applicantName: faker.company.name(),
        applicantAddress: faker.location.streetAddress(true),
        applicantCountry: originCountry,
        applicantAccount: faker.finance.accountNumber(12),

        // Beneficiary
        beneficiaryName: faker.company.name(),
        beneficiaryAddress: faker.location.streetAddress(true),
        beneficiaryCountry: destinationCountry,
        beneficiaryBank: faker.company.name() + ' Bank',
        beneficiaryBankSwift: generateSWIFT(),

        // Banks
        issuingBankName: faker.company.name() + ' Bank Ltd.',
        issuingBankSwift: generateSWIFT(),
        advisingBankName: faker.company.name() + ' Bank',
        advisingBankSwift: generateSWIFT(),
        confirmingBankName: faker.datatype.boolean({ probability: 0.4 }) ? (faker.company.name() + ' Bank') : '',

        // Commodity
        goodsDescription: faker.commerce.productDescription(),
        hsCode: faker.helpers.arrayElement(HS_CODES),
        quantity,
        quantityUnit: faker.helpers.arrayElement(QUANTITY_UNITS),
        unitPrice,

        // Shipment
        shipmentMode: faker.helpers.arrayElement(SHIPMENT_MODES),
        portOfLoading,
        portOfDischarge,
        originCountry,
        destinationCountry,
        transshipmentAllowed: faker.datatype.boolean({ probability: 0.4 }),
        partialShipmentAllowed: faker.datatype.boolean({ probability: 0.5 }),

        // Incoterms & Insurance
        incoterms: faker.helpers.arrayElement(INCOTERMS),
        insuranceRequired: faker.datatype.boolean({ probability: 0.6 }),
        insuranceAmount: parseFloat(faker.finance.amount({ min: 500, max: 50000, dec: 2 })),

        // TBML Detection
        transferableLc: faker.datatype.boolean({ probability: 0.15 }),
        paymentToThirdParty: faker.datatype.boolean({ probability: 0.1 }),
        paymentCountry: faker.location.countryCode('alpha-2'),
        collateralAmount: parseFloat(faker.finance.amount({ min: 0, max: 100000, dec: 2 })),
        contractReference: 'CTR-' + faker.string.numeric(8),

        // Risk & Compliance
        riskRating: faker.helpers.arrayElement(RISK_RATINGS),
        sanctionScreened: faker.datatype.boolean({ probability: 0.85 }),
        dualUseGoodsFlag: faker.datatype.boolean({ probability: 0.07 }),
        highRiskCountryFlag: faker.datatype.boolean({ probability: 0.12 }),
        priceAnomalyFlag: faker.datatype.boolean({ probability: 0.09 }),

        // Nested arrays — related trade objects
        amendments: Array.from(
            { length: faker.number.int({ min: 0, max: 3 }) },
            (_, i) => generateAmendment(i)
        ),
        invoices: Array.from(
            { length: faker.number.int({ min: 1, max: 3 }) },
            () => generateInvoice()
        ),
        shipments: Array.from(
            { length: faker.number.int({ min: 1, max: 2 }) },
            () => generateShipment()
        ),
        parties: Array.from(
            { length: faker.number.int({ min: 2, max: 6 }) },
            () => generateParty()
        ),
        documents: Array.from(
            { length: faker.number.int({ min: 1, max: 5 }) },
            () => generateDocument()
        ),
    };

    return lc;
}

// ─── Route Handler ───

export async function GET(request: NextRequest) {
    // Validate ACCESS_TOKEN
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.nextUrl.searchParams.get('token');
    console.log('Received token:', token);
    console.log('Expected token:', process.env.ACCESS_TOKEN);
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

        const data = amount === 1
            ? generateTradeData()
            : Array.from({ length: amount }, () => generateTradeData());

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error generating trade finance data:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
