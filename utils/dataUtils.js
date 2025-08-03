// Utility function to convert Excel serial date to JavaScript Date
export function excelDateToJSDate(serial) {
    const utc_days = Math.floor(serial - 25569); // Excel's "epoch" starts at 1900-01-01
    const utc_value = utc_days * 86400; // Convert days to seconds
    const date_info = new Date(utc_value * 1000); // Convert to milliseconds
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
  }
  