const express = require("express");
const db = require("../../db");
const { v4: uuidv4 } = require("uuid");

module.exports = class Requirement {
	// Create Layanan
	async createNewRequirement(additionalInfoId, serviceId, isTrue) {
		const uuid = uuidv4();

		let SP = `INSERT INTO requirement (requirement_id, additional_info_id, service_id, is_true)
    VALUES
    ('${uuid}', '${additionalInfoId}', '${serviceId}', '${isTrue}')`;

		// console.log(SP);
		let result = await db.any(SP);

		return result;
	}
};
