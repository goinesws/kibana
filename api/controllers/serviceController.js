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

	if (Array.isArray(serviceResult) && serviceResult.length === 0) {
		result.error_schema = {
			error_code: 903,
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = {};
	} else {
		result.error_schema = { error_code: 200, error_message: "Sukses" };
		result.output_schema.services = serviceResult;
	}

	res.send(result);
};

app.getServiceByCategory = async (req, res) => {
	var result = {};
	result.error_schema = {};
	result.output_schema = { services: "" };

	const category_id = req.params.categoryId;

	const serviceInstance = new Service();
	var serviceResult = await serviceInstance.getServiceByCategory(category_id);

	if (Array.isArray(serviceResult) && serviceResult.length === 0) {
		result.error_schema = {
			error_code: 903,
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = {};
	} else {
		result.error_schema = { error_code: 200, error_message: "Sukses" };
		result.output_schema.services = serviceResult;
	}

	res.send(result);
};

app.getServiceList = async (req, res) => {
	var result = {};
	result.error_schema = {};
	result.output_schema = { services: "" };

	const serviceInstance = new Service();
	let serviceListResult = await serviceInstance.getServiceList(req.body);
	let total_amount = serviceListResult.length;
	let has_next_page = true;

	if (req.body.last_id !== "") {
		const indexOfTarget = serviceListResult.findIndex(
			(obj) => obj.id === req.body.last_id
		);
		if (indexOfTarget !== -1) {
			serviceListResult = serviceListResult.slice(
				indexOfTarget + 1,
				indexOfTarget + 13
			);
		} else {
			console.log("Object with specified id not found.");
		}
		if (total_amount - (indexOfTarget + 1) > 12) has_next_page = true;
		else has_next_page = false;
	} else {
		serviceListResult = serviceListResult.slice(0, 12);
		if (total_amount > 8) has_next_page = true;
		else has_next_page = false;
	}
	// console.log(req.body)
	// console.log(serviceListResult);

	if (serviceListResult == "" || serviceListResult == null) {
		result.error_schema = {
			error_code: 903,
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = {};
	} else {
		result.error_schema = { error_code: 200, error_message: "Sukses" };
		result.output_schema.services = serviceListResult;
		result.output_schema.total_amount = total_amount;
		result.output_schema.has_next_page = has_next_page;
		result.output_schema.last_id =
			serviceListResult[serviceListResult.length - 1].id;
	}

	res.send(result);
};

app.getServiceDetail = async (req, res) => {
	var result = {};
	result.error_schema = {};
	result.output_schema = { service_detail: "" };

	const service_id = req.params.serviceId;

	let serviceInstance = new Service();
	var serviceResult = await serviceInstance.getServiceDetail(service_id);

	let freelancerInstance = new Freelancer();
	var freelancerResult = await freelancerInstance.getFreelancerByServiceId(
		service_id
	);

	let reviewInstance = new Review();
	var reviewResult = await reviewInstance.getServiceReview(service_id);

	if (Array.isArray(serviceResult) && serviceResult.length === 0) {
		result.error_schema = {
			error_code: 903,
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = {};
	} else {
		result.error_schema = { error_code: 200, error_message: "Sukses" };
		result.output_schema.service_detail = serviceResult;
		result.output_schema.freelancer = freelancerResult;
		result.output_schema.review = reviewResult;
	}

	res.send(result);
};

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.createNewService = async (req, res) => {
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

		images = images.map((link) => link.replace(/"/g, ""));

		var freelancerId = curr_session.session_data.freelancer_id;

		//process data
		var newServiceId = await serviceInstance.createNewService(
			images,
			req.body.data,
			freelancerId
		);

		result = {};

		if (newServiceId == "") {
			result.error_schema = {
				error_code: 999,
				error_message: "Gagal membuat service baru",
			};
			result.output_schema = {};
		} else {
			result.error_schema = { error_code: 200, error_message: "Sukses." };
			result.output_schema = {};
			result.output_schema.id = newServiceId;
		}
	} else {
		result.error_schema = { error_code: 403, error_message: "Forbidden." };
		result.output_schema = null;
	}

	res.send(result);
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

		if (Array.isArray(serviceResult) && serviceResult.length === 0) {
			result.error_schema = {
				error_code: 903,
				error_message: "Tidak ada data yang ditemukan.",
			};
			result.output_schema = {};
		} else {
			result.error_schema = { error_code: 200, error_message: "Sukses" };
			result.output_schema.services = serviceResult;
		}
	} else {
		result.error_schema = { error_code: 403, error_message: "Forbidden." };
		result.output_schema = null;
	}

	res.send(result);
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

			if (Array.isArray(serviceResult) && serviceResult.length === 0) {
				result.error_schema = {
					error_code: 903,
					error_message: "Tidak ada data yang ditemukan.",
				};
				result.output_schema = {};
			} else {
				result.error_schema = { error_code: 200, error_message: "Sukses" };
				result.output_schema.service_detail = serviceResult;
			}
		} else {
			result.error_schema = {
				error_code: 403,
				error_message: "Not the owner of this service.",
			};
			result.output_schema = null;
		}
	} else {
		result.error_schema = { error_code: 403, error_message: "Forbidden." };
		result.output_schema = null;
	}

	res.send(result);
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

			if (Array.isArray(serviceResult) && serviceResult.length === 0) {
				result.error_schema = {
					error_code: 903,
					error_message: "Tidak ada data yang ditemukan.",
				};
				result.output_schema = {};
			} else {
				result.error_schema = { error_code: 200, error_message: "Sukses" };
				result.output_schema.transactions = serviceResult;
			}
		} else {
			result.error_schema = {
				error_code: 403,
				error_message: "Not the owner of this service.",
			};
			result.output_schema = null;
		}
	} else {
		result.error_schema = { error_code: 403, error_message: "Forbidden." };
		result.output_schema = null;
	}

	res.send(result);
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

			if (serviceResult == null) {
				result.error_schema = {
					error_code: 903,
					error_message: "Deactivate gagal.",
				};
				result.output_schema = {};
			} else {
				result.error_schema = { error_code: 200, error_message: "Sukses" };
				result.output_schema.transactions = serviceResult;
			}
		} else {
			result.error_schema = {
				error_code: 403,
				error_message: "Not the owner of this service.",
			};
			result.output_schema = null;
		}
	} else {
		result.error_schema = { error_code: 403, error_message: "Forbidden." };
		result.output_schema = null;
	}

	res.send(result);
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

			if (serviceResult == null) {
				result.error_schema = {
					error_code: 903,
					error_message: "Delete gagal.",
				};
				result.output_schema = {};
			} else {
				result.error_schema = { error_code: 200, error_message: "Sukses" };
				result.output_schema.transactions = serviceResult;
			}
		} else {
			result.error_schema = {
				error_code: 403,
				error_message: "Not the owner of this service.",
			};
			result.output_schema = null;
		}
	} else {
		result.error_schema = { error_code: 403, error_message: "Forbidden." };
		result.output_schema = null;
	}

	res.send(result);
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

		const client_id = userInstance.getClientID(
			curr_session.session_data.username
		);
		var serviceResult = await serviceInstance.getClientServiceHistory(
			client_id
		);

		if (Array.isArray(serviceResult) && serviceResult.length === 0) {
			result.error_schema = {
				error_code: 903,
				error_message: "Tidak ada data yang ditemukan.",
			};
			result.output_schema = {};
		} else {
			result.error_schema = { error_code: 200, error_message: "Sukses" };
			result.output_schema.service_detail = serviceResult;
		}
	} else {
		result.error_schema = { error_code: 403, error_message: "Forbidden." };
		result.output_schema = null;
	}

	res.send(result);
};

module.exports = app;
