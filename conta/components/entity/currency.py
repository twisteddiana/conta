from components.couch import MyAsyncCouch
from tornado import gen


class Currency:
    db = None

    @gen.coroutine
    def initialise(self):
        self.db = MyAsyncCouch('currencies')
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
    def collection(self):
        result = yield self.db.view_all_docs(include_docs=True)
        return result

