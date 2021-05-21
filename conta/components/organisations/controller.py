from components.organisations.organisation import Organisation
import tornado.web
from tornado import gen
import couch
from lib.controller import ContaController

organisation = Organisation()
organisation.initialise()

class OrganisationsHandler(ContaController):
	@gen.coroutine
	def post(self):
		if self.request.body != b'':
			dict = tornado.escape.json_decode(self.request.body)
		else:
			dict = {}

		try:
			docs = yield organisation.collection(dict)
			self.write(docs)
		except couch.couch.CouchException as err:
			print(err)

	@gen.coroutine
	def get(self, view_name):
		docs = yield organisation.reduced_collection(view_name)
		self.write(docs)


class OrganisationHandler(ContaController):
	@gen.coroutine
	def get(self, id):
		doc = yield organisation.get(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)

	@gen.coroutine
	def post(self):
		dict = tornado.escape.json_decode(self.request.body)
		doc = yield organisation.post(dict)
		self.write(doc)

	@gen.coroutine
	def delete(self, id):
		doc = yield organisation.delete(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)
