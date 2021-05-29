angular
    .module('Conta')
    .factory('Settings', $http => ({
        all: () => $http.post('/settings').then(data => data.data.rows.map(row => row.doc)),
        get: id => $http.get('/settings/' + id).then(data => data.data),
        create: data => $http.put('/settings', data).then(data => data.data),
    }));