const express = require("express");
const app = express();
const Freelancer = require("../models/freelancerModel.js");
const User = require("../models/userModel.js");
var multer = require("multer");
const { authorize, listFiles, uploadFile } = require("../utils/googleUtil.js");

app.getFreelancerDescription = async (req, res) => {
	let result = {};
	let userId = req.params.userId;

	result.error_schema = {};
	result.output_schema = {};

	let freelancerInstance = new Freelancer();
	let desc = await freelancerInstance.getDescription(userId);

	if (desc instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema = desc;
	}

	res.send(result);
	return;
};

app.getFreelancerEducationHistory = async (req, res) => {
	let result = {};
	let userId = req.params.userId;

	result.error_schema = {};
	result.output_schema = {};

	let freelancerInstance = new Freelancer();
	let edu = await freelancerInstance.getFreelancerEducation(userId);

	if (edu instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema.education_history = edu;
		res.send(result);
		return;
	}
};

app.getFreelancerSkill = async (req, res) => {
	let result = {};
	let userId = req.params.userId;

	result.error_schema = {};
	result.output_schema = {};

	let freelancerInstance = new Freelancer();
	let skills = await freelancerInstance.getSkill(userId);

	if (skills instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema.skills = skills;
		res.send(result);
		return;
	}
};

app.getFreelancerCV = async (req, res) => {
	let result = {};
	let userId = req.params.userId;

	result.error_schema = {};
	result.output_schema = {};

	let freelancerInstance = new Freelancer();
	let CV = await freelancerInstance.getCV(userId);

	if (CV instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema = CV;
		res.send(result);
		return;
	}
};

app.getPortfolio = async (req, res) => {
	let result = {};
	let userId = req.params.userId;

	result.error_schema = {};
	result.output_schema = {};

	let freelancerInstance = new Freelancer();
	let portfolio = await freelancerInstance.getPortfolio(userId);

	if (portfolio instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema = portfolio;
		res.send(result);
		return;
	}
};

app.getOwnedService = async (req, res) => {
	let result = {};
	let userId = req.params.userId;

	result.error_schema = {};
	result.output_schema = {};

	let freelancerInstance = new Freelancer();
	let owned_service = await freelancerInstance.getOwnedService(userId);

	if (owned_service instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		if (owned_service.length < 1) {
			owned_service = null;
		}
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema.services = owned_service;
		res.send(result);
		return;
	}
};

app.getFreelancerProjectHistory = async (req, res) => {
	let result = {};
	let userId = "";

	if (req.params.userId) {
		userId = req.params.userId;
	} else {
		let UserInstance = new User();
		let res = await UserInstance.getUserSessionData(req.get("X-Token"));

		userId = res.session_data.freelancer_id;
	}

	result.error_schema = {};
	result.output_schema = {};

	let freelancerInstance = new Freelancer();
	let projects = await freelancerInstance.getProjectHistory(userId);

	if (projects instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		if (projects.project_amount < 1) {
			projects.average_rating = 0;
			projects.project_list = null;
		} else if ((projects.project_list = {})) {
			projects.project_list = null;
		}
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema = projects;
		res.send(result);
		return;
	}
};

app.editFreelancerDescription = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (
		curr_session.session_id == x_token &&
		curr_session.session_data.is_freelancer
	) {
		let userId = curr_session.session_data.client_id;
		let description = req.body.description;
		let freelancerInstance = new Freelancer();
		let edit_result = await freelancerInstance.editDescription(
			userId,
			description
		);

		if (edit_result == null) {
			result.error_schema = {
				error_code: "903",
				error_message: "Edit tidak dapat dilakukan.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = { error_code: "200", error_message: "Sukses" };
			result.output_schema = {};

			res.send(result);
			return;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses untuk hal tersebut.",
		};
		result.output_schema = null;
		res.send(result);
		return;
	}

	res.send(result);
};

