from setuptools import setup, find_packages

setup(name='conta',
      version='0.1',
      description='Book keeping (BETA)',
      url='https://github.com/twisteddiana/conta',
      author='twisteddiana',
      author_email='',
      license='MIT',
      packages=find_packages(),
      install_requires=[
          'couch',
          'tornado',
          'tornado-couchdb',
          'pdfkit',
          'xmltodict'
      ],
      zip_safe=False)