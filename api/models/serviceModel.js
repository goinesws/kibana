const express = require("express");
const db = require("../../db");
const imgur = require("../../imgur");
var multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const path = require("path");
const Requirement = require("../models/requirementModel.js");
const Payment = require("../models/paymentModel.js");
const { v4: uuidv4 } = require("uuid");

class Service {
	constructor() {}

	// Inquiry Invoice
	async getAllServiceDetail(service_id) {
		try {
			var SP = `select service_id,
      subcategory_id,
      freelancer_id,
      name,
      description,
      tags, price, working_time,
      images,
      revision_count,
      is_active,
      TO_CHAR(created_date, 'DD Mon YYYY') from service where service_id = '${service_id}'`;
			const result = await db.any(SP);
			return result[0];
		} catch (error) {
			throw new Error("Failed to fetch service");
		}
	}

	// Inquiry Invoice
	async getAdditionalData(service_id) {
		try {
			var SP = `SELECT 
          question as title
        FROM
          requirement
        JOIN
          additionalInfo ON additionalInfo.additional_info_id = requirement.additional_info_id
        WHERE
          service_id = '${service_id}'
        AND
          is_true = TRUE`;
			const result = await db.any(SP);
			return result;
		} catch (error) {
			throw new Error("Failed to fetch service");
		}
	}

	// Utilities
	async getServiceOwner(service_id) {
		try {
			var SP = `select freelancer_id from service where service_id = '${service_id}'`;
			const result = await db.any(SP);
			//console.log(result[0].freelancer_id);
			return result[0].freelancer_id;
		} catch (error) {
			throw new Error("Failed to fetch freelancer id");
		}
	}

	// Inquiry Layanan Baru
	async getNewService(category_id) {
		try {
			var SP = `SELECT service_id as id, images as image_url, service.name, service.is_active,
            jsonb_build_object('image_url', client.profile_image, 'name', client.name) as freelancer,
            COALESCE(ROUND((SELECT AVG(rating) FROM review WHERE destination_id = service.service_id), 1), 0) as average_rating,
            (SELECT COUNT(rating)
            FROM 
            review
            WHERE 
            destination_id = service.service_id) as rating_amount,
            service.tags as tags,
            service.price,
            service.working_time
            FROM service
            inner join subcategory on
                            service.subcategory_id = subcategory.subcategory_id
            inner join category on
                            subcategory.category_id = category.category_id
            inner join freelancer on
                            service.freelancer_id = freelancer.freelancer_id
            inner join client on
                            freelancer.user_id = client.client_id
            where category.category_id = '${category_id}'
            ORDER BY
            service.created_date DESC
            LIMIT 4`;
			const result = await db.any(SP);
			return result;
		} catch (error) {
			throw new Error("Failed to fetch user tasks");
		}
	}

	// Inquiry Layanan Baru
	async getNewServiceNoCat(category_id) {
		try {
			var SP = `SELECT service_id as id, images as image_url, service.name, service.is_active,
            jsonb_build_object('image_url', client.profile_image, 'name', client.name) as freelancer,
            COALESCE(ROUND((SELECT AVG(rating) FROM review WHERE destination_id = service.service_id), 1), 0) as average_rating,
            (SELECT COUNT(rating)
            FROM 
            review
            WHERE 
            destination_id = service.service_id) as rating_amount,
            service.tags as tags,
            service.price,
            service.working_time
            FROM service
            inner join freelancer on
                            service.freelancer_id = freelancer.freelancer_id
            inner join client on
                            freelancer.user_id = client.client_id
            ORDER BY
            service.created_date DESC
            LIMIT 4`;
			const result = await db.any(SP);
			return result;
		} catch (error) {
			throw new Error("Failed to fetch user tasks");
		}
	}

	// ?? dipake ato engga
	async getServiceByCategory(category_id) {
		try {
			var SP = `select service_id as id, service.name, service.description as desc, images as image_url from service
            inner join subcategory on
            subcategory.subcategory_id = service.subcategory_id
            where subcategory.category_id = '${category_id}'`;
			const result = await db.any(SP);
			return result;
		} catch (error) {
			throw new Error("Failed to fetch user tasks");
		}
	}

