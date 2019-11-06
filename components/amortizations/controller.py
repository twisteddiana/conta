from components.amortizations.amortization import Amortization
from components.entity.entity import Entity
import tornado.web
from tornado import gen
import pdfkit


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

	@gen.coroutine
	def get(self):
		entity = Entity()
		entity.initialise()
		amortization = Amortization()
		amortization.initialise()

		#delete existent entries
		yield entity.remove_amortization()
		#create new entries
		result = yield amortization.synchronize()


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

	@gen.coroutine
	def delete(self, id):
		amortization = Amortization()
		amortization.initialise()
		doc = yield amortization.delete(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)

class AmortizationSheetHandler(tornado.web.RequestHandler):
	@gen.coroutine
	def get(self, id):
		amortization = Amortization()
		amortization.initialise()

		doc = yield amortization.prepareSheet(id)
		if doc:
			html = self.render_string("reports/inventory_sheet.html", item=doc)

			path_wkthmltopdf = b'C:\Program Files\wkhtmltopdf\\bin\wkhtmltopdf.exe'
			config = pdfkit.configuration(wkhtmltopdf=path_wkthmltopdf)
			my_pdf = pdfkit.from_string(html.decode('utf-8'), None, configuration=config)
			self.write(my_pdf)
		else:
			self.write('')