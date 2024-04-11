const express = require("express");
const app = express();
const Transaction = require("../models/transactionModel.js");
const Service = require("../models/serviceModel.js");
const Task = require("../models/taskModel.js");
const User = require("../models/userModel.js");
const { authorize, listFiles, uploadFile } = require("../utils/googleUtil.js");

const errorMessages = require("../messages/errorMessages");

app.getTransactionInvoice = async (req, res) => {
	let result = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		const transaction_id = req.params.transactionId;

		result.error_schema = {};
		result.output_schema = {};
		result.output_schema.project = {};
		result.output_schema.fee = {};

		// console.log(JSON.stringify(result))
		var transactionInstance = new Transaction();
		var serviceInstance = new Service();
		var taskInstance = new Task();
		var transactionClient = await transactionInstance.getTransactionClient(
			transaction_id
		);
		var transactionFreelancer =
			await transactionInstance.getTransactionFreelancer(transaction_id);

		if (
			transactionClient.username == curr_session.session_data.username ||
			transactionFreelancer.username == curr_session.session_data.username
		) {
			var projectResult;
			var transactionDetail = await transactionInstance.getAllTransactionDetail(
				transaction_id
			);
			// console.log(JSON.stringify(transactionDetail) + "transactionDetail")
			var additional_data = "";
			var project_type = await transactionDetail.project_type;

			if (project_type == "Service") {
				projectResult = await serviceInstance.getAllServiceDetail(
					transactionDetail.project_id
				);
				// console.log(JSON.stringify(projectResult) + "PROJECT RESULT")
				additional_data = await serviceInstance.getAdditionalData(
					transactionDetail.project_id
				);
				result.output_schema.project.duration = projectResult.working_time;
				result.output_schema.project.revision_count =
					projectResult.revision_count;
				result.output_schema.project.additional_data = additional_data;
			} else {
				projectResult = await taskInstance.getAllTaskDetail(
					transactionDetail.project_id
				);
			}

			var fee = projectResult.price * 0.01;
			//console.log(JSON.stringify(projectResult) + "PROJECT RESULT");

			if (projectResult == null) {
				result.error_schema = {
					error_code: "903",
					error_message: errorMessages.DATA_NOT_FOUND,
				};
				result.output_schema = null;
			} else {
				result.error_schema = {
					error_code: "200",
					error_message: errorMessages.QUERY_SUCCESSFUL,
				};
				result.output_schema.ref_no = transaction_id;
				result.output_schema.client_name = transactionClient.name;
				result.output_schema.freelancer_name = transactionFreelancer.name;
				result.output_schema.payment_date = transactionDetail.payment_date;
				result.output_schema.project.name = projectResult.name;
				result.output_schema.project.price = projectResult.price;
				result.output_schema.fee.amount = fee;
				result.output_schema.fee.percentage = 1;
				result.output_schema.total_price =
					parseFloat(projectResult.price) + parseFloat(fee);
				result.output_schema.project.additional_data = additional_data;
			}
		} else {
			result.error_schema = {
				error_code: "403",
				error_message: errorMessages.NOT_PROJECT_OWNER,
			};
			result.output_schema = null;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: errorMessages.NOT_LOGGED_IN,
		};
		result.output_schema = null;
	}
	res.send(result);
};

app.getTransactionDetailsClientTask = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		let transaction_id = req.params.transactionId;

		let transactionInstance = new Transaction();

		// get client dari transaction tersebut
		let transaction_client = await transactionInstance.getTransactionFreelancer(
			transaction_id
		);

		if (transaction_client.username == curr_session.session_data.username) {
			let transaction_result =
				await transactionInstance.getTransactionDetailsTaskClient(
					transaction_id
				);

			if (transaction_result instanceof Error) {
				result.error_schema = {
					error_code: "403",
					error_message: errorMessages.DATA_NOT_FOUND,
				};
				result.output_schema = null;
			} else {
				result.error_schema = {
					error_code: "200",
					error_message: errorMessages.QUERY_SUCCESSFUL,
				};
				result.output_schema.transaction_detail = transaction_result;
			}
		} else {
			result.error_schema = {
				error_code: "403",
				error_message: errorMessages.NOT_PROJECT_OWNER,
			};
			result.output_schema = null;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: errorMessages.NOT_LOGGED_IN,
		};
		result.output_schema = null;
	}

	res.send(result);
};

