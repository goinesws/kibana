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
const { authorize, listFiles, uploadFile } = require("../models/googleModel");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get(
	"/invoice/:transactionId",
	transactionController.getTransactionInvoice
);
router.get(
	"/invoice/:transactionId/completed",
	transactionController.getTransactionInvoice
);
router.get(
	"/task/client/:transactionId",
	transactionController.getTransactionDetailsClientTask
);
router.get(
	"/task/freelancer/:transactionId",
	transactionController.getTransactionDetailsFreelancerTask
);
router.get(
	"/:transactionId/client/activity",
	transactionController.getClientTransactionActivity
);
router.get(
	"/service/client/:transactionId",
	transactionController.getTransactionDetailsClientService
);
router.get(
	"/service/freelancer/:transactionId",
	transactionController.getTransactionDetailsFreelancerService
);

module.exports = router;
