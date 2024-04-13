const midtransClient = require("midtrans-client");

module.exports = class Midtrans {
	async getToken(project_id, type, price, customer) {
		try {
			let snap = new midtransClient.Snap({
				isProduction: false,
				serverKey: "SB-Mid-server-48ACHoBgutFzMj-S3eG9mndj",
			});

			let date = new Date();
			console.log("Midtrans Date : ");
			console.log(date.valueOf());

			let parameter = {
				transaction_details: {
					order_id: "KIBANA-" + type + "-" + date.valueOf() + "-" + project_id,
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

			console.log("MIDTRANS PARAMS : ");
			console.log(parameter);

			let trx = await snap.createTransaction(parameter);

			console.log("TRX HASIL MID TRANS:");
			console.log(trx);

			return trx.token;
		} catch (error) {
			return new Error("Gagal Menciptakan Token");
		}
	}
};
