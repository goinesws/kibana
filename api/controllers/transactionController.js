const express = require("express");
const app = express();
const Transaction = require("../models/transactionModel.js");
const Service = require("../models/serviceModel.js");
const Task = require("../models/taskModel.js");
const User = require("../models/userModel.js");
const Payment = require("../models/paymentModel.js");
const {
	authorize,
	listFiles,
	uploadFile,
	getDownloadLink,
	getFileName,
} = require("../utils/googleUtil.js");

const errorMessages = require("../messages/errorMessages");
const BankInformation = require("../models/bankInformationModel.js");

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

			if (project_type == "SERVICE") {
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
				additional_data = null;
			}

			var fee = projectResult.price * 0.01;
			//console.log(JSON.stringify(projectResult) + "PROJECT RESULT");

			if (projectResult instanceof Error) {
				result.error_schema = {
					error_code: "903",
					error_message: errorMessages.ERROR,
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

app.getFreelancerTransactionInvoice = async (req, res) => {
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
		var bankInformationInstance = new BankInformation();
		var transactionClient = await transactionInstance.getTransactionClient(
			transaction_id
		);

		//get freelancers client id for bank information
		let freelancer_client_id = curr_session.session_data.client_id;
		var bank_detail = await bankInformationInstance.getBankDetails(freelancer_client_id);

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

			if (project_type == "SERVICE") {
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
				additional_data = null;
			}

			var fee = projectResult.price * 0.01;
			//console.log(JSON.stringify(projectResult) + "PROJECT RESULT");

			if (projectResult instanceof Error) {
				result.error_schema = {
					error_code: "903",
					error_message: errorMessages.ERROR,
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
				result.output_schema.bank_detail= bank_detail;
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
		let transaction_client = await transactionInstance.getTransactionClient(
			transaction_id
		);

		console.log(transaction_client);

		if (transaction_client.username == curr_session.session_data.username) {
			let transaction_result =
				await transactionInstance.getTransactionDetailsTaskClient(
					transaction_id
				);

			if (transaction_result instanceof Error) {
				result.error_schema = {
					error_code: "903",
					error_message: errorMessages.ERROR,
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
					error_message: errorMessages.ERROR,
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

	if (curr_session.session_id == x_token && x_token) {
		let transaction_id = req.params.transactionId;
		console.log(curr_session);
		let transactionInstance = new Transaction();
		let transaction_client = await transactionInstance.getTransactionClient(
			transaction_id
		);

		if (transaction_client.username == curr_session.session_data.username) {
			let client_id = curr_session.session_data.client_id;

			let transaction_result =
				await transactionInstance.getTransactionActivityClient(
					transaction_id,
					client_id
				);

			if (transaction_result instanceof Error) {
				console.log(transaction_result);

				result.error_schema = {
					error_code: "999",
					error_message: errorMessages.ERROR,
				};
				res.status(400).send(result);
				return;
			} else {
				await Promise.all(
					transaction_result.map(async (item) => {
						if (item.files != null) {
							item.files = item.files[0].split(",");

							await Promise.all(
								item.files.map(async (file_id, index) => {
									let auth = await authorize();

									let filename = await getFileName(auth, file_id);

									let link = await getDownloadLink(file_id);
									// create JSON
									let json = {
										download_url: link,
										file_name: filename,
									};

									item.files[index] = json;
								})
							);
						}
					})
				);
				result.error_schema = {
					error_code: "200",
					error_message: errorMessages.QUERY_SUCCESSFUL,
				};
				result.output_schema.activity = transaction_result;
				res.send(result);
				return;
			}
		} else {
			result.error_schema = {
				error_code: "403",
				error_message: errorMessages.NOT_PROJECT_OWNER,
			};
			res.status(400).send(result);
			return;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: errorMessages.NOT_LOGGED_IN,
		};
		res.status(400).send(result);
		return;
	}
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
					error_message: errorMessages.ERROR,
				};
				result.output_schema = null;
			} else {
				if (transaction_result) {
					if (transaction_result.average_rating == null) {
						transaction_result.average_rating = 0;
					}
					if (transaction_result.rating_amount == null) {
						transaction_result.rating_amount = 0;
					}
				}
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
					error_message: errorMessages.ERROR,
				};
				res.status(400).send(result);
				return;
			} else {
				result.error_schema = {
					error_code: "200",
					error_message: errorMessages.QUERY_SUCCESSFUL,
				};
				result.output_schema.transaction_detail = transaction_result;
				res.send(result);
				return;
			}
		} else {
			result.error_schema = {
				error_code: "403",
				error_message: errorMessages.NOT_PROJECT_OWNER,
			};
			res.status(400).send(result);
			return;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: errorMessages.NOT_LOGGED_IN,
		};

		res.status(400).send(result);
		return;
	}
};

app.getFreelancerTransactionActivity = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token && x_token) {
		// console.log("Current Session : ");
		// console.log(curr_session);
		let transaction_id = req.params.transactionId;

		let transactionInstance = new Transaction();
		let transaction_freelancer =
			await transactionInstance.getTransactionFreelancer(transaction_id);

		// console.log("Transaction Freelancer : ");
		// console.log(transaction_freelancer);

		if (transaction_freelancer.username == curr_session.session_data.username) {
			let freelancer_id = curr_session.session_data.freelancer_id;

			console.log("Freelancer ID : " + freelancer_id);

			let transaction_result =
				await transactionInstance.getTransactionActivityFreelancer(
					transaction_id,
					freelancer_id
				);

			if (transaction_result instanceof Error) {
				result.error_schema = {
					error_code: "999",
					error_message: errorMessages.ERROR,
				};

				res.status(400).send(result);
				return;
			} else {
				await Promise.all(
					transaction_result.map(async (item) => {
						if (item.files != null) {
							item.files = item.files[0].split(",");

							await Promise.all(
								item.files.map(async (file_id, index) => {
									let auth = await authorize();

									let filename = await getFileName(auth, file_id);

									let link = await getDownloadLink(file_id);
									// create JSON
									let json = {
										download_url: link,
										file_name: filename,
									};

									item.files[index] = json;
								})
							);
						}
					})
				);

				result.error_schema = {
					error_code: "200",
					error_message: errorMessages.QUERY_SUCCESSFUL,
				};
				result.output_schema.activity = transaction_result;

				res.send(result);
			}
		} else {
			result.error_schema = {
				error_code: "403",
				error_message: errorMessages.NOT_PROJECT_OWNER,
			};

			res.status(400).send(result);
			return;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: errorMessages.NOT_LOGGED_IN,
		};

		res.status(400).send(result);
		return;
	}
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

		data = JSON.parse(req.files["data"][0].buffer.toString());
		const transaction_id = data.transaction_id;
		const description = data.description;

		let transactionInstance = new Transaction();
		console.log(file + "CONTROLLER");
		let insert = await transactionInstance.sendRequirement(
			transaction_id,
			file,
			description,
			x_token
		);

		if (insert instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: errorMessages.ERROR,
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
		let insert = await transactionInstance.sendMessage(
			transaction_id,
			message,
			x_token
		);

		if (insert instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: errorMessages.ERROR,
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
		let data = JSON.parse(req.files["data"][0].buffer.toString());
		const transaction_id = data.transaction_id;

		let transactionInstance = new Transaction();
		let insert = await transactionInstance.sendAdditionalFile(
			transaction_id,
			file,
			x_token
		);

		if (insert instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: errorMessages.ERROR,
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
		//upload the file(s) to google docs

		let file = [];
		let auth;
		try {
			auth = await authorize();
			if (req.files && req.files["result_1"]) {
				console.log("MASUK1");
				let result = await req.files["result_1"][0];
				file.push(await uploadFile(auth, result));
				if (req.files["result_2"]) {
					result = await req.files["result_2"][0];
					file.push(await uploadFile(auth, result));
				}
				if (req.files["result_3"]) {
					result = await req.files["result_3"][0];
					file.push(await uploadFile(auth, result));
				}
			} else {
				console.log("No file has been uploaded");
			}
		} catch (err) {
			console.error("Error:", err);
			return null;
		}

		console.log(file);

		let data = JSON.parse(req.files["data"][0].buffer.toString());
		const transaction_id = data.transaction_id;
		const description = data.description;

		let transactionInstance = new Transaction();
		let insert = await transactionInstance.sendResult(
			transaction_id,
			file,
			description,
			x_token
		);

		if (insert instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: errorMessages.ERROR,
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
		let insert = await transactionInstance.askReturn(
			transaction_id,
			message,
			x_token
		);

		if (insert instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: errorMessages.ERROR,
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

app.cancelReturn = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		const transaction_id = req.body.transaction_id;

		let transactionInstance = new Transaction();
		let insert = await transactionInstance.cancelReturn(
			transaction_id,
			x_token
		);

		if (insert instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: errorMessages.ERROR,
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

app.askRevision = async (req, res) => {
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
		let insert = await transactionInstance.askRevision(
			transaction_id,
			message,
			x_token
		);

		if (insert instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: errorMessages.ERROR,
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

app.completeTransaction = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		const transaction_id = req.body.transaction_id;

		let transactionInstance = new Transaction();
		let insert = await transactionInstance.completeTransaction(
			transaction_id,
			x_token
		);

		if (insert instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: errorMessages.ERROR,
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

app.askCancellation = async (req, res) => {
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
		let insert = await transactionInstance.askCancellation(
			transaction_id,
			message,
			x_token
		);

		if (insert instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: errorMessages.ERROR,
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

app.manageCancellation = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		const transaction_id = req.body.transaction_id;
		const type = req.body.type;

		let transactionInstance = new Transaction();
		let insert = await transactionInstance.manageCancellation(
			transaction_id,
			type,
			x_token
		);

		if (insert instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: errorMessages.ERROR,
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

app.callAdmin = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		const transaction_id = req.body.transaction_id;

		let transactionInstance = new Transaction();
		let insert = await transactionInstance.callAdmin(transaction_id, x_token);

		if (insert instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: errorMessages.ERROR,
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

app.cancelCancellation = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		const transaction_id = req.body.transaction_id;

		let transactionInstance = new Transaction();
		let insert = await transactionInstance.cancelCancellation(
			transaction_id,
			x_token
		);

		if (insert instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: errorMessages.ERROR,
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

app.manageReturn = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		const transaction_id = req.body.transaction_id;
		const type = req.body.type;

		let transactionInstance = new Transaction();
		let insert = await transactionInstance.manageReturn(
			transaction_id,
			type,
			x_token
		);

		if (insert instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: errorMessages.ERROR,
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

app.sendFeedback = async (req, res) => {
	// ini buat process payment
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token && x_token) {
		let payment_id = req.params.paymentId;

		console.log("Payment ID Controller : " + payment_id);

		let transactionInstance = new Transaction();
		let trx_result = await transactionInstance.sendFeedback(payment_id);

		console.log("TRX Result : ");
		console.log(trx_result);

		if (trx_result instanceof Error) {
			result.error_schema = {
				error_code: "400",
				error_message: errorMessages.ERROR,
			};
			res.status(400).send(result);
			return;
		} else {
			result.error_schema = {
				error_code: "200",
				error_message: errorMessages.QUERY_SUCCESSFUL,
			};
			result.output_schema = trx_result;
		}

		res.send(result);
		return;
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
