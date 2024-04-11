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

	async getLatestActivityCode(transaction_id) {
        //find latest activity, get the code, to use for code_temp in new activity
		let SP = `
			SELECT code
			FROM activity
			WHERE transaction_id = ${transaction_id}
			ORDER BY date DESC
			LIMIT 1;
		`;

		try {
			let result = await db.any(SP);
			if (result.length < 1) {
				return null;
			} else {
				return result[0].code;
			}
		} catch (error) {
			throw new Error("Gagal Mendapatkan Data.");
		}
    }

	async updateResponseDeadline(transaction_id) {
        //delete all response deadline in that transaction so we can add a new one
		let SP = `
			UPDATE activity
			SET response_deadline = NULL
			WHERE transaction_id = '${transaction_id}';
		`;

		try {
			console.log(SP)
			let result = await db.any(SP);
			return null;
		} catch (error) {
			throw new Error("Gagal Mendapatkan Data.");
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
	async createActivity(activity) {
		let id = uuid.v4()
		let transaction_id = activity.transaction_id === undefined ? null : `'${activity.transaction_id}'`;
		let client_id = activity.client_id === undefined ? null : `'${activity.client_id}'`;
		let title = activity.title === undefined ? null : `'${activity.title}'`;
		let content = activity.content === undefined ? null : `'${activity.content}'`;
		let code = activity.code === undefined ? null : `'${activity.code}'`;
		let code_temp = await this.getLatestActivityCode(transaction_id);
		let response_deadline;
		if(activity.response_deadline === undefined) {
			response_deadline = null;
		} else if (activity.response_deadline == "(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') + INTERVAL '2 days'") {
			response_deadline = activity.response_deadline;
		} else {
			const parsedDate = new Date(activity.response_deadline);
			response_deadline = `'${parsedDate.toISOString()}'`;
		}

		let deadline_extension = activity.deadline_extension === undefined ? null : `'${activity.deadline_extension}'`;
		let file_array = activity.file === undefined ? null : `ARRAY['${activity.file}']`;

		console.log(activity.file)
		console.log(file_array)


		let SP = `
            INSERT INTO public.activity(
                activity_id, transaction_id, client_id, date, title, content, attachment, code, code_temp, response_deadline, deadline_extension)
            VALUES (
                '${id}', 
                ${transaction_id}, 
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
			console.log(SP);
			let result = await db.any(SP);
            return "Data telah dimasukkan";
		} catch (error) {
			return new Error("Gagal Memasukkan Data.");
		}
	}
	
};
