/**
 * Created by Diana on 11/22/2016.
 */
angular.module('Conta').factory('Amortization', ($http) => {
  return {
    all: (data) =>  {
      data = data || {};
      data.descending = data.direction === 'desc' ? true : false;
      data.reduce = !!data.reduce;

      return $http
        .post('/amortizations', data)
        .then(data => data.data);
    },

    get: id =>
      $http
        .get(`/amortization/${id}`)
        .then(data => data.data),
    create: data =>
      $http
        .post('/amortization', data)
        .then(data => data.data),
    delete: id =>
      $http
        .delete(`/amortization/${id}`)
        .then(data => data.data),
    synchronize: () =>
      $http
        .get('/amortizations')
        .then(data => data.data),
    downloadSheet: id =>
      $http
        .get('/amortization/sheet/'+id, {responseType: 'arraybuffer'})
        .then(data => data.data)
  }
});
