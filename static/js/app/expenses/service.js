/**
 * Created by Diana on 5/1/2017.
 */
Conta.factory('Expenses', function($http) {
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

            return $http.post('/expenses', data);
        },
        getOne: function(id) {
            var extension = "";
            if (typeof id != 'undefined')
                extension += "/"+id;
            return $http.get('/expense' + extension);
        },
        create: function(data) {
            return $http.put('/expense', data);
        },
        delete: function(id){
            return $http.delete('/expense/' + id);
        },
        synchronize: function() {
            return $http.get('/expenses');
        },
        downloadSheet: function(id) {
            return $http.get('/expenses/sheet/'+id, {responseType: 'arraybuffer'});
        }
    }
})


Conta.service('ExpensesAttachmentUpload', ['$http', function ($http) {
    return {
        upload: function (file, expense) {
            window.console.log(expense);
            var fd = new FormData();
            fd.append('file', file);
            fd.append('expense', JSON.stringify(expense));
            return $http.put('/expense/upload', fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            })
        },
        getAttachment: function(name, expense) {
            name = encodeURIComponent(name);
            return $http.post('/expense/attachment/'+name, expense, {responseType: 'arraybuffer'});
        },
        deleteAttachment: function(name, expense) {
            return $http.delete('/expense/attachment?name='+name + '&doc_id=' + expense._id + '&rev=' + expense._rev);
        }
    }
}]);
