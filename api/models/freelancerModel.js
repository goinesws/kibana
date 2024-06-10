const express = require("express");
const db = require("../../db");
const Transaction = require("../models/transactionModel");
const FormData = require("form-data");
const uuid = require("uuid");
const User = require("./userModel");
const Education = require("./educationModel");
const Google = require("../utils/googleUtil");

module.exports = class Freelancer extends User {
	// Inquiry Freelancer Description
	async setUserId(userId) {
		console.log("Set User ID : ");
		console.log(userId);
		this.userId = userId;
	}

	async getUserId() {
		return this.userId;
	}

	async getFreelancer() {}

	// Inquiry Freelancer Description
	async getDescription() {
		let SP = `select description from public.freelancer where user_id='${this.userId}' or freelancer_id = '${this.userId}';`;

		try {
			console.log(SP);
			let result = await db.any(SP);

			console.log("Freelancer Description : ");
			console.log(result);

			return result[0];
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Inquiry Freelancer Education
	async getEducation() {
		let EducationInstance = new Education();
		let set_result = EducationInstance.setUserId(this.userId);

		try {
			let education_result = await EducationInstance.getEducation(this.userId);

			console.log("Freelancer Education : ");
			console.log(education_result);

			return education_result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Inquiry Freelancer SKills
	async getSkill() {
		let SP = `select skills from public.freelancer where user_id = '${this.userId}' or freelancer_id = '${this.userId}';`;

		try {
			let result = await db.any(SP);

			console.log("Freelancer Skills : ");
			console.log(result);

			return result[0].skills;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Inquiry Freelancer CV
	async getCV() {
		let SP = `
    select cv as cv_url from public.freelancer where user_id = '${this.userId}' or freelancer_id = '${this.userId}';
    `;

		try {
			let result = await db.any(SP);

			if (result[0].cv_url.length > 1) {
				console.log("Freelancer CV : ");
				console.log(result);

				return Google.getPreviewLink(result[0].cv_url);
			} else {
				return null;
			}
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Inquiry Freelancer Portfolio
	async getPortfolio() {
		let SP = `
    select portfolio as portfolio_url from public.freelancer where user_id = '${this.userId}' or freelancer_id = '${this.userId}';
    `;

		try {
			let result = await db.any(SP);

			if (result[0].portfolio_url.length > 1) {
				console.log("Freelancer Portofolio : ");
				console.log(result);

				return Google.getPreviewLink(result[0].portfolio_url);
			} else {
				return null;
			}
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Inquiry Freelancer Owned Service
	// rewrite buat get service dari service model terus di hit dari sini
	async getFreelancerService() {
		let SPGetService = `select s.service_id as id, s.images as image_url, s.name, s.tags, s.price, s.working_time from public.service s 
			join 
			public.freelancer f 
			on 
			f.freelancer_id = s.freelancer_id
			where 
			f.user_id = '${this.userId}'
			or f.freelancer_id = '${this.userId}'
			and s.is_active = true; 
		`;

		let SPGetFreelancer = `
			select profile_image 
			as 
			profile_image_url, 
			name
			from 
			public.client c
			join
			public.freelancer f
			on
			c.client_id = f.user_id
			where client_id = '${this.userId}'
			or 
			f.freelancer_id = '${this.userId}';
		`;

		try {
			let result = await db.any(SPGetService);

			let resultFreelancer = await db.any(SPGetFreelancer);

			for (var i = 0; i < result.length; i++) {
				let serviceId = result[i].id;

				let SPGetReviewTotal = `select count(*) from public.review where destination_id = '${serviceId}';`;
				let SPGetReviewAverage = `select round(avg(rating), 1) as avg from public.review where destination_id = '${serviceId}';`;
				result[i].freelancer = resultFreelancer[0];
				let avg_placeholder = await db.any(SPGetReviewAverage);
				result[i].average_rating = avg_placeholder[0].avg;
				let amt_placeholder = await db.any(SPGetReviewTotal);
				result[i].rating_amount = amt_placeholder[0].count;
			}

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Inquiry Project History
	async getProjectHistory() {
		let result = {};

		let transactionInstance = new Transaction();

		try {
			let SP1 = `
			select 
			round(avg(rating),1)
			from
			public.review
			where
			destination_id 
			=
			'${this.userId}'
			or
			destination_id
			in
			(
				select
				service_id
				from
				public.service
				where
				freelancer_id = '${this.userId}'
				or
				freelancer_id = (
					select 
					freelancer_id 
					from
					public.freelancer f
					where
					f.user_id = '${this.userId}'
				)
			)
			or 
			destination_id =
			(
				select freelancer_id 
				from
				public.freelancer
				where
				user_id = '${this.userId}'
			)
			`;

			let sp1_result = await db.any(SP1);

			let SP2 = `
			select 
			count(*)
			from
			public.review
			where
			destination_id 
			=
			'${this.userId}'
			or
			destination_id
			in
			(
				select
				service_id
				from
				public.service
				where
				freelancer_id = '${this.userId}'
				or
				freelancer_id = (
					select 
					freelancer_id 
					from
					public.freelancer f
					where
					f.user_id = '${this.userId}'
				)
			)
			or 
			destination_id =
			(
				select freelancer_id 
				from
				public.freelancer
				where
				user_id = '${this.userId}'
			)
			`;

			let sp2_result = await db.any(SP2);

			let project_result =
				await transactionInstance.getFreelancerProjectByUserId(this.userId);

			// console.log(project_result);

			result.average_rating = sp1_result[0].round;
			result.project_amount = sp2_result[0].count;
			result.project_list = project_result;

			console.log("Freelancer Project History");
			console.log(result);

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	//Edit Freelancer Description
	async editDescription(desc) {
		let SP = `UPDATE public.freelancer set description = '${desc}' where user_id = '${this.userId}' or freelancer_id = '${this.userId}';`;

		try {
			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Edit Freelancer Education
	async editEducation(education) {
		console.log("edit freelancer education");
		let EducationInstance = new Education();
		let set_result = EducationInstance.setUserId(this.userId);

		try {
			let education_result = await EducationInstance.editEducation(education);

			return education_result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Edit Freelancer Skills
	async editSkill(skills) {
		let SP = `
		UPDATE  
		public.freelancer 
		set
		skills = '${skills}'
		where
		user_id = '${this.userId}'
		or freelancer_id = '${this.userId}'
		`;

		try {
			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Edit Freelancer CV
	async editCV(cvUrl) {
		let SP = `
		update 
		public.freelancer
		set 
		cv = '${cvUrl}'
		where
		user_id = '${this.userId}'
		or freelancer_id = '${this.userId}';`;

		//console.log(SP);

		try {
			let result = await db.any(SP);
			return result;
		} catch (error) {
			return new Error("Edit Gagal");
		}
	}

	// Edit Freelancer Portfolio
	async editPortfolio(portUrl) {
		let SP = `
		update 
		public.freelancer
		set 
		portfolio = '${portUrl}'
		where
		user_id = '${this.userId}'
		or freelancer_id = '${this.userId}';`;

		//console.log(SP);

		try {
			let result = await db.any(SP);
			return result;
		} catch (error) {
			return new Error("Edit Gagal");
		}
	}

	// Register As Freelancer
	async createFreelancer(userId, description, cv, portfolio, skills) {
		const fl_uuid = uuid.v4();
		let SP = `
		insert 
		into
		public.freelancer
		(freelancer_id, user_id, description, cv, portfolio, skills)
		values
		(
			'${fl_uuid}',
			'${userId}',
			'${description}',
			'${cv}',
			'${portfolio}',
			'{${skills}}'
		)
		`;

		try {
			let result = await db.any(SP);
			return fl_uuid;
		} catch (error) {
			return new Error("Gagal Insert.");
		}
	}

	// Register As Freelancer
	async insertFreelancerEducation(userId, education) {
		console.log(education);
		let EducationInstance = new Education();

		try {
			let education_result = await EducationInstance.insertEducation(
				userId,
				education
			);

			return education_result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async addFreelancerImage(image) {
		let link = "";
		const clientId = "33df5c9de1e057a";
		var axios = require("axios");
		var data = new FormData();

		data.append("image", image[0].buffer, { filename: `test.jpg` });

		var config = {
			method: "post",
			maxBodyLength: Infinity,
			url: "https://api.imgur.com/3/image",
			headers: {
				Authorization: `Client-ID ${clientId}`,
				...data.getHeaders(),
			},
			data: data,
		};

		await axios(config)
			.then(function (response) {
				// console.log(JSON.stringify(response.data.data.link));
				link = JSON.stringify(response.data.data.link);
				return response.data.data.link;
			})
			.catch(function (error) {
				//console.log(error);
			});

		return link;
	}

	async removeEducation() {
		console.log("remove old education");
		let SP = `DELETE FROM public.education WHERE freelancer_id = (select freelancer_id from public.freelancer where user_id = '${this.userId}') or freelancer_id = '${this.userId}';`;
		try {
			let result = await db.any(SP);
			return result;
		} catch (error) {
			return new Error("Gagal menghapus data edukasi.");
		}
	}

	// Register As Freelancer
	async register(data, cv_url, port_url) {
		// manggil freelancer buat create freelancer instance

		let freelancerInstance = new Freelancer();
		// bikin freelancer based on data

		let skills = data.skills.toString();
		// console.log(skills);
		let create_result = await freelancerInstance.createFreelancer(
			this.userId,
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
				this.userId,
				ed
			);

			if (education_result instanceof Error) {
				return new Error("Gagal Mendaftar.");
			}
		});

		return create_result;
	}
};
