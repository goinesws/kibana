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
		let bi_uuid = uuid.v4();
		let SP_delete = `
			DELETE
			FROM bank_information
			WHERE user_id = '${clientId}'
    	`;
		try {
			console.log(SP_delete)
			let res = await db.any(SP_delete);
		} catch (error) {
			return new Error("Gagal Mengubah Data.");
		}

		console.log(body)
		let SP = 
		`
			INSERT INTO public.bank_information(
			bank_information_id, user_id, bank_name, beneficiary_name, account_number)
			VALUES ('${bi_uuid}', '${clientId}', '${body.bank_name}', '${body.beneficiary_name}', '${body.account_number}')
    	`;
		console.log(SP)
		console.log("MASUK 2")
		

		try {
			console.log("masuk ga")
			console.log(SP)
			let res = await db.any(SP);

			return res;
		} catch (error) {
			return new Error("Gagal Mengubah Data.");
		}
	}
};
