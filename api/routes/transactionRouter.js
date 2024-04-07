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
const { authorize, listFiles, uploadFile } = require("../utils/googleUtil.js");;
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

//inquiry activity pesanan client
router.get(
	"/:transactionId/client/activity",
	transactionController.getClientTransactionActivity
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

//inquiry activity pesanan freelancer

//send requirement

//send message

//send additional file

//send result

//ask return

//cancel return

//ask revision

//complete transaksi

//manage cancellation

//call admin

//ask cancellation

//cancel cancellation

//manage return

//send feedback - transaction

module.exports = router;
