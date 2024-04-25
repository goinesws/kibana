const express = require("express");
const app = express();
const Service = require("../models/serviceModel.js");
const Freelancer = require("../models/freelancerModel.js");
const User = require("../models/userModel.js");
const Review = require("../models/reviewModel.js");
const Subcategory = require("../models/subcategoryModel.js");
var bodyParser = require("body-parser");
var multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const path = require("path");
const errorMessages = require("../messages/errorMessages.js");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.getNewService = async (req, res) => {
	var result = {};
	result.error_schema = {};
	result.output_schema = { services: "" };

	const category_id = req.params.categoryId;

	const serviceInstance = new Service();
	var serviceResult;
	if (category_id)
		serviceResult = await serviceInstance.getNewService(category_id);
	else serviceResult = await serviceInstance.getNewServiceNoCat();

	if (serviceResult instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: errorMessages.ERROR,
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema.services = serviceResult;
		res.send(result);
		return;
	}
};

app.getServiceByCategory = async (req, res) => {
	var result = {};
	result.error_schema = {};
	result.output_schema = { services: "" };

	const category_id = req.params.categoryId;

	const serviceInstance = new Service();
	var serviceResult = await serviceInstance.getServiceByCategory(category_id);

	if (serviceResult instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: errorMessages.ERROR,
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema.services = serviceResult;

		res.send(result);
		return;
	}
};

