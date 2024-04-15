const express = require("express");
const db = require("../../db");
const Review = require("../models/reviewModel");
const Task = require("../models/taskModel");
const Freelancer = require("../models/freelancerModel");
const User = require("./userModel");

module.exports = class Client extends User {
	// Inquiry Client Review
	async getClientReview(userId) {
		let reviewInstance = new Review();

		try {
			let review = await reviewInstance.getClientReviewByUserId(userId);

			console.log("Review : ");
			console.log(review);

			return review;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Inquiry Owned Task
	async getClientTask(userId) {
		let taskInstance = new Task();
		try {
			let result = await taskInstance.getTaskByClientId(userId);

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}
};
