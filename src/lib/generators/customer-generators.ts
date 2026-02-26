/**
 * Customer Profile Generators — Production-Ready Mock Data
 *
 * Generates realistic data for all 4 customer profile variants:
 *   INDIVIDUAL  — Personal KYC fields (name, DOB, parents, addresses, etc.)
 *   CORPORATE   — Company identity, directors, shareholders, signatories, financials
 *   GOVERNMENT  — Ministry/agency details, authorized officers, budget records
 *   NPO         — NGO/charity details, governing members, donors, financials
 *
 * Each generator returns data keyed with the appropriate prefix
 * (individual.*, corporate.*, government.*, npo.*) matching the backend
 * field-mapping template convention.
 */

import { faker } from '@faker-js/faker';

// ─── Reusable locale helpers (same pools as schema-manager) ──────────

const BD_MALE_FIRST = ['Mohammed', 'Abdul', 'Md', 'Sheikh', 'Rafiqul', 'Kamal', 'Hasan', 'Rahim', 'Rashid', 'Tariq', 'Faruk', 'Habib', 'Nasir', 'Kabir', 'Murad', 'Ashraf', 'Iqbal', 'Monir', 'Shahid', 'Masud'];
const BD_FEMALE_FIRST = ['Fatima', 'Aisha', 'Khadija', 'Nasima', 'Rahima', 'Sultana', 'Hasina', 'Shamima', 'Taslima', 'Rabeya', 'Salma', 'Nargis', 'Ruksana', 'Parveen', 'Shirin', 'Nusrat', 'Farzana', 'Sadia', 'Tasnim'];
const BD_LAST = ['Rahman', 'Islam', 'Hossain', 'Ahmed', 'Khan', 'Uddin', 'Ali', 'Chowdhury', 'Siddique', 'Hassan', 'Karim', 'Sheikh', 'Talukder', 'Sarker', 'Alam', 'Haque', 'Bhuiyan', 'Mahmud', 'Jahan'];
const BD_CITIES = ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Sylhet', 'Rangpur', 'Barisal', 'Comilla', 'Gazipur', 'Narayanganj', 'Mymensingh'];
const BD_AREAS = ['Dhanmondi', 'Gulshan', 'Banani', 'Uttara', 'Mirpur', 'Mohammadpur', 'Motijheel', 'Panthapath', 'Farmgate', 'Basundhara', 'Baridhara'];

const BD_COMPANY_SUFFIXES = ['Ltd', 'Pvt Ltd', 'Limited', 'Industries Ltd', 'Group of Industries', 'Corporation', 'Holdings Ltd', 'Enterprises', 'Trading Co'];
const BD_GOVT_BODIES = ['Ministry of Finance', 'Ministry of Home Affairs', 'Bangladesh Bank', 'Local Government Division', 'Ministry of Commerce', 'Ministry of Education', 'Power Division', 'Ministry of Health', 'Ministry of Agriculture', 'ICT Division', 'Ministry of Foreign Affairs', 'Roads and Highways Division'];
const BD_NPO_TYPES = ['Foundation', 'Trust', 'Association', 'Society', 'Welfare Organization', 'Relief Organization', 'Development Foundation', 'Charitable Trust', 'Cultural Society'];
const BD_NPO_NAMES = ['Bangladesh Rural Advancement', 'Grameen', 'ASA', 'BRAC', 'Proshika', 'Bangladesh Youth', 'Salam Foundation', 'Hope', 'Padma', 'Meghna', 'Jamuna', 'Sundarban', 'Rupantar', 'Uttaran', 'Samata'];

type Country = 'BD' | 'US';

function pick<T>(arr: T[]): T { return faker.helpers.arrayElement(arr); }
function pickN<T>(arr: T[], n: number): T[] { return faker.helpers.arrayElements(arr, n); }
function bdName(): string { return `${pick(Math.random() > 0.5 ? BD_MALE_FIRST : BD_FEMALE_FIRST)} ${pick(BD_LAST)}`; }
function fullName(country: Country): string { return country === 'BD' ? bdName() : faker.person.fullName(); }
function phone(country: Country): string {
    if (country === 'BD') {
        const prefix = pick(['013', '014', '015', '016', '017', '018', '019']);
        return `+880${prefix}${faker.string.numeric(8)}`;
    }
    return faker.phone.number();
}
function address(country: Country): string {
    if (country === 'BD') {
        return `House #${faker.number.int({ min: 1, max: 200 })}, Road #${faker.number.int({ min: 1, max: 50 })}, ${pick(BD_AREAS)}, ${pick(BD_CITIES)} ${faker.number.int({ min: 1000, max: 9999 })}`;
    }
    return faker.location.streetAddress();
}
function city(country: Country): string { return country === 'BD' ? pick(BD_CITIES) : faker.location.city(); }
function nid(): string { return faker.string.numeric(13); }
function tin(): string { return faker.string.numeric(12); }
function amount(min = 10000, max = 50000000): number { return faker.number.int({ min, max }); }
function pct(): string { return faker.number.float({ min: 0, max: 100, fractionDigits: 2 }).toString(); }
function pastDate(): string { return faker.date.past({ years: 5 }).toISOString().split('T')[0]; }
function futureDate(): string { return faker.date.future({ years: 3 }).toISOString().split('T')[0]; }
function recentDate(): string { return faker.date.recent({ days: 90 }).toISOString().split('T')[0]; }

