/**
 * Created by Diana on 11/15/2016.
 */
angular
  .module('Conta')
  .factory('Entity', $http => ({
    all: data => {
      data = data || {};
      data.descending = data.direction === 'desc' ? true : false;
      data.reduce = !!data.reduce;

      return $http.post('/entities', data).then(data => data.data);
    },
    get: id => $http.get(`/entity/${id}`).then(data => data.data),
    create: data => $http.post('/entity', data).then(data => data.data),
    delete: id => $http.delete(`/entity/${id}`).then(data => data.data),
    report: data => $http.post('/report', data,  { responseType: 'arraybuffer' }).then(data => data.data),
    statement: data => $http.post('/statement', data).then(data => data.data),
    export: data => $http.post('/export', data).then(data => data.data),
  }));

angular
  .module('Conta')
  .factory('Currency', $http => ({
    all: () =>
      $http
        .get('/currencies')
        .then(data => data.data.rows.map(row => row.doc)),
    get: id =>
      $http
        .get('/currencies/' + id)
        .then(data => data.data)
  }));

angular
  .module('Conta')
  .factory('ExchangeRates', $http => ({
    get: (currency_iso, date) => {
      let request;
      if (date) {
        request = $http.get(`/exchange_rates/${currency_iso}/${date}`);
      } else {
        request = $http.get(`/exchange_rates/${currency_iso}`);
      }
      return request.then(data => data.data)
    }
  }));

angular
  .module('Conta')
  .service('EntityAttachmentUpload', function($http) {
    return {
      upload: (files, entity) => {
        const fd = new FormData();
        angular.forEach(files, (file, key) => fd.append('file_' + key, file));

        fd.append('entity', JSON.stringify(entity));
        return $http
          .put('/entity/upload', fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
          })
          .then(data => data.data);
      },
      get: (name, entity) =>
        $http
          .post(`/entity/attachment/${name}`, entity, {responseType: 'arraybuffer'})
          .then(data => data.data),
      delete: (name, entity) =>
        $http
          .delete(`/entity/attachment?name=${name}&doc_id=${entity._id}&rev=${entity._rev}`)
          .then(data => data.data)
    }
  });
