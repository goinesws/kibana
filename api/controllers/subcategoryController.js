const express = require("express");
const app = express();
const Subcategory = require("../models/subcategoryModel.js");
const User = require("../models/userModel.js");
const errorMessages = require("../messages/errorMessages.js");

module.exports = app;

app.getSubcategoryByCategory = async (req, res) => {
	var result = {};
	result.error_schema = {};
	result.output_schema = { sub_categories: "" };

	const category_id = req.params.categoryId;

	const subcatInstance = new Subcategory();
	var subcatResult = await subcatInstance.getSubcatByCategoryID(category_id);

	if (subcatResult instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: errorMessages.ERROR,
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema.sub_categories = subcatResult;
		res.send(result);
		return;
	}
};

app.getadditionalInfoBySubcategoryId = async (req, res) => {
	var result = {};
	result.error_schema = {};
	result.output_schema = { additional_info: "" };

	const subcategory_id = req.params.subcategoryId;

	let subcatResult;

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		const subcatInstance = new Subcategory();
		var set_result = await subcatInstance.setSubcategoryId(subcategory_id);
		subcatResult = await subcatInstance.getadditionalInfoBySubcategoryId();
		if (subcatResult instanceof Error) {
			result.error_schema = {
				error_code: "903",
				error_message: errorMessages.ERROR,
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = { error_code: "200", error_message: "Sukses" };
			result.output_schema.additional_info = subcatResult;
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

	res.send(result);
	return;
};
