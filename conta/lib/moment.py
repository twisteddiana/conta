from datetime import date, datetime, timedelta
import time
import calendar


def get_date(date_string, format='%d-%m-%Y'):
    return datetime.strptime(date_string, format)


def subtract(date_obj, **kwargs):
    delta = timedelta(**kwargs)
    return date_obj - delta


def add(date_obj, **kwargs):
    delta = timedelta(**kwargs)
    return date_obj + delta;


def start_of_year(date_obj):
    return date_obj.replace(month=1, day=1, hour=0, minute=0, second=0)


def timestamp(date_obj):
    return int(time.mktime(date_obj.timetuple()))


def start_of_month(date_obj):
    return date_obj.replace(day=1, hour=0, minute=0, second=0)


def end_of_month(date_obj):
    days_in_month = calendar.monthrange(date_obj.year, date_obj.month)[1]
    return date_obj.replace(day=days_in_month, hour=23, minute=59, second=59)


def end_of_year(date_obj):
    return date_obj.replace(month=12, day=31, hour=23, minute=59, second=59)


def last_working_day(date_obj):
    weekday = date_obj.weekday()
    max_weekday = 4
    if weekday == 0:
        return subtract(date_obj, days=3)
    if weekday > max_weekday:
        return subtract(date_obj, days=weekday-max_weekday)
    return subtract(date_obj, days=1)