// ═══════════════════════════════════════════════════════════════════
// COMMON CUSTOMER PROFILE FIELDS (shared across all variants)
// ═══════════════════════════════════════════════════════════════════

export function generateCommonCustomerFields(country: Country, customerType: string) {
    const customerId = faker.number.int({ min: 100000, max: 999999 });
    const nameEng = customerType === 'INDIVIDUAL' || customerType === 'JOINT'
        ? fullName(country)
        : customerType === 'CORPORATE'
            ? `${faker.company.name()} ${pick(BD_COMPANY_SUFFIXES)}`
            : customerType === 'GOVERNMENT'
                ? pick(BD_GOVT_BODIES)
                : `${pick(BD_NPO_NAMES)} ${pick(BD_NPO_TYPES)}`;

    return {
        customerId,
        trackingNumber: faker.string.alphanumeric(12).toUpperCase(),
        customerUuid: faker.string.uuid(),
        customerShortName: nameEng.split(' ').slice(0, 2).join(' '),
        accountStatus: pick(['ACTIVE', 'PENDING']),
        customerNameEng: nameEng,
        customerNameBen: country === 'BD' ? nameEng : '', // simplified
        customerType,
        riskRating: pick(['LOW', 'MEDIUM', 'HIGH']),
        nationality: country === 'BD' ? 'Bangladesh' : 'United States',
        countryCode: country === 'BD' ? 'BD' : 'US',
        mobileNumber: phone(country),
        email: faker.internet.email({ firstName: nameEng.split(' ')[0] }).toLowerCase(),
    };
}

// ═══════════════════════════════════════════════════════════════════
// INDIVIDUAL PROFILE
// ═══════════════════════════════════════════════════════════════════

export function generateIndividualProfile(country: Country) {
    const common = generateCommonCustomerFields(country, 'INDIVIDUAL');
    const isMale = Math.random() > 0.5;

    const profile: Record<string, any> = {
        ...common,
        // Individual-specific fields with "individual." prefix
        'individual.nidNo': nid(),
        'individual.smartCardNo': faker.string.numeric(10),
        'individual.idType': pick(['NID', 'PASSPORT', 'DRIVING_LICENSE', 'BIRTH_CERTIFICATE']),
        'individual.dob': faker.date.birthdate({ min: 18, max: 75, mode: 'age' }).toISOString().split('T')[0],
        'individual.fatherNameEng': fullName(country),
        'individual.fatherNameBen': country === 'BD' ? bdName() : '',
        'individual.motherNameEng': fullName(country),
        'individual.motherNameBen': country === 'BD' ? bdName() : '',
        'individual.spouseNameEng': Math.random() > 0.3 ? fullName(country) : '',
        'individual.spouseNameBen': '',
        'individual.gender': isMale ? 'Male' : 'Female',
        'individual.maritalStatus': pick(['Single', 'Married', 'Divorced', 'Widowed']),
        'individual.presAddressEng': address(country),
        'individual.presAddressBen': '',
        'individual.permAddressEng': address(country),
        'individual.permAddressBen': '',
        'individual.profAddressEng': address(country),
        'individual.mailingAddress': address(country),
        'individual.tinNumber': tin(),
        'individual.etinNumber': tin(),
        'individual.profession': faker.person.jobTitle(),
        'individual.otherProfession': '',
        'individual.religion': pick(['Islam', 'Christianity', 'Hinduism', 'Buddhism', 'Other']),
        'individual.placeOfBirth': city(country),
        'individual.countryOfBirth': country === 'BD' ? 'Bangladesh' : 'United States',
        'individual.sourceOfFund': pick(['Salary', 'Business', 'Investment', 'Inheritance', 'Gift', 'Other']),
        'individual.otherSourceOfFund': '',
        'individual.natureOfBusiness': pick(['Service', 'Trading', 'Manufacturing', 'Agriculture', 'IT', 'Healthcare']),
        'individual.nativeResident': true,
        'individual.residentialStatus': pick(['RESIDENT', 'NON_RESIDENT']),
        'individual.transactionLimitMonthly': amount(50000, 5000000).toString(),
        'individual.monthlyIncome': amount(15000, 500000).toString(),
        'individual.usResidency': false,
        'individual.usCitizenship': false,
        'individual.passportNo': faker.string.alphanumeric(9).toUpperCase(),
        'individual.passportIssueDate': pastDate(),
        'individual.passportExpiryDate': futureDate(),
        'individual.passportIssuePlace': city(country),
        'individual.birthRegNo': faker.string.numeric(17),
        'individual.drivingLicenseNo': faker.string.alphanumeric(15).toUpperCase(),

        // Nested objects — delivered as flat-key maps
        verificationScores: generateVerificationScores(),
        screeningInfo: { isPep: faker.datatype.boolean({ probability: 0.05 }), pepCheckStatus: pick(['CLEAR', 'PENDING', 'HIT']) },
        transactionProfiles: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => generateTransactionProfile()),
        riskGrading: [generateRiskGrading()],
        riskGradingScores: [generateRiskGradingScore()],
        riskAssessments: [generateRiskAssessment()],
        branchRelatedInfo: [generateBranchRelatedInfo(country)],
        introducers: Array.from({ length: faker.number.int({ min: 1, max: 2 }) }, () => generateIntroducer(country)),
        otherBanks: Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => generateOtherBank(country)),
        otherBankCards: Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => generateOtherBankCard()),
        otherInfo: Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => ({ infoKey: faker.lorem.word(), infoValue: faker.lorem.sentence() })),
    };

    return profile;
}

