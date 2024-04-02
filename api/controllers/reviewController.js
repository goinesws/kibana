const express = require("express");
const app = express();
const Review = require("../models/reviewModel.js");
const User = require("../models/userModel.js");

app.insertReviewClient = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (
		curr_session.session_id == x_token &&
		curr_session.session_data.is_freelancer
	) {
		let freelancerId = curr_session.session_data.freelancer_id;
		let data = req.body;
		let reviewInstance = new Review();
		let review_insert_result = await reviewInstance.insertClientReview(
			freelancerId,
			data
		);

		if (review_insert_result instanceof Error) {
			result.error_schema = {
				error_code: "903",
				error_mesage: "Insert Gagal.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = {
				error_code: "200",
				error_mesage: "Sukses.",
			};
			result.output_schema = {};
		}
		res.send(result);
	} else {
		result.error_schema = {
			error_code: "403",
			error_mesage:
				"Anda tidak memiliki hak akses untuk melakukan hal tersebut.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}
};

app.insertReviewFreelancer = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		let userId = curr_session.session_data.client_id;
		let data = req.body;
		let reviewInstance = new Review();
		let review_insert_result = await reviewInstance.insertFreelancerReview(
			userId,
			data
		);

		if (review_insert_result instanceof Error) {
			result.error_schema = {
				error_code: "903",
				error_mesage: "Insert Gagal.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = {
				error_code: "200",
				error_mesage: "Sukses.",
			};
			result.output_schema = {};
		}
		res.send(result);
	} else {
		result.error_schema = {
			error_code: "403",
			error_mesage:
				"Anda tidak memiliki hak akses untuk melakukan hal tersebut.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}
};

app.insertReviewService = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		let userId = curr_session.session_data.client_id;
		let data = req.body;
		let reviewInstance = new Review();
		let review_insert_result = await reviewInstance.insertServiceReview(
			userId,
			data
		);

		if (review_insert_result instanceof Error) {
			result.error_schema = {
				error_code: "903",
				error_mesage: "Insert Gagal.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = {
				error_code: "200",
				error_mesage: "Sukses.",
			};
			result.output_schema = {};
		}
		res.send(result);
		return;
	} else {
		result.error_schema = {
			error_code: "403",
			error_mesage:
				"Anda tidak memiliki hak akses untuk melakukan hal tersebut.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}
};

module.exports = app;
