// An image on the clipboard (e.g. a screenshot), or null. When the clipboard also carries text (copying from Word or a
// web page puts both), the text is meant, so nothing is returned and the paste stays a normal text paste.
export const getPastedImage = (clipboardData: DataTransfer | null): File | null => {
    if (!clipboardData || clipboardData.getData('text/plain')) return null;

    const item = Array.from(clipboardData.items).find((entry) => entry.kind === 'file' && entry.type.startsWith('image/'));
    const file = item?.getAsFile();
    if (!file) return null;

    // Screenshots arrive as a generic "image.png"; a timestamp keeps uploads from sharing one name
    const extension = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
    return new File([file], `pasted-image-${Date.now()}.${extension}`, { type: file.type });
};
