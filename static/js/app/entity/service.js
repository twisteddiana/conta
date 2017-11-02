/**
 * Created by Diana on 11/15/2016.
 */
Conta.factory('Entity', function($http) {
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

            return $http.post('/entities', data);
        },
        getOne: function(id) {
            var extension = "";
            if (typeof id != 'undefined')
                extension += "/"+id;
            return $http.get('/entity' + extension);
        },
        create: function(data) {
            return $http.post('/entity', data);
        },
        delete: function(id){
            return $http.delete('/entity/' + id);
        },
        report: function(data) {
            return $http.post('/report', data,  {responseType: 'arraybuffer'});
        },
        statement: function(data) {
            return $http.post('/statement', data);
        }
    }
})

Conta.factory('Currency', function($http) {
    return {
        get: function () {
            return $http.get('/currencies');
        },
        getOne: function(id) {
            var extension = "";
            if (typeof id != 'undefined')
                extension += "/"+id;
            return $http.get('/currency' + extension);
        }
    }
})

Conta.factory('ExchangeRates', function($http) {
    return {
        get: function(currency_iso, date) {
            if (typeof date == 'undefined')
                return $http.get('/exchange_rates/'+currency_iso);
            else
                return $http.get('/exchange_rates/'+currency_iso+'/'+date);
        }
    }
})

Conta.service('EntityAttachmentUpload', ['$http', function ($http) {
    return {
        upload: function (file, entity) {
            var fd = new FormData();
            fd.append('file', file);
            fd.append('entity', JSON.stringify(entity));
            return $http.put('/entity/upload', fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            })
        },
        getAttachment: function(name, entity) {
            return $http.post('/entity/attachment/'+name, entity, {responseType: 'arraybuffer'});
        },
        deleteAttachment: function(name, entity) {
            return $http.delete('/entity/attachment?name='+name + '&doc_id=' + entity._id + '&rev=' + entity._rev);
        }
    }
}]);
