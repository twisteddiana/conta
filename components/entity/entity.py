from components.couch import MyAsyncCouch
from tornado import gen
import time
from datetime import date, datetime, timedelta


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
		elif filtered is None:
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

