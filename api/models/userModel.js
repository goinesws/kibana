const express = require("express");
const db = require("../../db");
const crypto = require("crypto");
const FormData = require("form-data");
const uuid = require("uuid");
const BankInformation = require("./bankInformationModel");

module.exports = class User {
	constructor() {}

	async setId(uuid) {
		this.id = uuid;
	}

	async login(username_email, password) {
		let SP = `
		select 
		(select 
		 case 
		 when count(*) = 1
		 then true
		 else false
		 end
		 as is_freelancer
		 from public.freelancer where user_id = 
		(select client_id from public.client where username = '${username_email}' or email = '${username_email}')),
		(select 
		 case 
		 when count(*) = 1 
		 then true 
		 else false
		 end 
		 as is_connected_bank
		 from public.bank_information where user_id = 
		(select client_id from public.client where username = '${username_email}' or email = '${username_email}')),
		profile_image as profile_image_url,
		username,
		name,
		client_id as id,
		(select freelancer_id from public.freelancer where user_id = 
		(select client_id from public.client where username = '${username_email}' or email = '${username_email}') limit 1)
		from 
		public.client
		where
		(username = '${username_email}'
		or
		email = '${username_email}')
		and 
		password = '${password}';`;

		try {
			let result = await db.any(SP);

			if (result.length < 1) {
				return new Error("Proses Login gagal");
			} else {
				return result[0];
			}
		} catch (error) {
			return new Error("Proses Login gagal");
		}
	}

	async register(email, username, name, phone, password) {
		let client_uuid = uuid.v4();

		let SP_insert = `
		insert 
		into
		public.client
		(client_id, email, password, name, phone_number, profile_image, username)
		values
		('${client_uuid}', '${email}', '${password}', '${name}', '${phone}', '', '${username}');
		`;

		try {
			let insert_result = await db.any(SP_insert);
		} catch (error) {
			return new Error("Gagal Insert.");
		}

		let SP_return = `
			select 
			profile_image as profile_image_url,
			username,
			name,
			client_id as id
			from
			public.client
			where
			username = '${username}';
		`;
		try {
			let return_result = await db.any(SP_return);

			return return_result[0];
		} catch (error) {
			return new Error("Gagal Get.");
		}
	}

	async logout() {
		let SP = `
			update 
			public.client
			set
			session_id = null,
			session_data = null
			where
			client_id = '${this.id}'
		`;

		try {
			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Mengubah Data.");
		}
	}

	async getMyProfile(clientId) {
		let SP = `
		select 
		client_id as id, 
		profile_image as profile_image_url, 
		email, 
		name, 
		username, 
		phone_number 
		from public.client 
		where client_id = '${clientId}';`;

		try {
			let result = await db.any(SP);

			return result[0];
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getBankDetails(clientId) {
		let BankInstance = new BankInformation();

		try {
			let bank_result = await BankInstance.getBankDetails(clientId);

			return bank_result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async getOtherProfile(clientId) {
		let SPGetClientDetails = `
		select 
		c.client_id as id, 
		c.profile_image as profile_image_url, 
		c.name, 
		c.username,
		CASE
			WHEN (
				select 
				count(*) 
				from public.freelancer 
				where user_id = '${clientId}' 
				or freelancer_id = '${clientId}' 
				) > 0
			THEN true
			ELSE false
		END is_freelancer
		from 
		public.client c
		join
		public.freelancer f
		on 
		f.user_id = c.client_id
    where 
		c.client_id = '${clientId}'
		or f.freelancer_id = '${clientId}';`;

		try {
			let result = await db.any(SPGetClientDetails);

			return result[0];
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	async editMyprofile(clientId, data, image_url) {
		let SP = `
		update 
		public.client
		set 
		profile_image = '${image_url}',
		email = '${data.email}',
		name = '${data.name}',
		username = '${data.username}',
		phone_number = '${data.phone_number}'
		where client_id = '${clientId}'
		`;

		// console.log(SP);

		try {
			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Edit.");
		}
	}

	async editBankDetails(clientId, body) {
		let BankInstance = new BankInformation();

		try {
			let bank_result = await BankInstance.editBankDetails(clientId, body);

			return bank_result;
		} catch (error) {
			return new Error("Gagal Mengubah Data.");
		}
	}

	async addUserImage(image) {
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

	async setUserSessionData(client_id, session_id, session_data) {
		let SP = `
			update 
			public.client
			set
			session_id = '${session_id}',
			session_data = '${session_data}'
			where
			client_id = '${client_id}'
		`;

		try {
			let result = await db.any(SP);

			return result;
		} catch (error) {
			return new Error("Gagal Mengubah Data.");
		}
	}

	async getUserSessionData(session_id) {
		let SP = `
			select
			session_id,
			session_data
			from
			public.client
			where
			session_id = '${session_id}';
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
