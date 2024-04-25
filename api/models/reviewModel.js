const express = require("express");
const db = require("../../db");
const User = require("../models/userModel");

module.exports = class Review {
	constructor() {}

	// Inquiry Client Review (3 bisa dijadiin satu)
	async getClientReviewByUserId(userId) {
		try {
			let result = {};
			let SP1 = `select 
      c.name,
      r.rating as star,
      r.content as description,
      TO_CHAR(r.date, 'DD Mon YYYY HH24:MI:SS') as timestamp
      from public.review r
      join
      public.freelancer f 
      on
      r.writer_id = f.freelancer_id
      join
      public.client c
      on
      f.user_id = c.client_id
      where 
      destination_id = '${userId}'
      or 
      destination_id = (
        select 
        user_id
        from
        public.freelancer
        where
        freelancer_id = '${userId}'
      );`;

			let review_list = await db.any(SP1);

			let SP2 = `select 
      round(avg(r.rating), 1) as average_rating
      from public.review r
      join
      public.freelancer f 
      on
      r.writer_id = f.freelancer_id
      join
      public.client c
      on
      f.user_id = c.client_id
      where 
      destination_id = '${userId}'
      or
      destination_id = (
        select 
        user_id
        from
        public.freelancer
        where
        freelancer_id = '${userId}'
      );`;

			let average_rating = await db.any(SP2);

			let SP3 = `
      select 
      count(*)
      from public.review r
      join
      public.freelancer f 
      on
      r.writer_id = f.freelancer_id
      join
      public.client c
      on
      f.user_id = c.client_id
      where 
      destination_id = '${userId}'
      or
      destination_id = (
        select 
        user_id
        from
        public.freelancer
        where
        freelancer_id = '${userId}'
      );`;

			let rating_amount = await db.any(SP3);

			result.average_rating = average_rating[0].average_rating;
			result.rating_amount = rating_amount[0].count;
			result.review_list = review_list;

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Review Client
	async insertClientReview(freelancerId, data) {
		// init date
		var datetime = new Date();
		datetime = datetime.toISOString().slice(0, 10);

		let SP = `
    insert 
    into 
    public.review
    (review_id, writer_id, destination_id, rating, content, date, transaction_id)
    values 
    (
    CONCAT('R', (select nextval('review_id_sequence'))),
    '${freelancerId}',
    (select client_id from public.transaction where transaction_id = '${data.transaction_id}'),
    ${data.star},
    '${data.description}',
    (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'),
    '${data.transaction_id}'
    )
    `;

		try {
			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Insert Review.");
		}
	}

	// Review Freelancer
	async insertFreelancerReview(userId, data) {
		var datetime = new Date();
		datetime = datetime.toISOString().slice(0, 10);

		let SP = `
    insert 
    into 
    public.review
    (review_id, writer_id, destination_id, rating, content, date, transaction_id)
    values 
    (
    CONCAT('R', (select nextval('review_id_sequence'))),
    '${userId}',
    (select freelancer_id from public.transaction where transaction_id = '${data.transaction_id}'),
    ${data.star},
    '${data.description}',
    (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'),
    '${data.transaction_id}'
    )
    `;

		try {
			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Insert Review.");
		}
	}

	// Review Service
	async insertServiceReview(userId, data) {
		var datetime = new Date();
		datetime = datetime.toISOString().slice(0, 10);

		let SP = `
    insert 
    into 
    public.review
    (review_id, writer_id, destination_id, rating, content, date, transaction_id)
    values 
    (
    CONCAT('R', (select nextval('review_id_sequence'))),
    '${userId}',
    (select project_id from public.transaction where transaction_id = '${data.transaction_id}'),
    ${data.star},
    '${data.description}',
    (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'),
    '${data.transaction_id}'
    )
    `;

		//console.log(SP);

		try {
			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Insert Review.");
		}
	}
};
