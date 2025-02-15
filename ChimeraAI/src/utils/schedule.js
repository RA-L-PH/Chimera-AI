export const getNextScheduleTime = () => {
  const now = new Date();
  const schedules = [0, 8, 12, 20]; // Hours to run updates
  const currentHour = now.getHours();
  
  // Find next schedule time
  const nextHour = schedules.find(h => h > currentHour) || schedules[0];
  const nextDate = new Date(now);
  
  nextDate.setHours(nextHour, 0, 0, 0);
  if (nextHour <= currentHour) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate;
};