	// Inquiry List Layanan
	async getServiceList(body) {
		const searchText = body["search_text"];
		const subcategory = body["sub_category"];
		const budget = body["budget"];
		const workingTime = body["working_time"];

		let SP = `SELECT service_id as id, images as image_url, service.name, service.is_active,
        jsonb_build_object('profile_image_url', client.profile_image, 'name', client.name) as freelancer,
        COALESCE(ROUND((SELECT AVG(rating) FROM review WHERE destination_id = service.service_id), 1), 0) as average_rating,
        (SELECT COUNT(rating)
        FROM 
        review
        WHERE 
        destination_id = service.service_id) as rating_amount,
        service.tags as tags,
        service.price,
        service.working_time
        FROM service
        inner join subcategory on
                        service.subcategory_id = subcategory.subcategory_id
        inner join category on
                        subcategory.category_id = category.category_id
        inner join freelancer on
                        service.freelancer_id = freelancer.freelancer_id
        inner join client on
                        freelancer.user_id = client.client_id`;

		if (searchText !== "" && searchText) {
			SP += ` WHERE (service.name || service.description ILIKE '%${searchText}%'
          OR '${searchText}' ILIKE ANY (service.tags))`;
		}
		if (subcategory !== "" && subcategory) {
			if (searchText !== "") SP += ` AND`;
			else SP += ` WHERE`;
			SP += ` service.subcategory_id = '${subcategory}'`;
		}

		if (budget !== "" && budget && budget.length >= 1) {
			if (
				(searchText !== "" && searchText) ||
				(subcategory !== "" && subcategory)
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
					SP += ` price BETWEEN '${budgetStart}' AND '${budgetEnd}'`;
				} else {
					SP += ` price > '${budgetStart}'`;
				}
			});

