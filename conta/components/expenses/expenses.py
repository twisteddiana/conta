from components.couch import MyAsyncCouch
from tornado import gen
from components.entity.entity import Entity
from components.lib.moment import *


class Expenses:
	db = None

	@gen.coroutine
	def initialise(self):
		self.db = MyAsyncCouch('expenses')
		try:
			yield self.db.create_db()
		except:
			pass

	@gen.coroutine
	def get(self, id):
		has_doc = yield self.db.has_doc(id)
		if (has_doc):
			doc = yield self.db.get_doc(id)
		else:
			doc = None
		return doc

	@gen.coroutine
	def post(self, doc):
		doc['date_clear'] = doc['date']
		doc['deductible_amount'] = round(doc['deductible_amount'], 2)
		doc['date'] = timestamp(get_date(doc['date']))

		document = yield self.db.save_doc(doc)
		entity = Entity()
		entity.initialise()
		if 'payment_id' in doc.keys():
			entity_doc = yield entity.get(doc['payment_id'])
		else:
			entity_doc = None

		if entity_doc is None:
			entity_doc = {
				'real_amount': doc['deductible_amount'],
				'document_number': doc['document_number'],
				'deductible_amount': doc['deductible_amount'],
				'currency': doc['currency'],
				'date': doc['date_clear'],
				'deductible': 100,
				'classification': 'Intretinere',
				'description': ' '.join(['Decont', doc['document_number']]),
				'document_type': 'Decont',
				'type': 'payment',
				'payment_type': 'Cash',
				'amount': doc['deductible_amount']
			}
			result = yield entity.post(entity_doc)
			doc = yield self.get(document['id'])
			doc['payment_id'] = result['id']
			document = yield self.db.save_doc(doc)
		else:
			entity_doc['real_amount'] = doc['deductible_amount']
			entity_doc['document_number'] = doc['document_number']
			entity_doc['deductible_amount'] = doc['deductible_amount']
			entity_doc['date'] = doc['date_clear']
			entity_doc['deductible'] = 100
			entity_doc['description'] = ' '.join(['Decont', doc['document_number']])
			entity_doc['amount'] = doc['deductible_amount']
			yield entity.post(entity_doc)

		return document

	@gen.coroutine
	def delete(self, id):
		has_doc = yield self.db.has_doc(id)
		if has_doc:
			doc = yield self.db.get_doc(id)
			doc = yield self.db.delete_doc(doc)
		else:
			doc = None
		return doc

	@gen.coroutine
	def collection(self, dict):
		result = yield self.db.view(dict['design'], dict['sort'], include_docs=True, **dict)
		return result

	@gen.coroutine
	def save_attachment(self, doc, file):
		attachment = {
			'name': file['filename'],
			'mimetype': file['content_type'],
			'data': file['body']
		}
		result = yield self.db.save_attachment(doc, attachment)
		return result

	@gen.coroutine
	def delete_attachment(self, doc, attachment_name):
		result = yield self.db.delete_attachment(doc, attachment_name=attachment_name)
		return result

	@gen.coroutine
	def get_attachment(self, doc, attachment_name):
		result = yield self.db.get_attachment(doc, attachment_name=attachment_name)
		return result

	@gen.coroutine
	def prepareSheet(self, id):
		doc = yield self.get(id)
		return doc