app.editFreelancerSkills = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (
		curr_session.session_id == x_token &&
		curr_session.session_data.is_freelancer
	) {
		let userId = curr_session.session_data.client_id;
		let skills = JSON.stringify(req.body.skills);
		//console.log(skills);
		skills = skills.replace("[", "{");
		skills = skills.replace("]", "}");
		let freelancerInstance = new Freelancer();
		let edit_result = await freelancerInstance.editFreelancerSkills(
			userId,
			skills
		);

		if (edit_result == null) {
			result.error_schema = {
				error_code: "903",
				error_message: "Edit tidak dapat dilakukan.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = { error_code: "200", error_message: "Sukses" };
			result.output_schema = {};
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses untuk hal tersebut.",
		};
		result.output_schema = null;
		res.send(result);
		return;
	}

	res.send(result);
};

app.editFreelancerEducation = async (req, res) => {
	console.log("MASUK KE EDIT")
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let education = req.body.education_history;

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (
		curr_session.session_id == x_token &&
		curr_session.session_data.is_freelancer
	) {
		let userId = curr_session.session_data.client_id;
		let freelancerInstance = new Freelancer();
		await freelancerInstance.removeEducation(userId);

		education.map((education) => {
			console.log(education)
			let ed_result = freelancerInstance.editFreelancerEducation(
				userId,
				education
			);

			if (ed_result == null) {
				result.error_schema = {
					error_code: "903",
					error_message: "Edit tidak dapat dilakukan.",
				};
				result.output_schema = null;

				res.send(result);
				return;
			}
		});

		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema = {};
		res.send(result);
		return;
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses untuk hal tersebut.",
		};
		result.output_schema = null;
		res.send(result);
		return;
	}
};

app.editFreelancerCV = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (
		curr_session.session_id == x_token &&
		curr_session.session_data.is_freelancer
	) {
		let userId = curr_session.session_data.client_id;
		let freelancerInstance = new Freelancer();
		const id = await authorize()
			.then((auth) => {
				if (req.files && req.files["cv"]) {
					const file = req.files["cv"][0];
					return uploadFile(auth, file);
				} else {
					console.log("No file has been uploaded");
				}
			})
			.then((resultCode) => {
				const id = resultCode;
				return id;
			})
			.catch((err) => {
				console.error("Error:", err);
			});

		let cv_result = await freelancerInstance.editFreelancerCV(userId, id);

		if (cv_result instanceof Error) {
			result.error_schema = {
				error_code: "903",
				error_message: "Edit tidak dapat dilakukan.",
			};
			result.output_schema = null;
			res.send(result);
			return;
		} else {
			result.error_schema = { error_code: "200", error_message: "Sukses" };
			result.output_schema = {};
			res.send(result);
			return;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses untuk hal tersebut.",
		};
		result.output_schema = null;
		res.send(result);
		return;
	}
};

app.editFreelancerPortfolio = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (
		curr_session.session_id == x_token &&
		curr_session.session_data.is_freelancer
	) {
		let userId = curr_session.session_data.client_id;
		let freelancerInstance = new Freelancer();
		const id = await authorize()
			.then((auth) => {
				if (req.files && req.files["portfolio"]) {
					const file = req.files["portfolio"][0];
					return uploadFile(auth, file);
				} else {
					console.log("No file has been uploaded");
				}
			})
			.then((resultCode) => {
				const id = resultCode;
				return id;
			})
			.catch((err) => {
				console.error("Error:", err);
			});

		let port_result = await freelancerInstance.editFreelancerPortfolio(
			userId,
			id
		);

		if (port_result instanceof Error) {
			result.error_schema = {
				error_code: "903",
				error_message: "Edit tidak dapat dilakukan.",
			};
			result.output_schema = null;
			res.send(result);
			return;
		} else {
			result.error_schema = { error_code: "200", error_message: "Sukses" };
			result.output_schema = {};
			res.send(result);
			return;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses untuk hal tersebut.",
		};
		result.output_schema = null;
		res.send(result);
		return;
	}
};

module.exports = app;
