from components.entity.entity import Entity
from components.entity.currency import Currency
from components.entity.exchange_rate import ExchangeRate
import tornado.web
from lib.controller import ContaController
import couch

entity = Entity()
exchange_rate = ExchangeRate()
currency = Currency()

class EntitiesHandler(ContaController):
	async def init(self):
		await entity.initialise()
		await exchange_rate.initialise()
		await currency.initialise()

	async def post(self):
		if self.request.body != b'':
			dict = tornado.escape.json_decode(self.request.body)
		else:
			dict = {}

		if not dict['reduce']:
			if not 'filter' in dict.keys() or not dict['filter']:
				try:
					docs = await entity.collection(dict)
					self.write(docs)
				except couch.couch.CouchException as err:
					print(err)
			else:
				docs = await entity.filter(dict)
				self.write(docs)
		else:
			docs = await entity.reduce(dict)
			self.write(docs)


class EntityHandler(ContaController):
	async def init(self):
		await entity.initialise()
		await exchange_rate.initialise()
		await currency.initialise()

	async def get(self, id):
		doc = await entity.get(id)
		super().write_or_404(doc)

	async def post(self):
		dict = tornado.escape.json_decode(self.request.body)
		doc = await entity.post(dict)
		self.write(doc)

	async def delete(self, id):
		result = await entity.delete(id)
		super().write_or_404(result)


class CurrenciesHandler(ContaController):
	async def init(self):
		await entity.initialise()
		await exchange_rate.initialise()
		await currency.initialise()

	async def get(self):
		try:
			docs = await currency.collection()
			self.write(docs)
		except couch.couch.CouchException as err:
			print(err)


class CurrencyHandler(ContaController):
	async def init(self):
		await entity.initialise()
		await exchange_rate.initialise()
		await currency.initialise()

	async def get(self):
		doc = await currency.get(id)
		super().write_or_404(doc)


class ExchangeRateHandler(ContaController):
	async def init(self):
		await entity.initialise()
		await exchange_rate.initialise()
		await currency.initialise()

	async def get(self, iso, request_date = None):
		doc = await exchange_rate.get(iso, request_date, True)
		self.write(doc)


class EntityUploadHandler(ContaController):
	async def init(self):
		await entity.initialise()
		await exchange_rate.initialise()
		await currency.initialise()

	async def put(self):
		post_entity = tornado.escape.json_decode(self.get_body_argument("entity"))
		for file in self.request.files:
			result = await entity.save_attachment(post_entity, self.request.files[file][0])
			post_entity = { '_id': result['id'], '_rev': result['rev'] }

		self.write(post_entity)

	async def post(self, attachment_name):
		doc = tornado.escape.json_decode(self.request.body)

		result = await entity.get_attachment(doc, attachment_name)
		self.write(result)

	async def delete(self):
		doc = {
			'_id': self.get_argument('doc_id'),
			'_rev': self.get_argument('rev')
		}

		result = await entity.delete_attachment(doc, self.get_argument('name'))
		self.write(result)
