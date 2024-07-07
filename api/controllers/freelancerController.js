const express = require("express");
const app = express();
const Freelancer = require("../models/freelancerModel.js");
const User = require("../models/userModel.js");
var multer = require("multer");
const { authorize, listFiles, uploadFile } = require("../utils/googleUtil.js");
const errorMessages = require("../messages/errorMessages.js");

app.getFreelancerDescription = async (req, res) => {
	let result = {};
	let userId = req.params.userId;

	result.error_schema = {};
	result.output_schema = {};

	let freelancerInstance = new Freelancer();
	let set_result = await freelancerInstance.setUserId(userId);
	let desc = await freelancerInstance.getDescription();

	if (desc instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: errorMessages.ERROR,
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
	let set_result = await freelancerInstance.setUserId(userId);
	let edu = await freelancerInstance.getEducation();

	if (edu instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: errorMessages.ERROR,
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		if (edu.length < 1) {
			edu = null;
		}
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
	let set_result = await freelancerInstance.setUserId(userId);
	let skills = await freelancerInstance.getSkill();

	if (skills instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: errorMessages.ERROR,
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
	let set_result = await freelancerInstance.setUserId(userId);
	let CV = await freelancerInstance.getCV();

	if (CV instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: errorMessages.ERROR,
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema.cv_url = CV;
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
	let set_result = await freelancerInstance.setUserId(userId);
	let portfolio = await freelancerInstance.getPortfolio();

	if (portfolio instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: errorMessages.ERROR,
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema.portfolio_url = portfolio;
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
	let set_result = await freelancerInstance.setUserId(userId);
	let owned_service = await freelancerInstance.getFreelancerService();

	if (owned_service instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: errorMessages.ERROR,
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		if (owned_service.length < 1) {
			owned_service = null;
		} else {
			owned_service.map((service) => {
				if (service.average_rating == null) {
					service.average_rating = 0;
				}
			});
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
	let set_result = await freelancerInstance.setUserId(userId);
	let projects = await freelancerInstance.getProjectHistory();

	if (projects instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: errorMessages.ERROR,
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		if (projects.project_amount < 1) {
			projects.average_rating = 0;
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
		let set_result = await freelancerInstance.setUserId(userId);
		let edit_result = await freelancerInstance.editDescription(description);

		if (edit_result == null) {
			result.error_schema = {
				error_code: "903",
				error_message: errorMessages.ERROR,
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
		res.status(400).send(result);
		return;
	}
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
		let set_result = await freelancerInstance.setUserId(userId);
		let edit_result = await freelancerInstance.editSkill(skills);

		if (edit_result == null) {
			result.error_schema = {
				error_code: "903",
				error_message: errorMessages.ERROR,
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
		res.status(400).send(result);
		return;
	}
};

app.editFreelancerEducation = async (req, res) => {
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
		let set_result = await freelancerInstance.setUserId(userId);
		await freelancerInstance.removeEducation();

		await Promise.all(
			education.map(async (education) => {
				let ed_result = await freelancerInstance.editEducation(education);

				if (ed_result == null) {
					result.error_schema = {
						error_code: "903",
						error_message: errorMessages.ERROR,
					};
					result.output_schema = null;

					res.status(400).send(result);
					return;
				}
			})
		);

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
		res.status(400).send(result);
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
		let set_result = await freelancerInstance.setUserId(userId);
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

		let cv_result = await freelancerInstance.editCV(id);

		if (cv_result instanceof Error) {
			result.error_schema = {
				error_code: "903",
				error_message: errorMessages.ERROR,
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
		res.status(400).send(result);
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
		let set_result = await freelancerInstance.setUserId(userId);
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

		let port_result = await freelancerInstance.editPortfolio(id);

		if (port_result instanceof Error) {
			result.error_schema = {
				error_code: "903",
				error_message: errorMessages.ERROR,
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
		res.status(400).send(result);
		return;
	}
};

app.register = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let userInstance = new User();
	let curr_session = await userInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		// get file cv
		let cv_id = "";
		if (req.files["cv"]) {
			cv_id = await authorize()
				.then((auth) => {
					if (req.files && req.files["cv"]) {
						const file = req.files["cv"][0];
						return uploadFile(auth, file);
					} else {
						//console.log("No file has been uploaded");
					}
				})
				.then((resultCode) => {
					const cv_id = resultCode;
					return cv_id;
				})
				.catch((err) => {
					console.error("Error:", err);
				});
		}

		// get portfolio
		let port_id = "";
		if (req.files["portfolio"]) {
			port_id = await authorize()
				.then((auth) => {
					if (req.files && req.files["portfolio"]) {
						const file = req.files["portfolio"][0];
						return uploadFile(auth, file);
					} else {
						//console.log("No file has been uploaded");
					}
				})
				.then((resultCode) => {
					const port_id = resultCode;
					return port_id;
				})
				.catch((err) => {
					console.error("Error:", err);
				});
		}

		let data = "";
		if (req.files["data"]) {
			data = JSON.parse(req.files["data"][0].buffer.toString());
		} else {
			result.error_schema = { error_code: "999", error_message: "Gagal." };
			result.output_schema = null;
			res.status(400).send(result);
			return;
		}

		const userID = curr_session.session_data.client_id;

		let freelancerInstance = new Freelancer();
		let set_result = await freelancerInstance.setUserId(userID);
		let reg_result = await freelancerInstance.register(data, cv_id, port_id);

		if (reg_result instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: "Registrasi Gagal.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			// set session data terbaru
			let session_data = JSON.stringify({
				client_id: curr_session.session_data.client_id,
				is_freelancer: true,
				freelancer_id: reg_result,
				username: curr_session.session_data.username,
			});

			console.log("Updated Session Data : ");
			console.log(session_data);

			let write_session_result = await userInstance.setUserSessionData(
				curr_session.session_data.client_id,
				x_token,
				session_data
			);

			if (write_session_result instanceof Error) {
				result.error_schema = {
					error_code: "903",
					error_message: errorMessages.ERROR,
				};
				result.output_schema = null;

				res.status(400).send(result);
				return;
			}

			result.error_schema = {
				error_code: "200",
				error_message: "Sukses.",
			};
			result.output_schema = {};
		}

		res.send(result);
		return;
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda tidak memiliki hak untuk melakukan hal tersebut.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}
};

module.exports = app;