app.getTransactionDetailsFreelancerTask = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		let transaction_id = req.params.transactionId;

		let transactionInstance = new Transaction();

		// get freelancer dari transaction tersebut
		let transaction_freelancer =
			await transactionInstance.getTransactionFreelancer(transaction_id);

		if (transaction_freelancer.username == curr_session.session_data.username) {
			let transaction_result =
				await transactionInstance.getTransactionDetailsTaskFreelancer(
					transaction_id
				);

			if (transaction_result instanceof Error) {
				result.error_schema = {
					error_code: "999",
					error_message: errorMessages.DATA_NOT_FOUND,
				};
				result.output_schema = null;
			} else {
				result.error_schema = {
					error_code: "200",
					error_message: errorMessages.QUERY_SUCCESSFUL,
				};
				result.output_schema.transaction_detail = transaction_result;
			}
		} else {
			result.error_schema = {
				error_code: "403",
				error_message: errorMessages.NOT_PROJECT_OWNER,
			};
			result.output_schema = null;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: errorMessages.NOT_LOGGED_IN,
		};
		result.output_schema = null;
	}

	res.send(result);
};

app.getClientTransactionActivity = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		let transaction_id = req.params.transactionId;
		console.log(curr_session+"1")
		let transactionInstance = new Transaction();
		let transaction_client = await transactionInstance.getTransactionClient(
			transaction_id
		);

		console.log(curr_session+"2")
		if (transaction_client.username == curr_session.session_data.username) {
			let transaction_result =
				await transactionInstance.getTransactionActivityClient(transaction_id);

			if (transaction_result instanceof Error) {
				result.error_schema = {
					error_code: "999",
					error_message: errorMessages.DATA_NOT_FOUND,
				};
				result.output_schema = null;
			} else {
				result.error_schema = {
					error_code: "200",
					error_message: errorMessages.QUERY_SUCCESSFUL,
				};
				result.output_schema.activity = transaction_result;
			}
		} else {
			result.error_schema = {
				error_code: "403",
				error_message: errorMessages.NOT_PROJECT_OWNER,
			};
			result.output_schema = null;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: errorMessages.NOT_LOGGED_IN,
		};
		result.output_schema = null;
	}

	res.send(result);
};

app.getTransactionDetailsClientService = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		let transaction_id = req.params.transactionId;

		let transactionInstance = new Transaction();
		let transaction_client = await transactionInstance.getTransactionClient(
			transaction_id
		);

		if (transaction_client.username == curr_session.session_data.username) {
			let transaction_result =
				await transactionInstance.getTransactionDetailsServiceClient(
					transaction_id
				);

			if (transaction_result instanceof Error) {
				result.error_schema = {
					error_code: "999",
					error_message: errorMessages.DATA_NOT_FOUND,
				};
				result.output_schema = null;
			} else {
				result.error_schema = {
					error_code: "200",
					error_message: errorMessages.QUERY_SUCCESSFUL,
				};
				result.output_schema.transaction_detail = transaction_result;
			}
		} else {
			result.error_schema = {
				error_code: "403",
				error_message: errorMessages.NOT_PROJECT_OWNER,
			};
			result.output_schema = null;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: errorMessages.NOT_LOGGED_IN,
		};
		result.output_schema = null;
	}

	res.send(result);
};

app.getTransactionDetailsFreelancerService = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		let transaction_id = req.params.transactionId;

		let transactionInstance = new Transaction();

		let transaction_freelancer =
			await transactionInstance.getTransactionFreelancer(transaction_id);

		// console.log(transaction_freelancer);

		if (curr_session.session_data.username == transaction_freelancer.username) {
			let transaction_result =
				await transactionInstance.getTransactionDetailsServiceFreelancer(
					transaction_id
				);

			if (transaction_result instanceof Error) {
				result.error_schema = {
					error_code: "999",
					error_message: errorMessages.DATA_NOT_FOUND,
				};
				result.output_schema = null;
			} else {
				result.error_schema = {
					error_code: "200",
					error_message: errorMessages.QUERY_SUCCESSFUL,
				};
				result.output_schema.transaction_detail = transaction_result;
			}
		} else {
			result.error_schema = {
				error_code: "403",
				error_message: errorMessages.NOT_PROJECT_OWNER,
			};
			result.output_schema = null;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: errorMessages.NOT_LOGGED_IN,
		};
		result.output_schema = null;
	}

	res.send(result);
};

