const db = require("../../db");
const Midtrans = require("../utils/midtransUtil");
const Transaction = require("../models/transactionModel");
const Activity = require("../models/activityModel");
const uuid = require("uuid");

module.exports = class Payment {
	constructor() {
		console.log("BERHASIL INIT PAYMENT");
	}
	async createPayment(
		projectId,
		type,
		nominal,
		customer,
		freelancerId,
		time_started
	) {
		try {
			let midtransUtil = new Midtrans();
			let transactionInstance = new Transaction();

			let transaction_id = "";
			if (type == "TASK") {
				transaction_id = await transactionInstance.createTransaction(
					projectId,
					customer.client_id,
					freelancerId,
					"TASK"
				);
			} else if (type == "SERVICE") {
				transaction_id = await transactionInstance.createTransaction(
					projectId,
					customer.client_id,
					freelancerId,
					"SERVICE"
				);
			}

			//todo add payment date

			if (transaction_id instanceof Error) {
				return new Error(transaction_id.message);
			}

			let token = await midtransUtil.getToken(
				transaction_id,
				type,
				nominal,
				customer
			);

			if (token instanceof Error) {
				return new Error(token.message);
			}

			let payment_id = uuid.v4();

			let query = `
				INSERT 
				INTO
				PUBLIC.PAYMENT
				(
					PAYMENT_ID,
					TRANSACTION_ID,
					STATUS,
					NOMINAL,
					TIME_STARTED,
					TIME_PAID
				)
				VALUES
				(
					'${payment_id}',
					'${transaction_id}',
					'0',
					'${nominal}',
					'${time_started}',
					null
				);
			`;

			let payment_result = await db.any(query);

			// create Activity With Deadline H+1 buat bayar

			let activity_uuid = uuid.v4();
			let activity = {};
			activity.activity_id = activity_uuid;
			activity.transaction_id = transaction_id;
			activity.client_id = customer.client_id;
			activity.title = "membuat Pesanan.";
			activity.code = 1;

			let activityInstance = new Activity();
			let activity_result = await activityInstance.createActivity(activity);

			let result = {};

			result.token = token;
			result.payment_id = payment_id;

			return result;
		} catch (error) {
			return new Error("Gagal Membuat Pembayaran");
		}
	}

	async updatePaymentStatus(paymentId) {
		try {
			// console.log("Payment ID Payment Model : " + paymentId);

			let SP = `
				UPDATE
				PUBLIC.PAYMENT
				SET 
				STATUS = '1'
				WHERE
				payment_id = '${paymentId}';
			`;

			// console.log("SP UPDATE PAYMENT:");
			// console.log(SP);

			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Update Payment Status.");
		}
	}
};
