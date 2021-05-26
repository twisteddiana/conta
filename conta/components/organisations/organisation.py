from components.couch import CouchClass
import time

class Organisation(CouchClass):
	db_name = 'organisations'

	async def post(self, dict):
		if 'date_added' in dict.keys():
			dict['date_updated'] = int(time.time())
		else:
			dict['date_added'] = int(time.time())
		doc = await self.db.save_doc(dict)
		return doc

	async def collection(self, dict):
		result = await self.db.view('sort', dict['sort'], include_docs = True, **dict)
		return result

	async def reduced_collection(self, view_name):
		result = await self.db.view('reduced', view_name)
		return result