// ═══════════════════════════════════════════════════════════════════
// CORPORATE PROFILE
// ═══════════════════════════════════════════════════════════════════

export function generateCorporateProfile(country: Country) {
    const common = generateCommonCustomerFields(country, 'CORPORATE');

    const profile: Record<string, any> = {
        ...common,
        'corporate.companyName': common.customerNameEng,
        'corporate.companyNameBengali': '',
        'corporate.registrationNumber': faker.string.alphanumeric(12).toUpperCase(),
        'corporate.dateOfIncorporation': pastDate(),
        'corporate.countryOfIncorporation': country === 'BD' ? 'Bangladesh' : 'United States',
        'corporate.companyType': pick(['PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'PARTNERSHIP', 'SOLE_PROPRIETORSHIP', 'LLC', 'JOINT_VENTURE']),
        'corporate.industryType': pick(['Manufacturing', 'IT & Software', 'Garments', 'Banking & Finance', 'Real Estate', 'Retail', 'Pharmaceuticals', 'Energy', 'Agriculture', 'Shipping']),
        'corporate.industrySector': pick(['Primary', 'Secondary', 'Tertiary']),
        'corporate.businessNature': faker.company.catchPhrase(),
        'corporate.businessDescription': faker.lorem.paragraph(),
        'corporate.registeredAddress': address(country),
        'corporate.businessAddress': address(country),
        'corporate.mailingAddress': address(country),
        'corporate.taxIdentificationNo': tin(),
        'corporate.tradeLicenseNo': faker.string.numeric(10),
        'corporate.tradeLicenseIssueDate': pastDate(),
        'corporate.tradeLicenseExpiryDate': futureDate(),
        'corporate.vatRegNo': faker.string.numeric(11),
        'corporate.binNo': faker.string.numeric(12),
        'corporate.phoneNumber': phone(country),
        'corporate.faxNumber': phone(country),
        'corporate.email': faker.internet.email({ firstName: common.customerNameEng.split(' ')[0] }).toLowerCase(),
        'corporate.website': faker.internet.url(),
        'corporate.authorizedCapital': amount(1000000, 100000000),
        'corporate.paidUpCapital': amount(500000, 50000000),
        'corporate.numberOfEmployees': faker.number.int({ min: 10, max: 5000 }),
        'corporate.annualTurnover': amount(5000000, 500000000),
        'corporate.netWorth': amount(2000000, 200000000),
        'corporate.sourceOfFund': pick(['Business Revenue', 'Investment', 'Loan', 'Share Capital', 'Retained Earnings']),
        'corporate.expectedMonthlyTransaction': amount(100000, 50000000),
        'corporate.publiclyListed': faker.datatype.boolean({ probability: 0.2 }),
        'corporate.stockExchange': Math.random() > 0.8 ? pick(['DSE', 'CSE', 'NYSE', 'NASDAQ']) : '',
        'corporate.foreignOwnership': faker.datatype.boolean({ probability: 0.15 }),
        'corporate.foreignOwnershipPercent': '',
        'corporate.sanctionScreeningDone': true,
        'corporate.adverseMediaCheckDone': true,
        'corporate.pepAssociationChecked': true,
        'corporate.riskRating': pick(['LOW', 'MEDIUM', 'HIGH']),

        // Nested arrays
        'corporate.directors': Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, (_, i) => ({
            directorIndex: i,
            directorName: fullName(country),
            directorDesignation: pick(['Managing Director', 'Director', 'Chairman', 'Chief Executive', 'Executive Director']),
            directorNid: nid(),
            directorPhone: phone(country),
            directorEmail: faker.internet.email().toLowerCase(),
            directorAddress: address(country),
            directorSharePercentage: pct(),
            directorNationality: country === 'BD' ? 'Bangladeshi' : 'American',
            directorIsPep: faker.datatype.boolean({ probability: 0.05 }),
        })),
        'corporate.shareholders': Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, (_, i) => ({
            shareholderIndex: i,
            shareholderName: Math.random() > 0.3 ? fullName(country) : `${faker.company.name()} ${pick(BD_COMPANY_SUFFIXES)}`,
            shareholderType: pick(['Individual', 'Corporate', 'Institutional']),
            shareholderPercentage: pct(),
            shareholderNid: nid(),
            shareholderNationality: country === 'BD' ? 'Bangladeshi' : 'American',
        })),
        'corporate.beneficialOwners': Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, (_, i) => ({
            beneficialOwnerIndex: i,
            beneficialOwnerName: fullName(country),
            beneficialOwnerNid: nid(),
            beneficialOwnerPercentage: pct(),
            beneficialOwnerNationality: country === 'BD' ? 'Bangladeshi' : 'American',
        })),
        'corporate.signatories': Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, (_, i) => ({
            signatoryIndex: i,
            signatoryName: fullName(country),
            signatoryDesignation: pick(['CEO', 'CFO', 'Managing Director', 'Director', 'Company Secretary', 'Authorized Signatory']),
            signatoryNid: nid(),
            signatoryPhone: phone(country),
            signatorySpecimenSignature: '',
        })),
        'corporate.contactPersons': Array.from({ length: faker.number.int({ min: 1, max: 2 }) }, (_, i) => ({
            contactPersonIndex: i,
            contactPersonName: fullName(country),
            contactPersonDesignation: pick(['Manager', 'Accountant', 'Officer', 'VP Finance', 'Compliance Officer']),
            contactPersonPhone: phone(country),
            contactPersonEmail: faker.internet.email().toLowerCase(),
        })),
        'corporate.financials': Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, (_, i) => ({
            financialYear: (2023 - i).toString(),
            totalRevenue: amount(5000000, 500000000),
            netProfit: amount(500000, 50000000),
            totalAssets: amount(10000000, 1000000000),
            totalLiabilities: amount(2000000, 500000000),
            auditFirm: pick(['ACNABIN', 'Hoda Vasi', 'A. Qasem', 'KPMG', 'Deloitte', 'EY', 'PwC', 'Grant Thornton']),
            auditOpinion: pick(['Unqualified', 'Qualified', 'Adverse', 'Disclaimer']),
        })),
        'corporate.relatedParties': Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, (_, i) => ({
            relatedPartyIndex: i,
            relatedPartyName: `${faker.company.name()} ${pick(BD_COMPANY_SUFFIXES)}`,
            relatedPartyRelationType: pick(['Subsidiary', 'Associate', 'Joint Venture', 'Sister Concern', 'Parent Company']),
            relatedPartyRegistrationNo: faker.string.alphanumeric(10).toUpperCase(),
        })),

        // Common nested sections
        screeningInfo: { isPep: faker.datatype.boolean({ probability: 0.05 }), pepCheckStatus: 'CLEAR' },
        branchRelatedInfo: [generateBranchRelatedInfo(country)],
        introducers: [generateIntroducer(country)],
        otherBanks: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => generateOtherBank(country)),
        otherInfo: [{ infoKey: 'businessCategory', infoValue: faker.company.buzzPhrase() }],
    };

    return profile;
}

