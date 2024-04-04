const express = require("express");
const db = require("../../db");
const AdditionalInfo = require("./additionalInfoModel");

module.exports = class Subcategory {
	// Inquiry Task Baru
	async getListSubcatByCategoryID(categoryId) {
		let SPGetSubcat = `select subcategory_id from public.subcategory where category_id = '${categoryId}';`;

		let result = await db.any(SPGetSubcat);

		// console.log(listSubcat);

		if (result == null || result.length == 0) {
			return null;
		}

		// rewrite list subcat buat masuk SP
		let list = "(";

		for (let i = 0; i < result.length; i++) {
			list += "'" + result[i].subcategory_id + "'";
			if (i == result.length - 1) {
				list += ")";
			} else {
				list += ",";
			}
		}

		// console.log(listSubcatSP);

		return list;
	}

	// Utilities
	async getSubcatByCategoryID(categoryId) {
		let SPGetCategories = `select subcategory_id as id, name, description as desc, image as image_url from subcategory where category_id = '${categoryId}'`;

		let result = await db.any(SPGetCategories);

		return result;
	}

	// Inquiry Additional Info
	async getadditionalInfoBySubcategoryId(subcategoryId) {
		const AdditionalInfoInstance = new AdditionalInfo();

		let additionalInfo_result = await AdditionalInfoInstance.getAdditionalInfo(
			subcategoryId
		);

		return additionalInfo_result;
	}
};
