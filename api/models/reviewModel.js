const express = require("express");
const db = require("../../db");
const User = require("../models/userModel");

module.exports = class Review {
	constructor() {}

	async getClientReviewByTaskID(taskId) {
		let SPGetClientReviewList = `select public.client.name as name, rating as star, content as description, to_char(date, 'DD Month YYYY') as timestamp
    from 
    public.review
    join 
    public.task
    on
    public.task.client_id = public.review.destination_id
    join 
    public.freelancer
    on
    public.review.writer_id = public.freelancer.freelancer_id
    join
    public.client
    on 
    public.freelancer.user_id = public.client.client_id
    and
    public.task.task_id = '${taskId}'; `;

		let result = await db.any(SPGetClientReviewList);

		return result;
	}

	async getClientReviewRatingAmountByTaskID(taskId) {
		let SPGetClientReviewRatingAmount = `select count(*) as rating_amount 
    from 
    public.review
    join 
    public.task
    on
    public.task.client_id = public.review.destination_id
    join 
    public.freelancer
    on
    public.review.writer_id = public.freelancer.freelancer_id
    join
    public.client
    on 
    public.freelancer.user_id = public.client.client_id
    and
    public.task.task_id = '${taskId}'; `;

		let result = await db.any(SPGetClientReviewRatingAmount);

		return result[0];
	}

	async getClientAvgRatingByTaskID(taskId) {
		let SPGetClientAverageRating = `select round(avg(public.review.rating), 1) as average_rating
    from 
    public.review
    join 
    public.task
    on
    public.task.client_id = public.review.destination_id
    join 
    public.freelancer
    on
    public.review.writer_id = public.freelancer.freelancer_id
    join
    public.client
    on 
    public.freelancer.user_id = public.client.client_id
    and
    public.task.task_id = '${taskId}';`;

		let result = await db.any(SPGetClientAverageRating);

		return result[0];
	}

	async getClientReviewByUserId(userId) {
		let SP = `select 
    c.name,
    r.rating as star,
    r.content as description,
    TO_CHAR(r.date, 'DD Mon YYYY') as timestamp
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

		let result = db.any(SP);

		return result;
	}

	async getClientAverageRatingByUserId(userId) {
		let SP = `select 
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

		let result = await db.any(SP);

		return result[0].average_rating;
	}

	async getClientReviewRatingAmountByUserId(userId) {
		let SP = `
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

		let result = await db.any(SP);

		return result[0].count;
	}

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
    '${datetime}',
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
    '${datetime}',
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
    '${datetime}',
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

	async getServiceReview(service_id) {
		try {
			var SP = `SELECT 
            (SELECT AVG(rating)
            FROM
              review
            WHERE
            destination_id = service.service_id) as average_rating,
            (SELECT COUNT(rating)
            FROM 
            review
            WHERE 
            destination_id = service.service_id) as rating_amount,
        (SELECT
                  jsonb_agg(
                    jsonb_build_object(
              'name', client.name,
              'star', review.rating,
              'description', review.content,
              'timestamp', TO_CHAR(review.date, 'DD Mon YYYY')
                    )
                  )
                FROM 
                  review
                JOIN 
                  client on client.client_id = review.writer_id
                WHERE 
                  review.destination_id = service.service_id
                ) AS review_list
            FROM service
        WHERE service_id = '${service_id}'
        ORDER BY service.created_date DESC`;
			const result = await db.any(SP);
			return result[0];
		} catch (error) {
			throw new Error("Failed to fetch user tasks");
		}
	}
};
