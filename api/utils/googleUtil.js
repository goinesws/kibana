const express = require("express");
const db = require("../../db");
const app = express();
const multer = require("multer");
const { google } = require("googleapis");
const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const stream = require("stream");

// If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
	try {
		const content = await fs.readFile(TOKEN_PATH);

		const credentials = JSON.parse(content);

		return google.auth.fromJSON(credentials);
	} catch (err) {
		return null;
	}
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
	const content = await fs.readFile(CREDENTIALS_PATH);
	const keys = JSON.parse(content);
	const key = keys.installed || keys.web;
	const payload = JSON.stringify({
		type: "authorized_user",
		client_id: key.client_id,
		client_secret: key.client_secret,
		refresh_token: client.credentials.refresh_token,
	});
	await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
	let client = await loadSavedCredentialsIfExist();

	if (client) {
		//console.log(client)
		return client;
	}

	client = await authenticate({
		scopes: SCOPES,
		keyfilePath: CREDENTIALS_PATH,
	});

	if (client.credentials) {
		await saveCredentials(client);
	}
	return client;
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(authClient) {
	const drive = google.drive({ version: "v3", auth: authClient });
	const res = await drive.files.list({
		pageSize: 10,
		fields: "nextPageToken, files(id, name)",
	});
	const files = res.data.files;
	if (files.length === 0) {
		//console.log('No files found.');
		return;
	}

	//console.log('Files:');
	files.map((file) => {
		//console.log(`${file.name} (${file.id})`);
	});
}

async function getPreviewLink(id) {
	let link = "https://drive.google.com/file/d/" + id + "/preview ";
	return link;
}

async function getBlob(id) {
	try {
		// Fetch file content from Google Drive.
		const response = await fetch(
			"https://www.googleapis.com/drive/v3/files/" + id + "?alt=media"
		);

		// Ensure the request was successful.
		if (!response.ok) {
			throw new Error("Tidak menemukan file");
		}

		// Convert the response to a Blob.
		const blob = await response.blob();

		return blob;
	} catch (error) {
		console.error("Error:", error.message);
		throw error;
	}
}

async function getDownloadLink(id) {
	let link = "https://drive.google.com/uc?id=" + id;
	return link;
}

async function getFileName(authClient, id) {
	try {
		// Fetch file metadata from Google Drive.
		const drive = google.drive({ version: "v3", auth: authClient });
		const fileInfo = await drive.files.get({
			fileId: id,
		});

		// Get the file name from the metadata.
		const fileName = fileInfo.data.name;

		return fileName;
	} catch (error) {
		console.error("Error:", error.message);
		throw error;
	}
}

async function uploadFile(authClient, file) {
	const drive = google.drive({ version: "v3", auth: authClient });

	const fileMetadata = {
		name: file.originalname,
	};

	const media = {
		body: new stream.PassThrough().end(file.buffer),
	};

	// console.log(image.originalname)
	// console.log(image.buffer)
	const driveRes = await drive.files.create({
		auth: authClient,
		resource: fileMetadata,
		media: media,
	});

	//console.log('File uploaded to Google Drive:', driveRes.data);
	const file_id = driveRes.data.id;

	// Set the visibility to 'anyone with the link'
	const changePermission = await drive.permissions.create({
		fileId: file_id,
		requestBody: {
			role: "reader",
			type: "anyone",
		},
	});
	//console.log('permission changed to all');

	//console.log("done")
	return file_id;
}

module.exports = {
	authorize,
	listFiles,
	uploadFile,
	loadSavedCredentialsIfExist,
	saveCredentials,
	getFileName,
	getBlob,
	getDownloadLink,
	getPreviewLink,
};
