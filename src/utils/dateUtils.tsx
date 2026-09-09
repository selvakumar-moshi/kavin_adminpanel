
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
 
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
 
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
 
    return `${year}-${month}-${day}`;
  } catch (error) {
    return "N/A";
  }
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';

    // Get day, month, year
    const day = date.getDate().toString().padStart(2, '0');
     const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    // Get hours, minutes, and AM/PM
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const formattedHours = hours.toString().padStart(2, '0');

    return `${year}-${month}-${day}, ${formattedHours}:${minutes} ${ampm}`;
  } catch (error) {
    return 'N/A';
  }
};

export const formatLastLoginTime = (dateString: string): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';

    // Create formatter
    const formatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'longOffset'
    });

    const parts = formatter.formatToParts(date);

    // Extract parts
    const weekday = parts.find(p => p.type === 'weekday')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    const year = parts.find(p => p.type === 'year')?.value || '';
    const hour = parts.find(p => p.type === 'hour')?.value || '';
    const minute = parts.find(p => p.type === 'minute')?.value || '';
    const second = parts.find(p => p.type === 'second')?.value || '';
    const timeZoneName = parts.find(p => p.type === 'timeZoneName')?.value || '';

    // Format timezone (remove "GMT" prefix if present)
    const timezone = timeZoneName.replace(/^GMT/, '');

    return `${weekday} ${month} ${day} ${year} ${hour}:${minute}:${second} ${timezone}`;
  } catch (error) {
    return '';
  }
};

export const formatCount = (count: number): string => {
  return count === 0 ? '0' : count.toString().padStart(2, '0');
};