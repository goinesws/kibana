const express = require("express");
const db = require("../../db");
const crypto = require("crypto");
const FormData = require("form-data");
const uuid = require("uuid");

module.exports = class Activity {
	// Inquiry Activity Pesanan Client
	async getClientActivity(transaction_id) {
		let SP = `
        `;

		try {
			let result = await db.any(SP);

			if (result.length < 1) {
				return new Error("Gagal Mendapatkan Data.");
			} else {
				return result;
			}
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Inquiry Activity Pesanan Freelancer
	async getFreelancerActivity(transaction_id) {
		let SP = `
        `;

		try {
			let result = await db.any(SP);

			if (result.length < 1) {
				return new Error("Gagal Mendapatkan Data.");
			} else {
				return result;
			}
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Send Requirement
	// Send Message
	// Send Additional File
	// Send Result
	// Ask Return
	// Cancel Return
	// Ask Revision
	// Complete Transaksi
	// Manage Cancellation
	// Call Admin
	// Ask Cancellation
	// Cancel Cancellation
	// Manage Return
	async createActivity(transaction_id, activity, file) {
		let id = activity.id === undefined ? null : `'${activity.id}'`;
		let client_id = activity.client_id === undefined ? null : `'${activity.client_id}'`;
		let title = activity.title === undefined ? null : `'${activity.title}'`;
		let content = activity.content === undefined ? null : `'${activity.content}'`;
		let code = activity.code === undefined ? null : `'${activity.code}'`;
		let code_temp = activity.code_temp === undefined ? null : `'${activity.code_temp}'`;
		let response_deadline = activity.response_deadline === undefined ? null : `'${activity.response_deadline}'`;
		let deadline_extension = activity.deadline_extension === undefined ? null : `'${activity.deadline_extension}'`;
		let file_array = file === null ? null : `ARRAY['${file}']`; 
		let SP = `
            INSERT INTO public.activity(
                activity_id, transaction_id, client_id, date, title, content, attachment, code, code_temp, response_deadline, deadline_extension)
            VALUES (
                ${id}, 
                '${transaction_id}', 
                ${client_id}, 
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta', 
                ${title}, 
                ${content}, 
				${file_array},
				${code},
				${code_temp},
				${response_deadline},
				${deadline_extension}
            );
        `;
		try {
			let result = await db.any(SP);
            return "Data telah dimasukkan";
		} catch (error) {
			return new Error("Gagal Memasukkan Data.");
		}
	}
};
