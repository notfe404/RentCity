export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDuration = (hours: number): string => {
  if (hours < 24) return `${hours} giờ`;
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours === 0) return `${days} ngày`;
  return `${days} ngày ${remainingHours} giờ`;
};
