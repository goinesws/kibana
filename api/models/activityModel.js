const express = require("express");
const db = require("../../db");
const crypto = require("crypto");
const FormData = require("form-data");
const uuid = require("uuid");

module.exports = class Activity {
	// Inquiry Activity Pesanan Client
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

	// Inquiry Activity Pesanan Freelancer
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

	// Send Requirement
	// Send Message
	// Send Additional File
	// Send Result
	// Ask Return
	// Cancel Return
	// Ask Revision
	// Complete Transaksi
	// Manage Cancellation
	// Call Admin
	// Ask Cancellation
	// Cancel Cancellation
	// Manage Return
	async createActivity(transaction_id, activity, file) {}
};
