// paymentModel.js
const Midtrans = require("../utils/midtransUtil");
const Transaction = require("../models/transactionModel");

class Payment {
	constructor() {
		// Initialize any properties or set up connections here
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
		// panggil buat create transac

		// returnnya payment_id & request token

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

			let payment_id = await transactionInstance.createTransaction();

			if (payment_id instanceof Error) {
				return new Error(payment_id.message);
			}

			let result = {};

			result.token = token;
			result.payment_id = payment_id;
		} catch (error) {
			return new Error("Gagal Membuat Pembayaran");
		}
	}

	async updatePaymentStatus(paymentId) {}
}

module.exports = Payment;
