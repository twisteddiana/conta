/**
 * Created by Diana on 5/1/2017.
 */
angular
  .module('Conta')
  .factory('Expenses', ($http) => ({
    all: data => {
      data = data || {};
      data.descending = data.direction === 'desc' ? true : false;
      data.reduce = !!data.reduce;

      return $http
        .post('/expenses', data)
        .then(data => data.data);
    },
    get: id => $http.get(`/expense/${id}`).then(data => data.data),
    create: data => $http.put('/expense', data).then(data => data.data),
    delete: id => $http.delete(`/expense/${id}`).then(data => data.data),
    synchronize: () => $http.get('/expenses').then(data => data.data),
    downloadSheet: id => $http.get(`/expenses/sheet/${id}`, {responseType: 'arraybuffer'}).then(data => data.data)
  }));


angular
  .module('Conta')
  .service('ExpensesAttachmentUpload', function($http) {
    return {
      upload: (files, expense) => {
        const fd = new FormData();
        angular.forEach(files, (file, key) => {
          fd.append('file_' + key, file);
        });
        fd.append('expense', JSON.stringify(expense));
        return $http
          .put('/expense/upload', fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
          })
          .then(data => data.data);
      },
      get: (name, expense) =>
        $http
          .post(`/expense/attachment/${encodeURIComponent(name)}`, expense, {responseType: 'arraybuffer'})
          .then(data => data.data),
      delete: (name, expense) =>
        $http
          .delete(`/expense/attachment?name=${encodeURIComponent(name)}&doc_id=${expense._id}&rev=${expense.rev}`)
          .then(data => data.data)
    }
  });
