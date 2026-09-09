export const EXTENSION_MAP: Record<string, string[]> = {
    pdf: ['.pdf'],
    docx: ['.docx'],
    xlsx: ['.xlsx'],
    csv: ['.csv'],
    pptx: ['.pptx'],
    html: ['.html'],
    tsec: ['.tsec'],
    jpg: ['.jpg', '.jpeg'],
    png: ['.png'],
    txt: ['.txt'],
    zip: ['.zip'],
  } as const;
  
  export const getFileExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
      return ''; // No extension found
    }
    return filename.slice(lastDotIndex).toLowerCase();
  };
  

  export const getAllowedExtensions = (): string[] => {
    return Object.values(EXTENSION_MAP).flat();
  };
  

  export const validateFileExtension = (
    filename: string
  ): { isValid: boolean; extension: string } => {
    const extension = getFileExtension(filename);
    const allowedExtensions = getAllowedExtensions();
    
    return {
      isValid: allowedExtensions.includes(extension),
      extension,
    };
  };
  

  export const getFormattedAllowedExtensions = (): string => {
    return Object.keys(EXTENSION_MAP)
      .map(ext => ext.toUpperCase())
      .join(', ');
  };