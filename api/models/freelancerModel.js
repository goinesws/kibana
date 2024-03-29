const express = require("express");
const db = require("../../db");
const Transaction = require("../models/transactionModel");
const FormData = require("form-data");
const uuid = require("uuid");

module.exports = class Freelancer {
	async getFreelancerByTaskID(taskId) {
		let SPGetRegisteredFreelancer = `select public.freelancer.freelancer_id as id, public.client.profile_image as profile_image_url, public.client.name
    from 
    public.client
    join 
    public.freelancer 
    on 
    public.freelancer.user_id = public.client.client_id
    join
    public.task_enrollment
    on 
    public.task_enrollment.freelancer_id = public.freelancer.freelancer_id
    join
    public.task
    on 
    public.task.task_id = public.task_enrollment.task_id
    and 
    public.task.task_id = '${taskId}';`;

		try {
			let result = await db.any(SPGetRegisteredFreelancer);

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async isFreelancer(userId) {
		let SPGetIsFreelancer = `select count(*) from public.freelancer where user_id = '${userId}' or freelancer_id = '${userId}';`;

		let result = await db.any(SPGetIsFreelancer);

		if (result[0].count > 0) {
			return true;
		} else {
			return false;
		}
	}

	async getDesc(userId) {
		let SP = `select description from public.freelancer where user_id='${userId}' or freelancer_id = '${userId}';`;

		try {
			let result = await db.any(SP);

			if (result.length < 1) {
				return new Error("Gagal Mendapatkan Data.");
			}

			return result[0];
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getEducationHistory(userId) {
		let SP = `
    select degree, major, university, country, year as graduation_year from public.education p
    join
    public.freelancer f
    on
    p.freelancer_id = f.freelancer_id
    where
    f.user_id = '${userId}'
		or f.freelancer_id = '${userId}';
    `;

		try {
			let result = await db.any(SP);

			if (result.length < 1) {
				return new Error("Gagal Mendapatkan Data.");
			}

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getSkill(userId) {
		let SP = `select skills from public.freelancer where user_id = '${userId}' or freelancer_id = '${userId}';`;

		try {
			let result = await db.any(SP);

			if (result.length < 1) {
				return new Error("Gagal Mendapatkan Data.");
			}

			return result[0].skills;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getCV(userId) {
		let SP = `
    select cv as cv_url from public.freelancer where user_id = '${userId}' or freelancer_id = '${userId}';
    `;

		try {
			let result = await db.any(SP);

			if (result.length < 1) {
				return new Error("Gagal Mendapatkan Data.");
			}

			return result[0];
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getPortfolio(userId) {
		let SP = `
    select portfolio as portfolio_url from public.freelancer where user_id = '${userId}' or freelancer_id = '${userId}';
    `;

		try {
			let result = await db.any(SP);
			if (result.length < 1) {
				return new Error("Gagal Mendapatkan Data.");
			}
			return result[0];
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getOwnedService(userId) {
		// rewrite buat get service dari service model terus di hit dari sini

		let SPGetService = `select s.service_id as id, s.images as image_url, s.name, s.tags, s.price, s.working_time from public.service s 
    join 
    public.freelancer f 
    on 
    f.freelancer_id = s.freelancer_id
    where 
    f.user_id = '${userId}'
		or f.freelancer_id = '${userId}'; `;

		try {
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
			where client_id = '${userId}'
			or 
			f.freelancer_id = '${userId}';`;

			let result = await db.any(SPGetService);

			let resultFreelancer = await db.any(SPGetFreelancer);

			for (var i = 0; i < result.length; i++) {
				//console.log("hi");
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

	async getFreelancerByServiceId(serviceId) {
		let SPGetRegisteredFreelancer = `select public.freelancer.freelancer_id as id, public.client.profile_image as profile_image_url, public.client.name, freelancer.description
    from 
    public.client
    join 
    public.freelancer 
    on 
		public.freelancer.user_id = public.client.client_id
		join
		service on service.freelancer_id = freelancer.freelancer_id
   	where
    service.service_id = '${serviceId}';`;

		try {
			let result = await db.any(SPGetRegisteredFreelancer);

			return result[0];
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getFreelancerAverageRating(userId) {
		let SP = `
    select 
    round(avg(r.rating), 1)
    from 
    public.review r
    join 
    public.transaction tr
    on
    r.transaction_id = tr.transaction_id
    join
    public.service s
    on
    tr.project_id = s.service_id
    join
    public.freelancer f
    on
    s.freelancer_id = f.freelancer_id
    where
    f.user_id = '${userId}'
		or f.freelancer_id = '${userId}';
    `;

		try {
			let result = await db.any(SP);
			if (result.length < 1) {
				return new Error("Gagal Mendapatkan Data.");
			}
			return result[0].avg;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getFreelancerTotalProject(userId) {
		let SP = `select 
    count(*)
    from 
    public.review r
    join 
    public.transaction tr
    on
    r.transaction_id = tr.transaction_id
    join
    public.service s
    on
    tr.project_id = s.service_id
    join
    public.freelancer f
    on
    s.freelancer_id = f.freelancer_id
    where
    f.user_id = '${userId}'
		or f.freelancer_id = '${userId}';`;

		try {
			let result = await db.any(SP);
			if (result.length < 1) {
				return new Error("Gagal Mendapatkan Data.");
			}
			return result[0].count;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getProjectHistory(userId) {
		let result = {};

		let transactionInstance = new Transaction();

		try {
			let ar = await this.getFreelancerAverageRating(userId);
			if (ar instanceof Error) {
				result.average_rating = null;
			} else {
				result.average_rating = ar;
			}
			let pa = await this.getFreelancerTotalProject(userId);
			if (pa instanceof Error) {
				result.project_amount = null;
			} else {
				result.project_amount = pa;
			}
			let pl = await transactionInstance.getFreelancerProjectByUserId(userId);
			if (pl.length < 1 || pl instanceof Error) {
				result.project_list = null;
			} else {
				result.project_list = pl;
			}

			console.log(result);

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async editDescription(userId, description) {
		let SP = `UPDATE public.freelancer set description = '${description}' where user_id = '${userId}' or freelancer_id = '${userId}';`;

		try {
			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async editFreelancerEducation(userId, education) {
		// ini SP buat insert educationHistory
		let SP_insert = `
		insert 
		into
		public.education
		(education_id, freelancer_id, degree, major, university, country, year)
		values
		(CONCAT('EDU', (select nextval('education_id_sequence'))), 
		(select freelancer_id from public.freelancer where user_id = '${userId}' or freelancer_id = '${userId}'), 
		'${education.degree}', '${education.major}', '${education.university}', '${education.country}', ${education.graducation_year});`;

		// ini SP buat edit
		let SP_edit = `
		update 
		public.education
		set
		degree = '${education.degree},
		major = '${education.major}',
		university = '${education.university}',
		country = '${education.country}',
		year = ${education.year}
		where 
		freelancer_id = (select frelancer_id from public.freelancer where userId = '${userId}' or freelancer_id = '${userId}')
		`;

		try {
			let result = await db.any(SP_edit);

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async editFreelancerSkills(userId, skill) {
		let SP = `
		UPDATE  
		public.freelancer 
		set
		skills = '${skill}'
		where
		user_id = '${userId}'
		or freelancer_id = '${userId}'
		`;

		try {
			let result = await db.any(SP);

			return result;
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

	async editFreelancerCV(userId, cv_url) {
		let SP = `
		update 
		public.freelancer
		set 
		cv = '${cv_url}'
		where
		user_id = '${userId}'
		or freelancer_id = '${userId}';`;

		//console.log(SP);

		try {
			let result = await db.any(SP);
			return result;
		} catch (error) {
			return new Error("Edit Gagal");
		}
	}

	async editFreelancerPortfolio(userId, portfolio_url) {
		let SP = `
		update 
		public.freelancer
		set 
		portfolio = '${portfolio_url}'
		where
		user_id = '${userId}'
		or freelancer_id = '${userId}';`;

		//console.log(SP);

		try {
			let result = await db.any(SP);
			return result;
		} catch (error) {
			return new Error("Edit Gagal");
		}
	}

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

	async insertFreelancerEducation(userId, education) {
		let SP = `
		insert 
		into
		public.education
		(education_id, freelancer_id, degree, major, university, country, year)
		values
		(CONCAT('EDU', (select nextval('education_id_sequence'))), 
		(select freelancer_id from public.freelancer where user_id = '${userId}' ), 
		'${education.degree}', '${education.major}', '${education.university}', '${education.country}', ${education.graducation_year});`;

		try {
			let result = await db.any(SP);
			return result;
		} catch (error) {
			return new Error("Gagal Insert.");
		}
	}
};
