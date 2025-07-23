# Google Sheets Integration Setup

This guide will help you set up Google Sheets integration for your TQR-RPE form application. The integration will automatically save player data to Google Sheets in a format similar to the "CONTROL CARGA" table.

## Features

- **Automatic Data Sync**: Player data is automatically synced to Google Sheets when they submit forms
- **CONTROL CARGA Format**: Data is organized in a format similar to your existing Excel template
- **Microcycle Management**: Support for weekly microcycles with proper date formatting
- **Real-time Updates**: Data is updated in real-time as players submit their entries
- **Flexible Metrics**: Currently supports soreness data, easily expandable for other metrics

## Prerequisites

1. **Google Cloud Project**: You need a Google Cloud project with the Google Sheets API enabled
2. **Service Account**: A service account with proper permissions to create and edit spreadsheets
3. **Environment Variables**: Proper configuration of environment variables

## Step-by-Step Setup

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click on it and press "Enable"

### 2. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - **Name**: `tqr-rpe-sheets-service`
   - **Description**: `Service account for TQR-RPE Google Sheets integration`
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

### 3. Generate JSON Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Click "Create" - this will download a JSON file

### 4. Configure Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add the following variables:

```env
# Database (your existing variables)
DATABASE_URL="your-database-url"
DIRECT_URL="your-direct-url"

# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
GOOGLE_SPREADSHEET_ID="your-spreadsheet-id-here"
```

3. **Important**: For the `GOOGLE_PRIVATE_KEY`, you need to:
   - Open the downloaded JSON file
   - Copy the `private_key` value
   - Replace `\n` with actual newlines
   - Wrap it in quotes

Example:

```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"
```

### 5. Run Setup Script

Run the setup script to verify your configuration:

```bash
pnpm run setup:sheets
```

This script will:

- Check if your environment variables are properly configured
- Create a template `.env.local` file if needed
- Provide instructions for the next steps

### 6. Create Your First Spreadsheet

You can create a spreadsheet in two ways:

#### Option A: Using the API Endpoint

```bash
curl -X POST http://localhost:3000/api/sheets/create \
  -H "Content-Type: application/json" \
  -d '{"title": "CONTROL CARGA TQR-RPE"}'
```

#### Option B: Using the Management Interface

1. Add the `SheetsManager` component to your application
2. Use the UI to create and manage spreadsheets

### 7. Update Environment Variables

After creating a spreadsheet, update your `.env.local` file with the spreadsheet ID:

```env
GOOGLE_SPREADSHEET_ID="your-new-spreadsheet-id"
```

## API Endpoints

### Create Spreadsheet

```http
POST /api/sheets/create
Content-Type: application/json

{
  "title": "CONTROL CARGA TQR-RPE"
}
```

### Sync Data

```http
POST /api/sheets/sync
Content-Type: application/json

{
  "spreadsheetId": "your-spreadsheet-id",
  "microcycleStartDate": "2024-01-15"
}
```

## Data Format

The Google Sheets will be organized as follows:

### Headers

- **Row 1**: "CONTROL CARGA" | "MICROCICLO 1" | Date headers (e.g., "21-jul LUN")
- **Row 2**: "NOMBRE" | Empty cells for date columns

### Player Data

- Each player gets a row with their name and daily soreness values
- Currently uses `tqr_soreness` as the primary metric
- Values are placed in the appropriate date columns

### Summary Rows

- **RPEMEDIA**: Purple background, calculated averages
- **TIEMPO TOTAL SESIÓN**: Yellow background, session time (default 80)
- **CARGA MEDIA**: Red background, average load
- **SUMATORIO MICROCICLO**: Dark blue background, weekly totals
- **CARGA AGUDA**: Pink background, acute load
- **CARGA CRÓNICA**: Pink background, chronic load
- **A:C 7-28**: Pink background, acute:chronic ratio

## Usage

### Automatic Sync

When a player submits their form, the data is automatically synced to Google Sheets if:

- `GOOGLE_SPREADSHEET_ID` is configured
- Google Sheets credentials are valid

### Manual Sync

You can manually sync all data using the sync endpoint or the management interface.

### Microcycle Management

- Set the microcycle start date to organize data by weeks
- Each microcycle covers 7 days
- Date headers are automatically generated

## Troubleshooting

### Common Issues

1. **"Google Sheets not configured"**
   - Check that all environment variables are set
   - Verify the service account email and private key

2. **"Failed to create spreadsheet"**
   - Ensure the Google Sheets API is enabled
   - Check that the service account has proper permissions

3. **"Failed to sync data"**
   - Verify the spreadsheet ID is correct
   - Check that the spreadsheet exists and is accessible

### Debug Steps

1. Check the browser console for error messages
2. Verify environment variables are loaded correctly
3. Test the Google Sheets API connection
4. Check the spreadsheet permissions

## Expanding the System

### Adding New Metrics

To add support for other metrics (like RPE, recovery, energy):

1. Update the `GoogleSheetsService.updateSpreadsheetData` method
2. Modify the data mapping logic
3. Update the spreadsheet format as needed

### Multiple Microcycles

To support multiple microcycles:

1. Create additional sheets in the spreadsheet
2. Update the sync logic to handle multiple time periods
3. Add UI controls for microcycle selection

## Security Notes

- Keep your service account credentials secure
- Never commit `.env.local` to version control
- Use environment-specific configurations for production
- Regularly rotate service account keys

## Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify your Google Cloud project settings
3. Test the API endpoints directly
4. Review the Google Sheets API documentation

For additional help, refer to the Google Sheets API documentation or create an issue in the project repository.
