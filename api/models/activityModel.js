const express = require("express");
const db = require("../../db");
const crypto = require("crypto");
const FormData = require("form-data");
const uuid = require("uuid");

module.exports = class Activity {
	async getClientActivity(transaction_id) {
		let SP = `
        `;

		try {
			let result = await db.any(SP);

			if (result.length < 1) {
				return new Error("Gagal Mendapatkan Data.");
			} else {
				return result;
			}
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getFreelancerActivity(transaction_id) {
		let SP = `
        `;

		try {
			let result = await db.any(SP);

			if (result.length < 1) {
				return new Error("Gagal Mendapatkan Data.");
			} else {
				return result;
			}
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async createActivity() {}

	async createActivityWithFile() {}
};
