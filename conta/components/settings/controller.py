from components.settings.settings import Settings
import tornado.web
from lib.controller import ContaController

settings = Settings()

class SettingsHandler(ContaController):
	async def init(self):
		await settings.initialise()

	async def post(self):
		result = await settings.collection()
		self.write_or_404(result)

	async def get(self, id):
		doc = await settings.get(id)
		self.write_or_404(doc)

	async def put(self):
		dict = tornado.escape.json_decode(self.request.body)
		doc = await settings.post(dict)
		self.write(doc)

	def delete(self, id):
		result = yield settings.delete(id)
		self.write_or_404(result)