// ═══════════════════════════════════════════════════════════════════
// GOVERNMENT PROFILE
// ═══════════════════════════════════════════════════════════════════

export function generateGovernmentProfile(country: Country) {
    const common = generateCommonCustomerFields(country, 'GOVERNMENT');

    const profile: Record<string, any> = {
        ...common,
        'government.entityName': common.customerNameEng,
        'government.entityNameBengali': '',
        'government.entityType': pick(['MINISTRY', 'DIVISION', 'DEPARTMENT', 'AUTONOMOUS_BODY', 'STATE_ENTERPRISE', 'LOCAL_GOVERNMENT', 'PUBLIC_CORPORATION']),
        'government.jurisdictionLevel': pick(['NATIONAL', 'DIVISIONAL', 'DISTRICT', 'UPAZILA', 'UNION']),
        'government.parentMinistry': pick(BD_GOVT_BODIES),
        'government.establishmentDate': pastDate(),
        'government.establishmentAct': `${pick(['Act', 'Ordinance', 'Order'])} of ${faker.number.int({ min: 1970, max: 2020 })}`,
        'government.registrationNumber': faker.string.alphanumeric(12).toUpperCase(),
        'government.taxIdentificationNo': tin(),
        'government.vatRegNo': faker.string.numeric(11),
        'government.registeredAddress': address(country),
        'government.correspondenceAddress': address(country),
        'government.phoneNumber': phone(country),
        'government.faxNumber': phone(country),
        'government.email': `info@${faker.internet.domainWord()}.gov.bd`,
        'government.website': `https://www.${faker.internet.domainWord()}.gov.bd`,
        'government.headOfEntity': fullName(country),
        'government.headDesignation': pick(['Secretary', 'Director General', 'Chairman', 'Chief Executive', 'Managing Director', 'Commissioner']),
        'government.budgetCode': faker.string.numeric(8),
        'government.fundingSource': pick(['Government Budget', 'Development Partner', 'Revenue', 'Mixed', 'Self-Funded']),
        'government.annualBudget': amount(10000000, 10000000000),
        'government.numberOfEmployees': faker.number.int({ min: 50, max: 10000 }),
        'government.accountPurpose': pick(['Operational Expenses', 'Project Fund', 'Revenue Collection', 'Development Fund', 'Salary Disbursement']),
        'government.expectedMonthlyTransaction': amount(1000000, 100000000),
        'government.sanctionScreeningDone': true,
        'government.auditAuthority': pick(['Comptroller & Auditor General', 'Internal Audit', 'External Audit Firm']),
        'government.lastAuditDate': pastDate(),
        'government.complianceOfficer': fullName(country),
        'government.complianceOfficerPhone': phone(country),
        'government.riskRating': 'LOW',

        'government.authorizedOfficers': Array.from({ length: faker.number.int({ min: 2, max: 4 }) }, (_, i) => ({
            officerIndex: i,
            officerName: fullName(country),
            officerDesignation: pick(['Secretary', 'Additional Secretary', 'Joint Secretary', 'Deputy Secretary', 'Senior Assistant Secretary', 'Director', 'Deputy Director']),
            officerNid: nid(),
            officerPhone: phone(country),
            officerEmail: faker.internet.email().toLowerCase(),
            officerSignatureAuthority: pick(['Full', 'Limited', 'Joint']),
        })),
        'government.signatories': Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, (_, i) => ({
            signatoryIndex: i,
            signatoryName: fullName(country),
            signatoryDesignation: pick(['Accounts Officer', 'Finance Officer', 'Drawing & Disbursing Officer']),
            signatoryNid: nid(),
            signatoryPhone: phone(country),
        })),
        'government.contactPersons': Array.from({ length: 1 }, (_, i) => ({
            contactPersonIndex: i,
            contactPersonName: fullName(country),
            contactPersonDesignation: pick(['Public Relations Officer', 'Protocol Officer', 'Administrative Officer']),
            contactPersonPhone: phone(country),
            contactPersonEmail: faker.internet.email().toLowerCase(),
        })),
        'government.budgetRecords': Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, (_, i) => ({
            fiscalYear: `${2023 - i}-${2024 - i}`,
            allocatedBudget: amount(10000000, 5000000000),
            revisedBudget: amount(10000000, 5000000000),
            actualExpenditure: amount(5000000, 3000000000),
            auditStatus: pick(['Audited', 'Pending', 'In Progress']),
        })),
        'government.relatedEntities': Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, (_, i) => ({
            relatedEntityIndex: i,
            relatedEntityName: pick(BD_GOVT_BODIES),
            relatedEntityType: pick(['Parent', 'Subsidiary', 'Affiliated', 'Oversight']),
        })),

        screeningInfo: { isPep: true, pepCheckStatus: 'CLEAR' },
        branchRelatedInfo: [generateBranchRelatedInfo(country)],
        otherBanks: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => generateOtherBank(country)),
    };

    return profile;
}

