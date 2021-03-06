from components.amortizations.amortization import Amortization
from components.entity.entity_report import EntityReport
import tornado.web
from tornado import gen
import pdfkit
from lib.settings import settings
from lib.controller import ContaController


class ReportHandler(ContaController):
	@gen.coroutine
	def post(self):
		if self.request.body != b'':
			query = tornado.escape.json_decode(self.request.body)
		else:
			query = {}

		if 'classification' in query.keys() and query['classification']:
			if query['classification'] == 'Amortizari' and query['report'] == 'sheet':
				html = yield self.report_amortization(query)
			else:
				# other sheet or journal
				html = yield self.general_report(query)
		elif query['report'] == 'fiscal_evidence':
			# fiscal evidence
			html = yield self.fiscal_evidence_report(query)
		else:
			# registry
			html = yield self.registry_report(query)

		my_pdf = pdfkit.from_string(html.decode('utf-8'), None, configuration=settings['pdfkit_config'])
		self.write(my_pdf)

	@gen.coroutine
	def report_amortization(self, query):
		amortization = Amortization()
		amortization.initialise()

		result = yield amortization.report(query)
		html = self.render_string("reports/" + query['report'] + '.html', classification=query['classification'],
								report=result['report'], transactions=result['transactions'])

		amortization.close()
		return html

	@gen.coroutine
	def general_report(self, query):
		entity = EntityReport()
		entity.initialise()

		result = yield entity.report(query)

		html = self.render_string("reports/" + query['report'] + '.html', classification=query['classification'],
								report=result['report'], transactions=result['transactions'])
		entity.close()
		return html

	@gen.coroutine
	def registry_report(self, query):
		entity = EntityReport()
		entity.initialise()

		result = yield entity.report(query)

		html = self.render_string("reports/" + query['report'] + '.html',
								report=result['report'], transactions=result['transactions'])
		entity.close()
		return html

	@gen.coroutine
	def fiscal_evidence_report(self, query):
		entity = EntityReport()
		entity.initialise()

		result = yield entity.fiscal_evidence_report(query)

		html = self.render_string("reports/" + query['report'] + '.html',
								year=result['year'], classifications=result['classifications'])
		entity.close()
		return html

class StatementHandler(ContaController):
	@gen.coroutine
	def post(self):
		if self.request.body != b'':
			query = tornado.escape.json_decode(self.request.body)
		else:
			query = {}

		entity = EntityReport()
		entity.initialise()

		result = yield entity.statement(query)
		self.write(result)
		entity.close()


class ExportHandler(ContaController):
	@gen.coroutine
	def post(self):
		if self.request.body != b'':
			query = tornado.escape.json_decode(self.request.body)
		else:
			query = {}

		entity = EntityReport()
		entity.initialise()

		result = yield entity.export(query)
		self.write(result)
		entity.close()