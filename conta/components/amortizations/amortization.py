from components.couch import CouchClass
import time
from lib.moment import *
from components.entity.entity import Entity
from components.inventory.inventory import Inventory
from components.settings.settings import Settings
import math
import calendar

entity = Entity()
inventory = Inventory()
settings = Settings()

class Amortization(CouchClass):
	db_name = 'amortizations'

	async def initialise(self):
		await super().initialise()
		await entity.initialise()
		await inventory.initialise()
		await settings.initialise()

	async def post(self, doc):
		if '_id' in doc.keys():
			current_doc = await self.get(doc['_id'])
		else:
			current_doc = None

		doc['date_clear'] = doc['date']
		initial_date = get_first_day(doc['date'])
		doc['date'] = timestamp(get_date(doc['date'], '%d-%m-%Y'))
		last_date = add_months(initial_date, doc['duration'])
		doc['last_date'] = int(time.mktime(last_date.timetuple()))
		doc['last_date_clear'] = last_date.strftime('%d-%m-%Y')

		result = await self.db.save_doc(doc)
		doc = await self.db.get_doc(result['id'])
		create_installments = True
		if current_doc and current_doc['date'] == doc['date'] and current_doc['amount'] == doc['amount'] and current_doc['duration'] == doc['duration']:
			# nothing changed
			create_installments = False

		if create_installments:
			if current_doc:
				await self.remove_installments(current_doc['_id'])
			for i in range(0, doc['duration']):
				await self.create_installment(doc, add_months(initial_date, i), i)

			await self.create_inventory_entry(doc)

		return doc

	async def remove_installments(self, doc_id):
		has_doc = await self.db.has_doc(doc_id)
		if has_doc:
			result = await self.db.view('installments', 'object', start_key=[doc_id], end_key=[doc_id, {}], reduce=False, include_docs=True)
			for installment in result['rows']:
				await self.db.delete_doc(installment['doc'])

	async def get_installment_amount(self, doc, year):
		max_installment = await settings.max_installment(year)
		amount = round(float(doc['amount']) / int(doc['duration']), 2)
		return min(amount, max_installment)

	async def create_installment(self, doc, installment_date, installment_number):
		installment = {
			'type': 'installment',
			'date':  int(time.mktime(installment_date.timetuple())),
			'date_clear': installment_date.strftime('%d-%m-%Y'),
			'object_id': doc['_id'],
			'installment': installment_number + 1,
			'amount': await self.get_installment_amount(doc, installment_date.strftime('%Y')),
			'name': doc['name']
		}

		return await self.db.save_doc(installment)

	async def delete(self, id):
		await self.remove_installments(id)
		await super().delete(id)

	async def liquidated(self, id):
		end_date = int(time.mktime(datetime.today().timetuple()))
		result = await self.db.view('installments', 'object', start_key=[id], end_key=[id, end_date], reduce=True, group_level=1)
		return result['rows'][0]['value']

	async def synchronize(self):
		result = await self.db.view('installments', 'date', include_docs=True)
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
					result = await entity.post(group)

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
			result = await entity.post(group)
		return result

	async def report(self, query):
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

		options = {
			'design': 'installments',
			'view': 'date',
			'start_key':  [date_start_year_timestamp],
			'end_key': [date_end_timestamp, {}],
			'reduce': False,
			'include_docs': True,
		}
		result = await self.db.view(options['design'], options['view'], **options)
		# group by months
		report = 0
		transactions = []
		for item in  result['rows']:
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
					'deductible': 100,
					'amount': round(item['doc']['amount'], 2),
				}
				transactions.append(transaction)
		return {
			'report': report,
			'transactions': transactions
		}

	async def prepare_sheet(self, id):
		doc = await self.get(id)
		if doc:
			doc['date'] = datetime.fromtimestamp(doc['date'])
			doc['date'] = add_months(doc['date'], 1)
			doc['last_date'] = datetime.fromtimestamp(doc['last_date'])

		return doc

	async def create_inventory_entry(self, document):
		search = {
			'design': 'default',
			'sort': 'amortization_id',
			'keys': [document['_id']]
		}

		inventory_document = await inventory.collection(search)
		if inventory_document['rows']:
			inventory_document = inventory_document['rows'][0]
			inventory_document = await inventory.get(inventory_document['doc']['_id'])
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

			installments = await self.db.view('installments', 'object', start_key=[document['_id'], first_installment], end_key=[document['_id'], last_day_of_year], reduce=True, group_level=1)
			total_installment = round(installments['rows'][0]['value'])

			log = {
				'description': '',
				'value': math.trunc(inventory_document['entry_value'] - total_installment),
				'inventory_value': math.trunc(inventory_document['entry_value'] - total_installment),
				'year': year
			}

			inventory_document['logs'].append(log)

		result = await inventory.post(inventory_document)
		return result