// ═══════════════════════════════════════════════════════════════════
// NPO (Non-Profit Organization) PROFILE
// ═══════════════════════════════════════════════════════════════════

export function generateNPOProfile(country: Country) {
    const common = generateCommonCustomerFields(country, 'NPO');

    const profile: Record<string, any> = {
        ...common,
        'npo.organizationName': common.customerNameEng,
        'npo.organizationNameBengali': '',
        'npo.organizationType': pick(['NGO', 'FOUNDATION', 'TRUST', 'COOPERATIVE', 'CHARITY', 'ASSOCIATION', 'SOCIETY']),
        'npo.registrationNumber': faker.string.alphanumeric(12).toUpperCase(),
        'npo.registrationAuthority': pick(['NGO Affairs Bureau', 'Joint Stock Companies', 'Registrar of Cooperative Societies', 'Ministry of Social Welfare', 'DCO Office']),
        'npo.dateOfRegistration': pastDate(),
        'npo.countryOfRegistration': country === 'BD' ? 'Bangladesh' : 'United States',
        'npo.ngoAffairsBureauNo': faker.string.numeric(6),
        'npo.microCreditLicenseNo': Math.random() > 0.5 ? faker.string.numeric(8) : '',
        'npo.taxIdentificationNo': tin(),
        'npo.vatRegNo': faker.string.numeric(11),
        'npo.registeredAddress': address(country),
        'npo.operationalAddress': address(country),
        'npo.mailingAddress': address(country),
        'npo.phoneNumber': phone(country),
        'npo.faxNumber': phone(country),
        'npo.email': `info@${faker.internet.domainWord()}.org`,
        'npo.website': `https://www.${faker.internet.domainWord()}.org`,
        'npo.mission': faker.lorem.sentence(),
        'npo.vision': faker.lorem.sentence(),
        'npo.areasOfOperation': pickN(['Education', 'Health', 'Poverty Reduction', 'Microfinance', 'Human Rights', 'Environment', 'Disaster Relief', 'Women Empowerment', 'Rural Development', 'Water & Sanitation'], faker.number.int({ min: 2, max: 5 })).join(', '),
        'npo.geographicCoverage': pick(['National', 'Regional', 'District-Level', 'International']),
        'npo.headOfOrganization': fullName(country),
        'npo.headDesignation': pick(['Executive Director', 'Director General', 'Secretary General', 'Chairman', 'Managing Trustee', 'Chief Executive']),
        'npo.numberOfEmployees': faker.number.int({ min: 5, max: 2000 }),
        'npo.numberOfBeneficiaries': faker.number.int({ min: 100, max: 500000 }),
        'npo.sourceOfFund': pick(['Grants', 'Donations', 'Government Subsidy', 'Microfinance Revenue', 'Project Funding', 'Mixed']),
        'npo.majorDonors': pickN(['USAID', 'World Bank', 'UNICEF', 'DFID', 'EU', 'Global Fund', 'JICA', 'BRAC', 'Government of Bangladesh', 'Private Philanthropy'], faker.number.int({ min: 1, max: 4 })).join(', '),
        'npo.annualBudget': amount(500000, 100000000),
        'npo.expectedMonthlyTransaction': amount(50000, 10000000),
        'npo.accountPurpose': pick(['Operational Expenses', 'Project Fund', 'Grant Disbursement', 'Salary', 'Microfinance Operations']),
        'npo.hasForeignFunding': faker.datatype.boolean({ probability: 0.6 }),
        'npo.foreignFundingApproval': Math.random() > 0.4 ? 'Approved by NGO Affairs Bureau' : '',
        'npo.sanctionScreeningDone': true,
        'npo.adverseMediaCheckDone': true,
        'npo.lastAuditDate': pastDate(),
        'npo.auditFirm': pick(['ACNABIN', 'Hoda Vasi', 'A. Qasem', 'Grant Thornton', 'KPMG']),
        'npo.complianceOfficer': fullName(country),
        'npo.complianceOfficerPhone': phone(country),
        'npo.riskRating': pick(['LOW', 'MEDIUM', 'HIGH']),

        'npo.governingMembers': Array.from({ length: faker.number.int({ min: 3, max: 7 }) }, (_, i) => ({
            memberIndex: i,
            memberName: fullName(country),
            memberDesignation: pick(['Chairman', 'Vice Chairman', 'Secretary', 'Treasurer', 'Member', 'Executive Member', 'Trustee']),
            memberNid: nid(),
            memberPhone: phone(country),
            memberEmail: faker.internet.email().toLowerCase(),
            memberOccupation: faker.person.jobTitle(),
            memberIsPep: faker.datatype.boolean({ probability: 0.05 }),
        })),
        'npo.signatories': Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, (_, i) => ({
            signatoryIndex: i,
            signatoryName: fullName(country),
            signatoryDesignation: pick(['Executive Director', 'Finance Director', 'Program Director', 'Authorized Signatory']),
            signatoryNid: nid(),
            signatoryPhone: phone(country),
        })),
        'npo.contactPersons': Array.from({ length: 1 }, (_, i) => ({
            contactPersonIndex: i,
            contactPersonName: fullName(country),
            contactPersonDesignation: pick(['Communications Manager', 'Admin Officer', 'Liaison Officer']),
            contactPersonPhone: phone(country),
            contactPersonEmail: faker.internet.email().toLowerCase(),
        })),
        'npo.donors': Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, (_, i) => ({
            donorIndex: i,
            donorName: pick(['USAID', 'World Bank', 'UNICEF', 'DFID', 'EU', 'JICA', 'Global Fund', `${faker.person.fullName()} Foundation`, faker.company.name()]),
            donorType: pick(['International', 'Government', 'Corporate', 'Individual', 'Multilateral']),
            donorCountry: pick(['US', 'GB', 'JP', 'DE', 'BD', 'CH', 'NO', 'SE', 'DK', 'CA']),
            donationAmount: amount(100000, 50000000),
            donationPurpose: pick(['General Support', 'Project-Specific', 'Emergency Relief', 'Capacity Building', 'Infrastructure']),
            donationDate: pastDate(),
        })),
        'npo.financials': Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, (_, i) => ({
            financialYear: (2023 - i).toString(),
            totalIncome: amount(500000, 100000000),
            totalExpenditure: amount(400000, 90000000),
            programExpenses: amount(300000, 70000000),
            adminExpenses: amount(50000, 15000000),
            fundraisingExpenses: amount(10000, 5000000),
            auditFirm: pick(['ACNABIN', 'Hoda Vasi', 'A. Qasem', 'Grant Thornton']),
            auditOpinion: pick(['Unqualified', 'Qualified']),
        })),
        'npo.relatedEntities': Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, (_, i) => ({
            relatedEntityIndex: i,
            relatedEntityName: `${pick(BD_NPO_NAMES)} ${pick(BD_NPO_TYPES)}`,
            relatedEntityType: pick(['Subsidiary', 'Affiliated', 'Partner', 'Network Member']),
        })),

        screeningInfo: { isPep: faker.datatype.boolean({ probability: 0.05 }), pepCheckStatus: 'CLEAR' },
        branchRelatedInfo: [generateBranchRelatedInfo(country)],
        otherBanks: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => generateOtherBank(country)),
    };

    return profile;
}

