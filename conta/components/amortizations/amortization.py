from components.couch import CouchClass
from tornado import gen
import time
from datetime import date
from lib.moment import *
from components.entity.entity import Entity
from components.inventory.inventory import Inventory
import math
import calendar


def add_months(sourcedate, months):
	if months == 0:
		return sourcedate
	month = sourcedate.month - 1 + months
	year = int(sourcedate.year + month / 12 )
	month = month % 12 + 1
	day = min(sourcedate.day, calendar.monthrange(year,month)[1])
	return date(year, month, day)


def get_first_day(date_text):
	date_obj = datetime.strptime(date_text, '%d-%m-%Y')
	date_obj = add_months(date_obj, 2)
	date_obj = date_obj - timedelta(days=date_obj.day)
	return date_obj


class Amortization(CouchClass):
	max_installment = 1500

	@gen.coroutine
	def initialise(self):
		yield super().initialise('amortizations')

	@gen.coroutine
	def get(self, id):
		has_doc = yield self.db.has_doc(id)
		print(has_doc)
		if has_doc:
			doc = yield self.db.get_doc(id)
		else:
			doc = None
		return doc

	@gen.coroutine
	def post(self, doc):
		if '_id' in doc.keys():
			current_doc = yield self.get(doc['_id'])
		else:
			current_doc = None

		doc['date_clear'] = doc['date']
		initial_date = get_first_day(doc['date'])
		doc['date'] = timestamp(get_date(doc['date'], '%d-%m-%Y'))
		last_date = add_months(initial_date, doc['duration'])
		doc['last_date'] = int(time.mktime(last_date.timetuple()))
		doc['last_date_clear'] = last_date.strftime('%d-%m-%Y')

		document = yield self.db.save_doc(doc)
		document = yield self.db.get_doc(document['id'])
		create_installments = True
		if current_doc:
			if current_doc['date'] == doc['date'] and current_doc['amount'] == doc['amount'] and current_doc['duration'] == doc['duration']:
				# nothing changed
				create_installments = False

		if create_installments:
			if current_doc:
				yield self.remove_installments(current_doc['_id'])
			for i in range(0, doc['duration']):
				installment = yield self.create_installment(document, add_months(initial_date, i), i)

			yield self.create_inventory_entry(document)

		return document

	@gen.coroutine
	def remove_installments(self, doc_id):
		has_doc = yield self.db.has_doc(doc_id)
		if (has_doc):
			result = yield self.db.view('installments', 'object', start_key=[doc_id], end_key=[doc_id, {}], reduce=False, include_docs=True)
			for installment in result['rows']:
				self.db.delete_doc(installment['doc'])

	def get_installment_amount(self, doc):
		amount = round(float(doc['amount']) / int(doc['duration']), 2)
		return min(amount, self.max_installment)

	@gen.coroutine
	def create_installment(self, doc, installment_date, installment_number):
		installment = {
			'type': 'installment',
			'date':  int(time.mktime(installment_date.timetuple())),
			'date_clear': installment_date.strftime('%d-%m-%Y'),
			'object_id': doc['_id'],
			'installment': installment_number + 1,
			'amount': self.get_installment_amount(doc),
			'name': doc['name']
		}

		installment = yield self.db.save_doc(installment)
		return installment

	@gen.coroutine
	def collection(self, dict):
		result = yield self.db.view(dict['design'], dict['sort'], include_docs=True, **dict)
		return result

	@gen.coroutine
	def delete(self, id):
		has_doc = yield self.db.has_doc(id)
		if (has_doc):
			doc = yield self.db.get_doc(id)
			self.remove_installments(doc.id)
			doc = yield self.db.delete_doc(doc)
		else:
			doc = None
		return doc

	@gen.coroutine
	def liquidated(self, id):
		end_date =  int(time.mktime(datetime.today().timetuple()))
		result = yield self.db.view('installments', 'object', start_key=[id], end_key=[id, end_date], reduce=True, group_level=1)
		return result['rows'][0]['value']

	@gen.coroutine
	def synchronize(self):
		entity = Entity()
		entity.initialise()

		result = yield self.db.view('installments', 'date', include_docs=True)
		group = None
		month = 0
		year = 0
		for item in result['rows']:
			item_date = datetime.fromtimestamp(item['doc']['date'])
			if item_date.month == month and item_date.year == year:
				group['amount'] += item['doc']['amount']
				group['real_amount'] += item['doc']['amount']
				group['deductible_amount'] += item['doc']['amount']
			else:
				if group is not None:
					result = yield entity.post(group)

				group = {
					'date': item['doc']['date_clear'],
					'amount': item['doc']['amount'],
					'type': 'payment',
					'document_number': str(item_date.month) + '/' + str(item_date.year),
					'currency': 'RON',
					'document_type': 'Jurnal',
					'description': 'Amortizari',
					'organisation': '',
					'real_amount': item['doc']['amount'],
					'real_vat': 0,
					'deductible': 100,
					'deductible_amount': item['doc']['amount'],
					'classification': 'Amortizari',
					'payment_type': '-'
				}
				month = item_date.month
				year = item_date.year

		# save last group
		if group is not None:
			result = yield entity.post(group)
		entity.close()

		return result

	@gen.coroutine
	def report(self, query):
		dictionary = {'design': 'installments'}

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

		dictionary['view'] = 'date'
		dictionary['start_key'] = [date_start_year_timestamp]
		dictionary['end_key'] = [date_end_timestamp, {}]

		dictionary['reduce'] = False
		dictionary['include_docs'] = True
		result = yield self.db.view(dictionary['design'], dictionary['view'], **dictionary)

		rows = result['rows']

		# group by months

		report = 0
		transactions = []
		for item in rows:
			if item['doc']['date'] < date_start_timestamp:
				report += round(item['doc']['amount'], 2)
			else:
				transaction_date = datetime.fromtimestamp(item['doc']['date'])
				transaction = {
					'date': item['doc']['date_clear'],
					'document_type': 'Amortizare '+ item['doc']['name'],
					'document_number': '',
					'description':  'Amortizare '+ item['doc']['name'] + '(' + str(item['doc']['installment']) + ')',
					'month': transaction_date.month,
					'year': transaction_date.year,
				}

				transaction['amount'] = round(item['doc']['amount'], 2)
				transaction['deductible'] = 100
				transactions.append(transaction)
		return {
			'report': report,
			'transactions': transactions
		}

	@gen.coroutine
	def prepareSheet(self, id):
		doc = yield self.get(id)
		if doc:
			doc['date'] = datetime.fromtimestamp(doc['date'])
			doc['date'] = add_months(doc['date'], 1)
			doc['last_date'] = datetime.fromtimestamp(doc['last_date'])

		return doc

	@gen.coroutine
	def create_inventory_entry(self, document):

		inventory = Inventory()
		inventory.initialise()

		search = {
			'design': 'default',
			'sort': 'amortization_id',
			'keys': [document['_id']]
		}

		inventory_document = yield inventory.collection(search)
		if inventory_document['rows']:
			inventory_document = inventory_document['rows'][0]
			inventory_document = yield inventory.get(inventory_document['doc']['_id'])
		else:
			inventory_document = {}

		inventory_document['name'] = document['name']
		inventory_document['entry_value'] = document['amount']
		inventory_document['entry_date'] = document['date_clear']
		inventory_document['exit_date'] = document['last_date_clear']
		inventory_document['amortization_id'] = document['_id']
		inventory_document['logs'] = []

		entry_date = datetime.fromtimestamp(document['date'])
		exit_date = datetime.fromtimestamp(document['last_date'])

		entry_year = entry_date.year
		exit_year = exit_date.year

		for year in range(entry_year, exit_year + 1):
			first_installment = document['date']
			last_day_of_year = int(time.mktime(datetime(year, month=12, day=31).timetuple()))

			installments = yield self.db.view('installments', 'object', start_key=[document['_id'], first_installment], end_key=[document['_id'], last_day_of_year], reduce=True, group_level=1)
			total_installment = round(installments['rows'][0]['value'])

			log = {
				'description': '',
				'value': math.trunc(inventory_document['entry_value'] - total_installment),
				'inventory_value': math.trunc(inventory_document['entry_value'] - total_installment),
				'year': year
			}

			inventory_document['logs'].append(log)

		result = yield inventory.post(inventory_document)
		inventory.close()
		return result




