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
		// let id = uuid.v4()
		let id = activity.activity_id === undefined ? uuid.v4() : `${activity.activity_id}`;
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

		let deadline_extension;
		if(activity.deadline_extension === undefined) {
			deadline_extension = null;
		} else if (activity.deadline_extension == "(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') + INTERVAL '3 days'") {
			deadline_extension = activity.deadline_extension;
		} else {
			const parsedDate = new Date(activity.deadline_extension);
			deadline_extension = `'${parsedDate.toISOString()}'`;
		}

		let file_array = activity.file === undefined ? null : `ARRAY['${activity.file}']`;


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

	async createButton(activity_id, transaction_id, code) {

		// 1 = Minta Revisi (${revision-count})
		// 2 = Selesaikan Pesanan
		// 3 = Tolak Permintaan Pengembalian
		// 4 = Terima Permintaan Pengembalian
		// 5 = Batalkan Ajuan Pengembalian
		// 6 = Tolak Permintaan Pembatalan
		// 7 = Terima Permintaan Pembatalan
		// 8 = Batalkan Ajuan Pembatalan
		// 9 = Hubungi Admin

		let id = uuid.v4()
		let name;
		let revision_count;
		if(code == 1) {
			//get remaining revision
			let SP = `
				SELECT remaining_revision
				FROM transaction
				WHERE transaction_id = '${transaction_id}';
			`;

			try {
				let result = await db.any(SP);
				revision_count = result[0].remaining_revision;
				if(revision_count == 0) {
					return null;
				}
			} catch (error) {
				throw new Error("Gagal Mendapatkan Data.");
			}
		}

		switch (code) {
			case 1:
				name = `Minta Revisi (${revision_count})`;
				break;
			case 2:
				name = 'Selesaikan Pesanan';
				break;
			case 3:
				name = 'Tolak Permintaan Pengembalian';
				break;
			case 4:
				name = 'Terima Permintaan Pengembalian';
				break;
			case 5:
				name = 'Batalkan Ajuan Pengembalian';
				break;
			case 6:
				name = 'Tolak Permintaan Pembatalan';
				break;
			case 7:
				name = 'Terima Permintaan Pembatalan';
				break;
			case 8:
				name = 'Batalkan Ajuan Pembatalan';
				break;
			case 9:
				name = 'Hubungi Admin';
				break;
			default:
				name = 'Invalid action code';
		}
		
        //create button for activity
		let SP = `
			INSERT INTO public.button(
			button_id, activity_id, name, code)
			VALUES (
				'${id}', 
				'${activity_id}',
				'${name}',
				'${code}'
			);
		`;

		try {
			console.log(SP)
			let result = await db.any(SP);
			return null;
		} catch (error) {
			throw new Error("Gagal Mendapatkan Data.");
		}
    }

	async deleteButton(transaction_id) {
        //delete all button to all activity in a transaction
		let SP = `
			DELETE FROM button
			WHERE activity_id IN (
				SELECT activity_id
				FROM activity
				WHERE transaction_id = '${transaction_id}'
			);
		`;

		try {
			console.log(SP)
			let result = await db.any(SP);
			return null;
		} catch (error) {
			throw new Error("Gagal Mendapatkan Data.");
		}
    }
	
};
