const express = require("express");
const db = require("../../db");
const Review = require("../models/reviewModel");
const Task = require("../models/taskModel");
const uuid = require("uuid");

module.exports = class Transaction {
	// Utilities
	async getFreelancerProjectByUserId(userId) {
		let SP = `
        select distinct
        s.name as project_name,
        r.rating as star,
        s.description as description,
        TO_CHAR(tr.delivery_date, 'DD Mon YYYY') as timestamp
        from 
        public.transaction tr
        join
        public.freelancer f
        on
        f.freelancer_id = tr.freelancer_id
        join
        public.service s
        on
        s.service_id = tr.project_id
        join
        public.review r
        on
        r.transaction_id = tr.transaction_id
        where
        f.user_id = '${userId}'
        or
        f.freelancer_id = '${userId}'
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

	// Inquiry Invoice
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

	// Inquiry Invoice
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

	// Utilities
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

	// Utilities
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

	// Inquiry Detail Pesanan Tugas Client
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

	// Inquiry Detail Pesanan Tugas Freelancer
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

	// masuk activity
	// Inquiry Activity Pesanan Client
	async getTransactionActivityClient(transaction_id) {}

	// Inquiry Detail Pesanan Layanan Client
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

	// Inquiry Detail Pesanan Layanan Freelancer
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

	// masuk activity
	// Inquiry Activity Pesanan Freelancer
	async getTransactionActivityFreelancer(transaction_id) {}

	// masuk activity
	// Send Requirement
	async sendRequirement(transaction_id, file, description) {}

	// masuk activity
	// Send Message
	async sendMessage(transaction_id, message) {}

	// masuk activity
	// Send Additional File
	async sendAdditionalFile(transaction_id, additionalFile) {}

	// masuk activity
	// Send Result
	async sendResult(transaction_id, files, description) {}

	// masuk activity
	// Ask Return
	async askReturn(transaction_id, message) {}

	// masuk activity
	// Cancel Return
	async cancelReturn(transaction_id) {}

	// masuk activity
	// Ask Revision
	async askRevision(transaction_id, message) {}

	// masuk activity
	// Complete Transaction
	async completeTransaction(transaction_id) {}

	// masuk activity
	// Manage Cancellation
	async manageCancellation(transaction_id, type) {}

	// masuk activity
	// Call Admin
	async callAdmin(transaction_id) {}

	// masuk activity
	// Ask Cancellation
	async askCancellation(transaction_id, message) {}

	// masuk activity
	// Cancel Cancellation
	async cancelCancellation(transaction_id) {}

	// masuk activity
	// Manage Return
	async manageReturn(transaction_id, type) {}

	// Send Feedback
	async sendFeedback(payment_id) {}

	// Create Transac Buat Payment
	async createTransaction(project_id, client_id, freelancer_id, project_type) {
		try {
			let trx_uuid = uuid.v4();
			let project;
			let SP;

			console.log(project_type);

			if (project_type == "TASK") {
				console.log("PROJECT ID:");
				console.log(project_id);

				let SPP = `
                select
                *
                from
                public.task
                where
                task_id = '${project_id}'
                `;

				project = await db.any(SPP);
				project = project[0];

				console.log("PROJECT : ");
				console.log(project);

				SP = `
                INSERT
                INTO
                PUBLIC.TRANSACTION
                (
                    transaction_id,
                    project_id,
                    client_id,
                    status,
                    deadline,
                    delivery_date,
                    remaining_revision,
                    is_need_admin,
                    can_cancel,
                    can_return,
                    payment_date,
                    freelancer_id,
                    project_type
                )
                VALUES
                (
                    '${trx_uuid}',
                    '${project_id}',
                    '${client_id}',
                    '2',
                    '${project.deadline.toLocaleString("en-UK", {
											timeZone: "Asia/Jakarta",
										})}',
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    '${freelancer_id}',
                    '${project_type}'
                )
                `;

				console.log("SP");
				console.log(SP);
			} else if (project_type == "SERVICE") {
				let SPP = `
                select
                *
                from
                public.service
                where
                service_id = '${project_id}'
                `;

				project = await db.any(SPP);
				project = project[0];
			}

			let insert_result = await db.any(SP);

			return trx_uuid;
		} catch (error) {
			return new Error("Gagal Membuat Transaksi.");
		}
	}
};
