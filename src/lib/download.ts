/**
 * Downloads a file from a blob with filename extraction from content-disposition header
 * @param blob - The file blob to download
 * @param contentDisposition - The content-disposition header value
 * @param fallbackFilename - Fallback filename if header parsing fails
 */
export function downloadFile(
  blob: Blob,
  contentDisposition?: string | null,
  fallbackFilename: string = "download"
) {
  // Extract filename from content-disposition header
  let filename = fallbackFilename;
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, "");
    }
  }

  // Create a temporary URL for the blob
  const url = window.URL.createObjectURL(blob);
  
  // Create a temporary anchor element and trigger download
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Downloads a file from a fetch response
 * @param response - The fetch response object
 * @param fallbackFilename - Fallback filename if header parsing fails
 */
export async function downloadFromResponse(
  response: Response,
  fallbackFilename: string = "download"
) {
  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition");
  downloadFile(blob, contentDisposition, fallbackFilename);
}
