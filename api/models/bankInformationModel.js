const express = require("express");
const db = require("../../db");
const crypto = require("crypto");
const FormData = require("form-data");
const uuid = require("uuid");

module.exports = class BankInformation {
	// Inquiry Bank Details
	async getBankDetails(clientId) {
		let SP = `
    select 
    bank_name,
    beneficiary_name,
    account_number 
    from 
    public.bank_information
    where
    user_id = '${clientId}';
    `;

		try {
			let result = await db.any(SP);

			return result[0];
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Edit Bank Details
	async editBankDetails(clientId, body) {
		let SP = `
    UPDATE
    public.bank_information
    set
    bank_name = '${body.bank_name}',
    beneficiary_name = '${body.beneficiary_name}',
    account_number = '${body.account_number}'
    where 
    user_id = '${clientId}';`;

		try {
			let res = await db.any(SP);

			return res;
		} catch (error) {
			return new Error("Gagal Mengubah Data.");
		}
	}
};
