const express = require("express");
const app = express();
const Category = require("../models/categoryModel.js");
const errorMessages = require("../messages/errorMessages.js");

app.getAllCategorySubcategory = async (req, res) => {
	var result = {};
	result.error_schema = {};
	result.output_schema = { categories: "" };

	const catInstance = new Category();
	var subcatResult = await catInstance.getAllCategorySubcategory();

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
		result.output_schema.categories = subcatResult;
	}

	res.send(result);
	return;
};

app.getAllCategorySubcategoryTask = async (req, res) => {
	var result = {};

	result.error_schema = {};
	result.output_schema = { categories: "" };

	const catInstance = new Category();
	let category = await catInstance.getAllCategorySubcategoryTask();

	// console.log(taskResult);

	if (category instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: errorMessages.ERROR,
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema.categories = category;
		res.send(result);
		return;
	}
};

module.exports = app;
