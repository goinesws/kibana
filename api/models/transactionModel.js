const express = require("express");
const db = require("../../db");
const uuid = require("uuid");
const User = require("../models/userModel");
const Activity = require("../models/activityModel.js");
const {
	authorize,
	listFiles,
	uploadFile,
	getDownloadLink,
	getFileName,
} = require("../utils/googleUtil.js");
const Payment = require("./paymentModel.js");

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
								TO_CHAR(deadline, 'DD Mon YYYY HH:mm') as due_date,
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
        TO_CHAR(delivery_date, 'DD Mon YYYY HH:mm') as delivery_date,
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
	async getTransactionActivityFreelancer(transaction_id, freelancer_id) {
		// getFreelancerActivity(transaction_id) activitymodel
		//if code 15 then dont add author di depan title
		//if code 18 then dont add author di depan title
		//if code 16 then dont add author di depan title
		try {
			let activityInstance = new Activity();

			let result = await activityInstance.getFreelancerActivity(
				transaction_id,
				freelancer_id
			);

			return result;
		} catch (error) {
			return new Error("Gagal Fetch Data Transaction Activity");
		}
	}

	async getTransactionActivityClient(transaction_id, client_id) {
		// getClientActivity(transaction_id) di activity model
		try {
			let activityInstance = new Activity();

			let result = await activityInstance.getClientActivity(
				transaction_id,
				client_id
			);

			// Map Files dari Result

			return result;
		} catch (error) {
			return new Error("Gagal Fetch Data Transaction Activity");
		}
	}

	// masuk activity
	// Send Requirement
	async sendRequirement(transaction_id, file, description, x_token) {
		let UserInstance = new User();
		let curr_session = await UserInstance.getUserSessionData(x_token);
		let client_id = curr_session.session_data.client_id;
		//date ambil dari query sql
		let title = "menambahkan file pendukung dan deskripsi";
		let activity = {};
		activity.transaction_id = transaction_id;
		activity.client_id = client_id;
		activity.title = title;
		activity.content = description;
		activity.file = file;
		activity.code = "2";

		//response deadline is the same as the transaction deadline
		activity.response_deadline = new Date(
			await this.getDeadline(transaction_id)
		);
		console.log(activity.response_deadline);

		let activityInstance = new Activity();
		let result = await activityInstance.createActivity(activity);

		return result;
	}

	// masuk activity
	// Send Message
	async sendMessage(transaction_id, message, x_token) {
		let UserInstance = new User();
		let curr_session = await UserInstance.getUserSessionData(x_token);
		let client_id = curr_session.session_data.client_id;
		let title = "mengirim pesan";
		let file = null;

		let activity = {};
		activity.transaction_id = transaction_id;
		activity.client_id = client_id;
		activity.title = title;
		activity.content = message;
		activity.code = "4";

		console.log(activity);
		let activityInstance = new Activity();
		let result = await activityInstance.createActivity(activity);
		return result;
	}

	// masuk activity
	// Send Additional File
	async sendAdditionalFile(transaction_id, additionalFile, x_token) {
		let UserInstance = new User();
		let curr_session = await UserInstance.getUserSessionData(x_token);
		let client_id = curr_session.session_data.client_id;
		//date ambil dari query sql
		let title = "menambahkan file pendukung";
		let activity = {};
		activity.transaction_id = transaction_id;
		activity.client_id = client_id;
		activity.title = title;
		activity.file = additionalFile;
		activity.code = "3";

		let activityInstance = new Activity();
		let result = await activityInstance.createActivity(activity);

		return result;
	}

	// masuk activity
	// Send Result
	async sendResult(transaction_id, files, description, x_token) {
		//apus previous response deadline
		let activityInstance = new Activity();
		let update = await activityInstance.updateResponseDeadline(transaction_id);

		//create activity
		let UserInstance = new User();
		let curr_session = await UserInstance.getUserSessionData(x_token);
		let client_id = curr_session.session_data.client_id;
		//date ambil dari query sql
		let title = "mengirim hasil pekerjaan";
		let activity = {};
		activity.transaction_id = transaction_id;
		activity.client_id = client_id;
		activity.title = title;
		activity.file = files;
		activity.content = description;
		activity.code = "5";
		activity.response_deadline =
			"(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') + INTERVAL '2 days'";

		let result = await activityInstance.createActivity(activity);

		//add delivery date in transaction
		let SP1 = `
            UPDATE transaction
            SET delivery_date = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'
            WHERE transaction_id = '${transaction_id}'
        `;

		try {
			console.log(SP1);
			let result = await db.any(SP1);
		} catch (error) {
			throw new Error("Gagal Mendapatkan Data.");
		}

		//change transaction status
		this.changeStatus(transaction_id, 3);

		return result;
	}

	// masuk activity
	// Ask Return
	async askReturn(transaction_id, message, x_token) {
		let UserInstance = new User();
		let curr_session = await UserInstance.getUserSessionData(x_token);
		let client_id = curr_session.session_data.client_id;
		let title = "meminta pengembalian dana.";

		let id = uuid.v4();
		let activity = {};
		activity.activity_id = id;
		activity.transaction_id = transaction_id;
		activity.client_id = client_id;
		activity.title = title;
		activity.content = message;
		activity.code = "6";

		//create response deadline
		activity.response_deadline =
			"(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') + INTERVAL '2 days'";

		console.log(activity);
		let activityInstance = new Activity();

		//apus response deadline sebelumnya
		let result = await activityInstance.updateResponseDeadline(transaction_id);

		//change transaction status to 7
		this.changeStatus(transaction_id, 7);

		//create activity
		result = await activityInstance.createActivity(activity);

		//delete all previous buttons
		result = await activityInstance.deleteButton(transaction_id);

		//add buttons
		//tolak permintaan pengembalian
		result = await activityInstance.createButton(id, transaction_id, 3);

		//terima permintaan pengembalian
		result = await activityInstance.createButton(id, transaction_id, 4);

		//batalkan ajuan pengembalian
		result = await activityInstance.createButton(id, transaction_id, 5);

		return result;
	}

	// masuk activity
	// Cancel Return
	async cancelReturn(transaction_id, x_token) {
		let UserInstance = new User();
		let curr_session = await UserInstance.getUserSessionData(x_token);
		let client_id = curr_session.session_data.client_id;
		let title = "membatalkan permintaan pengembalian dana.";

		let activity = {};
		activity.transaction_id = transaction_id;
		activity.client_id = client_id;
		activity.title = title;
		activity.code = "7";

		//no buttons -> no activity id
		console.log(activity);
		let activityInstance = new Activity();

		//delete all previous buttons + no new buttons
		let result = await activityInstance.deleteButton(transaction_id);

		//apus response deadline yang pas pengajuan pengembalian
		result = await activityInstance.updateResponseDeadline(transaction_id);

		//get old transaction_code
		let code = await this.getPrevStatus(transaction_id);

		//change transaction status to prev code before pengajuan pengembalian
		code = await this.changeStatus(transaction_id, code);

		//create activity
		result = await activityInstance.createActivity(activity);

		return result;
	}

	// masuk activity
	// Ask Revision
	async askRevision(transaction_id, message, x_token) {
		let UserInstance = new User();
		let curr_session = await UserInstance.getUserSessionData(x_token);
		let client_id = curr_session.session_data.client_id;
		let title = "meminta revisi.";

		let id = uuid.v4();
		let activity = {};
		activity.activity_id = id;
		activity.transaction_id = transaction_id;
		activity.client_id = client_id;
		activity.title = title;
		activity.content = message;
		activity.code = "14";

		//create deadline extension (3 hari)
		let date = new Date(await this.getDeadline(transaction_id));
		activity.deadline_extension = date.setDate(date.getDate() + 3);

		let activityInstance = new Activity();

		//apus response deadline sebelumnya
		let result = await activityInstance.updateResponseDeadline(transaction_id);

		console.log(activity);

		//reduce remaining revision in transaction
		let SP1 = `
            UPDATE transaction
            SET remaining_revision = remaining_revision-1
            WHERE transaction_id = '${transaction_id}'
        `;

		try {
			console.log(SP1);
			let result = await db.any(SP1);
		} catch (error) {
			throw new Error("Gagal Mendapatkan Data.");
		}

		//delay deadline 3 hari
		let SP2 = `
            UPDATE transaction
            SET deadline = deadline + INTERVAL '3 day'
            WHERE transaction_id = '${transaction_id}'
        `;

		try {
			console.log(SP2);
			let result = await db.any(SP2);
		} catch (error) {
			throw new Error("Gagal Mendapatkan Data.");
		}

		//if transaction type == task
		//delay deadline yang ada di table task juga
		let SP3 = `
            UPDATE task
            SET deadline = deadline + INTERVAL '3 day'
            WHERE task_id = (
                SELECT project_id 
                FROM transaction 
                WHERE transaction_id = '${transaction_id}'
                AND project_type = 'TASK'
            );
        `;

		try {
			console.log(SP3);
			let result = await db.any(SP3);
		} catch (error) {
			throw new Error("Gagal Mendapatkan Data.");
		}

		//change transaction status to 2
		this.changeStatus(transaction_id, 2);

		//create activity
		result = await activityInstance.createActivity(activity);

		//delete all previous buttons
		result = await activityInstance.deleteButton(transaction_id);

		return result;
	}

	// masuk activity
	// Complete Transaction
	async completeTransaction(transaction_id, x_token) {
		let UserInstance = new User();
		let curr_session = await UserInstance.getUserSessionData(x_token);
		let client_id = curr_session.session_data.client_id;
		let title =
			"Pesanan berhasil diselesaikan dan dana berhasil diteruskan kepada freelancer.";

		let activity = {};
		activity.transaction_id = transaction_id;
		activity.client_id = client_id;
		activity.title = title;
		activity.code = "15";

		//no buttons -> no activity id
		console.log(activity);
		let activityInstance = new Activity();

		//delete all previous buttons + no new buttons
		let result = await activityInstance.deleteButton(transaction_id);

		//apus response deadline yang pas pengajuan pengembalian
		result = await activityInstance.updateResponseDeadline(transaction_id);

		//get old transaction_code
		let code = await this.getPrevStatus(transaction_id);

		//change transaction status to prev code before pengajuan pengembalian
		code = await this.changeStatus(transaction_id, code);

		//create activity
		result = await activityInstance.createActivity(activity);

		//change transaction status to 4
		this.changeStatus(transaction_id, 4);

		return result;
	}

	// masuk activity
	// Ask Cancellation
	async askCancellation(transaction_id, message, x_token) {
		let UserInstance = new User();
		let curr_session = await UserInstance.getUserSessionData(x_token);
		let client_id = curr_session.session_data.client_id;
		let title = "meminta pembatalan.";

		let id = uuid.v4();
		let activity = {};
		activity.activity_id = id;
		activity.transaction_id = transaction_id;
		activity.client_id = client_id;
		activity.title = title;
		activity.content = message;
		activity.code = "10";

		//create response deadline
		activity.response_deadline =
			"(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') + INTERVAL '2 days'";

		console.log(activity);
		let activityInstance = new Activity();

		//apus response deadline sebelumnya
		let result = await activityInstance.updateResponseDeadline(transaction_id);

		//change transaction status to 7
		this.changeStatus(transaction_id, 7);

		//create activity
		result = await activityInstance.createActivity(activity);

		//delete all previous buttons
		result = await activityInstance.deleteButton(transaction_id);

		//add buttons
		//tolak permintaan pembatalan
		result = await activityInstance.createButton(id, transaction_id, 6);

		//terima permintaan pembatalan
		result = await activityInstance.createButton(id, transaction_id, 7);

		//batalkan ajuan pembatalan
		result = await activityInstance.createButton(id, transaction_id, 8);

		return result;
	}

	// masuk activity
	// Manage Cancellation
	async manageCancellation(transaction_id, type, x_token) {
		let UserInstance = new User();
		let curr_session = await UserInstance.getUserSessionData(x_token);
		let client_id = curr_session.session_data.client_id;

		let id = uuid.v4();
		let activity = {};
		activity.activity_id = id;
		activity.transaction_id = transaction_id;
		activity.client_id = client_id;

		console.log(activity);
		let activityInstance = new Activity();

		//delete all prev button
		let result = await activityInstance.deleteButton(transaction_id);

		//delete all prev response deadline
		result = await activityInstance.updateResponseDeadline(transaction_id);

		if (type == "REJECT") {
			activity.code = "12";
			activity.title = "menolak permintaan pembatalan.";
			//add button for hubungi admin
			result = await activityInstance.createButton(id, transaction_id, 9);

			//button for batalkan ajuan pembatalan
			result = await activityInstance.createButton(id, transaction_id, 8);

			//response deadline 2 hari
			activity.response_deadline =
				"(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') + INTERVAL '2 days'";

			//change status to 7
			this.changeStatus(transaction_id, 7);

			//create activity
			result = await activityInstance.createActivity(activity);
		} else {
			//if type == "ACCEPT"
			activity.code = "13";
			activity.title = "menerima permintaan pembatalan";

			//change status to 5
			this.changeStatus(transaction_id, 5);

			//create activity
			result = await activityInstance.createActivity(activity);

			//create activity satu lagi for pembatalan
			let newActivity = {};
			newActivity.transaction_id = transaction_id;
			newActivity.client_id = client_id;
			newActivity.title =
				"Pesanan dibatalkan dan dana berhasil dikembalikan kepada klien.";
			newActivity.code = "18";
			result = await activityInstance.createActivity(newActivity);
		}

		return result;
	}

	// masuk activity
	// Call Admin
	async callAdmin(transaction_id, x_token) {
		let UserInstance = new User();
		let curr_session = await UserInstance.getUserSessionData(x_token);
		let client_id = curr_session.session_data.client_id;
		let title = "Admin berhasil dihubungi dan investigasi sedang dilakukan";

		let activity = {};
		activity.transaction_id = transaction_id;
		activity.client_id = client_id;
		activity.title = title;
		activity.code = "16";

		console.log(activity);
		let activityInstance = new Activity();

		//apus response deadline sebelumnya
		let result = await activityInstance.updateResponseDeadline(transaction_id);

		//change status to 9
		this.changeStatus(transaction_id, 9);

		//create activity
		result = await activityInstance.createActivity(activity);

		//delete all previous buttons
		result = await activityInstance.deleteButton(transaction_id);

		return result;
	}

	// masuk activity
	// Cancel Cancellation
	async cancelCancellation(transaction_id, x_token) {
		let UserInstance = new User();
		let curr_session = await UserInstance.getUserSessionData(x_token);
		let client_id = curr_session.session_data.client_id;
		let title = "membatalkan permintaan pembatalan.";

		let activity = {};
		activity.transaction_id = transaction_id;
		activity.client_id = client_id;
		activity.title = title;
		activity.code = "11";

		//no buttons -> no activity id
		console.log(activity);
		let activityInstance = new Activity();

		//delete all previous buttons + no new buttons
		let result = await activityInstance.deleteButton(transaction_id);

		//apus response deadline yang pas pengajuan pengembalian
		result = await activityInstance.updateResponseDeadline(transaction_id);

		//get old transaction_code
		let code = await this.getPrevStatus(transaction_id);

		//change transaction status to prev code before pengajuan pengembalian
		code = await this.changeStatus(transaction_id, code);

		//create activity
		result = await activityInstance.createActivity(activity);

		return result;
	}

	// masuk activity
	// Manage Return
	async manageReturn(transaction_id, type, x_token) {
		let UserInstance = new User();
		let curr_session = await UserInstance.getUserSessionData(x_token);
		let client_id = curr_session.session_data.client_id;

		let id = uuid.v4();
		let activity = {};
		activity.activity_id = id;
		activity.transaction_id = transaction_id;
		activity.client_id = client_id;

		console.log(activity);
		let activityInstance = new Activity();

		//delete all prev button
		let result = await activityInstance.deleteButton(transaction_id);

		//delete all prev response deadline
		result = await activityInstance.updateResponseDeadline(transaction_id);

		if (type == "REJECT") {
			activity.code = "8";
			activity.title = "menolak permintaan pengembalian dana.";
			//add button for hubungi admin
			result = await activityInstance.createButton(id, transaction_id, 9);

			//button for batalkan ajuan pengembalian
			result = await activityInstance.createButton(id, transaction_id, 5);

			//response deadline 2 hari
			activity.response_deadline =
				"(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') + INTERVAL '2 days'";

			//change status to 7
			this.changeStatus(transaction_id, 7);

			//create activity
			result = await activityInstance.createActivity(activity);
		} else {
			//if type == "ACCEPT"
			activity.code = "9";
			activity.title = "menerima permintaan pengembalian dana.";

			//change status to 5
			this.changeStatus(transaction_id, 5);

			//create activity
			result = await activityInstance.createActivity(activity);

			//create activity satu lagi for pembatalan
			let newActivity = {};
			newActivity.transaction_id = transaction_id;
			newActivity.client_id = client_id;
			newActivity.title =
				"Pesanan dibatalkan dan dana berhasil dikembalikan kepada klien.";
			newActivity.code = "18";
			result = await activityInstance.createActivity(newActivity);
		}
	}

	// Send Feedback
	async sendFeedback(payment_id) {
		try {
			// update di payment
			console.log("Transaction Model ");

			let date = new Date();

			console.log("DATE : " + date.toISOString());

			// update di transac
			let SPU = `
			update
			public.transaction
			set
			payment_date = '${date.toISOString()}'
			where
			transaction_id 
			in
			(
			select
			transaction_id
			from 
			public.payment
			where
			payment_id = '${payment_id}'
			)
			`;
			let update_result = await db.any(SPU);

			let SP = `
			select
			transaction_id
			from 
			public.payment
			where
			payment_id = '${payment_id}'
			`;

			console.log("SP : " + SP);

			let result = await db.any(SP);

			console.log("result : ");
			console.log(result);

			let paymentInstance = new (require("../models/paymentModel"))();
			let payment_update_result = await paymentInstance.updatePaymentStatus(
				payment_id
			);

			if (payment_update_result instanceof Error) {
				return new Error("Gagal Pada Payment Model.");
			}

			// Create Activity Setelah Bayar (Karena Transaksi Di buat)

			return result[0];
		} catch (error) {
			console.log(error);
			return new Error("Gagal Pada Transaction Model.");
		}
	}

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
                    '${project.deadline.toLocaleString()}',
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

				// console.log("SPP : ");
				// console.log(SPP);

				project = await db.any(SPP);
				project = project[0];

				// harus set deadline via get dari service terus
				// ditambahin working days

				// console.log("PROJECT SERVICE : ");
				// console.log(project);

				let remaining_revision = project.revision_count;
				// console.log("REMAINING REVISION: ");
				// console.log(remaining_revision);

				let working_time = project.working_time * 24 * 60 * 60 * 1000;
				// console.log("WORKING TIME : ");
				// console.log(working_time);

				let date = new Date();
				// console.log("DATE : ");
				// console.log(date.valueOf());

				let deadlinems = Math.round(date.valueOf() + working_time);
				let deadline = new Date(deadlinems);
				// console.log("DEADLINE : ");
				// console.log(deadline);

				// SP Buat create transaction
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
                    '${deadline.toLocaleString()}',
                    null,
                    '${remaining_revision}',
                    false,
                    false,
                    false,
                    null,
                    '${freelancer_id}',
                    'SERVICE'
                )
                `;

				// console.log("SP SERVICE : ");
				// console.log(SP);
			}

			let insert_result = await db.any(SP);

			return trx_uuid;
		} catch (error) {
			return new Error("Gagal Membuat Transaksi.");
		}
	}

	//change status
	async changeStatus(transaction_id, status) {
		//get current status (sblm diupdate)
		let oldStatus;
		let SP1 = `
            SELECT status
            FROM public.transaction
            WHERE transaction_id = '${transaction_id}'
        `;

		try {
			console.log(SP1);
			let result = await db.any(SP1);
			oldStatus = result[0].status;
		} catch (error) {
			throw new Error("Gagal Mendapatkan Data.");
		}

		//masukkin old status ke status_temp and new status dari param ke status
		let SP = `
            UPDATE transaction 
            SET status = '${status}', status_temp = '${oldStatus}'
            WHERE transaction_id = '${transaction_id}'  
        `;

		try {
			console.log(SP);
			let result = await db.any(SP);
			return null;
		} catch (error) {
			throw new Error("Gagal Mendapatkan Data.");
		}
	}

	async getDeadline(transaction_id) {
		//find latest activity, get the code, to use for code_temp in new activity
		let SP = `
            SELECT deadline
            FROM transaction
            WHERE transaction_id = '${transaction_id}'    
        `;

		try {
			let result = await db.any(SP);
			if (result.length < 1) {
				throw new Error("Gagal Mendapatkan Data.");
			} else {
				return result[0].deadline;
			}
		} catch (error) {
			throw new Error("Gagal Mendapatkan Data.");
		}
	}

	async editDeadline(transaction_id) {}

	async deleteActivityResponseDeadline(transaction_id) {
		//update to null semua response deadline dari semua activity yang ada di transaction tersebut
		//hiit this before creating new activity with response deadline karena hanya ada satu activity yang boleh punya active response deadline
	}

	async getPrevStatus(transaction_id) {
		//cari activity paling baru
		//liat code temp nya
		//assign status dari code temp
		let code;
		let SP = `
            SELECT status_temp
            FROM transaction
            WHERE transaction_id = '${transaction_id}'
        `;

		try {
			console.log(SP);
			let result = await db.any(SP);
			code = result[0].status_temp;
			console.log(code);
			return code;
		} catch (error) {
			throw new Error("Gagal Mendapatkan Data.");
		}
	}
};
