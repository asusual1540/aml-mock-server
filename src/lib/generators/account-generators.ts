/**
 * Account Product Generators — Production-Ready Mock Data
 *
 * Generates realistic data for all 8 account product variants:
 *   SAVINGS           — Savings accounts (regular, student, NRB, Islamic, etc.)
 *   CURRENT           — Current/Checking accounts (overdraft, escrow, SND, FCY)
 *   LOAN              — Loan accounts (personal, auto, education, mortgage, SME)
 *   CARD              — Credit/Debit cards (Visa, MC, rewards, supplementary)
 *   MFS               — Mobile Financial Services (bKash, Nagad, agent, merchant)
 *   DEPOSIT           — Term deposits (FDR, RD, DPS, Senior Citizen)
 *   CORPORATE_ACCOUNT — Corporate accounts (operating, collection, payroll, trade)
 *   CAMPAIGN          — Campaign/promotional accounts with incentives
 *
 * Each generator returns common account fields PLUS product-specific
 * fields keyed with the appropriate prefix (savings.*, current.*, loan.*, etc.)
 */

import { faker } from '@faker-js/faker';

// ─── Helpers ──────────────────────────────────────────────────────

type Country = 'BD' | 'US';
function pick<T>(arr: T[]): T { return faker.helpers.arrayElement(arr); }
function pickN<T>(arr: T[], n: number): T[] { return faker.helpers.arrayElements(arr, n); }

