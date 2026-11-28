// Saving a file returned by the API (axios `responseType: 'blob'`)

// Pulls a filename out of a Content-Disposition header (e.g. attachment; filename="users.xlsx")
const parseFileNameFromContentDisposition = (contentDisposition: string | undefined): string | null => {
    if (!contentDisposition) return null;
    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
};

// Downloads the response body under the name the server gave it, or `fallbackName`
export const saveBlobResponse = (res: { data: unknown; headers?: Record<string, any> }, fallbackName: string) => {
    const fileName = parseFileNameFromContentDisposition(res.headers?.['content-disposition']) || fallbackName;
    const url = URL.createObjectURL(res.data as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};
