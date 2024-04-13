const express = require("express");
const router = express.Router();
const db = require("../../db");
const dotenv = require("dotenv");
const { google } = require("googleapis");
const fs = require("fs");
const reviewController = require("../controllers/reviewController");
const multer = require("multer");
const { authorize, listFiles, uploadFile } = require("../utils/googleUtil.js");;
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/client", reviewController.insertReviewClient);
router.post("/freelancer", reviewController.insertReviewFreelancer);
router.post("/service", reviewController.insertReviewService);

module.exports = router;
