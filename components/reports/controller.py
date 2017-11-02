from components.entity.entity import Entity, Currency, ExchangeRate
from components.amortizations.amortization import Amortization
import tornado.web
from tornado import gen
import couch
import pdfkit

class ReportHandler(tornado.web.RequestHandler):
	@gen.coroutine
	def post(self):
		if self.request.body != b'':
			query = tornado.escape.json_decode(self.request.body)
		else:
			query = {}

		if 'classification' in query.keys():
			if query['classification'] == 'Amortizari' and query['report'] == 'sheet':
				html = yield self.report_amortization(query)
			else:
				# other sheet or journal
				html = yield self.general_report(query)
		else:
			# registry
			html = yield self.registry_report(query)

		path_wkthmltopdf = b'C:\Program Files\wkhtmltopdf\\bin\wkhtmltopdf.exe'
		config = pdfkit.configuration(wkhtmltopdf=path_wkthmltopdf)
		my_pdf = pdfkit.from_string(html.decode('utf-8'), None, configuration=config)
		self.write(my_pdf)

	@gen.coroutine
	def report_amortization(self, query):
		amortization = Amortization()
		amortization.initialise()

		result = yield amortization.report(query)
		html = self.render_string("reports/" + query['report'] + '.html', classification=query['classification'],
								report=result['report'], transactions=result['transactions'])

		return html

	@gen.coroutine
	def general_report(self, query):
		entity = Entity()
		entity.initialise()

		result = yield entity.report(query)

		html = self.render_string("reports/" + query['report'] + '.html', classification=query['classification'],
								report=result['report'], transactions=result['transactions'])

		return html

	@gen.coroutine
	def registry_report(self, query):
		entity = Entity()
		entity.initialise()

		result = yield entity.report(query)

		html = self.render_string("reports/" + query['report'] + '.html',
								report=result['report'], transactions=result['transactions'])

		return html

class StatementHandler(tornado.web.RequestHandler):
	@gen.coroutine
	def post(self):
		if self.request.body != b'':
			query = tornado.escape.json_decode(self.request.body)
		else:
			query = {}

		entity = Entity()
		entity.initialise()

		result = yield entity.statement(query)
		self.write(result)