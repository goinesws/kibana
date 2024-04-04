const express = require("express");
const db = require("../../db");
const AdditionalInfo = require("./additionalInfoModel");

module.exports = class Subcategory {
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

	async getSubcatByCategoryID(categoryId) {
		let SPGetCategories = `select subcategory_id as id, name, description as desc, image as image_url from subcategory where category_id = '${categoryId}'`;

		let result = await db.any(SPGetCategories);

		return result;
	}

	async getSubcatLiteByCategoryID(categoryId) {
		let spGetSubcategories = `select subcategory_id as id, name from public.subcategory where category_id ='${categoryId}'`;

		let result = {};

		result = await db.any(spGetSubcategories);

		return result;
	}

	async getSubcatCountByID(subcategoryId) {
		let spGetCount = `select count(*) from public.task where sub_category_id = '${subcategoryId}'`;

		var countResult = {};

		countResult = await db.any(spGetCount);

		return countResult[0];
	}

	async getadditionalInfoBySubcategoryId(subcategoryId) {
		const AdditionalInfoInstance = new AdditionalInfo();

		let additionalInfo_result = await AdditionalInfoInstance.getAdditionalInfo(
			subcategoryId
		);

		return additionalInfo_result;
	}
};
