import os
import platform
import pdfkit

settings = {
    'template_path': os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates'),
    'static_path': os.path.join(os.path.dirname(os.path.dirname(__file__)), '../static'),
    'debug' : True,
    'couch_url': os.environ.get('COUCH_URL') or 'http://127.0.0.1:5984/',
}

if platform.system() == 'Windows':
    path_wkthmltopdf = b'C:\Program Files\wkhtmltopdf\\bin\wkhtmltopdf.exe'
    settings['pdfkit_config'] = pdfkit.configuration(wkhtmltopdf=path_wkthmltopdf)
else:
    settings['pdfkit_config'] = None
