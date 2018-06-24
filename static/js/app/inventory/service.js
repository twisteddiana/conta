/**
 * Created by Diana on 12/3/2016.
 */
/**
 * Created by Diana on 11/22/2016.
 */
angular
  .module('Conta')
  .factory('Inventory', ($http) => ({
    all:  (data) => {
      data = data || {};
      data.descending = data.direction === 'desc' ? true : false;
      data.reduce = !!data.reduce;

      return $http.post('/inventory', data).then(data => data.data);
    },
    get: (id) => $http.get(`/inventory/${id}`).then(data => data.data),
    create: (data) => $http.put('/inventory', data).then(data => data.data),
    delete: (id) => $http.delete(`/inventory/${id}`).then(data => data.data),
    report: (data) => $http.post('/inventory/report', data, { responseType: 'arraybuffer' }).then(data => data.data)
}));
