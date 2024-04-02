const express = require("express");
const app = express();
const Task = require("../models/taskModel.js");
const User = require("../models/userModel.js");

app.getNewTask = async (req, res) => {
	//console.log(req.params);

	var result = {};
	result.error_schema = {};
	result.output_schema = { tasks: "" };

	const taskInstance = new Task();
	let task_result = await taskInstance.getNewTask();

	// console.log(taskResult);
	if (task_result instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = null;
		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema.tasks = task_result;
	}

	res.send(result);
	return;
};

app.getNewTaskByCategory = async (req, res) => {
	//console.log(req.params);

	var result = {};
	result.error_schema = {};
	result.output_schema = { tasks: "" };

	const taskInstance = new Task();
	let taskResult = await taskInstance.getNewTaskByCategory(
		req.params.categoryId
	);

	// console.log(taskResult);

	if (taskResult == null) {
		result.error_schema = {
			error_code: "903",
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = null;
		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema.tasks = taskResult;
	}

	res.send(result);
	return;
};

app.getTaskDetails = async (req, res) => {
	var result = {};

	result.error_schema = {};
	result.output_schema = {};

	const taskInstance = new Task();
	let taskDetailResult = await taskInstance.getTaskDetails(req.params.taskId);

	// console.log(taskDetailResult);

	if (taskDetailResult == null) {
		result.error_schema = {
			error_code: "903",
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = null;
		res.status(400).send(result);
		return;
	} else {
		result.error_schema = { error_code: "200", error_message: "Sukses" };
		result.output_schema = taskDetailResult;
	}

	res.send(result);
	return;
};

app.getTaskList = async (req, res) => {
	var result = {};

	result.error_schema = {};
	result.output_schema = {};

	const taskInstance = new Task();
	let taskListResult = await taskInstance.getTaskList(req.body);
	let total_amount = taskListResult.length;
	let has_next_page = true;

	// console.log("Task List Result : " + taskListResult);

	if (taskListResult instanceof Error) {
		result.error_schema = {
			error_code: "903",
			error_message: "Tidak ada data yang ditemukan.",
		};
		result.output_schema = null;
		res.status(400).send(result);
		return;
	} else {
		if (req.body.last_id !== "" && req.body.last_id) {
			const indexOfTarget = taskListResult.findIndex(
				(obj) => obj.id == req.body.last_id
			);
			if (indexOfTarget !== -1) {
				taskListResult = taskListResult.slice(
					indexOfTarget + 1,
					indexOfTarget + 9
				);
			} else {
				console.log("Object with specified id not found.");
			}
			// console.log("Curr Index : " + indexOfTarget);
			if (total_amount - (indexOfTarget + 1) > 8) has_next_page = true;
			else has_next_page = false;
		} else {
			taskListResult = taskListResult.slice(0, 8);
			if (total_amount > 8) has_next_page = true;
			else has_next_page = false;
		}

		if (taskListResult == "" || taskListResult == null) {
			result.error_schema = {
				error_code: "903",
				error_message: "Tidak ada data yang ditemukan.",
			};
			result.output_schema = null;
			res.status(400).send(result);
			return;
		} else {
			result.error_schema = { error_code: "200", error_message: "Sukses" };
			result.output_schema.tasks = taskListResult;
			result.output_schema.total_amount = total_amount;
			result.output_schema.has_next_page = has_next_page;
			result.output_schema.last_id =
				taskListResult[taskListResult.length - 1].id;
		}
	}

	res.send(result);
	return;
};

app.createTask = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);
	console.log(curr_session);

	if (curr_session.session_id == x_token) {
		// let taskInstance = new Task();
		// let create_task_result = taskInstance.createTask(req.body);

		let data = req.body;
		let userId = curr_session.session_data.client_id;

		let taskInstance = new Task();
		let create_task_result = await taskInstance.createTask(data, userId);

		//console.log(create_task_result);

		if (create_task_result instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: "Gagal membuat tugas baru.",
			};
			result.output_schema = null;
			res.status(400).send(result);
			return;
		} else {
			result.error_schema = {
				error_code: "200",
				error_message: "Sukses.",
			};
			result.output_schema.id = create_task_result;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda tidak memiliki hak untuk melakukan hal tersebut.",
		};
		result.output_schema = null;
		res.status(400).send(result);
		return;
	}
	res.send(result);
	return;
};

