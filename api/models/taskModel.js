const express = require("express");
const db = require("../../db");
const uuid = require("uuid");
const Subcategory = require("../models/subcategoryModel");
const Payment = require("../models/paymentModel");

module.exports = class Task {
	// Inquiry Tugas Baru
	async getNewTask() {
		let SP = `
    select 
    task_id as id,
    name as name,
    description as description,
    tags as tags,
    TO_CHAR(deadline, 'DD Mon YYYY') as due_date, 
    difficulty as difficulty,
    price as price 
    from 
    public.task
    order by task_id desc
    LIMIT 4
    `;

		try {
			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Inquiry Invoice
	async getAllTaskDetail(task_id) {
		let SP = `select 
      task_id,
      sub_category_id,
      client_id,
      freelancer_id,
      name,
      description,
      price,
      difficulty,
      tags,
      TO_CHAR(created_date, 'DD Mon YYYY') from task where task_id = '${task_id}'`;

		try {
			let result = await db.any(SP);

			return result[0];
		} catch (error) {
			return new Error("Gagal Mendapatkan Data");
		}
	}

	// Inquiry List Tugas
	async getTaskList(body) {
		// console.log(body);

		const searchText = body["search_text"];
		const subcategory = body["sub_category"];
		const budget = body["budget"];
		const difficulty = body["difficulty"];
		const lastId = body["last_id"];

		let SP = `SELECT task_id as id, name, description, tags, TO_CHAR(deadline, 'DD Mon YYYY') as due_date, difficulty, price FROM public.task`;

		if (searchText !== "" && searchText) {
			SP += ` WHERE (name || description ILIKE '%${searchText}%'
      OR '${searchText}' ILIKE ANY (tags))`;
		}
		if (subcategory !== "" && subcategory && subcategory.length >= 1) {
			if (searchText !== "" && searchText) {
				SP += ` AND `;
			} else {
				SP += ` WHERE `;
			}

			SP += "(";

			subcategory.map((curr, i) => {
				if (i > 0) {
					SP += " OR ";
				}

				SP += ` sub_category_id = '${curr}'`;
			});

			SP += ")";
		}
		if (budget !== "" && budget && budget.length >= 1) {
			if (
				(searchText !== "" && searchText) ||
				(subcategory !== "" && subcategory && subcategory.length >= 1)
			) {
				SP += ` AND `;
			} else {
				SP += ` WHERE `;
			}

			SP += "(";

			budget.map((curr, i) => {
				const budgetObject = curr;
				const budgetStart = budgetObject.budget_start;
				const budgetEnd = budgetObject.budget_end;

				if (i > 0) {
					SP += " OR ";
				}

				if (curr.budget_end != null || curr.budget_end != undefined) {
					if (curr.budget_start === 0) {
						SP += ` price >= '${budgetStart}' AND price < '${budgetEnd}'`;
					} else {
						SP += ` price BETWEEN '${budgetStart}' AND '${budgetEnd}'`;
					}
				} else {
					SP += ` price > '${budgetStart}'`;
				}
			});

			SP += ")";
		}

		if (difficulty !== "" && difficulty && difficulty.length >= 1) {
			if (
				(searchText !== "" && searchText) ||
				(subcategory !== "" && subcategory && subcategory.length >= 1) ||
				(budget !== "" && budget && budget.length >= 1)
			) {
				SP += ` AND `;
			} else {
				SP += ` WHERE `;
			}

			SP += "(";

			difficulty.map((curr, i) => {
				if (i > 0) {
					SP += " OR ";
				}
				SP += ` difficulty = '${curr}'`;
			});

			SP += ")";
		}

		try {
			console.log("Get Task List SP : " + SP);
			let result = await db.any(SP);

			return result;
		} catch (error) {
			console.log(error);
			return new Error("Gagal Mendapatkan Data");
		}
	}

	// Inquiry Tuga Baru
	async getNewTaskByCategory(categoryId) {
		// get list of SUBCAT BY CATEGORY ID
		const subcatInstance = new Subcategory();
		let subcat_list = await subcatInstance.getListSubcatByCategoryID(
			categoryId
		);

		let SPGetTask = `
    select 
    t.task_id as id, 
    t.name, 
    t.description, 
    t.tags, 
    TO_CHAR(t.deadline, 'DD Mon YYYY') as due_date,  
    t.difficulty, 
    t.price 
    from public.task t
    where 
    t.sub_category_id 
    in 
    ${subcat_list}
    order by t.deadline ASC 
    limit 4;`;

		try {
			let result = await db.any(SPGetTask);

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data");
		}
	}

	// Inquiry Detail Tugas
	async getTaskDetails(taskId) {
		try {
			let result = {};

			let task_details;
			try {
				let SP = `
		  select
		  task_id as id,
		  name as name,
		  tags as tags,
		  TO_CHAR(deadline, 'DD Mon YYYY') as due_date,
		  difficulty as difficulty,
		  price as price,
		  description as description
		  from
		  public.task
		  where
		  task_id = '${taskId}'
		  `;
				task_details = await db.any(SP);
			} catch (error) {
				return new Error("Gagal Mengambil Data.");
			}

			let client_details;
			try {
				let SP = `
		  select
		  c.client_id as id,
		  profile_image as profile_image_url,
		  c.name as name
		  from
		  public.task t
		  join
		  public.client c
		  on
		  t.client_id = c.client_id
		  where
		  task_id = '${taskId}';
		  `;

				client_details = await db.any(SP);
			} catch (error) {
				return new Error("Gagal Mengambil Data.");
			}

			let reg_freelancer_details;
			try {
				let SP = `
		  select
		  f.freelancer_id as id,
		  c.profile_image as profile_image_url,
		  c.name as name
		  from
		  public.task t
		  join
		  public.task_enrollment te
		  on
		  t.task_id = te.task_id
		  join
		  public.freelancer f
		  on
		  te.freelancer_id = f.freelancer_id
		  join
		  public.client c
		  on
		  f.user_id = c.client_id
		  where
		  t.task_id = '${taskId}';
		  `;

				reg_freelancer_details = await db.any(SP);

				if (reg_freelancer_details.length < 1) {
					reg_freelancer_details = null;
				}
			} catch (error) {
				return new Error("Gagal Mengambil Data.");
			}

			let review_details;
			try {
				let SP = `
				select
				round(avg(rating), 1) as average_rating,
				count(*) as rating_amount,
				(
					select json_agg(t)
					from
					(
						select
						c.name,
						r.rating as star,
						r.content as description,
						TO_CHAR(r.date, 'DD Mon YYYY') as timestamp
						from
						public.review r
						join
						public.freelancer f
						on
						r.writer_id = f.freelancer_id
						join
						public.client c
						on
						f.user_id = c.client_id
						where
						destination_id = (select client_id from public.task where task_id = '${taskId}')
					) t
				) as review_list
				from
				public.review
				where
				destination_id = (select client_id from public.task where task_id = '${taskId}')
				or
				destination_id = '${taskId}'
		  `;

				review_details = await db.any(SP);
			} catch (error) {
				return new Error("Gagal Mengambil Data.");
			}

			// map review details dulu

			if (review_details[0].rating_amount == 0) {
				review_details[0].average_rating = 0;
				review_details[0].review_list = null;
			}
			result.task_detail = task_details[0];
			result.client = client_details[0];
			result.registered_freelancer = reg_freelancer_details;
			result.review = review_details[0];

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Detail Tugas.");
		}
	}

	// Inquiry Owned Task
	async getTaskByClientId(userId) {
		let SP = `
    select 
    t.task_id as id,
    t.name,
    t.description,
    t.tags,
    TO_CHAR(t.deadline, 'DD Mon YYYY') as due_date,
    t.difficulty,
    t.price
    from 
    public.task t
		left join
		public.transaction trx
		on
		t.task_id = trx.project_id
    where
		(
			t.client_id = '${userId}'
			or
			t.client_id = 
			(
				select 
				client_id 
				from
				public.client c
				join
				public.freelancer f
				on
				c.client_id = f.user_id
				where
				f.freelancer_id = '${userId}'
			)
		)
		and
		trx.status IS NULL
		;
    `;

		try {
			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Create Tugas
	async createTask(data, userId) {
		let task_uuid = uuid.v4();
		let subcat = data.sub_category;
		let name = data.name;
		let price = data.price;
		let difficulty = data.difficulty;
		let tags = data.tags;
		let deadline = data.deadline;
		let description = data.description;

		let SP = `
		insert into
		public.task
		(task_id, sub_category_id, client_id, name, price, difficulty, tags, deadline, description)
		values
		(
		'${task_uuid}',
		'${subcat}',
		'${userId}',
		'${name}',
		${price},
		'${difficulty}',
		'{${tags}}',
		'${deadline}',
		'${description}'
		)
		`;

		try {
			let result = await db.any(SP);

			return task_uuid;
		} catch (error) {
			return new Error("Gagal Insert.");
		}
	}

	// Inquiry Tugas Saya
	async getOwnedTask(userId) {
		let SP = `
    select 
    t.task_id as id,
    t.name as name,
    t.tags as tags,
    TO_CHAR(t.deadline, 'DD Mon YYYY') as due_date,
    t.price as price,
   	CASE
			WHEN tr.status IS NULL
			THEN '1'
			ELSE tr.status 
		END status,
    TO_CHAR(tr.delivery_date, 'DD Mon YYYY') as delivery_date,
    CASE 
      WHEN (select status from public.transaction where project_id = t.task_id) = '1' 
      OR (select status from public.transaction where project_id = t.task_id) = '6'
      THEN
      (select count(*) from public.task_enrollment where task_id in (select task_id from public.task 
      where client_id = t.client_id))
      ELSE null
    END registered_freelancer_amount,
    CASE 
      WHEN (select status from public.transaction where project_id = t.task_id) != '1' 
      OR (select status from public.transaction where project_id = t.task_id) != '6'
      THEN
      (select row_to_json(t)
      from 
      (
      select f.freelancer_id as id, c.name, c.profile_image as profile_image_url 
      from public.freelancer f join public.client c on f.user_id = c.client_id
      where f.freelancer_id = t.freelancer_id
      ) 
      t)
      ELSE null
    END chosen_freelancer,
    tr.transaction_id as transaction_id,
    CASE 
      WHEN (select count(*) from public.review where destination_id = t.task_id) >= 1 THEN true
      ELSE false
    END is_reviewed,
    CASE 
      WHEN (select count(*) from public.review where destination_id = t.task_id) >= 1 
      THEN 
      (select row_to_json(t)
      from 
      (
      select count(*) as amount
      from 
      public.review
      where
      destination_id = t.task_id
      ) 
      t)
      ELSE null
    END review
    from 
    public.task t
    left join
    public.transaction tr
    on
    tr.project_id = t.task_id
    where
    t.client_id = '${userId}'
    or
    t.client_id = 
    (
      select 
      client_id 
      from
      public.client c
      join
      public.freelancer f
      on
      c.client_id = f.user_id
      where
      f.freelancer_id = '${userId}'
    );
    `;

		try {
			console.log(SP);
			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal mendapatkan task");
		}
	}

	// Inquiry Details Tugas Saya
	async getOwnedTaskDetails(taskId, userId) {
		let SP = `
    select 
    t.task_id as id,
    t.name as name,
    t.tags as tags,
    TO_CHAR(t.deadline, 'DD Mon YYYY') as due_date,
    t.difficulty as difficulty,
    t.price as price,
    CASE 
			WHEN tr.status IS NULL
			THEN '1'
			ELSE tr.status
		END status
    from 
    public.task t
    left join
    public.transaction tr
    on
    t.task_id = tr.project_id
    where
    t.task_id = '${taskId}'
    and
    (
      t.client_id = '${userId}'
      or
      t.client_id = 
      (
        select 
        client_id 
        from
        public.client c
        join
        public.freelancer f
        on
        c.client_id = f.user_id
        where
        f.freelancer_id = '${userId}'
      )
    )
    ;
    `;

		try {
			let result = await db.any(SP);

			return result[0];
		} catch (error) {
			return new Error("Gagal Mengambil Task.");
		}
	}

	// Inquiry Pemilihan Freelancer
	async getRegisteredFreelancer(taskId) {
		let SP = `
    select 
    TO_CHAR(ta.deadline, 'DD Mon YYYY HH:mm') as choose_due_date,
    (
      select json_agg(t)
      from 
      (
        select 
        f.freelancer_id as id,
        c.name as name,
        c.profile_image as profile_image_url,
        f.description as description,
        f.portfolio as portfolio_url,
        f.cv as cv_url
        from
        public.freelancer f
        join
        task_enrollment te
        on
        te.freelancer_id = f.freelancer_id
        join
        public.client c 
        on
        c.client_id = f.user_id
				where
				te.task_id = '${taskId}'
        group by id, name, profile_image_url
      ) t
    ) registered_freelancer
    from 
		public.task ta
		where
		ta.task_id = '${taskId}'
    `;

		try {
			let result = await db.any(SP);

			console.log(result);

			return result[0];
		} catch (error) {
			return new Error("Gagal mengambil data.");
		}
	}

	// Delete Tugas
	async deleteTask(taskId, userId) {
		let SP = `
      delete 
      from 
      public.task
      where task_id = '${taskId}'
      and 
      (client_id = '${userId}'
      or
      client_id = 
      (
        select 
        client_id 
        from
        public.client c
        join
        public.freelancer f
        on
        c.client_id = f.user_id
        where
        f.freelancer_id = '${userId}'
      ))
      ;	
    `;

		try {
			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Menghapus Tugas.");
		}
	}

	// Inquiry Riwayat Tugas
	async getTaskHistory(userId) {
		let SP = `
    select 
    t.task_id as id,
    t.name as name,
    t.tags as tags,
    TO_CHAR(t.deadline, 'DD Mon YYYY') as due_date,
    t.difficulty as difficulty,
    t.price as price,
    tr.status as status, 
    TO_CHAR(tr.delivery_date, 'DD Mon YYYY') as delivery_date,
    CASE 
      WHEN tr.status = '1' or tr.status = '10'
      THEN (select count(*) from public.task_enrollment where task_id = t.task_id)
    END registered_freelancer_amount,
    (
      select to_json(t)
      from 
      (
        select client_id as id, name, profile_image as profile_image_url
        from 
        public.client
        where 
        client_id = t.client_id
      )t
    ) client,
    CASE
      WHEN tr.status != '1' or tr.status != '10'
      THEN tr.transaction_id 
      ELSE null
    END transaction_id, 
    CASE
      WHEN tr.status = '4' AND (select count(*) from public.review where destination_id = t.task_id) >= 1
      THEN true
      ELSE false
    END is_reviewed,
    CASE 
      WHEN tr.status = '4' AND (select count(*) from public.review where destination_id = t.task_id) >= 1
      THEN 
      (
        select to_json(t)
        from 
        (
          select count(*) as amount
          from
          public.review 
          where 
          destination_id = t.task_id
        )t
      )
      ELSE null
    END review
    from  
    public.task t
    join
    public.transaction tr
    on 
    t.task_id = tr.project_id
    where 
    t.freelancer_id = '${userId}'`;

		try {
			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal mendapatkan data.");
		}
	}

	// Inquiry Detail Riwayat Tugas
	async getTaskHistoryDetails(taskId, userId) {
		let SP = `
    select 
    t.task_id as id,
    t.name as name,
    t.tags as tags,
    TO_CHAR(t.deadline, 'DD Mon YYYY') as due_date,
    t.difficulty as difficulty,
    t.price as price,
    tr.status as status
    from
    public.task t
    join
    public.transaction tr
    on
    t.task_id = tr.project_id
    where 
    t.task_id = '${taskId}'
    and
    t.freelancer_id = '${userId}'
    `;

		try {
			let result = await db.any(SP);

			return result[0];
		} catch (error) {
			return new Error("Gagal mendapatkan data.");
		}
	}

	// Request Task Token
	async getTaskToken(taskId, freelancerId) {
		try {
			// cek apakah freelancerId dipilih sudah terdaftar
			let SPC = `
			select
			count(*)
			from 
			task_enrollment
			where
			task_id = '${taskId}'
			and
			freelancer_id = '${freelancerId}'
			`;

			let cnt = await db.any(SPC);

			console.log("FREELANCER - TASK COUNT :");
			console.log(cnt[0].count);

			if (cnt[0].count != 1) {
				return new Error("Tidak ada Pendaftaran Freelancer dan Task Tersebut.");
			}

			// get task details
			let SP1 = `
			select
				price,
				client_id,
				deadline,
				freelancer_id
			from
				public.task
			where
				task_id = '${taskId}'
			;
		`;

			let task_result = await db.any(SP1);

			// get client details
			let SP2 = `
			select
			client_id,
			name,
			email,
			phone_number
			from
			public.client
			where
			client_id = '${task_result[0].client_id}'
			;
		`;

			let client_result = await db.any(SP2);

			// ini pindah ke payment model

			let time = new Date().toLocaleString();
			console.log("Time : ");
			console.log(time);

			let price = task_result[0].price;
			let client = client_result[0];

			let paymentInstance = new Payment();
			let result = paymentInstance.createPayment(
				taskId,
				"TASK",
				price,
				client,
				freelancerId,
				time
			);

			if (result instanceof Error) {
				return new Error(result.message);
			}

			// Update di Task buat Freelancer IDnya
			let SP3 = `
				UPDATE 
				PUBLIC.TASK
				SET
				FREELANCER_ID
				=
				'${freelancerId}';
			`;

			let update_result = await db.any(SP3);

			return result;
		} catch (error) {
			return new Error("Gagal Membuat Transaksi/Token.");
		}
	}

	// Daftar Untuk Mengerjakan
	async registerForTask(taskId, freelancerId) {
		// insert task enrollment
		try {
			// console.log("TASK ID: " + taskId + " FREELANCER ID: " + freelancerId);
			let te_uuid = uuid.v4();

			let SPC = `
				select 
				count(*)
				from
				public.task_enrollment
				where
				task_id = '${taskId}'
				and
				freelancer_id = '${freelancerId}'
			`;

			console.log(SPC);

			let check_result = await db.any(SPC);

			console.log(check_result);

			if (check_result[0].count > 0) {
				return new Error("Sudah Mendaftar.");
			}

			let SP = `
				INSERT 
				INTO 
				PUBLIC.TASK_ENROLLMENT
				(
					task_enrollment_id,
					task_id,
					freelancer_id
				)
				VALUES
				(
					'${te_uuid}',
					'${taskId}',
					'${freelancerId}'
				)
			`;

			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Pendaftaran Untuk Tugas Gagal.");
		}
	}
};
