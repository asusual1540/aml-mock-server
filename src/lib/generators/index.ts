/**
 * Mock Data Generators — Barrel Export
 *
 * Central export point for all customer and account data generators.
 */

export {
    generateCustomerData,
    generateIndividualProfile,
    generateCorporateProfile,
    generateGovernmentProfile,
    generateNPOProfile,
    generateCommonCustomerFields,
    randomCustomerType,
    type CustomerType,
} from './customer-generators';

export {
    generateAccountData,
    generateSavingsAccount,
    generateCurrentAccount,
    generateLoanAccount,
    generateCardAccount,
    generateMFSAccount,
    generateDepositAccount,
    generateCorporateAccountDetail,
    generateCampaignAccount,
    generateCommonAccountFields,
    randomAccountType,
    type AccountProductType,
} from './account-generators';
