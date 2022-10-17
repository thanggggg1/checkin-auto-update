// Returns an array of dates between the two dates
import moment from 'moment';

export const getDatesBetween = (startDate: string, endDate: string, date_format_from = "DD/MM/YYYY", date_format_to="DD/MM/YYYY") => { // DD/MM/YYYY

  const getDateAsArray = (date: string) => {
    return moment(date.split(/\D+/), date_format_from);
  };

  const diff = getDateAsArray(endDate).diff(getDateAsArray(startDate), "days") + 1;
  const dates = [];

  for (let i = 0; i < diff; i++) {
    const nextDate = getDateAsArray(startDate).add(i, "day");
    dates.push(nextDate.format(date_format_to))
  }

  return dates;

};
