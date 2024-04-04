const express = require("express");
const db = require("../../db");
const crypto = require("crypto");
const FormData = require("form-data");
const uuid = require("uuid");

module.exports = class Education {
	// Inquiry Freelancer Education History
	async getEducation(userId) {
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

	// Edit Freelancer Education
	async editEducation(userId, education) {
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

	// Ini buat di insert tapi di techdoc ga ada
	async insertEducation(userId, education) {
		let ed_uuid = uuid.v4();

		let SP = `
		insert 
		into
		public.education
		(education_id, freelancer_id, degree, major, university, country, year)
		values
		'${ed_uuid}', 
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