app.getOwnedTask = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	//console.log(curr_session);

	if (curr_session.session_id == x_token) {
		let taskInstance = new Task();

		let task_result = await taskInstance.getOwnedTask(
			curr_session.session_data.client_id
		);

		if (task_result instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: "Gagal Mendapatkan Data.",
			};
			result.output_schema = null;
			res.status(400).send(result);
			return;
		} else {
			result.error_schema = {
				error_code: "200",
				error_message: "Sukses.",
			};
			result.output_schema.tasks = task_result;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda tidak memiliki hak untuk melakukan hal tersebut.",
		};
		result.output_schema = null;
		res.status(400).send(result);
		return;
	}
	res.send(result);
	return;
};

app.getOwnedTaskDetails = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		let taskId = req.params.taskId;
		let userId = curr_session.session_data.client_id;

		let taskInstance = new Task();
		let task_result = await taskInstance.getOwnedTaskDetails(taskId, userId);

		if (task_result instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: "Gagal Mengambil Data.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = {
				error_code: "200",
				error_message: "Sukses.",
			};
			result.output_schema.task_detail = task_result;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda tidak memiliki hak untuk melakukan hal tersebut.",
		};
		result.output_schema = null;
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}
	res.send(result);
	return;
};

app.getRegisteredFreelancer = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		let taskId = req.params.taskId;
		let userId = curr_session.session_data.client_id;

		let taskInstance = new Task();
		let task_result = await taskInstance.getRegisteredFreelancer(
			taskId,
			userId
		);

		if (task_result instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: "Gagal Mendapatkan Data.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = {
				error_code: "200",
				error_message: "Sukses.",
			};
			result.output_schema = task_result;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda tidak memiliki hak untuk melakukan hal tersebut.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}
	res.send(result);
	return;
};

app.deleteTask = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
		let taskId = req.params.taskId;
		let userId = curr_session.session_data.client_id;

		let taskInstance = new Task();
		let task_result = taskInstance.deleteTask(taskId, userId);

		if (task_result instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: "Gagal Menghapus Data.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = {
				error_code: "200",
				error_message: "Sukses.",
			};
			result.output_schema = {};
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda tidak memiliki hak untuk melakukan hal tersebut.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}

	res.send(result);
	return;
};

app.getTaskHistory = async (req, res) => {
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
		let userId = curr_session.session_data.freelancer_id;
		//console.log(userId);

		let taskInstance = new Task();
		let task_result = await taskInstance.getTaskHistory(userId);

		if (task_result instanceof Error) {
			result.error_schema = {
				error_code: "903",
				error_message: "Gagal mendapatkan data.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = {
				error_code: "200",
				error_message: "Sukses.",
			};
			result.output_schema = task_result;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda tidak memiliki hak untuk melakukan hal tersebut.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}

	res.send(result);
	return;
};

app.getTaskHistoryDetails = async (req, res) => {
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
		let taskId = req.params.taskId;
		let userId = curr_session.session_data.freelancer_id;

		let taskInstance = new Task();
		let task_result = await taskInstance.getTaskHistoryDetails(taskId, userId);

		if (task_result instanceof Error) {
			result.error_schema = {
				error_code: "999",
				error_message: "Terjadi Kegagalan.",
			};
			result.output_schema = null;

			res.status(400).send(result);
			return;
		} else {
			result.error_schema = {
				error_code: "200",
				error_message: "Sukses.",
			};
			result.output_schema.task_detail = task_result;
		}
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda tidak memiliki hak untuk melakukan hal tersebut.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}

	res.send(result);
	return;
};

app.chooseFreelancer = async (req, res) => {
	let result = {};

	result.error_schema = {};
	result.output_schema = {};

	let x_token = req.get("X-Token");
	let UserInstance = new User();
	let curr_session = await UserInstance.getUserSessionData(x_token);

	if (curr_session.session_id == x_token) {
	} else {
		result.error_schema = {
			error_code: "403",
			error_message: "Anda tidak memiliki hak untuk melakukan hal tersebut.",
		};
		result.output_schema = null;

		res.status(400).send(result);
		return;
	}

	res.send(result);
	return;
};

module.exports = app;
