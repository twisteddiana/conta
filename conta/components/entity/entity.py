from components.couch import CouchClass
import time
from lib.moment import *


class Entity(CouchClass):
	db_name = 'enitites'

	async def post(self, dict):
		if 'date_added' in dict.keys():
			dict['date_updated'] = int(time.time())
		else:
			dict['date_added'] = int(time.time())
		dict['date_clear'] = dict['date']

		dict['date'] = timestamp(get_date(dict['date'], '%d-%m-%Y'))
		dict['real_amount'] = round(dict['real_amount'], 2)
		dict['real_vat'] = round(dict['real_vat'], 2)
		doc = await self.db.save_doc(dict)
		return doc

	async def reduce(self, dict):
		dict['group_level'] = 1
		result = await self.db.view(dict['design'], dict['sort'], **dict)
		return result

	async def filter(self, dictionary):
		filtered = None
		for key, value in dictionary['filter'].items():
			if value:
				if isinstance(value, dict):
					filter_dict = {
						'inclusive_end': True,
						'reduce': False,
					}
					if 'start_key' in value.keys() and value['start_key']:
						filter_dict['start_key'] = [value['start_key']]
					if 'end_key' in value.keys() and value['end_key']:
						filter_dict['end_key'] = [value['end_key'], {}]

					result = await self.db.view(dictionary['design'], key, **filter_dict)
				else:
					filter_dict = {
						'reduce': False,
					}
					result = {'rows': []}
					for val in value:
						filter_dict['start_key'] = [str(val)]
						filter_dict['end_key'] = [str(val), {}]
						intermediary = await self.db.view(dictionary['design'], key, **filter_dict)
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

			result = await self.db.view(dictionary['design'], dictionary['sort'], include_docs = True, **dictionary)
			return result
		elif filtered is None:
			result = await self.db.view(dictionary['design'], dictionary['sort'], include_docs=True, **dictionary)
			return result
		else:
			return {'rows': []}
	
	async def save_attachment(self, doc, file):
		attachment = {
			'name': file['filename'],
			'mimetype': file['content_type'],
			'data': file['body']
		}
		result = await self.db.save_attachment(doc, attachment)
		return result

	async def delete_attachment(self, doc, attachment_name):
		result = await self.db.delete_attachment(doc, attachment_name=attachment_name)
		return result

	async def get_attachment(self, doc, attachment_name):
		result = await self.db.get_attachment(doc, attachment_name=attachment_name)
		return result

	async def remove_amortization(self):
		result = await self.db.view('payments', 'classification', start_key=['Amortizari'], end_key=['Amortizari', {}], include_docs=True, reduce=False)
		for item in result['rows']:
			await self.db.delete_doc(item['doc'])

