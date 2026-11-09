from flask import Flask, request, jsonify
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
import os

# Google Drive API setup
SERVICE_ACCOUNT_FILE = 'src\service.json'
FOLDER_ID = '1GauVn6uNGINlQaCSTF9FbaozHmnPysLR'  # Replace with your fixed Google Drive folder ID

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE,
    scopes=['https://www.googleapis.com/auth/drive']
)

drive_service = build('drive', 'v3', credentials=credentials)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    file_stream = io.BytesIO(file.read())  # Read file into memory

    # Prepare the file metadata and media
    file_metadata = {
        'name': file.filename,
        'parents': [FOLDER_ID]
    }
    media = MediaIoBaseUpload(file_stream, mimetype=file.mimetype, resumable=True)

    try:
        # Upload the file to Google Drive
        uploaded_file = drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink'
        ).execute()
        print(f"File uploaded successfully. View link: {'web_view_link'}")
        # Return the response
        return jsonify({'file_id': uploaded_file['id'], 'link': uploaded_file['webViewLink']}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to upload file: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host="127.0.0.1", port=5000)
