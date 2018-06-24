/**
 * Created by Diana on 11/12/2016.
 */
angular.module('Conta').factory('Organisation', function($http) {
  return {
    all: (data) => {
      data = data || {};
      data.descending = data.direction === 'desc' ? true : false;
      return $http.post('/organisations', data).then(data => data.data);
    },
    list: view => $http.get('/organisations/' + view).then(data => data.data),
    get: (id) => $http.get('/organisation/' + id).then(data => data.data),
    create: (data) => $http.post('/organisation', data).then(data => data.data),
    delete: (id) => $http.delete('/organisation/' + id).then(data => data.data),
  }
});
