from components.couch import MyAsyncCouch
from tornado import gen
import time
from datetime import date, datetime, timedelta
import calendar

class Inventory:
	db = None

	@gen.coroutine
	def initialise(self):
		self.db = MyAsyncCouch('inventory')
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
	def post(self, doc):
		doc['entry_date_clear'] = doc['entry_date']
		doc['entry_date'] = int(time.mktime(datetime.strptime(doc['entry_date'], '%d-%m-%Y').timetuple()))

		doc['exit_date_clear'] = doc['exit_date']
		if doc['exit_date']:
			doc['exit_date'] = int(time.mktime(datetime.strptime(doc['exit_date'], '%d-%m-%Y').timetuple()))
		else:
			doc['exit_date'] = date.today().replace(year=2050)

		document = yield self.db.save_doc(doc)
		return document

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
	def collection(self, dict):
		result = yield self.db.view(dict['design'], dict['sort'], include_docs=True, **dict)
		return result

	@gen.coroutine
	def report(self, date_start):
		date_start = datetime.strptime(date_start, '%d-%m-%Y')

		list = yield self.db.view('default', 'name', include_docs=True)
		inventory_list = []
		for row in list['rows']:
			for log in row['doc']['logs']:
				if log['year'] == date_start.year:
					inv = {
						'name': row['doc']['name'],
						'value': float(log['value']),
						'inventory_value': float(log['inventory_value']),
						'description': log['description']
					}
					inventory_list.append(inv)

		return inventory_list