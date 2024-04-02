const express = require("express");
const db = require("../../db");
const Review = require("../models/reviewModel");
const Task = require("../models/taskModel");
const Freelancer = require("../models/freelancerModel");
const User = require("./userModel");

module.exports = class Client extends User {
	async getClientByTaskID(taskId) {
		// SP buat get Client Details
		let SPGetClient = `select public.client.client_id as id, profile_image as profile_image_url, public.client.name from public.client 
    join 
    public.task 
    on
    public.client.client_id = public.task.client_id
    and
    public.task.task_id = '${taskId}';`;

		// console.log("Hasil : ");
		// console.log(result);
		try {
			let result = await db.any(SPGetClient);

			return result[0];
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getOtherClientProfile(userId) {
		let SPGetClientDetails = `
		select 
		c.client_id as id, 
		c.profile_image as profile_image_url, 
		c.name, 
		c.username 
		from 
		public.client c
		join
		public.freelancer f
		on 
		f.user_id = c.client_id
    where 
		c.client_id = '${userId}'
		or f.freelancer_id = '${userId}'; `;

		try {
			let result = await db.any(SPGetClientDetails);

			return result[0];
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getClientReview(userId) {
		let result = {};

		let reviewInstance = new Review();

		try {
			let review = await reviewInstance.getClientReviewByUserId(userId);

			let average_rating = await reviewInstance.getClientAverageRatingByUserId(
				userId
			);

			let rating_amount =
				await reviewInstance.getClientReviewRatingAmountByUserId(userId);

			result.average_rating = average_rating;
			result.rating_amount = rating_amount;
			if (review.length < 1) {
				result.review_list = null;
			} else {
				result.review_list = review;
			}

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

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
