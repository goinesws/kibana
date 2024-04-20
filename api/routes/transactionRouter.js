const express = require("express");
const router = express.Router();
const db = require("../../db");
const dotenv = require("dotenv");
const { google } = require("googleapis");
const fs = require("fs");
const userController = require("../controllers/userController");
const taskController = require("../controllers/taskController");
const serviceController = require("../controllers/serviceController");
const subcategoryController = require("../controllers/subcategoryController");
const categoryController = require("../controllers/categoryController");
const clientController = require("../controllers/clientController");
const freelancerController = require("../controllers/freelancerController");
const reviewController = require("../controllers/reviewController");
const transactionController = require("../controllers/transactionController");
const multer = require("multer");
const { authorize, listFiles, uploadFile } = require("../utils/googleUtil.js");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//inquiry invoice transaksi client
router.get(
	"/invoice/:transactionId",
	transactionController.getTransactionInvoice
);

//inquiry invoice transaksi freelancer
router.get(
	"/invoice/:transactionId/completed",
	transactionController.getTransactionInvoice
);

//inquiry detail pesanan tugas client
router.get(
	"/task/client/:transactionId",
	transactionController.getTransactionDetailsClientTask
);

//inquiry detail pesanan tugas freelancer
router.get(
	"/task/freelancer/:transactionId",
	transactionController.getTransactionDetailsFreelancerTask
);

//Inquiry Detail Pesanan Layanan Client
router.get(
	"/service/client/:transactionId",
	transactionController.getTransactionDetailsClientService
);

//inquiry detail pesanan layanan freelancer
router.get(
	"/service/freelancer/:transactionId",
	transactionController.getTransactionDetailsFreelancerService
);

//inquiry activity pesanan client
router.get(
	"/:transactionId/client/activity",
	transactionController.getClientTransactionActivity
);

//inquiry activity pesanan freelancer
router.get(
	"/:transactionId/freelancer/activity",
	transactionController.getFreelancerTransactionActivity
);

//send requirement
router.post(
	"/send-requirement",
	upload.fields([
		{ name: "supporting_file", maxCount: 1 },
		{ name: "data", maxCount: 1 },
	]),
	transactionController.sendRequirement
);

//send message
router.post("/send-message", transactionController.sendMessage);

//send additional file
router.post(
	"/send-file",
	upload.fields([
		{ name: "additional_file", maxCount: 1 },
		{ name: "data", maxCount: 1 },
	]),
	transactionController.sendAdditionalFile
);

//send result
router.post(
	"/send-result",
	upload.fields([
		{ name: "result_1", maxCount: 1 },
		{ name: "result_2", maxCount: 1 },
		{ name: "result_3", maxCount: 1 },
		{ name: "data", maxCount: 1 },
	]),
	transactionController.sendResult
);

//ask return
router.post("/ask-return", transactionController.askReturn);

//cancel return
router.put("/cancel-return", transactionController.cancelReturn);

//ask revision
router.post("/ask-revision", transactionController.askRevision);

//complete transaksi
router.put("/complete", transactionController.completeTransaction);

//ask cancellation
router.post("/ask-cancellation", transactionController.askCancellation);

//manage cancellation
router.post("/manage-cancellation", transactionController.manageCancellation);

//call admin
router.put("/call-admin", transactionController.callAdmin);

//cancel cancellation
router.put("/cancel-cancellation", transactionController.cancelCancellation);

//manage return
router.post("/manage-return", transactionController.manageReturn);

//send feedback - transaction
router.put("/:paymentId/send-feedback", transactionController.sendFeedback);

module.exports = router;
