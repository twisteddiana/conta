from components.inventory.inventory import Inventory
import tornado.web
from tornado import gen
import pdfkit

class InventoryHandler(tornado.web.RequestHandler):
	@gen.coroutine
	def post(self):
		if self.request.body != b'':
			params = tornado.escape.json_decode(self.request.body)
		else:
			params = {}
		inventory = Inventory()
		inventory.initialise()

		docs = yield inventory.collection(params)
		self.write(docs)

	@gen.coroutine
	def get(self, id):
		inventory = Inventory()
		inventory.initialise()
		doc = yield inventory.get(id)
		if doc is None:
			self.set_status(404)
		else:
			self.write(doc)

	@gen.coroutine
	def put(self):
		dict = tornado.escape.json_decode(self.request.body)
		inventory = Inventory()
		inventory.initialise()
		doc = yield inventory.post(dict)
		self.write(doc)

	@gen.coroutine
	def delete(self, id):
		inventory = Inventory()
		inventory.initialise()

		doc = yield inventory.delete(id)
		self.write(doc)

class InventoryReportHandler(tornado.web.RequestHandler):
	@gen.coroutine
	def post(self):
		if self.request.body != b'':
			query = tornado.escape.json_decode(self.request.body)
		else:
			query = {}

		inventory = Inventory()
		inventory.initialise()

		list = yield inventory.report(query['date_start'])
		html = self.render_string('reports/inventory.html', inventory=list, inventory_date=query['date_end'])

		path_wkthmltopdf = b'C:\Program Files\wkhtmltopdf\\bin\wkhtmltopdf.exe'
		config = pdfkit.configuration(wkhtmltopdf=path_wkthmltopdf)
		my_pdf = pdfkit.from_string(html.decode('utf-8'), None, configuration=config)
		self.write(my_pdf)