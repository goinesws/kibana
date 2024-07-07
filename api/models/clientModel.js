const express = require("express");
const db = require("../../db");
const Review = require("../models/reviewModel");
const Task = require("../models/taskModel");
const Freelancer = require("../models/freelancerModel");
const User = require("./userModel");

module.exports = class Client extends User {
	// Inquiry Client Review
	async setUserId(userId) {
		this.userId = userId;
	}

	async getUserId() {
		return this.userId;
	}

	async getClient() {
		return this;
	}

	async getClientReview() {
		let reviewInstance = new Review();

		try {
			let review = await reviewInstance.getClientReview(this.userId);

			console.log("Review : ");
			console.log(review);

			return review;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Inquiry Owned Task
	async getClientTask() {
		let taskInstance = new Task();

		try {
			let result = await taskInstance.getTaskByClientId(this.userId);

			console.log("Client's Tasks : ");
			console.log(result);

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}
};
