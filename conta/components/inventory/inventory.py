from components.couch import CouchClass
import time
from datetime import date, datetime


class Inventory(CouchClass):
	db_name = 'inventory'

	async def post(self, doc):
		doc['entry_date_clear'] = doc['entry_date']
		doc['entry_date'] = int(time.mktime(datetime.strptime(doc['entry_date'], '%d-%m-%Y').timetuple()))

		doc['exit_date_clear'] = doc['exit_date']
		if doc['exit_date']:
			doc['exit_date'] = int(time.mktime(datetime.strptime(doc['exit_date'], '%d-%m-%Y').timetuple()))
		else:
			doc['exit_date'] = date.today().replace(year=2050)

		document = await self.db.save_doc(doc)
		return document

	async def delete(self, id):
		await super().delete(id)
		await self.remove_installments(id)

	async def report(self, date_start):
		date_start = datetime.strptime(date_start, '%d-%m-%Y')

		list = await self.db.view('default', 'name', include_docs=True)
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
