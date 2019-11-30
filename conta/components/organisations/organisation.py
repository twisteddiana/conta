from components.couch import MyAsyncCouch
from tornado import gen
import time

class Organisation:
	db = None

	@gen.coroutine
	def initialise(self):
		self.db = MyAsyncCouch('organisations')
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
		result = yield self.db.view('sort', dict['sort'], include_docs = True, **dict)
		return result

	@gen.coroutine
	def reducedCollection(self, view_name):
		result = yield self.db.view('reduced', view_name)
		return result


# @gen.coroutine
# def main():
# 	organisation = Organisation()
# 	organisation.initialise()
# 	doc = yield organisation.collection(limit = 1)
# 	print(doc)

