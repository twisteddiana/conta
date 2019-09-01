from components.couch import MyAsyncCouch
from tornado import gen
import time
from datetime import date, datetime, timedelta
import calendar
from tornado.httpclient import  AsyncHTTPClient
import xml.etree.ElementTree as ET


class Entity:
	db = None

	@gen.coroutine
	def initialise(self):
		self.db = MyAsyncCouch('enitites')
		try:
			yield self.db.create_db()
		except:
			pass

	@gen.coroutine
	def get(self, id):
		has_doc = yield self.db.has_doc(id)
		if (has_doc):
			doc = yield self.db.get_doc(id)
		else:
			doc = None
		return doc

	@gen.coroutine
	def post(self, dict):
		if 'date_added' in dict.keys():
			dict['date_updated'] = int(time.time())
		else:
			dict['date_added'] = int(time.time())
		dict['date_clear'] = dict['date']
		dict['date'] = int(time.mktime(datetime.strptime(dict['date'], '%d-%m-%Y').timetuple()))
		dict['real_amount'] = round(dict['real_amount'], 2)
		doc = yield self.db.save_doc(dict)
		return doc

	@gen.coroutine
	def delete(self, id):
		has_doc = yield self.db.has_doc(id)
		if (has_doc):
			doc = yield self.db.get_doc(id)
			doc = yield self.db.delete_doc(doc)
		else:
			doc = None
		return doc

	@gen.coroutine
	def collection(self, dict):
		result = yield self.db.view(dict['design'], dict['sort'], include_docs = True, **dict)
		return result

	@gen.coroutine
	def reduce(self, dict):
		dict['group_level'] = 1
		result = yield self.db.view(dict['design'], dict['sort'], **dict)
		return result

	@gen.coroutine
	def filter(self, dictionary):
		filtered = None
		for key, value in dictionary['filter'].items():
			if value:
				if isinstance(value, dict):
					filter_dict = {}
					if 'start_key' in value.keys() and value['start_key']:
						filter_dict['start_key'] = [value['start_key']]
					if 'end_key' in value.keys() and value['end_key']:
						filter_dict['end_key'] = [value['end_key'], {}]

					filter_dict['inclusive_end'] = True
					filter_dict['reduce'] = False

					result = yield self.db.view(dictionary['design'], key, **filter_dict)
				else:
					filter_dict = {}
					filter_dict['reduce'] = False
					result = {'rows': []}
					for val in value:
						filter_dict['start_key'] = [str(val)]
						filter_dict['end_key'] = [str(val), {}]
						intermediary = yield self.db.view(dictionary['design'], key, **filter_dict)
						result['rows'] = result['rows'] + intermediary['rows']

				list = [[item['value'][dictionary['sort']][0], item['id']] for item in result['rows']]

				if filtered == None:
					filtered = list
				else:
					filtered = [id for id in filtered if id in list]

		if filtered:
			if 'descending' in dictionary.keys() and dictionary['descending']:
				dictionary['keys'] = sorted(filtered, key=lambda x: x[0], reverse=True)
				del dictionary['descending']
			else:
				dictionary['keys'] = sorted(filtered, key=lambda x: x[0])

			result = yield self.db.view(dictionary['design'], dictionary['sort'], include_docs = True, **dictionary)
			return result
		elif filtered == None:
			result = yield self.db.view(dictionary['design'], dictionary['sort'], include_docs=True, **dictionary)
			return result
		else:
			return {'rows': []}

	@gen.coroutine
	def save_attachment(self, doc, file):
		attachment = {
			'name': file['filename'],
			'mimetype': file['content_type'],
			'data': file['body']
		}
		result = yield self.db.save_attachment(doc, attachment)
		return result

	@gen.coroutine
	def delete_attachment(self, doc, attachment_name):
		result = yield self.db.delete_attachment(doc, attachment_name=attachment_name)
		return result

	@gen.coroutine
	def get_attachment(self, doc, attachment_name):
		result = yield self.db.get_attachment(doc, attachment_name=attachment_name)
		return result

	@gen.coroutine
	def remove_amortization(self):
		result = yield self.db.view('payments', 'classification', start_key=['Amortizari'], end_key=['Amortizari', {}], include_docs=True, reduce=False)
		res = True
		for item in result['rows']:
			res = yield self.db.delete_doc(item['doc'])
		return res

	@gen.coroutine
	def report(self, query):
		dictionary = {'design': 'all'}

		date_start = datetime.strptime(query['date_start'], '%d-%m-%Y')
		# first day of the month
		date_start = date_start - timedelta(days=date_start.day - 1)
		date_start_year = date_start.replace(month=1, day=1)
		date_start_year_timestamp = int(time.mktime(date_start_year.timetuple()))
		date_start_timestamp = int(time.mktime(date_start.timetuple()))

		date_end = datetime.strptime(query['date_end'], '%d-%m-%Y')
		# last day of the month
		days_in_month = calendar.monthrange(date_end.year, date_end.month)[1]
		date_end = date_end + timedelta(days=days_in_month - date_end.day)
		date_end_timestamp = int(time.mktime(date_end.timetuple()))

		if query['report'] == 'registry' or query['report'] == 'fiscal_evidence':
			dictionary['view'] = 'date'
			dictionary['start_key'] = date_start_year_timestamp
			dictionary['end_key'] = date_end_timestamp
		else:
			dictionary['view'] = 'classification'
			dictionary['start_key'] = [query['classification'], date_start_year_timestamp]
			dictionary['end_key'] = [query['classification'], date_end_timestamp]

		dictionary['reduce'] = False
		dictionary['include_docs'] = True
		result = yield self.db.view(dictionary['design'], dictionary['view'], **dictionary)

		rows = result['rows']

		# group by months

		report = 0
		transactions = []
		deductible_only = query['report'] == 'journal'
		for item in rows:
			if item['doc']['date'] < date_start_timestamp:
				if deductible_only:
					# sum up only deductible
					report += round(item['doc']['real_amount'] * item['doc']['deductible'] / 100, 2)
				else:
					# sum up the amount
					report += round(item['doc']['real_amount'], 2)
			else:
				transaction_date = datetime.fromtimestamp(item['doc']['date'])
				transaction = {
					'date': item['doc']['date_clear'],
					'document_type': item['doc']['document_type'],
					'document_number': item['doc']['document_number'],
					'description': item['doc']['description'],
					'month': transaction_date.month,
					'year': transaction_date.year,
					'payment_type': item['doc']['payment_type'],
					'type': item['doc']['type']
				}
				if 'real_amount' in item['doc'].keys():
					if deductible_only:
						# sum up only deductible
						transaction['amount'] = round(item['doc']['real_amount'] * item['doc']['deductible'] / 100, 2)
					else:
						transaction['amount'] = round(item['doc']['real_amount'], 2)
						transaction['deductible'] = item['doc']['deductible']
				transactions.append(transaction)
		return {
			'report': report,
			'transactions': transactions
		}

	@gen.coroutine
	def fiscal_evidence_report(self, query):
		classifications_result = yield self.db.view('all', 'classification', reduce=True, group_level=1)
		classifications = []

		date_start = datetime.strptime(query['date_start'], '%d-%m-%Y')
		# first day of the month
		date_start = date_start - timedelta(days=date_start.day - 1)
		date_start_year = date_start.replace(month=1, day=1)
		date_start_year_timestamp = int(time.mktime(date_start_year.timetuple()))

		date_end = datetime.strptime(query['date_end'], '%d-%m-%Y')
		# last day of the month
		days_in_month = calendar.monthrange(date_end.year, date_end.month)[1]
		date_end = date_end + timedelta(days=days_in_month - date_end.day)
		date_end_timestamp = int(time.mktime(date_end.timetuple()))

		for classification in classifications_result['rows']:
			classification_name = classification['key'][0]
			if classification_name == 'CAS (pensie)' or classification_name == 'CASS (sanatate)':
				continue

			transactions = []
			total = 0
			classifications_query = {
				'start_key': [classification_name, date_start_year_timestamp],
				'end_key': [classification_name, date_end_timestamp],
				'reduce': False,
				'include_docs': True
			}

			result = yield self.db.view('all', 'classification', **classifications_query)
			for row in result['rows']:
				transaction_date = datetime.fromtimestamp(row['doc']['date'])
				amount = row['doc']['deductible_amount'] if 'deductible_amount' in row['doc'] else row['doc']['real_amount']
				transaction = {
					'date': row['doc']['date_clear'],
					'document_type': row['doc']['document_type'],
					'document_number': row['doc']['document_number'],
					'description': row['doc']['description'],
					'month': transaction_date.month,
					'year': transaction_date.year,
					'payment_type': row['doc']['payment_type'],
					'type': row['doc']['type'],
					'amount': round(amount, 2)
				}
				transactions.append(transaction)
				total += round(transaction['amount'], 2)

			classifications.append({
				'name': classification_name,
				'transactions': transactions,
				'total': round(total, 2)
			})

		return {
			'classifications': classifications,
			'year': date_start.year
		}

	@gen.coroutine
	def statement(self, query):
		date_start = datetime.strptime(query['year'], '%Y')
		date_start = date_start.replace(month=1, day=1)

		date_end = datetime.strptime(query['year'], '%Y')
		date_end = date_end.replace(month=12, day=31)

		date_start_timestamp = int(time.mktime(date_start.timetuple()))
		date_end_timestamp = int(time.mktime(date_end.timetuple()))

		dictionary = {
			'design': 'all',
			'view': 'date',
			'start_key': date_start_timestamp,
			'end_key': date_end_timestamp,
			'reduce': False,
			'include_docs': True
		}

		result = yield self.db.view(dictionary['design'], dictionary['view'], **dictionary)
		rows = result['rows']

		brut_income = 0
		untaxable_income = 0
		payments = 0
		social_payments = {
			'CAS (pensie)': 0,
			'CASS (sanatate)': 0
		}

		for doc in rows:
			if doc['doc']['type'] == 'income':
				brut_income += round(doc['doc']['real_amount'], 2)
				if doc['doc']['deductible'] < 100:
					untaxable_income += round(doc['doc']['real_amount'] * (100 - doc['doc']['deductible']) / 100, 2)
			else:
				if doc['doc']['classification'] == 'CAS (pensie)' or doc['doc']['classification'] == 'CASS (sanatate)':
					social_payments[doc['doc']['classification']] += round(doc['doc']['deductible_amount'], 2)
				else:
					payments += round(doc['doc']['deductible_amount'], 2)

		brut_income = round(brut_income, 2)
		untaxable_income = round(untaxable_income, 2)
		payments = round(payments, 2)
		social_payments['CAS (pensie)'] = round(social_payments['CAS (pensie)'], 2)
		social_payments['CASS (sanatate)'] = round(social_payments['CASS (sanatate)'], 2)
		net_income = round(brut_income - payments, 2)

		if query['year'] <= '2015':
			medical_insurance = round((net_income - untaxable_income) * 5.5/100, 2)
			pension = round((net_income - untaxable_income) * 10.5/100, 2)
			income_tax = round((net_income - untaxable_income - medical_insurance - pension) * 16/100, 2)
		elif query['year'] == '2016':
			medical_insurance = round((net_income - untaxable_income) * 5.5 / 100, 2)
			pension = social_payments['CAS (pensie)']
			income_tax = round((net_income - untaxable_income - medical_insurance - pension) * 16 / 100, 2)
		elif query['year'] == '2017':
			medical_insurance = round((net_income - untaxable_income) * 5.5 / 100, 2)
			pension = social_payments['CAS (pensie)']
			income_tax = round((net_income - untaxable_income - medical_insurance - pension) * 16 / 100, 2)
		elif query['year'] == '2018':
			base = 1900
			medical_insurance = round(base * 12 * 10 / 100, 2)
			pension = round(base * 12 * 25 / 100, 2)
			income_tax = round((net_income - untaxable_income - medical_insurance - pension) * 10 / 100, 2)

		return {
			'brut_income': brut_income,
			'untaxable_income': untaxable_income,
			'payments': payments,
			'social_payments': social_payments,
			'net_income': net_income,
			'medical_insurance': medical_insurance,
			'pension': pension,
			'income_tax': income_tax
		}


