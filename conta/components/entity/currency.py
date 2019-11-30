from components.couch import CouchClass
from tornado import gen


class Currency(CouchClass):
    @gen.coroutine
    def initialise(self):
        yield super().initialise('currencies')

    @gen.coroutine
    def get(self, id):
        has_doc = yield self.db.has_doc(id)
        if has_doc:
            doc = yield self.db.get_doc(id)
        else:
            doc = None
        return doc

    @gen.coroutine
    def collection(self):
        result = yield self.db.view_all_docs(include_docs=True)
        return result

