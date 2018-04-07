/**
 * Created by Diana on 5/1/2017.
 */
angular.module('Conta').factory('Expenses', function($http) {
    return {
        post: function (data) {
            if (typeof data == 'undefined')
                data = {};

            if (data['direction'] == 'desc')
                data['descending'] = true;
            else
                data['descending'] = false;

            if (typeof data['reduce'] == 'undefined')
                data['reduce'] = false;

            return $http.post('/expenses', data).then(data => data.data);
        },
        getOne: function(id) {
            var extension = "";
            if (typeof id != 'undefined')
                extension += "/"+id;
            return $http.get('/expense' + extension).then(data => data.data);
        },
        create: function(data) {
            return $http.put('/expense', data).then(data => data.data);
        },
        delete: function(id){
            return $http.delete('/expense/' + id).then(data => data.data);
        },
        synchronize: function() {
            return $http.get('/expenses').then(data => data.data);
        },
        downloadSheet: function(id) {
            return $http.get('/expenses/sheet/'+id, {responseType: 'arraybuffer'}).then(data => data.data);
        }
    }
})


angular.module('Conta').service('ExpensesAttachmentUpload', ['$http', function ($http) {
    return {
        upload: (files, expense) => {
            var fd = new FormData();
            angular.forEach(files, (file, key) => {
                fd.append('file_' + key, file);
            });
            fd.append('expense', JSON.stringify(expense));
            return $http.put('/expense/upload', fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).then(data => data.data);
        },
        getAttachment: function(name, expense) {
            name = encodeURIComponent(name);
            return $http.post('/expense/attachment/'+name, expense, {responseType: 'arraybuffer'}).then(data => data.data);
        },
        deleteAttachment: function(name, expense) {
            return $http.delete('/expense/attachment?name='+name + '&doc_id=' + expense._id + '&rev=' + expense._rev).then(data => data.data);
        }
    }
}]);
