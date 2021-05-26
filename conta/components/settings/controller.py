from components.settings.settings import Settings
import tornado.web
from lib.controller import ContaController

settings = Settings()

class SettingsHandler(ContaController):
	async def init(self):
		await settings.initialise()

	async def get(self, id):
		doc = await settings.get(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)

	async def post(self):
		dict = tornado.escape.json_decode(self.request.body)
		doc = await settings.post(dict)
		self.write(doc)

	def delete(self, id):
		doc = yield settings.delete(id)
		if (doc is None):
			self.set_status(404)
		else:
			self.write(doc)
