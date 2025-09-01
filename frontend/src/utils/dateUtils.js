export const formatDateWithSuffix = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getDate();

  const getDaySuffix = (d) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const dayWithSuffix = `${day}${getDaySuffix(day)}`;
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();

  return `${dayWithSuffix} ${month}, ${year}`;
}

export const getDaysToGo = (dateStr) => {
  const now = new Date();
  const matchDate = new Date(dateStr);

  const diffMillis = matchDate.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMillis / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffMillis / (1000 * 60 * 60 * 24));

  if (diffMillis < 0) return 'Match Completed';

  if (diffDays > 1) return `${diffDays} days to go`;
  if (diffDays === 1) return '1 day to go';

  if (diffHours >= 1) return `${diffHours} hour${diffHours > 1 ? 's' : ''} to go`;
  if (diffMinutes >= 1) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} to go`;

  return 'Less than a minute to go';
};