const BD_AREAS = ['Dhanmondi', 'Gulshan', 'Banani', 'Uttara', 'Mirpur', 'Mohammadpur', 'Motijheel', 'Panthapath', 'Farmgate', 'Basundhara', 'Baridhara'];
const BD_CITIES = ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Sylhet', 'Rangpur', 'Barisal', 'Comilla', 'Gazipur', 'Narayanganj', 'Mymensingh'];
const BD_BANKS = ['Sonali Bank', 'Janata Bank', 'BRAC Bank', 'Dutch-Bangla Bank', 'Islami Bank Bangladesh', 'Prime Bank', 'Bank Asia', 'Eastern Bank', 'Mutual Trust Bank'];
const US_BANKS = ['JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'Capital One', 'US Bank'];
const BD_MALE_FIRST = ['Mohammed', 'Abdul', 'Md', 'Sheikh', 'Rafiqul', 'Kamal', 'Hasan', 'Rahim', 'Rashid', 'Tariq', 'Faruk', 'Habib'];
const BD_FEMALE_FIRST = ['Fatima', 'Aisha', 'Khadija', 'Nasima', 'Rahima', 'Sultana', 'Hasina', 'Shamima'];
const BD_LAST = ['Rahman', 'Islam', 'Hossain', 'Ahmed', 'Khan', 'Uddin', 'Ali', 'Chowdhury', 'Siddique', 'Alam'];
const BD_COMPANY_SUFFIXES = ['Ltd', 'Pvt Ltd', 'Limited', 'Industries Ltd', 'Group', 'Corporation', 'Holdings', 'Enterprises'];

function bdName(): string { return `${pick(Math.random() > 0.5 ? BD_MALE_FIRST : BD_FEMALE_FIRST)} ${pick(BD_LAST)}`; }
function fullName(c: Country): string { return c === 'BD' ? bdName() : faker.person.fullName(); }
function phone(c: Country): string {
    if (c === 'BD') return `+880${pick(['013', '014', '015', '016', '017', '018', '019'])}${faker.string.numeric(8)}`;
    return faker.phone.number();
}
function address(c: Country): string {
    if (c === 'BD') return `House #${faker.number.int({ min: 1, max: 200 })}, Road #${faker.number.int({ min: 1, max: 50 })}, ${pick(BD_AREAS)}, ${pick(BD_CITIES)} ${faker.number.int({ min: 1000, max: 9999 })}`;
    return faker.location.streetAddress();
}
function nid(): string { return faker.string.numeric(13); }
function tin(): string { return faker.string.numeric(12); }
function amt(min = 10000, max = 50000000): number { return faker.number.int({ min, max }); }
function rate(min = 2, max = 18): number { return faker.number.float({ min, max, fractionDigits: 2 }); }
function pastDate(): string { return faker.date.past({ years: 5 }).toISOString().split('T')[0]; }
function futureDate(): string { return faker.date.future({ years: 5 }).toISOString().split('T')[0]; }
function recentDate(): string { return faker.date.recent({ days: 90 }).toISOString().split('T')[0]; }
function bankName(c: Country): string { return c === 'BD' ? pick(BD_BANKS) : pick(US_BANKS); }
function acctNo(): string { return faker.finance.accountNumber(13); }

// ─── Branch pool (5 Dhaka branches used across all mock data) ────
export const BRANCH_POOL = [
    { branchId: 'MGB-0183', code: 'PALTON0183', name: 'Palton Branch' },
    { branchId: 'MGB-0002', code: 'BADDA0002', name: 'Badda Branch' },
    { branchId: 'MGB-0016', code: 'UTTARW0016', name: 'Uttara West Branch' },
    { branchId: 'MGB-0022', code: 'GENDAR0022', name: 'Gendaria Branch' },
    { branchId: 'MGB-0046', code: 'KODOMT0046', name: 'Kodomtoli Branch' },
] as const;

export function pickBranch() { return pick([...BRANCH_POOL]); }
export function branchCode(): string { return pickBranch().branchId; }

// ═══════════════════════════════════════════════════════════════════
// COMMON ACCOUNT FIELDS (shared across every account variant)
// ═══════════════════════════════════════════════════════════════════

export function generateCommonAccountFields(customerId: number, accountType: string, country: Country) {
    return {
        customerId,
        trackingNumber: faker.string.alphanumeric(12).toUpperCase(),
        uuid: faker.string.uuid(),
        accountName: fullName(country),
        accountNumber: acctNo(),
        uniqueAccountNumber: `${branchCode()}-${acctNo()}`,
        cbsAccountId: faker.string.alphanumeric(10).toUpperCase(),
        branchCode: branchCode(),
        branchName: pickBranch().name,
        preferredBranchCode: branchCode(),
        onboardingType: pick(['NEW', 'MIGRATION', 'CONVERSION']),
        onboardingChannel: pick(['BRANCH', 'ONLINE', 'AGENT', 'KIOSK', 'PARTNER_API']),
        accountType,
        accountSubType: '',
        productCode: faker.string.alphanumeric(6).toUpperCase(),
        productName: `${accountType} Account - ${pick(['Standard', 'Premium', 'Basic', 'Special'])}`,
        purposeOfAccountOpening: pick(['Savings', 'Salary', 'Business', 'Investment', 'Personal', 'Others']),
        accountTypeBankside: faker.string.alphanumeric(4).toUpperCase(),
        accountOperationType: pick(['individual', 'joint', 'corporate']),
        accountProfileType: pick(['simplified', 'standard', 'enhanced']),
        preferredCurrency: country === 'BD' ? 'BDT' : 'USD',
        interestRate: rate(0.5, 12),
        interestRateType: pick(['FIXED', 'FLOATING', 'VARIABLE']),
        minimumBalance: amt(500, 50000),
        sourceOfFund: pick(['Salary', 'Business Revenue', 'Investment', 'Inheritance', 'Gift', 'Remittance', 'Others']),
        transactionAmountMonthly: amt(10000, 5000000).toString(),
        initialDeposit: amt(1000, 100000),
        accountRemarks: faker.lorem.sentence(),
        kycLevel: pick(['STANDARD', 'SIMPLIFIED', 'ENHANCED']),
        riskCategory: pick(['LOW', 'MEDIUM', 'HIGH']),
        eddRequired: faker.datatype.boolean({ probability: 0.1 }),
        pepRelated: faker.datatype.boolean({ probability: 0.05 }),
        sanctionScreened: true,
        accountStatus: pick(['DRAFT', 'ACTIVE', 'DORMANT', 'FROZEN']),
        accountOpenDate: pastDate(),
        jointModeOfOperation: '',
        jointSignatory: '',
        jointNumberOfApplicants: 0,
        jointAccountTitleEng: '',

        // Nominees array
        nominees: Array.from({ length: faker.number.int({ min: 1, max: 2 }) }, (_, i) => ({
            nomineeName: fullName(country),
            nomineeNidType: pick(['NID', 'PASSPORT', 'DRIVING_LICENSE']),
            nomineeNidNo: nid(),
            nomineeDob: faker.date.birthdate({ min: 18, max: 70, mode: 'age' }).toISOString().split('T')[0],
            nomineePercentage: i === 0 ? 100 : 50,
            nomineeRelation: pick(['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister']),
            nomineePresentAddress: address(country),
            nomineeIsMinor: false,
            guardianName: '',
            guardianNidNo: '',
            guardianRelation: '',
        })),
    };
}

// ═══════════════════════════════════════════════════════════════════
// SAVINGS ACCOUNT
// ═══════════════════════════════════════════════════════════════════

export function generateSavingsAccount(customerId: number, country: Country) {
    const common = generateCommonAccountFields(customerId, 'SAVINGS', country);
    const isMinor = faker.datatype.boolean({ probability: 0.1 });
    const isNRB = faker.datatype.boolean({ probability: 0.08 });
    const isSenior = faker.datatype.boolean({ probability: 0.1 });
    const isIslamic = faker.datatype.boolean({ probability: 0.15 });

    return {
        ...common,
        accountSubType: 'SAVINGS_ACCOUNT',
        'savings.schemeType': pick(['REGULAR', 'STUDENT', 'WOMENS', 'SENIOR_CITIZEN', 'MINOR', 'STAFF', 'NRB', 'ISLAMIC', 'FARMERS']),
        'savings.accountTierLevel': pick(['BASIC', 'STANDARD', 'PREMIUM', 'VIP']),
        'savings.interestCreditFreq': pick(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY']),
        'savings.sweepFacility': faker.datatype.boolean({ probability: 0.2 }),
        'savings.sweepThreshold': amt(50000, 500000),
        'savings.expectedMonthlyDeposit': amt(5000, 200000),
        'savings.expectedMonthlyWithdrawal': amt(3000, 100000),
        'savings.expectedTransactionFrequency': pick(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']),
        'savings.savingsGoal': pick(['EMERGENCY_FUND', 'EDUCATION', 'RETIREMENT', 'MARRIAGE', 'TRAVEL', 'GENERAL']),
        'savings.savingsGoalAmount': amt(100000, 5000000),
        'savings.passbookRequired': faker.datatype.boolean({ probability: 0.6 }),
        'savings.statementFrequency': pick(['MONTHLY', 'QUARTERLY', 'YEARLY']),
        'savings.isMinorAccount': isMinor,
        'savings.minorGuardianName': isMinor ? fullName(country) : '',
        'savings.isIslamicAccount': isIslamic,
        'savings.introducerName': fullName(country),
        'savings.introducerAccountNumber': acctNo(),
        // Extended fields
        'savings.autoDebitFacility': faker.datatype.boolean({ probability: 0.3 }),
        'savings.autoDebitFrequency': pick(['MONTHLY', 'WEEKLY']),
        'savings.allowATMWithdrawal': true,
        'savings.taxDeductedAtSource': true,
        'savings.minorDob': isMinor ? faker.date.birthdate({ min: 1, max: 17, mode: 'age' }).toISOString().split('T')[0] : '',
        'savings.minorGuardianNid': isMinor ? nid() : '',
        'savings.minorGuardianRelation': isMinor ? pick(['Father', 'Mother', 'Legal Guardian']) : '',
        'savings.minorGuardianMobile': isMinor ? phone(country) : '',
        ...(isNRB ? {
            'savings.nrbCountryOfResidence': pick(['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Malaysia', 'UK', 'USA', 'Italy']),
            'savings.nrbPassportNumber': faker.string.alphanumeric(9).toUpperCase(),
            'savings.nrbVisaType': pick(['WORK', 'RESIDENCE', 'STUDENT']),
            'savings.nrbEmployerAbroad': faker.company.name(),
            'savings.nrbRemittanceChannel': pick(['BANK', 'MFS', 'EXCHANGE_HOUSE']),
        } : {}),
        ...(isSenior ? {
            'savings.seniorCitizenVerified': true,
            'savings.retirementDate': pastDate(),
            'savings.pensionReferenceNo': faker.string.numeric(10),
        } : {}),
        ...(isIslamic ? {
            'savings.mudarabaRatio': faker.number.float({ min: 30, max: 70, fractionDigits: 2 }),
            'savings.zakatDeduction': faker.datatype.boolean({ probability: 0.4 }),
        } : {}),
    };
}

// ═══════════════════════════════════════════════════════════════════
// CURRENT ACCOUNT
// ═══════════════════════════════════════════════════════════════════

export function generateCurrentAccount(customerId: number, country: Country) {
    const common = generateCommonAccountFields(customerId, 'CURRENT', country);
    const hasOD = faker.datatype.boolean({ probability: 0.3 });
    const isEscrow = faker.datatype.boolean({ probability: 0.1 });
    const isFCY = faker.datatype.boolean({ probability: 0.1 });
    const isSND = faker.datatype.boolean({ probability: 0.08 });
    const isGovt = faker.datatype.boolean({ probability: 0.05 });

    return {
        ...common,
        accountSubType: 'CURRENT_ACCOUNT',
        'current.schemeType': pick(['REGULAR', 'OVERDRAFT', 'SND', 'CALL_DEPOSIT', 'ESCROW', 'FCY', 'RFCD', 'NFCD']),
        'current.accountTierLevel': pick(['BASIC', 'STANDARD', 'PREMIUM', 'VIP', 'CORPORATE']),
        'current.overdraftEnabled': hasOD,
        'current.overdraftLimit': hasOD ? amt(100000, 5000000) : 0,
        'current.overdraftInterestRate': hasOD ? rate(8, 16) : 0,
        'current.chequeBookIssued': faker.datatype.boolean({ probability: 0.8 }),
        'current.expectedMonthlyCredit': amt(50000, 10000000),
        'current.expectedMonthlyDebit': amt(50000, 8000000),
        'current.expectedTransactionFrequency': pick(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']),
        'current.isFcyAccount': isFCY,
        'current.fcyCurrencyCode': isFCY ? pick(['USD', 'GBP', 'EUR', 'JPY', 'SGD']) : '',
        'current.isSndAccount': isSND,
        'current.isEscrowAccount': isEscrow,
        'current.escrowPurpose': isEscrow ? pick(['Real Estate Transaction', 'Legal Settlement', 'Project Escrow', 'Regulatory Requirement']) : '',
        'current.tradeFinanceLinked': faker.datatype.boolean({ probability: 0.15 }),
        'current.natureOfBusiness': faker.company.buzzPhrase(),
        'current.numberOfSignatories': faker.number.int({ min: 1, max: 4 }),
        'current.signatureRule': pick(['ANY_ONE', 'JOINTLY', 'TWO_OF_THREE', 'ANY_TWO']),
        'current.isIslamicAccount': faker.datatype.boolean({ probability: 0.12 }),
        'current.isGovtAccount': isGovt,
        'current.introducerName': fullName(country),
        // Extended fields
        ...(hasOD ? {
            'current.overdraftExpiryDate': futureDate(),
            'current.overdraftCollateral': pick(['FDR', 'PROPERTY', 'STOCK', 'NONE']),
            'current.overdraftSanctionRef': faker.string.alphanumeric(10).toUpperCase(),
            'current.overdraftSecurityValue': amt(200000, 10000000),
        } : {}),
        'current.chequeBookLeaves': pick([25, 50, 100]),
        'current.payOrderEnabled': faker.datatype.boolean({ probability: 0.5 }),
        'current.demandDraftEnabled': faker.datatype.boolean({ probability: 0.3 }),
        'current.expectedCashDeposit': amt(10000, 5000000),
        'current.expectedCashWithdrawal': amt(10000, 3000000),
        'current.sweepFacility': faker.datatype.boolean({ probability: 0.15 }),
        'current.sweepThreshold': amt(100000, 1000000),
        'current.salaryDisbursement': faker.datatype.boolean({ probability: 0.2 }),
        'current.statementFrequency': pick(['MONTHLY', 'QUARTERLY']),
        'current.statementDelivery': pick(['EMAIL', 'POSTAL', 'BOTH']),
        'current.passbookRequired': false,
        'current.allowATMWithdrawal': true,
        ...(isFCY ? {
            'current.fcyPurpose': pick(['Import', 'Export', 'Travel', 'Education', 'Investment']),
            'current.fcyAccountSubType': pick(['RFCD', 'NFCD', 'ERQ', 'GENERAL']),
        } : {}),
        ...(isSND ? {
            'current.sndNoticeDays': pick([7, 14, 30]),
            'current.callDepositRate': rate(2, 6),
            'current.minSndBalance': amt(100000, 1000000),
        } : {}),
        ...(isEscrow ? {
            'current.escrowPrincipalParty': fullName(country),
            'current.escrowBeneficiary': fullName(country),
            'current.escrowReleaseCond': 'Completion of contractual obligations',
            'current.escrowExpiryDate': futureDate(),
        } : {}),
        ...(isGovt ? {
            'current.govtMinistryDept': pick(['Ministry of Finance', 'Local Government', 'Ministry of Commerce']),
            'current.govtBudgetCode': faker.string.numeric(8),
            'current.govtProjectName': faker.lorem.words(3),
        } : {}),
        'current.taxDeductedAtSource': true,
        'current.exciseDutyApplicable': true,
    };
}

// ═══════════════════════════════════════════════════════════════════
// LOAN ACCOUNT
// ═══════════════════════════════════════════════════════════════════

export function generateLoanAccount(customerId: number, country: Country) {
    const common = generateCommonAccountFields(customerId, 'LOAN', country);
    const loanSubType = pick(['PERSONAL', 'SALARY_LOAN', 'AUTO', 'EDUCATION', 'MORTGAGE', 'SME', 'BUSINESS', 'AGRICULTURE', 'CONSUMER']);
    const requestedAmt = amt(50000, 20000000);
    const sanctionedAmt = Math.round(requestedAmt * faker.number.float({ min: 0.7, max: 1.0 }));
    const tenure = pick([12, 24, 36, 48, 60, 84, 120, 180, 240]);
    const iRate = rate(6, 16);
    const hasCollateral = ['MORTGAGE', 'AUTO', 'SME', 'BUSINESS'].includes(loanSubType);
    const isMortgage = loanSubType === 'MORTGAGE';
    const isAuto = loanSubType === 'AUTO';
    const isEducation = loanSubType === 'EDUCATION';
    const isBusiness = ['SME', 'BUSINESS'].includes(loanSubType);
    const isIslamic = faker.datatype.boolean({ probability: 0.12 });

    return {
        ...common,
        accountSubType: 'LOAN_ACCOUNT',
        'loan.loanSubType': loanSubType,
        'loan.loanPurpose': pick(['Home Purchase', 'Vehicle Purchase', 'Education', 'Business Expansion', 'Working Capital', 'Personal Needs', 'Agriculture']),
        'loan.loanScheme': faker.string.alphanumeric(6).toUpperCase(),
        'loan.requestedAmount': requestedAmt,
        'loan.sanctionedAmount': sanctionedAmt,
        'loan.disbursedAmount': Math.round(sanctionedAmt * faker.number.float({ min: 0.8, max: 1.0 })),
        'loan.outstandingAmount': Math.round(sanctionedAmt * faker.number.float({ min: 0.3, max: 0.9 })),
        'loan.tenureMonths': tenure,
        'loan.interestRate': iRate,
        'loan.interestRateType': pick(['FIXED', 'FLOATING', 'VARIABLE']),
        'loan.interestCalcMethod': pick(['REDUCING_BALANCE', 'FLAT_RATE']),
        'loan.effectiveRate': iRate + faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
        'loan.emiAmount': Math.round(sanctionedAmt / tenure * (1 + iRate / 1200)),
        'loan.emiStartDate': recentDate(),
        'loan.moratoriumPeriod': pick([0, 0, 0, 3, 6]),
        'loan.repaymentMode': pick(['EMI', 'BULLET', 'BALLOON', 'STEP_UP']),
        'loan.repaymentFrequency': pick(['MONTHLY', 'QUARTERLY']),
        'loan.repaymentAccountNo': acctNo(),
        'loan.disbursementAccountNo': acctNo(),
        'loan.disbursementMode': pick(['ACCOUNT_CREDIT', 'CHEQUE', 'DD']),
        'loan.maturityDate': futureDate(),
        'loan.processingFee': Math.round(sanctionedAmt * 0.01),
        'loan.processingFeePercent': 1.0,
        'loan.documentationFee': amt(500, 5000),
        'loan.stampDuty': amt(100, 2000),
        'loan.employmentType': pick(['SALARIED', 'SELF_EMPLOYED', 'BUSINESS']),
        'loan.employerName': faker.company.name(),
        'loan.employerAddress': address(country),
        'loan.designation': faker.person.jobTitle(),
        'loan.employmentYears': faker.number.int({ min: 1, max: 30 }),
        'loan.monthlySalary': amt(15000, 500000),
        'loan.otherIncome': amt(0, 100000),
        'loan.annualGrossIncome': amt(200000, 6000000),
        'loan.totalMonthlyExpense': amt(10000, 200000),
        'loan.tinNumber': tin(),
        'loan.existingLoanExposure': amt(0, 5000000),
        'loan.existingEmiTotal': amt(0, 50000),
        'loan.debtServiceRatio': faker.number.float({ min: 20, max: 60, fractionDigits: 2 }),
        'loan.cibStatus': pick(['CLEAN', 'CLASSIFIED', 'SUB_STANDARD']),
        'loan.cibReportDate': recentDate(),
        'loan.cibReferenceNo': faker.string.alphanumeric(10).toUpperCase(),
        'loan.cibLoanCount': faker.number.int({ min: 0, max: 5 }),
        'loan.creditScore': faker.number.int({ min: 300, max: 850 }),
        'loan.previousDefaultHistory': faker.datatype.boolean({ probability: 0.05 }),
        ...(hasCollateral ? {
            'loan.collateralType': isMortgage ? 'PROPERTY' : isAuto ? 'VEHICLE' : pick(['PROPERTY', 'FDR', 'GOLD', 'STOCK', 'MACHINERY']),
            'loan.collateralDescription': faker.lorem.sentence(),
            'loan.collateralValue': Math.round(sanctionedAmt * faker.number.float({ min: 1.1, max: 2.0 })),
            'loan.ltvRatio': faker.number.float({ min: 50, max: 80, fractionDigits: 2 }),
        } : {
            'loan.collateralType': 'NONE',
        }),
        'loan.insuranceRequired': faker.datatype.boolean({ probability: 0.4 }),
        'loan.insuranceType': pick(['LIFE', 'PROPERTY', 'VEHICLE', 'NONE']),
        'loan.guarantorRequired': faker.datatype.boolean({ probability: 0.5 }),
        'loan.guarantorName': fullName(country),
        'loan.guarantorNid': nid(),
        'loan.guarantorMobile': phone(country),
        'loan.guarantorRelation': pick(['Father', 'Brother', 'Friend', 'Business Partner', 'Spouse']),
        'loan.guarantorAddress': address(country),
        'loan.guarantorIncome': amt(20000, 300000),
        'loan.guarantorOccupation': faker.person.jobTitle(),
        'loan.prepaymentAllowed': true,
        'loan.prepaymentPenaltyPercent': faker.number.float({ min: 0, max: 3, fractionDigits: 2 }),
        'loan.partialPrepaymentAllowed': true,
        'loan.topUpEligible': faker.datatype.boolean({ probability: 0.3 }),
        ...(isAuto ? {
            'loan.vehicleType': pick(['CAR', 'SUV', 'MOTORCYCLE', 'PICKUP', 'MICROBUS']),
            'loan.vehicleMake': pick(['Toyota', 'Honda', 'Mitsubishi', 'Nissan', 'Suzuki', 'Hyundai']),
            'loan.vehicleModel': faker.vehicle.model(),
            'loan.vehicleYear': faker.number.int({ min: 2018, max: 2025 }),
            'loan.vehicleRegNo': `${pick(['Dhaka-Metro', 'CHA', 'RAJ'])} ${faker.string.alpha(2).toUpperCase()}-${faker.string.numeric(4)}`,
            'loan.vehicleValue': amt(500000, 10000000),
            'loan.dealerName': `${faker.company.name()} Motors`,
            'loan.newOrUsed': pick(['NEW', 'USED', 'RECONDITIONED']),
        } : {}),
        ...(isEducation ? {
            'loan.institutionName': pick(['University of Dhaka', 'BUET', 'North South University', 'BRAC University', 'MIT', 'Stanford', 'Oxford']),
            'loan.courseName': pick(['MBA', 'MS in CS', 'MBBS', 'Engineering', 'Law', 'PhD']),
            'loan.courseDurationYears': pick([2, 3, 4, 5]),
            'loan.countryOfStudy': pick(['Bangladesh', 'USA', 'UK', 'Australia', 'Canada', 'Germany']),
        } : {}),
        ...(isMortgage ? {
            'loan.mortgageType': pick(['PURCHASE', 'CONSTRUCTION', 'RENOVATION', 'PLOT_PURCHASE']),
            'loan.propertyCategory': pick(['APARTMENT', 'DUPLEX', 'PLOT', 'COMMERCIAL', 'RESIDENTIAL']),
            'loan.propertyAreaSqft': faker.number.int({ min: 600, max: 5000 }),
            'loan.propertyAddress': address(country),
            'loan.propertyValuation': Math.round(sanctionedAmt * 1.5),
            'loan.propertyDistrict': pick(BD_CITIES),
            'loan.downPaymentAmount': Math.round(sanctionedAmt * 0.2),
            'loan.downPaymentPercent': 20,
        } : {}),
        ...(isBusiness ? {
            'loan.businessEntityType': pick(['SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED']),
            'loan.businessName': `${faker.company.name()} ${pick(BD_COMPANY_SUFFIXES)}`,
            'loan.businessRegistrationNo': faker.string.alphanumeric(10).toUpperCase(),
            'loan.tradeLicenseNumber': faker.string.numeric(10),
            'loan.businessNatureDetail': faker.company.catchPhrase(),
            'loan.businessSector': pick(['Manufacturing', 'Trading', 'Service', 'IT', 'Agriculture', 'Garments']),
            'loan.businessTurnover': amt(1000000, 100000000),
            'loan.cmsmeClassification': pick(['COTTAGE', 'MICRO', 'SMALL', 'MEDIUM']),
            'loan.womenEntrepreneur': faker.datatype.boolean({ probability: 0.2 }),
        } : {}),
        ...(isIslamic ? {
            'loan.isIslamicFinance': true,
            'loan.islamicMode': pick(['MURABAHA', 'IJARA', 'DIMINISHING_MUSHARAKA', 'BAI_MUAJJAL']),
            'loan.profitRate': rate(6, 14),
        } : {}),
        'loan.sanctionLetterRef': faker.string.alphanumeric(10).toUpperCase(),
        'loan.sanctionDate': pastDate(),
        'loan.sanctionAuthority': pick(['Branch Manager', 'Regional Head', 'Head Office Credit Committee']),
        'loan.introducerName': fullName(country),
        'loan.introducerAccountNumber': acctNo(),
    };
}

// ═══════════════════════════════════════════════════════════════════
// CARD ACCOUNT (Credit/Debit)
// ═══════════════════════════════════════════════════════════════════

export function generateCardAccount(customerId: number, country: Country) {
    const common = generateCommonAccountFields(customerId, 'CARD', country);
    const isCredit = faker.datatype.boolean({ probability: 0.6 });
    const cardType = isCredit ? 'CREDIT' : 'DEBIT';
    const tier = pick(['CLASSIC', 'GOLD', 'PLATINUM', 'SIGNATURE', 'INFINITE']);
    const creditLimit = isCredit ? amt(50000, 5000000) : 0;
    const hasSupp = faker.datatype.boolean({ probability: 0.2 });

    return {
        ...common,
        accountSubType: isCredit ? 'CREDIT_CARD' : 'DEBIT_CARD',
        'card.cardType': cardType,
        'card.cardNetwork': pick(['VISA', 'MASTERCARD', 'AMEX', 'UNIONPAY']),
        'card.cardVariant': tier,
        'card.cardSubType': pick(['PRIMARY', 'SUPPLEMENTARY', 'CORPORATE']),
        'card.cardPurpose': pick(['PERSONAL', 'CORPORATE', 'TRAVEL', 'SHOPPING']),
        'card.cardSchemeCode': faker.string.alphanumeric(6).toUpperCase(),
        'card.cardNameOnCard': common.accountName.toUpperCase(),
        'card.cardCurrency': country === 'BD' ? 'BDT' : 'USD',
        'card.dualCurrencyCard': faker.datatype.boolean({ probability: 0.2 }),
        'card.cardIssuanceType': pick(['NEW', 'REPLACEMENT', 'RENEWAL', 'UPGRADE']),
        ...(isCredit ? {
            'card.creditLimit': creditLimit,
            'card.requestedCreditLimit': creditLimit,
            'card.cashAdvanceLimit': Math.round(creditLimit * 0.3),
            'card.cashAdvanceLimitPct': 30,
        } : {}),
        'card.dailyAtmLimit': amt(10000, 200000),
        'card.dailyPosLimit': amt(50000, 500000),
        'card.dailyOnlineLimit': amt(20000, 300000),
        'card.singleTxnLimit': amt(10000, 200000),
        'card.dailyOverallLimit': amt(100000, 1000000),
        'card.internationalTxLimit': amt(50000, 500000),
        'card.monthlySpendLimit': amt(200000, 2000000),
        'card.ecommerceEnabled': true,
        'card.internationalUsage': faker.datatype.boolean({ probability: 0.6 }),
        'card.contactlessEnabled': true,
        'card.atmWithdrawalEnabled': true,
        'card.posEnabled': true,
        'card.mobilePaymentEnabled': true,
        'card.rewardProgramEnrolled': faker.datatype.boolean({ probability: 0.7 }),
        'card.rewardProgramType': pick(['POINTS', 'CASHBACK', 'MILES', 'HYBRID']),
        'card.cashbackPercentage': faker.number.float({ min: 0.5, max: 5, fractionDigits: 2 }),
        'card.loungeAccessEntitled': ['PLATINUM', 'SIGNATURE', 'INFINITE'].includes(tier),
        'card.loungeAccessCount': ['PLATINUM', 'SIGNATURE', 'INFINITE'].includes(tier) ? pick([4, 6, 8, 12, 999]) : 0,
        ...(isCredit ? {
            'card.interestRateMonthly': rate(1.5, 3.5),
            'card.interestRateAnnual': rate(18, 42),
            'card.minimumPaymentPercent': pick([3, 5, 10]),
            'card.minimumPaymentAmount': amt(500, 5000),
            'card.annualFeeAmount': pick([0, 1000, 2000, 3000, 5000, 10000]),
            'card.joiningFeeAmount': pick([0, 500, 1000, 2000]),
            'card.annualFeeWaiver': faker.datatype.boolean({ probability: 0.3 }),
        } : {}),
        'card.cardBillingCycle': pick([1, 5, 10, 15, 20, 25]),
        'card.paymentDueDay': pick([5, 10, 15, 20]),
        'card.gracePeriodDays': pick([15, 21, 45]),
        'card.cardStatementDelivery': pick(['EMAIL', 'POSTAL', 'BOTH']),
        'card.statementEmail': faker.internet.email().toLowerCase(),
        ...(hasSupp ? {
            'card.supplementaryCardCount': faker.number.int({ min: 1, max: 3 }),
            'card.suppCardHolderName': fullName(country),
            'card.suppCardHolderNid': nid(),
            'card.suppCardHolderMobile': phone(country),
            'card.suppCardHolderRelation': pick(['Spouse', 'Son', 'Daughter', 'Parent']),
            'card.suppCardLimit': isCredit ? Math.round(creditLimit * 0.5) : 0,
        } : {}),
        'card.linkedAccountNumber': acctNo(),
        'card.linkedAccountBank': bankName(country),
        'card.autoPayEnabled': faker.datatype.boolean({ probability: 0.4 }),
        'card.autoPayType': pick(['FULL_AMOUNT', 'MINIMUM', 'FIXED_AMOUNT']),
        'card.employmentType': pick(['SALARIED', 'SELF_EMPLOYED', 'BUSINESS']),
        'card.employerName': faker.company.name(),
        'card.monthlySalary': amt(25000, 500000),
        'card.tinNumber': tin(),
        'card.cibStatus': pick(['CLEAN', 'CLASSIFIED']),
        'card.creditScore': faker.number.int({ min: 500, max: 850 }),
        'card.smsAlertEnabled': true,
        'card.emailAlertEnabled': true,
        'card.twoFactorAuthEnabled': true,
        'card.cardStatus': pick(['ACTIVE', 'BLOCKED', 'EXPIRED']),
        'card.cardIssueDate': pastDate(),
        'card.cardExpiryDate': futureDate(),
        'card.autoRenewal': true,
        'card.introducerName': fullName(country),
        'card.introducerAccountNumber': acctNo(),
    };
}

// ═══════════════════════════════════════════════════════════════════
// MFS ACCOUNT (Mobile Financial Services)
// ═══════════════════════════════════════════════════════════════════

export function generateMFSAccount(customerId: number, country: Country) {
    const common = generateCommonAccountFields(customerId, 'MFS', country);
    const mfsType = pick(['PERSONAL', 'AGENT', 'MERCHANT']);
    const isMerchant = mfsType === 'MERCHANT';
    const isAgent = mfsType === 'AGENT';
    const mobileNum = phone(country);

    return {
        ...common,
        accountSubType: 'MFS_ACCOUNT',
        'mfs.provider': pick(['bKash', 'Nagad', 'Rocket', 'SureCash', 'mCash', 'OK Wallet', 'iPay', 'UCash']),
        'mfs.mfsAccountType': mfsType,
        'mfs.accountClass': pick(['BASIC', 'STANDARD', 'ENHANCED']),
        'mfs.walletNumber': mobileNum,
        'mfs.linkedMobileNumber': mobileNum,
        'mfs.mobileOperator': pick(['Grameenphone', 'Robi', 'Banglalink', 'Teletalk', 'Airtel']),
        'mfs.simType': pick(['PREPAID', 'POSTPAID']),
        'mfs.alternateMobile': phone(country),
        'mfs.kycLevel': pick(['BASIC', 'STANDARD', 'ENHANCED']),
        'mfs.kycVerifiedByMfs': true,
        'mfs.biometricVerified': faker.datatype.boolean({ probability: 0.7 }),
        'mfs.nidVerifiedViaEc': faker.datatype.boolean({ probability: 0.6 }),
        'mfs.faceVerified': faker.datatype.boolean({ probability: 0.5 }),
        'mfs.ekycReference': faker.string.alphanumeric(12).toUpperCase(),
        'mfs.dailyLimit': isMerchant ? amt(500000, 5000000) : isAgent ? amt(200000, 2000000) : amt(25000, 200000),
        'mfs.monthlyLimit': isMerchant ? amt(5000000, 50000000) : isAgent ? amt(2000000, 20000000) : amt(200000, 2000000),
        'mfs.singleTxLimit': isMerchant ? amt(100000, 1000000) : amt(10000, 100000),
        'mfs.balanceLimit': isMerchant ? amt(1000000, 10000000) : amt(300000, 500000),
        'mfs.dailyCashInLimit': amt(25000, 200000),
        'mfs.dailyCashOutLimit': amt(25000, 150000),
        'mfs.dailySendLimit': amt(25000, 200000),
        'mfs.dailyPaymentLimit': amt(25000, 200000),
        'mfs.monthlyCashInLimit': amt(200000, 2000000),
        'mfs.monthlyCashOutLimit': amt(200000, 1500000),
        'mfs.linkedBankAccount': acctNo(),
        'mfs.linkedBankName': bankName(country),
        'mfs.autoTopUpEnabled': faker.datatype.boolean({ probability: 0.2 }),
        'mfs.autoTopUpThreshold': amt(500, 5000),
        'mfs.autoTopUpAmount': amt(1000, 10000),
        'mfs.cashInOutEnabled': true,
        'mfs.sendMoneyEnabled': true,
        'mfs.paymentEnabled': true,
        'mfs.mobileRechargeEnabled': true,
        'mfs.billPaymentEnabled': true,
        'mfs.remittanceReceive': faker.datatype.boolean({ probability: 0.4 }),
        'mfs.salaryDisbursement': faker.datatype.boolean({ probability: 0.15 }),
        'mfs.govtAllowanceReceive': faker.datatype.boolean({ probability: 0.1 }),
        'mfs.qrPaymentEnabled': true,
        ...(isMerchant ? {
            'mfs.merchantCategoryCode': faker.string.numeric(4),
            'mfs.merchantName': faker.company.name(),
            'mfs.merchantTradeLicense': faker.string.numeric(10),
            'mfs.merchantTin': tin(),
            'mfs.merchantLocation': address(country),
            'mfs.merchantSettlementAcct': acctNo(),
            'mfs.merchantSettlementFreq': pick(['DAILY', 'WEEKLY', 'BIWEEKLY']),
            'mfs.merchantAnnualTurnover': amt(500000, 50000000),
            'mfs.merchantNatureOfBiz': faker.company.buzzPhrase(),
        } : {}),
        ...(isAgent ? {
            'mfs.agentBankingEnabled': true,
            'mfs.agentCode': faker.string.alphanumeric(8).toUpperCase(),
            'mfs.agentTerritory': pick(BD_AREAS),
            'mfs.agentCommissionType': pick(['FLAT', 'PERCENTAGE', 'TIERED']),
            'mfs.agentFloatLimit': amt(100000, 1000000),
        } : {}),
        'mfs.pinSet': true,
        'mfs.twoFactorEnabled': true,
        'mfs.fraudAlertEnabled': true,
        'mfs.smsAlertEnabled': true,
        'mfs.introducerName': fullName(country),
        'mfs.introducerAccountNumber': mobileNum,
    };
}

// ═══════════════════════════════════════════════════════════════════
// DEPOSIT ACCOUNT (FDR, RD, DPS)
// ═══════════════════════════════════════════════════════════════════

export function generateDepositAccount(customerId: number, country: Country) {
    const common = generateCommonAccountFields(customerId, 'DEPOSIT', country);
    const depositType = pick(['FDR', 'RECURRING_DEPOSIT', 'DPS', 'FIXED_DEPOSIT_SPECIAL', 'MONTHLY_BENEFIT', 'DOUBLE_BENEFIT']);
    const isRD = ['RECURRING_DEPOSIT', 'DPS'].includes(depositType);
    const tenure = pick([3, 6, 12, 24, 36, 60]);
    const depositAmt = isRD ? amt(500, 50000) : amt(50000, 10000000);
    const iRate = rate(4, 10);
    const isSenior = faker.datatype.boolean({ probability: 0.1 });

    return {
        ...common,
        accountSubType: 'FIXED_DEPOSIT',
        'deposit.depositType': depositType,
        'deposit.depositScheme': faker.string.alphanumeric(6).toUpperCase(),
        'deposit.depositSchemeName': `${depositType} - ${pick(['Standard', 'Premium', 'Special'])}`,
        'deposit.depositCurrency': country === 'BD' ? 'BDT' : 'USD',
        'deposit.isJointDeposit': faker.datatype.boolean({ probability: 0.1 }),
        'deposit.depositAmount': depositAmt,
        'deposit.installmentAmount': isRD ? depositAmt : 0,
        'deposit.installmentDate': isRD ? pick([1, 5, 10, 15, 20, 25]) : 0,
        'deposit.installmentFrequency': isRD ? 'MONTHLY' : '',
        'deposit.totalInstallments': isRD ? tenure : 0,
        'deposit.tenureMonths': tenure,
        'deposit.interestRate': iRate,
        'deposit.interestCalculationMethod': pick(['SIMPLE', 'COMPOUND']),
        'deposit.compoundingFrequency': pick(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY']),
        'deposit.interestPayoutMode': pick(['MONTHLY', 'QUARTERLY', 'AT_MATURITY']),
        'deposit.interestCreditAccount': acctNo(),
        'deposit.isVariableRate': faker.datatype.boolean({ probability: 0.1 }),
        ...(isSenior ? { 'deposit.seniorCitizenExtraRate': 0.5 } : {}),
        'deposit.maturityDate': futureDate(),
        'deposit.maturityAmount': Math.round(depositAmt * (1 + (iRate / 100) * (tenure / 12))),
        'deposit.maturityInstruction': pick(['AUTO_RENEW', 'CREDIT_TO_ACCOUNT', 'ISSUE_CHEQUE']),
        'deposit.autoRenewal': faker.datatype.boolean({ probability: 0.5 }),
        'deposit.renewalTenureMonths': tenure,
        'deposit.encashmentAccountNumber': acctNo(),
        'deposit.encashmentBankName': bankName(country),
        'deposit.prematureEncashmentAllowed': true,
        'deposit.prematureEncashmentRate': iRate - faker.number.float({ min: 1, max: 3, fractionDigits: 2 }),
        'deposit.partialEncashmentAllowed': faker.datatype.boolean({ probability: 0.3 }),
        'deposit.lienMarked': faker.datatype.boolean({ probability: 0.1 }),
        'deposit.debitAccountForInstallment': isRD ? acctNo() : '',
        'deposit.standingInstructionActive': isRD,
        'deposit.taxDeductedAtSource': true,
        'deposit.tdsRate': country === 'BD' ? 10 : 0,
        'deposit.sourceOfFund': pick(['Savings', 'Business', 'Salary', 'Gift', 'Inheritance', 'Remittance']),
        'deposit.purposeOfDeposit': pick(['Investment', 'Emergency Fund', 'Childs Education', 'Retirement', 'General Savings']),
        'deposit.fundTransferMode': pick(['ACCOUNT_TRANSFER', 'CASH', 'CHEQUE', 'ONLINE']),
        'deposit.nomineeName': fullName(country),
        'deposit.nomineeNid': nid(),
        'deposit.nomineeRelationship': pick(['Spouse', 'Son', 'Daughter', 'Father', 'Mother']),
        'deposit.nomineePhone': phone(country),
        'deposit.certificateNumber': faker.string.alphanumeric(10).toUpperCase(),
        'deposit.linkedSavingsAccount': acctNo(),
        'deposit.introducerName': fullName(country),
        'deposit.introducerAccountNumber': acctNo(),
        'deposit.isIslamicDeposit': faker.datatype.boolean({ probability: 0.12 }),
        'deposit.isSeniorCitizen': isSenior,
    };
}

// ═══════════════════════════════════════════════════════════════════
// CORPORATE ACCOUNT
// ═══════════════════════════════════════════════════════════════════

export function generateCorporateAccountDetail(customerId: number, country: Country) {
    const common = generateCommonAccountFields(customerId, 'CORPORATE', country);
    const companyName = `${faker.company.name()} ${pick(BD_COMPANY_SUFFIXES)}`;

    return {
        ...common,
        accountSubType: 'CORPORATE_ACCOUNT',
        accountOperationType: 'corporate',
        'corporateAccount.corporateAccountType': pick(['OPERATING', 'COLLECTION', 'DISBURSEMENT', 'PAYROLL', 'ESCROW', 'PROJECT', 'TREASURY']),
        'corporateAccount.companyName': companyName,
        'corporateAccount.companyNameLocal': '',
        'corporateAccount.companyNameShort': companyName.split(' ').slice(0, 2).join(' '),
        'corporateAccount.companyRegistrationNumber': faker.string.alphanumeric(12).toUpperCase(),
        'corporateAccount.entityType': pick(['PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'PARTNERSHIP', 'SOLE_PROPRIETORSHIP', 'LLC']),
        'corporateAccount.natureOfBusiness': faker.company.buzzPhrase(),
        'corporateAccount.businessDescription': faker.lorem.paragraph(),
        'corporateAccount.sectorCode': faker.string.numeric(4),
        'corporateAccount.industryClassification': pick(['Manufacturing', 'IT', 'Garments', 'Banking', 'Real Estate', 'Pharmaceuticals']),
        'corporateAccount.countryOfIncorporation': country === 'BD' ? 'Bangladesh' : 'United States',
        'corporateAccount.isForeignEntity': faker.datatype.boolean({ probability: 0.1 }),
        'corporateAccount.tradeLicenseNumber': faker.string.numeric(10),
        'corporateAccount.tradeLicenseAuthority': pick(['City Corporation', 'Municipality', 'BIDA']),
        'corporateAccount.tinNumber': tin(),
        'corporateAccount.binNumber': faker.string.numeric(12),
        'corporateAccount.registrationAuthority': pick(['RJSC', 'BIDA', 'Bangladesh Bank']),
        'corporateAccount.ircNumber': faker.string.alphanumeric(8).toUpperCase(),
        'corporateAccount.ercNumber': faker.string.alphanumeric(8).toUpperCase(),
        'corporateAccount.boardResolutionNumber': faker.string.alphanumeric(10).toUpperCase(),
        'corporateAccount.authorizedSignatoryCount': faker.number.int({ min: 1, max: 5 }),
        'corporateAccount.signatoryOperationMode': pick(['ANY_ONE', 'JOINTLY', 'TWO_OF_THREE']),
        'corporateAccount.ceoName': fullName(country),
        'corporateAccount.ceoDesignation': 'Chief Executive Officer',
        'corporateAccount.ceoNid': nid(),
        'corporateAccount.ceoPhone': phone(country),
        'corporateAccount.ceoEmail': faker.internet.email().toLowerCase(),
        'corporateAccount.chairmanName': fullName(country),
        'corporateAccount.chairmanNid': nid(),
        'corporateAccount.uboName': fullName(country),
        'corporateAccount.uboNationality': country === 'BD' ? 'Bangladeshi' : 'American',
        'corporateAccount.uboNid': nid(),
        'corporateAccount.uboSharePercentage': faker.number.float({ min: 25, max: 100, fractionDigits: 2 }),
        'corporateAccount.uboAddress': address(country),
        'corporateAccount.authorizedCapital': amt(1000000, 100000000),
        'corporateAccount.paidUpCapital': amt(500000, 50000000),
        'corporateAccount.annualTurnover': amt(5000000, 500000000),
        'corporateAccount.netWorth': amt(2000000, 200000000),
        'corporateAccount.totalAssets': amt(5000000, 500000000),
        'corporateAccount.numberOfEmployees': faker.number.int({ min: 10, max: 5000 }),
        'corporateAccount.expectedMonthlyTurnover': amt(500000, 50000000),
        'corporateAccount.expectedMonthlyDeposit': amt(200000, 30000000),
        'corporateAccount.expectedMonthlyWithdrawal': amt(200000, 25000000),
        'corporateAccount.sourceOfFund': pick(['Business Revenue', 'Investment', 'Loan', 'Share Capital']),
        'corporateAccount.involvedInImportExport': faker.datatype.boolean({ probability: 0.3 }),
        'corporateAccount.importProducts': faker.commerce.productName(),
        'corporateAccount.exportProducts': faker.commerce.productName(),
        'corporateAccount.purposeOfAccount': pick(['Business Operations', 'Payroll', 'Collection', 'Project Fund']),
        'corporateAccount.accountCurrency': country === 'BD' ? 'BDT' : 'USD',
        'corporateAccount.overdraftRequired': faker.datatype.boolean({ probability: 0.2 }),
        'corporateAccount.chequeBookRequired': true,
        'corporateAccount.onlineBankingRequired': true,
        'corporateAccount.payrollServiceReqd': faker.datatype.boolean({ probability: 0.4 }),
        'corporateAccount.cashManagementReqd': faker.datatype.boolean({ probability: 0.3 }),
        'corporateAccount.statementFrequency': pick(['MONTHLY', 'WEEKLY', 'DAILY']),
        'corporateAccount.statementDelivery': pick(['EMAIL', 'POSTAL', 'BOTH']),
        'corporateAccount.companyWebsite': faker.internet.url(),
        'corporateAccount.companyEmail': faker.internet.email().toLowerCase(),
        'corporateAccount.registeredAddressText': address(country),
        'corporateAccount.operationalAddressText': address(country),
        'corporateAccount.highRiskBusiness': faker.datatype.boolean({ probability: 0.05 }),
        'corporateAccount.pepAssociated': faker.datatype.boolean({ probability: 0.05 }),
        'corporateAccount.sanctionScreeningDone': true,
        'corporateAccount.isMsme': faker.datatype.boolean({ probability: 0.4 }),
        'corporateAccount.msmeCategory': pick(['COTTAGE', 'MICRO', 'SMALL', 'MEDIUM']),
        'corporateAccount.introducerName': fullName(country),
        'corporateAccount.introducerAccountNumber': acctNo(),
    };
}

// ═══════════════════════════════════════════════════════════════════
// CAMPAIGN ACCOUNT
// ═══════════════════════════════════════════════════════════════════

export function generateCampaignAccount(customerId: number, country: Country) {
    const common = generateCommonAccountFields(customerId, 'CAMPAIGN', country);
    const hasReferral = faker.datatype.boolean({ probability: 0.4 });

    return {
        ...common,
        accountSubType: 'CAMPAIGN',
        'campaign.campaignType': pick(['ACQUISITION', 'RETENTION', 'CROSS_SELL', 'PROMOTIONAL', 'SEASONAL', 'DIGITAL']),
        'campaign.campaignCategory': pick(['DEPOSIT', 'LOAN', 'CARD', 'SAVINGS', 'ACCOUNT_OPENING', 'REFERRAL']),
        'campaign.campaignTier': pick(['BASIC', 'STANDARD', 'PREMIUM', 'VIP']),
        'campaign.campaignBatchNo': faker.string.alphanumeric(8).toUpperCase(),
        'campaign.campaignCode': `CMP-${faker.string.alphanumeric(6).toUpperCase()}`,
        'campaign.campaignName': `${pick(['Mega', 'Super', 'Eid', 'New Year', 'Digital First', 'Green', 'Smart', 'Youth'])} ${pick(['Savings', 'Deposit', 'Account', 'Offer', 'Campaign', 'Prize'])} ${faker.number.int({ min: 2023, max: 2025 })}`,
        'campaign.campaignDescription': faker.lorem.paragraph(),
        'campaign.internalRefNumber': faker.string.alphanumeric(10).toUpperCase(),
        'campaign.campaignOwnerDept': pick(['Retail Banking', 'Marketing', 'Digital Banking', 'Product', 'Branch Banking']),
        'campaign.campaignOwnerName': fullName(country),
        'campaign.campaignOwnerEmail': faker.internet.email().toLowerCase(),
        'campaign.campaignStatus': pick(['active', 'upcoming', 'completed']),
        'campaign.campaignLaunchDate': pastDate(),
        'campaign.campaignEndDate': futureDate(),
        'campaign.offerValidFrom': pastDate(),
        'campaign.offerValidUntil': futureDate(),
        'campaign.enrollmentStartDt': pastDate(),
        'campaign.enrollmentEndDt': futureDate(),
        'campaign.maxEnrollmentCap': faker.number.int({ min: 100, max: 100000 }),
        'campaign.promoCode': `PROMO${faker.string.alphanumeric(4).toUpperCase()}`,
        ...(hasReferral ? {
            'campaign.referralCode': `REF${faker.string.alphanumeric(6).toUpperCase()}`,
            'campaign.referredBy': fullName(country),
            'campaign.referredByAccount': acctNo(),
            'campaign.referredByPhone': phone(country),
            'campaign.referralType': pick(['CUSTOMER', 'EMPLOYEE', 'AGENT', 'PARTNER']),
            'campaign.referralVerified': true,
            'campaign.referrerRewardType': pick(['CASH', 'POINTS', 'VOUCHER']),
            'campaign.referrerRewardAmount': amt(100, 5000),
            'campaign.refereeRewardType': pick(['CASH', 'POINTS', 'VOUCHER']),
            'campaign.refereeRewardAmount': amt(100, 3000),
        } : {}),
        'campaign.discountPercent': faker.number.float({ min: 0, max: 50, fractionDigits: 2 }),
        'campaign.discountType': pick(['PERCENTAGE', 'FLAT', 'NONE']),
        'campaign.bonusInterest': faker.number.float({ min: 0, max: 3, fractionDigits: 2 }),
        'campaign.bonusInterestDuration': pick(['3_MONTHS', '6_MONTHS', '12_MONTHS']),
        'campaign.cashbackAmount': amt(0, 5000),
        'campaign.cashbackType': pick(['FLAT', 'PERCENTAGE', 'NONE']),
        'campaign.cashbackMaxCap': amt(1000, 10000),
        'campaign.welcomeBonusAmount': amt(0, 5000),
        'campaign.rewardPoints': faker.number.int({ min: 0, max: 10000 }),
        'campaign.giftDescription': Math.random() > 0.5 ? pick(['Free Bag', 'T-Shirt', 'Power Bank', 'Umbrella', 'None']) : '',
        'campaign.feeWaiverType': pick(['ANNUAL_FEE', 'PROCESSING_FEE', 'ISSUANCE_FEE', 'ALL', 'NONE']),
        'campaign.feeWaiverAmount': amt(0, 5000),
        'campaign.feeWaiverDuration': pick(['1_YEAR', '2_YEARS', 'LIFETIME', 'NONE']),
        'campaign.freeDebitCard': faker.datatype.boolean({ probability: 0.4 }),
        'campaign.freeChequeBook': faker.datatype.boolean({ probability: 0.3 }),
        'campaign.freeInternetBanking': faker.datatype.boolean({ probability: 0.5 }),
        'campaign.targetSegment': pick(['RETAIL', 'CORPORATE', 'SME', 'YOUTH', 'WOMEN', 'SENIOR', 'NRB', 'ALL']),
        'campaign.targetGeography': pick(['National', 'Dhaka', 'Chittagong', 'Urban', 'Rural']),
        'campaign.channelExclusive': pick(['ALL', 'BRANCH', 'DIGITAL', 'AGENT']),
        'campaign.existingCustomerOnly': faker.datatype.boolean({ probability: 0.3 }),
        'campaign.newCustomerOnly': faker.datatype.boolean({ probability: 0.4 }),
        'campaign.minDepositRequired': amt(1000, 50000),
        'campaign.productOfInterest': pick(['Savings', 'FDR', 'Current', 'Loan', 'Card']),
        'campaign.linkedProductCode': faker.string.alphanumeric(6).toUpperCase(),
        'campaign.referralSource': pick(['SOCIAL_MEDIA', 'WEBSITE', 'BRANCH', 'CALL_CENTER', 'SMS', 'EMAIL', 'AGENT']),
        'campaign.utmSource': pick(['facebook', 'google', 'instagram', 'website', 'sms']),
        'campaign.utmMedium': pick(['cpc', 'organic', 'social', 'email', 'banner']),
        'campaign.utmCampaign': faker.string.alphanumeric(10),
        'campaign.dsaAgentCode': faker.string.alphanumeric(6).toUpperCase(),
        'campaign.dsaAgentName': fullName(country),
        'campaign.consentMarketing': true,
        'campaign.consentSms': true,
        'campaign.consentEmail': true,
        'campaign.termsAccepted': true,
        'campaign.enrollmentStatus': 'enrolled',
        'campaign.fulfillmentStatus': pick(['PENDING', 'PROCESSED', 'DELIVERED']),
        'campaign.accountOpeningBranch': branchCode(),
        'campaign.accountOpeningChannel': pick(['BRANCH', 'ONLINE', 'AGENT']),
        'campaign.relationshipManager': fullName(country),
        'campaign.introducerName': fullName(country),
        'campaign.introducerAccount': acctNo(),
    };
}

// ═══════════════════════════════════════════════════════════════════
// MAIN DISPATCHER
// ═══════════════════════════════════════════════════════════════════

export type AccountProductType =
    | 'SAVINGS' | 'CURRENT' | 'LOAN' | 'CARD'
    | 'MFS' | 'DEPOSIT' | 'CORPORATE_ACCOUNT' | 'CAMPAIGN';

const ACCOUNT_TYPE_WEIGHTS: { type: AccountProductType; weight: number }[] = [
    { type: 'SAVINGS', weight: 30 },
    { type: 'CURRENT', weight: 20 },
    { type: 'LOAN', weight: 15 },
    { type: 'CARD', weight: 12 },
    { type: 'MFS', weight: 8 },
    { type: 'DEPOSIT', weight: 8 },
    { type: 'CORPORATE_ACCOUNT', weight: 5 },
    { type: 'CAMPAIGN', weight: 2 },
];

export function randomAccountType(): AccountProductType {
    const total = ACCOUNT_TYPE_WEIGHTS.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;
    for (const { type, weight } of ACCOUNT_TYPE_WEIGHTS) {
        r -= weight;
        if (r <= 0) return type;
    }
    return 'SAVINGS';
}

/**
 * Generate a complete account payload for any product type.
 * @param customerId — The parent customer's ID
 * @param forceType — Force a specific account product type
 * @param forceCountry — Force BD or US locale (default: 85% BD / 15% US)
 */
export function generateAccountData(
    customerId: number,
    forceType?: AccountProductType,
    forceCountry?: Country,
): Record<string, any> {
    const country = forceCountry || (Math.random() < 0.85 ? 'BD' : 'US');
    const accountType = forceType || randomAccountType();

    switch (accountType) {
        case 'SAVINGS':
            return generateSavingsAccount(customerId, country);
        case 'CURRENT':
            return generateCurrentAccount(customerId, country);
        case 'LOAN':
            return generateLoanAccount(customerId, country);
        case 'CARD':
            return generateCardAccount(customerId, country);
        case 'MFS':
            return generateMFSAccount(customerId, country);
        case 'DEPOSIT':
            return generateDepositAccount(customerId, country);
        case 'CORPORATE_ACCOUNT':
            return generateCorporateAccountDetail(customerId, country);
        case 'CAMPAIGN':
            return generateCampaignAccount(customerId, country);
        default:
            return generateSavingsAccount(customerId, country);
    }
}
