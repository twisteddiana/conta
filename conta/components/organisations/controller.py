from components.organisations.organisation import Organisation
import tornado.web
import couch
from lib.controller import ContaController

organisation = Organisation()


class OrganisationsHandler(ContaController):
	async def init(self):
		await organisation.initialise()

	async def post(self):
		if self.request.body != b'':
			dict = tornado.escape.json_decode(self.request.body)
		else:
			dict = {}

		try:
			docs = await organisation.collection(dict)
			self.write(docs)
		except couch.couch.CouchException as err:
			print(err)

	async def get(self, view_name):
		docs = await organisation.reduced_collection(view_name)
		self.write(docs)


class OrganisationHandler(ContaController):
	async def init(self):
		await organisation.initialise()

	async def get(self, id):
		doc = await organisation.get(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)

	async def post(self):
		dict = tornado.escape.json_decode(self.request.body)
		doc = await organisation.post(dict)
		self.write(doc)

	async def delete(self, id):
		doc = await organisation.delete(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)
