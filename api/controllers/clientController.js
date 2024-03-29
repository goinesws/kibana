const express = require("express");
const app = express();
const User = require("../models/userModel.js");
const Client = require("../models/clientModel.js");
const Freelancer = require("../models/freelancerModel.js");
const Google = require("../models/googleModel.js");
var multer = require("multer");
const { authorize, listFiles, uploadFile } = require("../models/googleModel");

app.getClientReview = async (req, res) => {
	let result = {};
	let userId = req.params.userId;

	result.error_schema = {};
	result.output_schema = {};

	const clientInstance = new Client();
	let client_review = await clientInstance.getClientReview(userId);

	if (client_review == null || client_review instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = {};

		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema = client_review;
		res.send(result);
		return;
	}
};

app.getClientTask = async (req, res) => {
	let result = {};
	let userId = req.params.userId;

	result.error_schema = {};
	result.output_schema = {};

	const clientInstance = new Client();
	let task = await clientInstance.getClientTask(userId);

	if (task == null || task instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = {};
		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema.tasks = task;
		res.send(result);
		return;
	}
};

app.registerAsFreelancer = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let userInstance = new User();
	let curr_session = await userInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		// get file cv
		let cv_id = "";
		let cv_url = "";
		if (req.files["cv"]) {
			cv_id = await authorize()
				.then((auth) => {
					if (req.files && req.files["cv"]) {
						const file = req.files["cv"][0];
						return uploadFile(auth, file);
					} else {
						//console.log("No file has been uploaded");
					}
				})
				.then((resultCode) => {
					const cv_id = resultCode;
					return cv_id;
				})
				.catch((err) => {
					console.error("Error:", err);
				});

			cv_url = await Google.getPreviewLink(cv_id);
		}

		// get portfolio
		let port_id = "";
		let port_url = "";
		if (req.files["portfolio"]) {
			port_id = await authorize()
				.then((auth) => {
					if (req.files && req.files["portfolio"]) {
						const file = req.files["portfolio"][0];
						return uploadFile(auth, file);
					} else {
						//console.log("No file has been uploaded");
					}
				})
				.then((resultCode) => {
					const port_id = resultCode;
					return port_id;
				})
				.catch((err) => {
					console.error("Error:", err);
				});

			port_url = await Google.getPreviewLink(port_id);
		}

		let data = "";
		if (req.files["data"]) {
			data = JSON.parse(req.files["data"][0].buffer.toString());
		} else {
			result.error_schema = { error_code: "999", error_message: "Gagal." };
			result.output_schema = {};
			res.status(400).send(result);
			return;
		}

		const userID = curr_session.session_data.client_id;

		let clientInstance = new Client();
		let reg_result = await clientInstance.register(
			data,
			cv_url,
			port_url,
			userID
		);

		if (reg_result instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: "Registrasi Gagal.",
			};
			result.output_schema = {};

			res.status(400).send(result);
			return;
		} else {
			// set session data terbaru
			let session_data = JSON.stringify({
				client_id: curr_session.session_data.client_id,
				is_freelancer: true,
				freelancer_id: reg_result,
				username: curr_session.session_data.username,
			});

			console.log("Updated Session Data : ");
			console.log(session_data);

			let write_session_result = await userInstance.setUserSessionData(
				curr_session.session_data.client_id,
				x_token,
				session_data
			);

			if (write_session_result instanceof Error) {
				result.error_schema = {
					error_code: "903",
					error_message: "Registrasi Gagal.",
				};
				result.output_schema = {};

				res.status(400).send(result);
				return;
			}

			result.error_schema = {
				error_code: "200",
				error_message: "Sukses.",
			};
			result.output_schema = {};
		}

		res.send(result);
		return;
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda tidak memiliki hak untuk melakukan hal tersebut.",
		};
		result.output_schema = {};

		res.status(400).send(result);
		return;
	}
};

module.exports = app;