// ═══════════════════════════════════════════════════════════════════
// SHARED NESTED OBJECT GENERATORS
// ═══════════════════════════════════════════════════════════════════

function generateVerificationScores() {
    const s = () => faker.number.int({ min: 50, max: 100 });
    const st = () => pick(['VERIFIED', 'PENDING', 'FAILED']);
    return {
        customerNameEngScore: s(), customerNameEngStatus: st(),
        customerNameBenScore: s(), customerNameBenStatus: st(),
        fatherNameScore: s(), fatherNameStatus: st(),
        motherNameScore: s(), motherNameStatus: st(),
        spouseNameScore: s(), spouseNameStatus: st(),
        presentAddressScore: s(), presentAddressStatus: st(),
        customerPhotoCardScore: s(), customerPhotoCardStatus: st(),
        customerPhotoAppScore: s(), customerPhotoAppStatus: st(),
        textualInfoMatchStatus: pick(['MATCHED', 'PARTIAL', 'NOT_MATCHED']),
    };
}

function generateTransactionProfile() {
    return {
        transactionChannelIndex: faker.number.int({ min: 0, max: 4 }),
        transactionChannel: pick(['ATM', 'BRANCH', 'ONLINE', 'MOBILE', 'POS']),
        transactionDepositNumber: faker.number.int({ min: 1, max: 100 }),
        transactionDepositAmount: amount(5000, 5000000).toString(),
        transactionDepositAmountPerMax: amount(1000, 1000000).toString(),
        transactionWithdrawNumber: faker.number.int({ min: 1, max: 80 }),
        transactionWithdrawAmount: amount(5000, 3000000).toString(),
        transactionWithdrawAmountPerMax: amount(1000, 800000).toString(),
    };
}

