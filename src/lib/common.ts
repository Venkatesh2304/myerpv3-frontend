/**
 * Format date from YYYY-MM-DD to DD/MM/YYYY
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string in DD/MM/YYYY format or empty string if invalid
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  
  try {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

/**
 * Format date to locale string
 * @param dateString - Date string in any valid format
 * @param locale - Locale string (default: 'en-IN')
 * @returns Formatted date string
 */
export function formatDateLocale(
  dateString: string | null | undefined,
  locale: string = "en-IN"
): string {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}
