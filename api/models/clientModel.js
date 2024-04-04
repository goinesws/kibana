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

			if (result.length < 1) {
				return new Error("Gagal Mendapatkan Data.");
			}

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Register As Freelancer
	async register(data, cv_url, port_url, userId) {
		// manggil freelancer buat create freelancer instance

		let freelancerInstance = new Freelancer();
		// bikin freelancer based on data

		let skills = data.skills.toString();
		// console.log(skills);
		let create_result = await freelancerInstance.createFreelancer(
			userId,
			data.description,
			cv_url,
			port_url,
			skills
		);

		if (create_result instanceof Error) {
			return new Error("Gagal Mendaftar.");
		}

		// bikin education and link it to freelancer
		data.education_history.forEach(async (ed) => {
			//console.log("Insert ED");
			let education_result = await freelancerInstance.insertFreelancerEducation(
				userId,
				ed
			);

			if (education_result instanceof Error) {
				return new Error("Gagal Mendaftar.");
			}
		});

		return create_result;
	}
};
