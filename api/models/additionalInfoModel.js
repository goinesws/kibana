const express = require("express");
const db = require("../../db");
const crypto = require("crypto");
const FormData = require("form-data");
const uuid = require("uuid");

module.exports = class AdditionalInfo {
	// Inquiry Additional Info
	async getAdditionalInfo(subcategoryId) {
		let SP = `SELECT
        additionalInfo.additional_info_id as id,
        additionalInfo.question as title
    FROM 
      subcategory
    JOIN 
      additionalInfo on subcategory.subcategory_id = additionalInfo.subcategory_id
    WHERE 
      additionalInfo.subcategory_id =  '${subcategoryId}'`;

		var additionalInfo = {};

		additionalInfo = await db.any(SP);

		return additionalInfo;
	}
};
