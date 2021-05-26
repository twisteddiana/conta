from components.couch import CouchClass


class Currency(CouchClass):
    db_name = 'currencies'

    async def collection(self):
        result = await self.db.view_all_docs(include_docs=True)
        return result