function generateRiskGrading() {
    return {
        riskGradingTypeOfOnboarding: pick(['ONLINE', 'BRANCH', 'MOBILE', 'AGENT']),
        riskGradingGeographicRisk: pick(['LOW', 'MEDIUM', 'HIGH']),
        riskGradingIsPep: faker.datatype.boolean({ probability: 0.05 }),
        riskGradingIsIp: faker.datatype.boolean({ probability: 0.03 }),
        riskGradingIsPepFamily: faker.datatype.boolean({ probability: 0.03 }),
        riskGradingProductAndChannelRisk: pick(['LOW', 'MEDIUM', 'HIGH']),
        riskGradingBusinessAndActivityRisk: pick(['LOW', 'MEDIUM', 'HIGH']),
        riskGradingProfessionAndActivityRisk: pick(['LOW', 'MEDIUM', 'HIGH']),
        riskGradingBusinessOrProfession: pick(['BUSINESS', 'PROFESSION', 'BOTH']),
        riskGradingTransactionRisk: pick(['LOW', 'MEDIUM', 'HIGH']),
        riskGradingCredibleSourceOfFund: faker.datatype.boolean({ probability: 0.85 }),
        riskGradingClientCitizenshipUst: faker.datatype.boolean({ probability: 0.02 }),
        riskGradingDonatesToPep: faker.datatype.boolean({ probability: 0.02 }),
    };
}

function generateRiskGradingScore() {
    const s = () => faker.number.int({ min: 0, max: 100 });
    return {
        riskGradingScoreTypeOfOnboarding: s(), riskGradingScoreGeographicRisk: s(),
        riskGradingScoreIsPep: s(), riskGradingScoreIsIp: s(), riskGradingScoreIsPepFamily: s(),
        riskGradingScoreProductAndChannelRisk: s(), riskGradingScoreBusinessAndActivityRisk: s(),
        riskGradingScoreProfessionAndActivityRisk: s(), riskGradingScoreTransactionRisk: s(),
        riskGradingScoreCredibleSourceOfFund: s(), riskGradingScoreClientCitizenshipUst: s(),
        riskGradingScoreDonatesToPep: s(), riskGradingScoreScore: s(),
        riskGradingScoreAssessmentType: pick(['INITIAL', 'PERIODIC', 'EVENT_DRIVEN']),
    };
}

