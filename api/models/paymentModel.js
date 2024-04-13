// paymentModel.js
const db = require("../../db");
const Midtrans = require("../utils/midtransUtil");
const Transaction = require("../models/transactionModel");
const uuid = require("uuid");

class Payment {
	constructor() {
		console.log("BERHASIL INIT PAYMENT");
	}

	async processPayment(paymentDetails) {
		// Implement the logic to process the payment
		// This could involve interacting with a payment gateway, database, etc.

		try {
			// Example: Perform payment processing logic
			// For simplicity, this example just logs the payment details
			//console.log('Processing payment:', paymentDetails);

			// Return a success message or relevant data
			return { success: true, message: "Payment processed successfully" };
		} catch (error) {
			// Handle any errors that occur during payment processing
			console.error("Error processing payment:", error.message);
			return { success: false, message: "Payment processing failed" };
		}
	}
	// Add more methods as needed for your payment-related operations

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

			let token = await midtransUtil.getToken(
				projectId,
				type,
				nominal,
				customer
			);

			if (token instanceof Error) {
				return new Error(token.message);
			}

			console.log("Token : ");
			console.log(token);

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

			console.log("TRX ID : ");
			console.log(transaction_id);

			if (transaction_id instanceof Error) {
				return new Error(transaction_id.message);
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

			console.log("SP PAYMENT : ");
			console.log(query);

			let payment_result = await db.any(query);

			console.log("PAYMENT ID:");
			console.log(payment_id);

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
			console.log("Payment ID Payment Model : " + paymentId);

			let SP = `
				UPDATE
				PUBLIC.PAYMENT
				SET 
				STATUS = '1'
				WHERE
				payment_id = '${paymentId}';
			`;

			console.log("SP UPDATE PAYMENT:");
			console.log(SP);

			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Update Payment Status.");
		}
	}
}

module.exports = Payment;
