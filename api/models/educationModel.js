const express = require("express");
const db = require("../../db");
const crypto = require("crypto");
const FormData = require("form-data");
const uuid = require("uuid");

module.exports = class Education {
	// Inquiry Freelancer Education History
	async setUserId(userId) {
		this.userId = userId;
	}

	async getUserId() {
		return this.userId;
	}

	async getEducation(freelancerId) {
		let SP = `
    select degree, major, university, country, year as graduation_year from public.education p
    join
    public.freelancer f
    on
    p.freelancer_id = f.freelancer_id
    where
    f.user_id = '${freelancerId}'
		or f.freelancer_id = '${freelancerId}'
		order by p.year desc
    `;

		try {
			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Edit Freelancer Education
	async editEducation(education) {
		// ini SP buat insert educationHistory
		let edu_uuid = uuid.v4();
		let SP_insert = `
		insert 
		into
		public.education
		(education_id, freelancer_id, degree, major, university, country, year)
		values
		('${edu_uuid}', 
		(select freelancer_id from public.freelancer where user_id = '${this.userId}' or freelancer_id = '${this.userId}'), 
		'${education.degree}', '${education.major}', '${education.university}', '${education.country}', ${education.graduation_year});`;

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
		freelancer_id = (select freelancer_id from public.freelancer where userId = '${this.userId}' or freelancer_id = '${this.userId}')
		`;

		try {
			console.log(SP_insert);
			let result = await db.any(SP_insert);

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Ini buat di insert tapi di techdoc ga ada
	async insertEducation(userId, education) {
		let ed_uuid = uuid.v4();

		let SP = `
		insert 
		into
		public.education
		(education_id, freelancer_id, degree, major, university, country, year)
		values
		('${ed_uuid}', 
		(select freelancer_id from public.freelancer where user_id = '${userId}' ), 
		'${education.degree}', '${education.major}', '${education.university}', '${education.country}', ${education.graduation_year});`;

		try {
			console.log(SP);
			let result = await db.any(SP);
			return result;
		} catch (error) {
			return new Error("Gagal Insert.");
		}
	}
};