function generateRiskAssessment() {
    return {
        riskAssessmentUnscrsCheckDone: true,
        riskAssessmentIsPep: faker.datatype.boolean({ probability: 0.05 }),
        riskAssessmentPepDetails: '',
        riskAssessmentAdverseMedia: faker.datatype.boolean({ probability: 0.03 }),
        riskAssessmentBeneficialOwnerChecked: true,
        riskAssessmentRiskGradingDone: true,
        riskAssessmentOtherDocObtained: '',
        riskAssessmentRiskType: pick(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
        riskAssessmentRiskScore: faker.number.int({ min: 0, max: 100 }),
        riskAssessmentSofVerified: true,
        riskAssessmentReviewOfProfileDone: true,
        riskAssessmentReviewOfProfileDate: recentDate(),
        riskAssessmentDepositHistory: faker.number.int({ min: 0, max: 500 }),
        riskAssessmentWithdrawHistory: faker.number.int({ min: 0, max: 400 }),
        riskAssessmentIsTransactionPatternUsual: faker.datatype.boolean({ probability: 0.85 }),
        riskAssessmentPepApproval: false,
        riskAssessmentPepFaceToFaceInterview: false,
    };
}

function generateBranchRelatedInfo(country: Country) {
    return {
        branchRelatedCompletedAof: true,
        branchRelatedWlcFalsePositive: faker.datatype.boolean({ probability: 0.1 }),
        branchRelatedWlcPositive: faker.datatype.boolean({ probability: 0.02 }),
        branchRelatedWlcChecked: true,
        branchRelatedMarketedByOfficial: faker.datatype.boolean({ probability: 0.7 }),
        branchRelatedMarketedByDsa: faker.datatype.boolean({ probability: 0.3 }),
        branchRelatedSectorCode: faker.string.numeric(4),
        branchRelatedOfficialDsaName: fullName(country),
        branchRelatedEmployeeDsaCode: faker.string.alphanumeric(6).toUpperCase(),
        branchRelatedAccOpeningOfficerName: fullName(country),
        branchRelatedAccOpeningApproachByName: fullName(country),
        branchRelatedAccOpeningOfficerEid: faker.string.alphanumeric(6).toUpperCase(),
        branchRelatedAccOpeningApproachByEid: faker.string.alphanumeric(6).toUpperCase(),
        branchRelatedAddressVerified: true,
        branchRelatedAddressVerificationMethod: pick(['PHYSICAL_VISIT', 'UTILITY_BILL', 'BANK_STATEMENT', 'OTHER']),
        branchRelatedAddressVerifierName: fullName(country),
        branchRelatedAddressVerifierEid: faker.string.alphanumeric(6).toUpperCase(),
        branchRelatedCertifyingOfficerName: fullName(country),
        branchRelatedCertifyingOfficerEid: faker.string.alphanumeric(6).toUpperCase(),
    };
}

function generateIntroducer(country: Country) {
    return {
        introducerName: fullName(country),
        introducerDob: faker.date.birthdate({ min: 18, max: 70, mode: 'age' }).toISOString().split('T')[0],
        introducerMobileNo: phone(country),
        introducerAccountNo: faker.finance.accountNumber(),
        introducerIdType: pick(['NID', 'PASSPORT', 'DRIVING_LICENSE']),
        introducerIdNumber: nid(),
    };
}

function generateOtherBank(country: Country) {
    const banks = country === 'BD'
        ? ['Sonali Bank', 'Janata Bank', 'BRAC Bank', 'Dutch-Bangla Bank', 'Islami Bank Bangladesh', 'Prime Bank', 'Bank Asia']
        : ['JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'Capital One'];
    return {
        otherBankIndex: faker.number.int({ min: 0, max: 5 }),
        otherBankName: pick(banks),
        otherBankBranch: pick(BD_AREAS),
        otherBankAccountNumber: faker.finance.accountNumber(),
    };
}

function generateOtherBankCard() {
    return {
        otherBankCardIndex: faker.number.int({ min: 0, max: 3 }),
        otherBankCardName: pick(['Visa', 'MasterCard', 'AMEX', 'UnionPay']),
        otherBankCardNumber: faker.finance.creditCardNumber(),
    };
}

// ═══════════════════════════════════════════════════════════════════
// MAIN DISPATCHER
// ═══════════════════════════════════════════════════════════════════

export type CustomerType = 'INDIVIDUAL' | 'CORPORATE' | 'GOVERNMENT' | 'NPO' | 'JOINT';

const CUSTOMER_TYPE_WEIGHTS: { type: CustomerType; weight: number }[] = [
    { type: 'INDIVIDUAL', weight: 55 },
    { type: 'CORPORATE', weight: 20 },
    { type: 'GOVERNMENT', weight: 5 },
    { type: 'NPO', weight: 10 },
    { type: 'JOINT', weight: 10 },
];

export function randomCustomerType(): CustomerType {
    const total = CUSTOMER_TYPE_WEIGHTS.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;
    for (const { type, weight } of CUSTOMER_TYPE_WEIGHTS) {
        r -= weight;
        if (r <= 0) return type;
    }
    return 'INDIVIDUAL';
}

/**
 * Generate a complete customer payload for any profile type.
 * @param forceType — If provided, forces a specific customer type
 * @param country — Force BD or US locale (default: 85% BD / 15% US)
 */
export function generateCustomerData(forceType?: CustomerType, forceCountry?: Country): Record<string, any> {
    const country = forceCountry || (Math.random() < 0.85 ? 'BD' : 'US');
    const customerType = forceType || randomCustomerType();

    switch (customerType) {
        case 'CORPORATE':
            return generateCorporateProfile(country);
        case 'GOVERNMENT':
            return generateGovernmentProfile(country);
        case 'NPO':
            return generateNPOProfile(country);
        case 'JOINT':
            // Joint accounts use individual profile with joint-specific fields
            return { ...generateIndividualProfile(country), customerType: 'JOINT' };
        case 'INDIVIDUAL':
        default:
            return generateIndividualProfile(country);
    }
}
