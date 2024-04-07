const midtransClient = require("midtrans-client");

module.exports = class Midtrans {
	async getToken(project_id, type, price, customer) {
		try {
			let snap = new midtransClient.Snap({
				isProduction: false,
				serverKey: "SB-Mid-server-48ACHoBgutFzMj-S3eG9mndj",
			});

			let parameter = {
				transaction_details: {
					order_id: "KIBANA-" + type + "-" + id,
					gross_amount: price,
				},
				credit_card: {
					secure: true,
				},
				customer_details: {
					first_name: "KIBANA",
					last_name: customer.name,
					email: customer.email,
					phone: customer.phone_number,
				},
			};

			let trx = await snap.createTransaction(parameter);

			return trx.token;
		} catch (error) {
			return new Error("Gagal Menciptakan Token");
		}
	}
};
