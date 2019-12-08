from components.organisations.organisation import Organisation
import tornado.web
from tornado import gen
import couch
from lib.controller import ContaController


class OrganisationsHandler(ContaController):
	@gen.coroutine
	def post(self):
		if self.request.body != b'':
			dict = tornado.escape.json_decode(self.request.body)
		else:
			dict = {}
		organisation = Organisation()
		organisation.initialise()
		try:
			docs = yield organisation.collection(dict)
			self.write(docs)
		except couch.couch.CouchException as err:
			print(err)
		organisation.close()

	@gen.coroutine
	def get(self, view_name):
		organisation = Organisation()
		organisation.initialise()
		docs = yield organisation.reduced_collection(view_name)
		self.write(docs)
		organisation.close()


class OrganisationHandler(ContaController):
	@gen.coroutine
	def get(self, id):
		organisation = Organisation()
		organisation.initialise()
		doc = yield organisation.get(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)
		organisation.close()

	@gen.coroutine
	def post(self):
		dict = tornado.escape.json_decode(self.request.body)
		organisation = Organisation()
		organisation.initialise()
		doc = yield organisation.post(dict)
		self.write(doc)
		organisation.close()

	@gen.coroutine
	def delete(self, id):
		organisation = Organisation()
		organisation.initialise()
		doc = yield organisation.delete(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)
		organisation.close()
