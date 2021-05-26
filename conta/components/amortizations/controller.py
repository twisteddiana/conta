from components.amortizations.amortization import Amortization
from components.entity.entity import Entity
from lib.controller import ContaController
import tornado.web
import pdfkit
from lib.env import env

amortization = Amortization()
entity = Entity()

class AmortizationsHandler(ContaController):
	async def init(self):
		await amortization.initialise()
		await entity.initialise()

	async def post(self):
		if self.request.body != b'':
			params = tornado.escape.json_decode(self.request.body)
		else:
			params = {}

		docs = await amortization.collection(params)
		if params['design'] == 'objects':
			for doc in docs['rows']:
				doc['doc']['liquidated'] = await amortization.liquidated(doc['id'])
		self.write(docs)

	async def get(self):
		# delete existent entries
		await entity.remove_amortization()
		# create new entries
		await amortization.synchronize()


class AmortizationHandler(ContaController):
	async def init(self):
		await amortization.initialise()
		await entity.initialise()

	async def get(self, id):
		doc = await amortization.get(id)
		super().write_or_404(doc)

	async def post(self):
		dict = tornado.escape.json_decode(self.request.body)
		doc = await amortization.post(dict)
		self.write(doc)

	async def delete(self, id):
		result = await amortization.delete(id)
		super().write_or_404(result)


class AmortizationSheetHandler(ContaController):
	async def init(self):
		await amortization.initialise()
		await entity.initialise()

	async def get(self, id):
		doc = await amortization.prepare_sheet(id)
		if doc:
			html = self.render_string("reports/inventory_sheet.html", item=doc)

			my_pdf = pdfkit.from_string(html.decode('utf-8'), None, configuration=env['pdfkit_config'])
			self.write(my_pdf)
		else:
			self.write('')