app.getFreelancerTransactionActivity = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		let transaction_id = req.params.transactionId;

		let transactionInstance = new Transaction();
		let transaction_client = await transactionInstance.getTransactionClient(
			transaction_id
		);

		if (transaction_client.username == curr_session.session_data.username) {
			let transaction_result =
				await transactionInstance.getTransactionActivityClient(transaction_id);

			if (transaction_result instanceof Error) {
				result.error_schema = {
					error_code: "999",
					error_message: errorMessages.INSERT_ERROR,
				};
				result.output_schema = null;
			} else {
				result.error_schema = {
					error_code: "200",
					error_message: errorMessages.QUERY_SUCCESSFUL,
				};
				result.output_schema.activity = transaction_result;
			}
		} else {
			result.error_schema = {
				error_code: "403",
				error_message: errorMessages.NOT_PROJECT_OWNER,
			};
			result.output_schema = null;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: errorMessages.NOT_LOGGED_IN,
		};
		result.output_schema = null;
	}

	res.send(result);
};

app.sendRequirement = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		//upload the file to google docs
		const file = await authorize()
			.then((auth) => {
				if (req.files && req.files["supporting_file"]) {
					const file = req.files["supporting_file"][0];
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
				return null;
			});
		let data = JSON.parse(req.body.data);
		const transaction_id = data.transaction_id;
		const description = data.description;

		let transactionInstance = new Transaction();
		console.log(file + "CONTROLLER")
		let insert = await transactionInstance.sendRequirement(transaction_id, file, description, x_token);

			if (insert instanceof Error) {
				result.error_schema = {
					error_code: "999",
					error_message: errorMessages.INSERT_ERROR,
				};
			} else {
				result.error_schema = {
					error_code: "200",
					error_message: errorMessages.QUERY_SUCCESSFUL,
				};
			}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: errorMessages.NOT_LOGGED_IN,
		};  
		result.output_schema = null;
	}

	res.send(result);
};

app.sendMessage = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		const transaction_id = req.body.transaction_id;
		const message = req.body.message;

		let transactionInstance = new Transaction();
		let insert = await transactionInstance.sendMessage(transaction_id, message, x_token);

			if (insert instanceof Error) {
				result.error_schema = {
					error_code: "999",
					error_message: errorMessages.INSERT_ERROR,
				};
			} else {
				result.error_schema = {
					error_code: "200",
					error_message: errorMessages.QUERY_SUCCESSFUL,
				};
			}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: errorMessages.NOT_LOGGED_IN,
		};  
		result.output_schema = null;
	}

	res.send(result);
};

app.sendAdditionalFile = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		//upload the file to google docs
		const file = await authorize()
			.then((auth) => {
				if (req.files && req.files["additional_file"]) {
					const file = req.files["additional_file"][0];
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
				return null;
			});
			console.log(req.body);
		let data = JSON.parse(req.body.data);
		const transaction_id = data.transaction_id;

		let transactionInstance = new Transaction();
		let insert = await transactionInstance.sendAdditionalFile(transaction_id, file, x_token);

			if (insert instanceof Error) {
				result.error_schema = {
					error_code: "999",
					error_message: errorMessages.DATA_NOT_FOUND,
				};
			} else {
				result.error_schema = {
					error_code: "200",
					error_message: errorMessages.QUERY_SUCCESSFUL,
				};
			}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: errorMessages.NOT_LOGGED_IN,
		};  
		result.output_schema = null;
	}

	res.send(result);
};

app.sendResult = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		//upload the file to google docs
		const file = await authorize()
			.then((auth) => {
				if (req.files && req.files["additional_file"]) {
					const file = req.files["additional_file"][0];
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
				return null;
			});
			console.log(req.body);
		let data = JSON.parse(req.body.data);
		const transaction_id = data.transaction_id;

		let transactionInstance = new Transaction();
		let insert = await transactionInstance.sendAdditionalFile(transaction_id, file, x_token);

			if (insert instanceof Error) {
				result.error_schema = {
					error_code: "999",
					error_message: errorMessages.DATA_NOT_FOUND,
				};
			} else {
				result.error_schema = {
					error_code: "200",
					error_message: errorMessages.QUERY_SUCCESSFUL,
				};
			}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: errorMessages.NOT_LOGGED_IN,
		};  
		result.output_schema = null;
	}

	res.send(result);
};

app.askReturn = async (req, res) => {
	res.send("Good");
};

app.cancelReturn = async (req, res) => {
	res.send("Good");
};

app.askRevision = async (req, res) => {
	res.send("Good");
};

app.completeTransaction = async (req, res) => {
	res.send("Good");
};

app.manageCancellation = async (req, res) => {
	res.send("Good");
};

app.callAdmin = async (req, res) => {
	res.send("Good");
};

app.askCancellation = async (req, res) => {
	res.send("Good");
};

app.cancelCancellation = async (req, res) => {
	res.send("Good");
};

app.manageReturn = async (req, res) => {
	res.send("Good");
};

app.sendFeedback = async (req, res) => {
	res.send("Good");
};

module.exports = app;
