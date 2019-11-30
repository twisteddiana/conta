from components.amortizations.amortization import Amortization
from components.entity.entity import Entity
import tornado.web
from tornado import gen
import pdfkit
from settings.settings import settings


class AmortizationsHandler(tornado.web.RequestHandler):
	@gen.coroutine
	def post(self):
		if self.request.body != b'':
			params = tornado.escape.json_decode(self.request.body)
		else:
			params = {}
		amortization = Amortization()
		amortization.initialise()

		docs = yield amortization.collection(params)
		if params['design'] == 'objects':
			for doc in docs['rows']:
				doc['doc']['liquidated'] = yield amortization.liquidated(doc['id'])
		self.write(docs)
		amortization.close()

	@gen.coroutine
	def get(self):
		entity = Entity()
		entity.initialise()
		amortization = Amortization()
		amortization.initialise()

		# delete existent entries
		yield entity.remove_amortization()
		# create new entries
		yield amortization.synchronize()
		amortization.close()
		entity.close()


class AmortizationHandler(tornado.web.RequestHandler):
	@gen.coroutine
	def get(self, id):
		amortization = Amortization()
		amortization.initialise()
		doc = yield amortization.get(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)

	@gen.coroutine
	def post(self):
		dict = tornado.escape.json_decode(self.request.body)
		amortization = Amortization()
		amortization.initialise()
		doc = yield amortization.post(dict)
		self.write(doc)
		amortization.close()

	@gen.coroutine
	def delete(self, id):
		amortization = Amortization()
		amortization.initialise()
		doc = yield amortization.delete(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)
		amortization.close()


class AmortizationSheetHandler(tornado.web.RequestHandler):
	@gen.coroutine
	def get(self, id):
		amortization = Amortization()
		amortization.initialise()

		doc = yield amortization.prepareSheet(id)
		if doc:
			html = self.render_string("reports/inventory_sheet.html", item=doc)

			my_pdf = pdfkit.from_string(html.decode('utf-8'), None, configuration=settings['pdfkit_config'])
			self.write(my_pdf)
		else:
			self.write('')
		amortization.close()