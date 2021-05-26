from components.amortizations.amortization import Amortization
from components.entity.entity_report import EntityReport
import tornado.web
import pdfkit
from lib.env import env
from lib.controller import ContaController

amortization = Amortization()
entity = EntityReport()

class ReportHandler(ContaController):
	async def init(self):
		await entity.initialise()
		await amortization.initialise()

	async def post(self):
		if self.request.body != b'':
			query = tornado.escape.json_decode(self.request.body)
		else:
			query = {}

		if 'classification' in query.keys() and query['classification']:
			if query['classification'] == 'Amortizari' and query['report'] == 'sheet':
				html = await self.report_amortization(query)
			else:
				# other sheet or journal
				html = await self.general_report(query)
		elif query['report'] == 'fiscal_evidence':
			# fiscal evidence
			html = await self.fiscal_evidence_report(query)
		else:
			# registry
			html = await self.registry_report(query)

		my_pdf = pdfkit.from_string(html.decode('utf-8'), None, configuration=env['pdfkit_config'])
		self.write(my_pdf)

	async def report_amortization(self, query):
		result = await amortization.report(query)
		html = self.render_string("reports/" + query['report'] + '.html', classification=query['classification'],
								report=result['report'], transactions=result['transactions'])
		return html

	async def general_report(self, query):
		result = await entity.report(query)
		html = self.render_string("reports/" + query['report'] + '.html', classification=query['classification'],
								report=result['report'], transactions=result['transactions'])
		return html

	async def registry_report(self, query):
		result = await entity.report(query)
		html = self.render_string("reports/" + query['report'] + '.html',
								report=result['report'], transactions=result['transactions'])
		return html

	async def fiscal_evidence_report(self, query):
		result = await entity.fiscal_evidence_report(query)
		html = self.render_string("reports/" + query['report'] + '.html',
								year=result['year'], classifications=result['classifications'])
		return html

class StatementHandler(ContaController):
	async def init(self):
		await entity.initialise()
		await amortization.initialise()

	async def post(self):
		if self.request.body != b'':
			query = tornado.escape.json_decode(self.request.body)
		else:
			query = {}

		result = await entity.statement(query)
		self.write(result)


class ExportHandler(ContaController):
	async def init(self):
		await entity.initialise()
		await amortization.initialise()

	async def post(self):
		if self.request.body != b'':
			query = tornado.escape.json_decode(self.request.body)
		else:
			query = {}

		result = await entity.export(query)
		self.write(result)