app.getServiceList = async (req, res) => {
	var result = {};
	result.error_schema = {};
	result.output_schema = { services: "" };

	const serviceInstance = new Service();
	let serviceListResult = await serviceInstance.getServiceList(req.body);
	console.log(serviceListResult);
	let total_amount = serviceListResult.length;
	let has_next_page = true;

	if (req.body.last_id !== "" && req.body.last_id) {
		console.log("1 MASUK SINI");
		console.log(req.body);
		if (serviceListResult && serviceListResult.length >= 1) {
			const indexOfTarget = serviceListResult.findIndex(
				(obj) => obj.id == req.body.last_id
			);
			if (indexOfTarget !== -1) {
				serviceListResult = serviceListResult.slice(
					indexOfTarget + 1,
					indexOfTarget + 13
				);
			} else {
				//console.log("Object with specified id not found.");
			}
			if (total_amount - (indexOfTarget + 1) > 12) has_next_page = true;
			else has_next_page = false;
		}
	} else {
		console.log("2 MASUK SINI");
		console.log(serviceListResult);
		serviceListResult = serviceListResult.slice(0, 12);
		if (total_amount > 8) has_next_page = true;
		else has_next_page = false;
	}
	// console.log(req.body)
	// console.log(serviceListResult);

	if (serviceListResult instanceof Error) {
		console.log(Error);
		result.error_schema = {
			error_code: "903",
			error_message: errorMessages.ERROR,
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		if (serviceListResult.length < 1) {
			result.error_schema = { error_code: "200", error_message: "Sukses" };
			result.output_schema.services = serviceListResult;
			result.output_schema.total_amount = total_amount;
			result.output_schema.has_next_page = false;
			result.output_schema.last_id = null;
		} else {
			result.error_schema = { error_code: "200", error_message: "Sukses" };
			result.output_schema.services = serviceListResult;
			result.output_schema.total_amount = total_amount;
			result.output_schema.has_next_page = has_next_page;
			result.output_schema.last_id =
				serviceListResult[serviceListResult.length - 1].id;
		}
	}

	res.send(result);
	return;
};

app.getServiceDetail = async (req, res) => {
	var result = {};
	result.error_schema = {};
	result.output_schema = { service_detail: "" };

	const service_id = req.params.serviceId;

	let serviceInstance = new Service();
	var serviceResult = await serviceInstance.getServiceDetail(service_id);

	if (serviceResult instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: errorMessages.ERROR,
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema = serviceResult;
	}

	res.send(result);
	return;
};

app.createNewService = async (req, res) => {
	console.log("TAPI MASUK KAN");
	var serviceInstance = new Service();
	let result = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		var images = [];

		images.push(await serviceInstance.addServiceImage(req.files["image_1"]));
		if (req.files["image_2"])
			images.push(await serviceInstance.addServiceImage(req.files["image_2"]));
		if (req.files["image_3"])
			images.push(await serviceInstance.addServiceImage(req.files["image_3"]));
		if (req.files["image_4"])
			images.push(await serviceInstance.addServiceImage(req.files["image_4"]));
		if (req.files["image_5"])
			images.push(await serviceInstance.addServiceImage(req.files["image_5"]));

		console.log(images + "IMAGES on CONTROLLER");
		let data = JSON.parse(req.files["data"][0].buffer.toString());
		images = images.map((link) => link.replace(/"/g, ""));

		var freelancerId = curr_session.session_data.freelancer_id;

		//process data
		var newServiceId = await serviceInstance.createNewService(
			images,
			data,
			freelancerId
		);

		result = {};

		if (newServiceId instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: newServiceId.message,
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = { error_code: "200", error_message: "Sukses." };
			result.output_schema = {};
			result.output_schema.id = newServiceId;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}

	res.send(result);
	return;
};

app.getOwnedService = async (req, res) => {
	let result = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		result.error_schema = {};
		result.output_schema = { services: "" };

		const freelancer_id = curr_session.session_data.freelancer_id;

		var serviceInstance = new Service();
		var serviceResult = await serviceInstance.getOwnedService(freelancer_id);

		if (serviceResult instanceof Error) {
			result.error_schema = {
				error_code: "903",
				error_message: errorMessages.ERROR,
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = { error_code: "200", error_message: "Sukses" };
			result.output_schema.services = serviceResult;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}

	res.send(result);
	return;
};

app.getOwnedServiceDetail = async (req, res) => {
	let result = {};

	//check service ini bnrn punya dia apa engga

	// console.log(req.get('X-Token') + "token")
	// console.log(req.session.id + "sess id")

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		result.error_schema = {};
		result.output_schema = { service_detail: "" };

		const freelancer_id = curr_session.session_data.freelancer_id;
		const service_id = req.params.serviceId;

		var serviceInstance = new Service();
		var serviceOwner = await serviceInstance.getServiceOwner(service_id);

		if (serviceOwner == freelancer_id) {
			var serviceResult = await serviceInstance.getOwnedServiceDetail(
				service_id
			);

			if (serviceResult instanceof Error) {
				result.error_schema = {
					error_code: "903",
					error_message: errorMessages.ERROR,
				};
				result.output_schema = null;

				res.status(400).send(result);
				return;
			} else {
				result.error_schema = { error_code: "200", error_message: "Sukses" };
				result.output_schema.service_detail = serviceResult;
				result.output_schema.review = serviceResult.review;

				delete serviceResult["review"];

				res.send(result);
				return;
			}
		} else {
			result.error_schema = {
				error_code: "403",
				error_message: "Not the owner of this service.",
			};
			result.output_schema = {};

			res.status(400).send(result);
			return;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}
};

app.getOwnedServiceOrders = async (req, res) => {
	let result = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		result.error_schema = {};
		result.output_schema = { transactions: "" };

		const freelancer_id = curr_session.session_data.freelancer_id;
		const service_id = req.params.serviceId;

		var serviceInstance = new Service();
		var serviceOwner = await serviceInstance.getServiceOwner(service_id);

		if (serviceOwner == freelancer_id) {
			var serviceResult = await serviceInstance.getOwnedServiceOrders(
				service_id
			);

			if (serviceResult instanceof Error) {
				result.error_schema = {
					error_code: "903",
					error_message: errorMessages.ERROR,
				};
				result.output_schema = null;

				res.status(400).send(result);
				return;
			} else {
				result.error_schema = { error_code: "200", error_message: "Sukses" };
				result.output_schema.transactions = serviceResult;
			}
		} else {
			result.error_schema = {
				error_code: "403",
				error_message: "Not the owner of this service.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}

	res.send(result);
	return;
};

app.deactivateService = async (req, res) => {
	let result = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		result.error_schema = {};
		result.output_schema = { transactions: "" };

		const freelancer_id = curr_session.session_data.freelancer_id;
		const service_id = req.params.serviceId;

		var serviceInstance = new Service();
		var serviceOwner = await serviceInstance.getServiceOwner(service_id);

		if (serviceOwner == freelancer_id) {
			var serviceResult = await serviceInstance.deactivateService(service_id);

			if (serviceResult instanceof Error) {
				result.error_schema = {
					error_code: "903",
					error_message: errorMessages.ERROR,
				};
				result.output_schema = null;

				res.status(400).send(result);
				return;
			} else {
				result.error_schema = { error_code: "200", error_message: "Sukses" };
				result.output_schema.transactions = serviceResult;

				res.send(result);
				return;
			}
		} else {
			result.error_schema = {
				error_code: "403",
				error_message: "Not the owner of this service.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}
};

app.deleteService = async (req, res) => {
	let result = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		result.error_schema = {};
		result.output_schema = { transactions: "" };

		const freelancer_id = curr_session.session_data.freelancer_id;
		const service_id = req.params.serviceId;

		var serviceInstance = new Service();
		var serviceOwner = await serviceInstance.getServiceOwner(service_id);

		if (serviceOwner == freelancer_id) {
			var serviceResult = await serviceInstance.deleteService(service_id);

			if (serviceResult instanceof Error) {
				result.error_schema = {
					error_code: "903",
					error_message: errorMessages.ERROR,
				};
				result.output_schema = null;

				res.status(400).send(result);
				return;
			} else {
				result.error_schema = { error_code: "200", error_message: "Sukses" };
				result.output_schema.transactions = serviceResult;

				res.send(result);
				return;
			}
		} else {
			result.error_schema = {
				error_code: "403",
				error_message: "Not the owner of this service.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}
};

//from client
app.getServiceHistory = async (req, res) => {
	let result = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		result.error_schema = {};
		result.output_schema = { service_detail: "" };
		var serviceInstance = new Service();
		var userInstance = new User();

		const client_id = curr_session.session_data.client_id;
		var serviceResult = await serviceInstance.getClientServiceHistory(
			client_id
		);

		if (serviceResult instanceof Error) {
			result.error_schema = {
				error_code: "903",
				error_message: errorMessages.ERROR,
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = { error_code: "200", error_message: "Sukses" };
			result.output_schema.services = serviceResult;

			res.send(result);
			return;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda Tidak Memiliki Hak Akses.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}
};

app.activateService = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let userInstance = new User();
	let curr_session = await userInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token && x_token) {
		if (curr_session.session_data.is_freelancer == false) {
			result.error_schema.error_code = 400;
			result.error_schema.error_message = errorMessages.ERROR;
			res.status(400).send(result);
			return;
		}

		let serviceId = req.params.serviceId;

		let serviceInstance = new Service();
		let service_result = await serviceInstance.activateService(serviceId);

		if (service_result instanceof Error) {
			result.error_schema.error_code = "400";
			result.error_schema.error_message = errorMessages.ERROR;
			res.status(400).send(result);
			return;
		} else {
			result.error_schema.error_code = "200";
			result.error_schema.error_message = errorMessages.QUERY_SUCCESSFUL;
			res.send(result);
			return;
		}
	} else {
		result.error_schema = {
			error_code: "400",
			error_message: errorMessages.NOT_LOGGED_IN,
		};

		res.status(400).send(result);
		return;
	}
};

app.getRequestToken = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let userInstance = new User();
	let curr_session = await userInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token && x_token) {
		let serviceId = req.params.serviceId;
		let client_id = curr_session.session_data.client_id;

		let serviceInstance = new Service();
		let service_result = await serviceInstance.getServiceToken(
			serviceId,
			client_id
		);

		if (service_result instanceof Error) {
			result.error_schema = {
				error_code: 999,
				error_message: service_result.message,
			};

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = {
				error_code: 200,
				error_message: errorMessages.QUERY_SUCCESSFUL,
			};
			result.output_schema = service_result;

			res.send(result);
			return;
		}
	} else {
		result.error_schema = {
			error_code: "400",
			error_message: errorMessages.NOT_LOGGED_IN,
		};

		res.status(400).send(result);
		return;
	}
};

module.exports = app;
