from components.amortizations.amortization import Amortization
from components.entity.entity import Entity
from lib.controller import ContaController
import tornado.web
from tornado import gen
import pdfkit
from lib.settings import settings

amortization = Amortization()
amortization.initialise()
entity = Entity()
entity.initialise()

class AmortizationsHandler(ContaController):
	@gen.coroutine
	def post(self):
		if self.request.body != b'':
			params = tornado.escape.json_decode(self.request.body)
		else:
			params = {}

		docs = yield amortization.collection(params)
		if params['design'] == 'objects':
			for doc in docs['rows']:
				doc['doc']['liquidated'] = yield amortization.liquidated(doc['id'])
		self.write(docs)

	@gen.coroutine
	def get(self):
		# delete existent entries
		yield entity.remove_amortization()
		# create new entries
		yield amortization.synchronize()


class AmortizationHandler(ContaController):
	@gen.coroutine
	def get(self, id):
		doc = yield amortization.get(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)

	@gen.coroutine
	def post(self):
		dict = tornado.escape.json_decode(self.request.body)
		doc = yield amortization.post(dict)
		self.write(doc)

	@gen.coroutine
	def delete(self, id):
		doc = yield amortization.delete(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)


class AmortizationSheetHandler(ContaController):
	@gen.coroutine
	def get(self, id):
		doc = yield amortization.prepareSheet(id)
		if doc:
			html = self.render_string("reports/inventory_sheet.html", item=doc)

			my_pdf = pdfkit.from_string(html.decode('utf-8'), None, configuration=settings['pdfkit_config'])
			self.write(my_pdf)
		else:
			self.write('')