class Currency:
	db = None

	@gen.coroutine
	def initialise(self):
		self.db = MyAsyncCouch('currencies')
		try:
			yield self.db.create_db()
		except:
			pass

	@gen.coroutine
	def get(self, id):
		has_doc = yield self.db.has_doc(id)
		if (has_doc):
			doc = yield self.db.get_doc(id)
		else:
			doc = None
		return doc

	@gen.coroutine
	def collection(self):
		result = yield self.db.view_all_docs(include_docs=True)
		return result


class ExchangeRate:
	db = None

	@gen.coroutine
	def initialise(self):
		self.db = MyAsyncCouch('exchange_rates')
		try:
			yield self.db.create_db()
		except:
			pass

	@gen.coroutine
	def post(self, dict):
		doc = yield self.db.save_doc(dict)
		return doc

	@gen.coroutine
	def get(self, iso, request_date=None):
		if request_date is None:
			today = date.today()
			request_date = str(int(time.mktime(today.timetuple())))
		else:
			request_date = str(int(time.mktime(datetime.strptime(request_date, '%d-%m-%Y').timetuple())))

		doc = yield self.db.view('filter', 'by_date_and_iso', key=iso+request_date)
		if not doc['rows']:
			# the pair was not found
			# import the thing
			request_date_object = datetime.fromtimestamp(int(request_date))
			year = request_date_object.year

			success = yield self.importRates(year, iso)
			success = yield self.importRates(year - 1, iso)
			if success:
				doc = yield self.db.view('filter', 'by_date_and_iso', key=iso + request_date)
			if not doc['rows']:
				doc = yield self.db.view('filter', 'by_date_and_iso', start_key=iso + request_date, descending=True, limit=1, inclusive_end=True)

		return doc

	@gen.coroutine
	def importRates(self, year, iso):
		url = 'http://www.bnr.ro/files/xml/years/nbrfxrates' + str(year) + '.xml'
		http_client = AsyncHTTPClient()
		response = yield http_client.fetch(url)

		root = ET.fromstring(response.body)
		for cube in root[1].findall('{http://www.bnr.ro/xsd}Cube'):
			dict = cube.attrib
			dict['date'] = str(int(time.mktime(datetime.strptime(dict['date'], '%Y-%m-%d').timetuple())))
			dict['iso'] = iso

			for rate in cube.findall('{http://www.bnr.ro/xsd}Rate'):
				if rate.attrib['currency'] == iso:
					dict['exchange_rate'] = rate.text

			doc = yield self.db.view('filter', 'by_date_and_iso', key=dict['iso']+dict['date'])
			if not doc['rows']:
				doc = yield self.db.save_doc(dict)
		return doc
