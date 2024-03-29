const express = require("express");
const db = require("../../db");
const Review = require("../models/reviewModel");
const Task = require("../models/taskModel");

module.exports = class Transaction {
	async getFreelancerProjectByUserId(userId) {
		let SP = `
        select 
        s.name as project_name,
        r.rating as star,
        s.description as description,
        TO_CHAR(tr.delivery_date, 'DD Mon YYYY') as timestamp
        from 
        public.transaction tr
        join
        public.service s
        on
        tr.project_id = s.service_id
        join
        public.freelancer f
        on
        f.freelancer_id = s.freelancer_id
        left join
        public.review r
        on
        r.transaction_id = tr.transaction_id
        where
        f.user_id = '${userId}'
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

	async getAllTransactionDetail(transaction_id) {
		// SP buat get Client Details
		let SP = `SELECT 
                transaction_id,
                project_id,
                client_id,
                status,
                TO_CHAR(deadline, 'DD Mon YYYY') as deadline,
                TO_CHAR(delivery_date, 'DD Mon YYYY') as delivery_date,
                remaining_revision,
                is_need_admin,
                can_cancel,
                can_return,
                TO_CHAR(payment_date, 'DD Mon YYYY') as payment_date,
                freelancer_id,
                project_type
            FROM
                transaction
            WHERE
                transaction_id = '${transaction_id}'`;
		let result = await db.any(SP);

		return result[0];
	}

	async getTransactionInvoice(taskId) {
		// SP buat get Client Details
		let SPGetClient = `select public.client.client_id as id, profile_image as profile_image_url, public.client.name from public.client 
    join 
    public.task 
    on
    public.client.client_id = public.task.client_id
    and
    public.task.task_id = '${taskId}';`;

		let result = await db.any(SPGetClient);

		return result;
	}

	async getTransactionClient(transaction_id) {
		// SP buat get Client Details
		let SP = `SELECT 
                *
            FROM
                transaction
            JOIN 
                client
            ON 
                client.client_id = transaction.client_id
            WHERE
                transaction_id = '${transaction_id}'`;
		let result = await db.any(SP);

		return result[0];
	}

	async getTransactionFreelancer(transaction_id) {
		// SP buat get Client Details
		let SP = `SELECT 
                *
            FROM
                transaction
            JOIN 
                freelancer
            ON 
                freelancer.freelancer_id = transaction.freelancer_id
            JOIN
                client
            ON
                freelancer.user_id = client.client_id
            WHERE
                transaction_id = '${transaction_id}'`;
		let result = await db.any(SP);

		return result[0];
	}

	async getTransactionDetailsTaskClient(transaction_id) {
		let SP = `
        select 
        transaction_id as id,
        (
            select row_to_json(t)
            from
            (
                select 
                task_id as id,
                name as name,
                tags as tags,
                deadline as due_date,
                difficulty as difficulty,
                price as price
                from
                public.task t
                where
                t.task_id = tr.project_id
                limit 1
            ) t
        ) as task_detail,
        status as status,
        delivery_date as delivery_date,
        CASE
            when status = '7' 
            then true
            else false
        END has_returned,
        (
            select 
            row_to_json(t)
            from
            (
                select 
                    f.freelancer_id as id,
                    c.name as name,
                    c.profile_image as profile_image_url,
                    f.description as description
                from 
                public.freelancer f
                join
                public.client c
                on 
                c.client_id = f.user_id
                where 
                f.freelancer_id = tr.freelancer_id
            ) t
        ) chosen_freelancer,
        CASE
            when 
            (
                select count(*)
                from
                public.review
                where
                transaction_id = tr.transaction_id
            ) = 1
            then true
            else false
        END is_reviewed,
        CASE
            when 
            (
                select count(*)
                from
                public.review
                where
                transaction_id = tr.transaction_id
            ) = 1
            then 
            (
                select 
                row_to_json (t)
                from
                (
                    select 
                        rating as amount,
                        content as description
                    from 
                        public.review
                    where
                    transaction_id = tr.transaction_id
                ) t
            )
            else null
        END review
        from
        public.transaction tr
        where
        transaction_id = '${transaction_id}'
        `;

		try {
			let result = await db.any(SP);

			if (result.length == 0) {
				return new Error("Gagal Mendapatkan Data.");
			} else {
				return result[0];
			}
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getTransactionDetailsTaskFreelancer(transaction_id) {
		let SP = `
        select 
        transaction_id as id,
        (
            select row_to_json(t)
            from
            (
                select 
                task_id as id,
                name as name,
                tags as tags,
                deadline as due_date,
                difficulty as difficulty,
                price as price
                from
                public.task t
                where
                t.task_id = tr.project_id
                limit 1
            ) t
        ) as task_detail,
        status as status,
        delivery_date as delivery_date,
        CASE
            when status = '5' 
            then true
            else false
        END has_cancelled,
        (
            select 
            row_to_json(t)
            from
            (
                select
                client_id as id,
                name as name,
                profile_image as profile_image_url
                from
                public.client
                where
                client_id = tr.client_id
            ) t
        ) client,
        CASE
            when 
            (
                select count(*)
                from
                public.review
                where
                transaction_id = tr.transaction_id
            ) = 1
            then true
            else false
        END is_reviewed,
        CASE
            when 
            (
                select count(*)
                from
                public.review
                where
                transaction_id = tr.transaction_id
            ) = 1
            then 
            (
                select 
                row_to_json (t)
                from
                (
                    select 
                        rating as amount,
                        content as description
                    from 
                        public.review
                    where
                    transaction_id = tr.transaction_id
                    limit 1
                ) t
            )
            else null
        END review
        from
        public.transaction tr
        where
        transaction_id = '${transaction_id}'
        limit 1
        `;

		try {
			let result = await db.any(SP);

			if (result.length == 0) {
				return new Error("Gagal Mendapatkan Data.");
			}

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getTransactionActivityClient(transaction_id) {
		let SP = `
        `;

		try {
			let result = await db.any(SP);

			if (result.length < 1) {
				return new Error("Gagal Mendapatkan Data.");
			} else {
				return result;
			}
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getTransactionDetailsServiceClient(transaction_id) {
		let SP = `
        select
        transaction_id as id,
        (
            select row_to_json(t)
            from
            (
                select 
                s.service_id as id,
                s.name as name,
                s.tags as tags,
                tr.deadline as due_date,
                s.price as price
                from
                public.transaction tr
                join
                public.service s 
                on 
                tr.project_id = s.service_id
                where
                tr.transaction_id = trx.transaction_id
            ) t
        ) service_detail,
        status as status,
        delivery_date as delivery_date,
        (
            select row_to_json(t)
            from
            (
                select
                f.freelancer_id as id,
                c.name as name,
                c.profile_image as profile_image_url,
                f.description as description
                from
                public.freelancer f
                join
                public.client c
                on
                f.user_id = c.client_id
                where
                f.freelancer_id = trx.freelancer_id
            ) t
        ) freelancer,
        (
            select AVG(rating)
            from 
            public.review
            where
            destination_id = trx.transaction_id
        ) average_rating,
        (
            select AVG(rating)
            from 
            public.review
            where
            destination_id = trx.transaction_id
        ) rating_amount,
        CASE 
            when
            (
                select count(*) 
                from 
                public.review
                where 
                destination_id = trx.transaction_id
            ) > 0
            then true
            else false
        END is_reviewed,
        CASE
            when
            (
                select count(*) 
                from 
                public.review
                where 
                destination_id = trx.transaction_id
            ) > 0
            then true
            else null
        END review,
        CASE
            when status = '7'
            then true
            else false
        END has_returned
        from 
        public.transaction trx
        where
        transaction_id = '${transaction_id}'
        `;

		try {
			let result = await db.any(SP);

			if (result.length < 1) {
				return new Error("Gagal Mendapatkan Data.");
			} else {
				return result[0];
			}
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getTransactionDetailsServiceFreelancer(transaction_id) {
		let SP = `
        select
        transaction_id as id,
        (
            select row_to_json(t)
            from
            (
                select 
                s.service_id as id,
                s.name as name,
                s.tags as tags,
                tr.deadline as due_date,
                s.price as price
                from
                public.transaction tr
                join
                public.service s 
                on 
                tr.project_id = s.service_id
                where
                tr.transaction_id = trx.transaction_id
            ) t
        ) service_detail,
        status as status,
        delivery_date as delivery_date,
        (
            select row_to_json(t)
            from
            (
                select 
                client_id as id, 
                name as name,
                profile_image as profile_image_url
                from
                public.client
                where
                client_id = trx.client_id 
            ) t
        ) client,
        CASE 
            when
            (
                select count(*) 
                from 
                public.review
                where 
                destination_id = trx.transaction_id
            ) > 0
            then true
            else false
        END is_reviewed,
        CASE
            when
            (
                select count(*) 
                from 
                public.review
                where 
                destination_id = trx.transaction_id
            ) > 0
            then true
            else null
        END review,
        CASE
            when status = '5'
            then true
            else false
        END has_cancelled
        from 
        public.transaction trx
        where
        transaction_id = '${transaction_id}'
        `;

		try {
			let result = await db.any(SP);

			if (result.length < 1) {
				return new Error("Gagal Mendapatkan Data.");
			} else {
				return result[0];
			}
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}
};
