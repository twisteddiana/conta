import os

settings = {
    "template_path": os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates"),
    "static_path": os.path.join(os.path.dirname(os.path.dirname(__file__)), "../static"),
    "debug" : True
}