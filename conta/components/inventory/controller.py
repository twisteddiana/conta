from components.inventory.inventory import Inventory
import tornado.web
import pdfkit
from lib.env import env
from lib.controller import ContaController

inventory = Inventory()

class InventoryHandler(ContaController):
	async def init(self):
		await inventory.initialise()

	async def post(self):
		if self.request.body != b'':
			params = tornado.escape.json_decode(self.request.body)
		else:
			params = {}

		docs = await inventory.collection(params)
		self.write(docs)

	async def get(self, id):
		doc = await inventory.get(id)
		if doc is None:
			self.set_status(404)
		else:
			self.write(doc)

	async def put(self):
		dict = tornado.escape.json_decode(self.request.body)
		doc = await inventory.post(dict)
		self.write(doc)

	async def delete(self, id):
		doc = await inventory.delete(id)
		self.write(doc)

class InventoryReportHandler(ContaController):
	async def init(self):
		await inventory.initialise()

	async def post(self):
		if self.request.body != b'':
			query = tornado.escape.json_decode(self.request.body)
		else:
			query = {}

		list = await inventory.report(query['date_start'])
		html = self.render_string('reports/inventory.html', inventory=list, inventory_date=query['date_end'])

		my_pdf = pdfkit.from_string(html.decode('utf-8'), None, configuration=env['pdfkit_config'])
		self.write(my_pdf)
