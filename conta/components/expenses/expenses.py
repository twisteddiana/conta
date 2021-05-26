from components.couch import CouchClass
from components.entity.entity import Entity
from lib.moment import *

entity = Entity()

class Expenses(CouchClass):
	db_name = 'expenses'

	async def post(self, doc):
		doc['date_clear'] = doc['date']
		doc['deductible_amount'] = round(doc['deductible_amount'], 2)
		doc['date'] = timestamp(get_date(doc['date']))

		expense_result = await self.db.save_doc(doc)
		if 'payment_id' in doc.keys():
			entity_doc = await entity.get(doc['payment_id'])
		else:
			entity_doc = None

		if entity_doc is None:
			entity_doc = {
				'real_amount': doc['deductible_amount'],
				'real_vat': 0,
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
			entity_result = await entity.post(entity_doc)
			doc = await self.get(expense_result['id'])
			doc['payment_id'] = entity_result['id']
			expense_result = await self.db.save_doc(doc)
		else:
			entity_doc['real_amount'] = doc['deductible_amount']
			entity_doc['document_number'] = doc['document_number']
			entity_doc['deductible_amount'] = doc['deductible_amount']
			entity_doc['date'] = doc['date_clear']
			entity_doc['deductible'] = 100
			entity_doc['description'] = ' '.join(['Decont', doc['document_number']])
			entity_doc['amount'] = doc['deductible_amount']
			await entity.post(entity_doc)

		return expense_result

	async def save_attachment(self, doc, file):
		attachment = {
			'name': file['filename'],
			'mimetype': file['content_type'],
			'data': file['body']
		}
		result = await self.db.save_attachment(doc, attachment)
		return result

	async def delete_attachment(self, doc, attachment_name):
		result = await self.db.delete_attachment(doc, attachment_name=attachment_name)
		return result

	async def get_attachment(self, doc, attachment_name):
		result = await self.db.get_attachment(doc, attachment_name=attachment_name)
		return result

	async def prepare_sheet(self, id):
		doc = await self.get(id)
		return doc