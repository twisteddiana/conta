from components.entity.entity import Entity
from components.entity.currency import Currency
from components.entity.exchange_rate import ExchangeRate
import tornado.web
from lib.controller import ContaController
from tornado import gen
import couch


class EntitiesHandler(ContaController):
	async def post(self):
		if self.request.body != b'':
			dict = tornado.escape.json_decode(self.request.body)
		else:
			dict = {}
		entity = Entity()
		entity.initialise()

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
		#entity.close()


class EntityHandler(ContaController):
	@gen.coroutine
	def get(self, id):
		entity = Entity()
		entity.initialise()
		doc = yield entity.get(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)
		entity.close()

	@gen.coroutine
	def post(self):
		dict = tornado.escape.json_decode(self.request.body)
		entity = Entity()
		entity.initialise()
		doc = yield entity.post(dict)
		self.write(doc)
		entity.close()

	@gen.coroutine
	def delete(self, id):
		entity = Entity()
		entity.initialise()
		doc = yield entity.delete(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)
		entity.close()


class CurrenciesHandler(ContaController):
	@gen.coroutine
	def get(self):
		currency = Currency()
		currency.initialise()
		try:
			docs = yield currency.collection()
			self.write(docs)
		except couch.couch.CouchException as err:
			print(err)
		currency.close()


class CurrencyHandler(ContaController):
	@gen.coroutine
	def get(self, **params):
		currency = Currency()
		currency.initialise()
		doc = yield currency.get(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)
		currency.close()


class ExchangeRateHandler(ContaController):
	@gen.coroutine
	def get(self, iso, request_date = None):
		exchange_rate = ExchangeRate()
		exchange_rate.initialise()
		doc = yield exchange_rate.get(iso, request_date, True)
		self.write(doc)
		exchange_rate.close()


class EntityUploadHandler(ContaController):
	@gen.coroutine
	def put(self):
		post_entity = tornado.escape.json_decode(self.get_body_argument("entity"))
		entity = Entity()
		entity.initialise()
		for file in self.request.files:
			result = yield entity.save_attachment(post_entity, self.request.files[file][0])
			post_entity = { '_id': result['id'], '_rev': result['rev'] }

		self.write(post_entity)
		entity.close()

	@gen.coroutine
	def post(self, attachment_name):
		doc = tornado.escape.json_decode(self.request.body)
		entity = Entity()
		entity.initialise()

		result = yield entity.get_attachment(doc, attachment_name)
		self.write(result)
		entity.close()

	@gen.coroutine
	def delete(self):
		doc = {
			'_id': self.get_argument('doc_id'),
			'_rev': self.get_argument('rev')
		}
		entity = Entity()
		entity.initialise()

		result = yield entity.delete_attachment(doc, self.get_argument('name'))
		self.write(result)
		entity.close()