			SP += ")";
		}

    if (workingTime !== "" && workingTime && workingTime.length >= 1) {
			if (
				(searchText !== "" && searchText) ||
				(budget!== "" && budget) ||
				(subcategory !== "" && subcategory)
			) {
				SP += ` AND `;
			} else {
				SP += ` WHERE `;
			}

			SP += "(";

			workingTime.map((curr, i) => {
				const workingTimeObject = curr;
				const workingTimeStart = workingTimeObject.working_time_start;
				const workingTimeEnd = workingTimeObject.working_time_end;

				if (i > 0) {
					SP += " OR ";
				}

				if (curr.workingTimeEnd != null || curr.workingTimeEnd != undefined) {
					SP += ` working_time BETWEEN '${workingTimeStart}' AND '${workingTimeEnd}'`;
				} else {
					SP += ` working_time > '${workingTimeStart}'`;
				}
			});

			SP += ")";
		}

		SP += ` ORDER BY service.created_date DESC`;
    let result;

    try {
      result = await db.any(SP);
    }  catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}

		return result;
	}

	// Inquiry Detail Layanan
	async getServiceDetail(service_id) {
		try {
			let result = {};
			var SP = `select service.service_id as id,
            images as image_url,
            service.name,
            service.is_active,
            service.tags,
            service.working_time,
            service.price,
            service.revision_count,
            (SELECT
              jsonb_agg(
                jsonb_build_object(
                  'title', question,
                  'is_supported', requirement.is_true
                )
              )
            FROM 
              additionalInfo
            JOIN 
              requirement on additionalInfo.additional_info_id = requirement.additional_info_id
            WHERE 
              requirement.service_id = 'S1'
            ) AS additional_info,
            service.description
            FROM service
            JOIN 
              requirement on service.service_id = requirement.service_id
            JOIN
              additionalInfo on requirement.additional_info_id = requirement.additional_info_id
            WHERE
              service.service_id = '${service_id}'
            GROUP BY 
              service.service_id`;
			let service_result = await db.any(SP);

			let SP1 = `
      select public.freelancer.freelancer_id as id, public.client.profile_image as profile_image_url, public.client.name, freelancer.description
      from 
      public.client
      join 
      public.freelancer 
      on 
      public.freelancer.user_id = public.client.client_id
      join
      service on service.freelancer_id = freelancer.freelancer_id
      where
      service.service_id = '${service_id}';
      `;

			let fl_result = await db.any(SP1);

			let SP2 = `
      SELECT 
        COALESCE(ROUND((SELECT AVG(rating) FROM review WHERE destination_id = service.service_id), 1), 0) as average_rating,
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
        ORDER BY service.created_date DESC
      `;

			let rev_result = await db.any(SP2);

			result.service_detail = service_result[0];
			result.freelancer = fl_result[0];
			result.review = rev_result[0];

			return result;
		} catch (error) {
			throw new Error("Failed to fetch user tasks");
		}
	}

	// Create Layanan
	async createNewService(images, data_incoming, clientId) {
		const serviceId = uuidv4();
		const data = JSON.parse(data_incoming);
		const name = data.name;
		const subCategory = data.sub_category;
		const workingTime = data.working_time;
		const revisionCount = data.revision_count;
		const description = data.description;
		const price = data.price;
		const tags = data.tags;
		const additionalInfo = data.additional_info;
		const freelancerId = clientId;

		//console.log(clientId);

		// console.log(tags)
		additionalInfo.forEach((item, index) => {
			Requirement.createNewRequirement(item.id, serviceId, item.is_supported);
		});

		if (
			!name ||
			!subCategory ||
			!workingTime ||
			!revisionCount ||
			!description ||
			!price ||
			!tags ||
			!additionalInfo ||
			!freelancerId
		)
			return "";

		let SP = `
    INSERT INTO service (service_id, subcategory_id, freelancer_id, name, description, tags, price, working_time, images, revision_count, is_active, created_date)
    VALUES
    ('${serviceId}', '${subCategory}', '${freelancerId}', '${name}', '${description}', ARRAY['${tags.join(
			"','"
		)}'], ${price}, ${workingTime}, ARRAY['${images.join(
			"','"
		)}'], ${revisionCount}, TRUE, CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta');
    `;

		await db.any(SP);

		return serviceId;
	}

	// Utitlities
	async addServiceImage(image) {
		var link;
		const clientId = "33df5c9de1e057a";
		var axios = require("axios");
		var data = new FormData();
		data.append("image", image[0].buffer, { filename: `test.jpg` });
		// data.append('image', fs.createReadStream('/home/flakrim/Downloads/GHJQTpX.jpeg'));

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

	// Inquiry Layanan Saya
	async getOwnedService(freelancer_id) {
		try {
			var SP = `select
      service_id as id,
      is_active,
      name,
      working_time,
      tags,
      images as image_url,
      price,
      COALESCE(ROUND((SELECT AVG(rating) FROM review WHERE destination_id = service.service_id), 1), 0) as average_rating,
      (SELECT COUNT(rating)
      FROM 
      review
      WHERE 
      destination_id = service.service_id) as rating_amount,
      (SELECT COUNT(transaction_id)
      FROM 
        transaction
      WHERE 
      transaction.project_id = service.service_id
      AND
      status = 'Dalam Proses') as in_progress_transaction_amount,
      (SELECT 
         CASE
           WHEN is_active = TRUE THEN 1
           ELSE 2
       END AS status
      )
    
    from service
    where freelancer_id = '${freelancer_id}'`;
			const result = await db.any(SP);
			return result;
		} catch (error) {
			throw new Error("Failed to fetch owned services");
		}
	}

	// Inquiry Detail Layanan Saya
	async getOwnedServiceDetail(service_id) {
		try {
			var SP = `SELECT
      service.service_id AS id,
      service.name,
      service.is_active,
      service.working_time,
      service.tags,
      service.price,
    jsonb_build_object(
      'average_rating', COALESCE(ROUND((SELECT AVG(rating) FROM review WHERE destination_id = service.service_id), 1), 0),
      'rating_amount', (SELECT COUNT(rating)
                FROM 
                review
                WHERE 
                destination_id = service.service_id),
      'review_list', (SELECT
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
                review.destination_id = service.service_id)
    ) AS review,
    (SELECT 
           CASE
             WHEN is_active = TRUE THEN 1
             ELSE 2
         END AS status
        )
  FROM service
  LEFT JOIN review on service.service_id = review.destination_id
  LEFT JOIN client on client.client_id = review.writer_id
  WHERE service.service_id = '${service_id}'
  GROUP BY service.service_id`;
			const result = await db.any(SP);
			return result;
		} catch (error) {
			throw new Error("Failed to fetch owned services detail");
		}
	}

	// Inquiry Pesanan Saya
	async getOwnedServiceOrders(service_id) {
		try {
			var SP = `SELECT 
      transaction.transaction_id as id,
      transaction.status as status,
      TO_CHAR(transaction.deadline, 'DD Mon YYYY') as due_date,
      TO_CHAR(transaction.delivery_date, 'DD Mon YYYY') as delivery_date,
      jsonb_build_object(
        'id', client.client_id,
        'name', client.name,
        'profile_image_url', client.profile_image
      ) as client,
      CASE 
        WHEN transaction.status IN ('Selesai', 'Dibatalkan') THEN
          EXISTS (
            SELECT 1
            FROM review
            WHERE review.transaction_id = transaction.transaction_id
          )
        ELSE
          NULL
      END as is_reviewed,
      CASE 
        WHEN transaction.status IN ('Selesai', 'Dibatalkan') AND
             EXISTS (
               SELECT 1
               FROM review
               WHERE review.transaction_id = transaction.transaction_id
             ) THEN
          (SELECT rating FROM review WHERE transaction_id = transaction.transaction_id)
        ELSE
          NULL
      END as review
    FROM transaction
    JOIN client ON transaction.client_id = client.client_id
    WHERE transaction.project_id = '${service_id}';`;
			const result = await db.any(SP);
			return result;
		} catch (error) {
			throw new Error("Failed to fetch owned services detail");
		}
	}

	// Non-Active Layanan
	async deactivateService(service_id) {
		try {
			var SP = `update service
      set is_active = FALSE
      where service_id = '${service_id}';`;
			const result = await db.any(SP);
			return "Successfully deactivated service";
		} catch (error) {
			throw new Error("Failed to deactivate service");
		}
	}

	// Activate Layanan
	async activateService(service_id) {
		try {
			let SPC = `
        select 
        is_active
        from 
        public.service
        where
        service_id = '${service_id}'
      `;

			let check_result = await db.any(SPC);

			console.log("Check Service Active Status : ");
			console.log(check_result);

			if (check_result[0].is_active == true) {
				return new Error("Layanan Sudah Aktif.");
			}

			let SP = `
        UPDATE
        PUBLIC.SERVICE
        SET
        is_active = true
        where
        service_id = '${service_id}'
      `;

			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Dalam Mengaktivasi Layanan.");
		}
	}

	// Delete Layanan
	async deleteService(service_id) {
		try {
			var SP = `delete from service
      where service_id = '${service_id}';`;
			const result = await db.any(SP);
			return "Successfully deleted service";
		} catch (error) {
			throw new Error("Failed to deactivate service");
		}
	}

	// Inquiry Riwayat Layanan
	async getClientServiceHistory(client_id) {
		try {
			var SP = `SELECT 
      service.service_id as id,
      service.name as name,
      service.is_active,
      service.tags,
      service.price,
      transaction.status as status,
      TO_CHAR(transaction.deadline, 'DD Mon YYYY') as due_date,
      TO_CHAR(transaction.delivery_date, 'DD Mon YYYY') as delivery_date,
      jsonb_build_object(
          'id', freelancer.freelancer_id,
          'name', client.name,
          'profile_image_url', client.profile_image
      ) as freelancer,
      COALESCE(ROUND((SELECT AVG(rating) FROM review WHERE destination_id = service.service_id), 1), 0) as average_rating,
      (SELECT COUNT(rating)
      FROM 
      review
      WHERE 
      destination_id = service.service_id) as rating_amount,
      transaction.transaction_id as transaction_id,
      CASE 
          WHEN transaction.status IN ('Selesai', 'Dibatalkan') THEN
          EXISTS (
              SELECT 1
              FROM review
              WHERE review.transaction_id = transaction.transaction_id
          )
          ELSE
          NULL
      END as is_reviewed,
      CASE 
          WHEN transaction.status IN ('Selesai', 'Dibatalkan') AND
          EXISTS (
              SELECT 1
              FROM review
              WHERE review.transaction_id = transaction.transaction_id
          ) THEN
          jsonb_build_object('amount', (SELECT rating FROM review WHERE transaction_id = transaction.transaction_id))
          ELSE
          NULL
      END as review
  FROM transaction
  JOIN service ON service.service_id = transaction.project_id
  JOIN freelancer ON service.freelancer_id = freelancer.freelancer_id
  JOIN client ON freelancer.user_id = client.client_id 
  WHERE transaction.client_id = '${client_id}';`;
			const result = await db.any(SP);
			return result;
		} catch (error) {
			throw new Error("Failed to fetch owned services detail");
		}
	}

	// Request Token Service
	async getServiceToken(service_id, client_id) {
		try {
			// get service details
			let SP1 = `
        select 
        price,
        freelancer_id
        from
        public.service
        where
        service_id = '${service_id}'
      `;

			let service_result = await db.any(SP1);

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
      client_id = '${client_id}'
      `;
			let client_result = await db.any(SP2);

			// create payment
			let time = new Date().toLocaleString();

			// get freelancer id dari hasil query service
			let freelancerId = service_result[0].freelancer_id;
			let price = service_result[0].price;
			let client = client_result[0];

			let paymentInstance = new Payment();
			let result = await paymentInstance.createPayment(
				service_id,
				"SERVICE",
				price,
				client,
				freelancerId,
				time
			);

			if (result instanceof Error) {
				return new Error(result.message);
			}

			return result;
		} catch (error) {
			return new Error("Gagal Menciptakan Token Pembayaran.");
		}
	}
}

module.exports = Service;
