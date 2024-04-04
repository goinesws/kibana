const express = require("express");
const app = express();
const User = require("../models/userModel");
const Client = require("../models/clientModel.js");
const Freelancer = require("../models/freelancerModel.js");
const BankInformation = require("../models/bankInformationModel.js");

app.login = async (req, res) => {
	const username = req.body.username_email;
	const password = req.body.password;

	const userInstance = new User();

	let login_info = await userInstance.login(username, password);

	result = {};

	if (
		login_info instanceof Error ||
		login_info == null ||
		login_info == undefined
	) {
		result.error_schema = { error_code: "903", error_message: "Login Gagal." };
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		let x_token = req.session.id;
		// remove freelancer_id dari login_info
		result.error_schema = { error_code: "200", error_message: "Sukses." };
		result.output_schema = login_info;
		result.output_schema.token = x_token;

		let session_data = JSON.stringify({
			client_id: login_info.id,
			is_freelancer: login_info.is_freelancer,
			freelancer_id: login_info.freelancer_id,
			username: login_info.username,
		});

		console.log("X Token : " + x_token);
		console.log("Session Data : ");
		console.log(session_data);

		let write_session_result = await userInstance.setUserSessionData(
			login_info.id,
			x_token,
			session_data
		);

		if (write_session_result instanceof Error) {
			result.error_schema = {
				error_code: "903",
				error_message: "Login Gagal.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		}

		delete login_info["freelancer_id"];
	}

	res.send(result);
	return;
};

app.register = async (req, res) => {
	const email = req.body.email;
	const username = req.body.username;
	const name = req.body.name;
	const phone = req.body.phone_number;
	const password = req.body.password;

	// new Code
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	const userInstance = new User();
	let register_result = await userInstance.register(
		email,
		username,
		name,
		phone,
		password
	);

	if (register_result instanceof Error) {
		result.error_schema = {
			error_code: "999",
			error_message: "Registrasi Gagal.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		x_token = req.session.id;
		result.error_schema = { error_code: "200", error_message: "Sukses." };
		result.output_schema = register_result;
		result.output_schema.is_freelancer = false;
		result.output_schema.is_connected_bank = false;
		result.output_schema.token = x_token;

		let session_data = JSON.stringify({
			client_id: register_result.id,
			is_freelancer: false,
			freelancer_id: null,
			username: username,
		});

		let write_session_result = await userInstance.setUserSessionData(
			register_result.id,
			x_token,
			session_data
		);

		if (write_session_result instanceof Error) {
			result.error_schema = {
				error_code: "903",
				error_message: "Registrasi Gagal.",
			};
			result.output_schema = null;
			res.status(400).send(result);
			return;
		}
	}

	res.send(result);
	return;
};

app.logout = async (req, res) => {
	let result = {};

	let x_token = req.get("X-Token");
	const userInstance = new User();
	let curr_session = await userInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		req.session.destroy();

		let set_result = await userInstance.setId(
			curr_session.session_data.client_id
		);

		let logout_result = await userInstance.logout();

		if (logout_result instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: "Logout Failed.",
			};
			result.output_schema = null;
			res.status(400).send(result);
			return;
		}

		result.error_schema = { error_code: "200", error_message: "Success" };
		result.output_schema = {};
	} else {
		result.error_schema = {
			error_code: "999",
			error_message: "Logout Failed.",
		};
		result.output_schema = null;
		res.status(400).send(result);
		return;
	}

	res.send(result);
};

app.getOtherProfile = async (req, res) => {
	let result = {};
	let userId = req.params.userId;

	result.error_schema = {};
	result.output_schema = {};

	const clientInstance = new Client();
	const freelancerInstance = new Freelancer();
	let clientDetails = await clientInstance.getOtherClientProfile(userId);
	let isFreelancer = await freelancerInstance.isFreelancer(userId);

	if (clientDetails == null) {
		result.error_schema = {
			error_code: "903",
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = null;
		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema = clientDetails;
		result.output_schema.is_freelancer = isFreelancer;
	}

	res.send(result);
	return;
};

app.getMyProfile = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let me;
	let x_token = req.get("X-Token");
	const userInstance = new User();
	let curr_session = await userInstance.getUserSessionData(x_token);

	// console.log("X-Token:");
	// console.log(req.get("X-Token"));
	// console.log("Session Data:");
	// console.log(curr_session);
	// console.log("==================");

	if (x_token == curr_session.session_id) {
		me = await userInstance.getMyProfile(curr_session.session_data.client_id);
		if (me == null) {
			result.error_schema = {
				error_code: "903",
				error_message: "Tidak ada data yang ditemukan.",
			};
			result.output_schema = null;
			res.status(400).send(result);
			return;
		} else {
			result.error_schema = { error_code: "200", error_message: "Sukses" };
			result.output_schema = me;
			res.send(result);
			return;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses.",
		};
		result.output_schema = null;
		res.status(400).send(result);
		return;
	}
};

app.getMyBankDetails = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let bank;

	let x_token = req.get("X-Token");
	const userInstance = new User();
	let curr_session = await userInstance.getUserSessionData(x_token);

	if (x_token == curr_session.session_id) {
		bank = await userInstance.getBankDetails(
			curr_session.session_data.client_id
		);
		if (bank == null || bank instanceof Error) {
			result.error_schema = {
				error_code: "903",
				error_message: "Tidak ada data yang ditemukan.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = { error_code: "200", error_message: "Sukses" };
			result.output_schema.bank_detail = bank;
			res.send(result);
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses.",
		};
		result.output_schema = null;
		res.status(400).send(result);
		return;
	}
};

app.editMyProfile = async (req, res) => {
	let result = {};
	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let userInstance = new User();
	let curr_session = await userInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		let userId = curr_session.session_data.client_id;
		let images = [];
		if (req.files["profile_image"]) {
			try {
				images.push(
					await userInstance.addUserImage(req.files["profile_image"])
				);
			} catch (error) {
				result.error_schema = {
					error_code: "999",
					error_message: "Gagal. Terjadi Kesalahan Saat Upload Gambar.",
				};
				result.output_schema = null;
				res.status(400).send(result);
				return;
			}

			images = images.map((link) => link.replace(/"/g, ""));
		}
		let data = "";
		if (req.files["data"]) {
			data = JSON.parse(req.files["data"][0].buffer.toString());
		} else {
			result.error_schema = {
				error_code: "999",
				error_message: "Gagal. Tidak ada data.",
			};
			result.output_schema = null;
			res.status(400).send(result);
			return;
		}

		let user_edit = await userInstance.editMyprofile(userId, data, images[0]);

		if (user_edit instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: "Gagal. Terjadi Kesalahan Saat Merubah Data.",
			};
			result.output_schema = null;
			res.status(400).send(result);
			return;
		} else {
			result.error_schema = { error_code: "200", error_message: "Sukses." };
			result.output_schema = {};
			res.send(result);
			return;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses.",
		};
		result.output_schema = null;
		res.status(400).send(result);
		return;
	}
};

app.editBankDetails = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	const userInstance = new User();
	let curr_session = await userInstance.getUserSessionData(x_token);
	if (curr_session.session_id == x_token) {
		try {
			let change = await userInstance.editBankDetails(
				curr_session.session_data.client_id,
				req.body
			);
			result.error_schema = { error_code: "200", error_message: "Success." };
			result.output_schema = {};
		} catch (error) {
			result.error_schema = {
				error_code: "999",
				error_message: "Gagal. Terjadi Kesalahan Saat Merubah Data.",
			};
			result.output_schema = null;
			res.status(400).send(result);
			return;
		}
		res.send(result);
		return;
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses.",
		};
		result.output_schema = null;
		res.status(400).send(result);
		return;
	}
};

module.exports = app;
