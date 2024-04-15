const express = require("express");
const app = express();
const User = require("../models/userModel.js");
const Client = require("../models/clientModel.js");
const Freelancer = require("../models/freelancerModel.js");
const Google = require("../utils/googleUtil.js");
var multer = require("multer");
const { authorize, listFiles, uploadFile } = require("../utils/googleUtil.js");
const errorMessages = require("../messages/errorMessages.js");

app.getClientReview = async (req, res) => {
	let result = {};
	let userId = req.params.userId;

	result.error_schema = {};
	result.output_schema = {};

	const clientInstance = new Client();
	let client_review = await clientInstance.getClientReview(userId);

	if (client_review instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: errorMessages.ERROR,
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		if (client_review.rating_amount < 1) {
			client_review.average_rating = 0;
			client_review.review_list = null;
		}
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

	if (task instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: errorMessages.ERROR,
		};
		result.output_schema = null;
		res.status(400).send(result);
		return;
	} else {
		if (task.length < 1) {
			task = null;
		}
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema.tasks = task;
		res.send(result);
		return;
	}
};

module.exports = app;
