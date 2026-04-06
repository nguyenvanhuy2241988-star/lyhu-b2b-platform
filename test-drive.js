require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function testDrive() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    console.log("Testing Drive API with folder ID:", process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
    
    const response = await drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
      pageSize: 5
    });

    console.log("Success! Files found:", response.data.files);
  } catch (err) {
    console.error("Drive API Error:", err.message);
    if (err.response && err.response.data) {
        console.error("Details:", JSON.stringify(err.response.data, null, 2));
    }
  }
}

testDrive();
