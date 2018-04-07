/**
 * Created by Diana on 11/15/2016.
 */
angular.module('Conta').factory('Entity', ($http) => {
    return {
        post: (data) => {
            if (typeof data == 'undefined')
                data = {};

            if (data['direction'] == 'desc')
                data['descending'] = true;
            else
                data['descending'] = false;

            if (typeof data['reduce'] == 'undefined')
                data['reduce'] = false;

            return $http.post('/entities', data).then(data => data.data);
        },
        getOne: (id) => {
            var extension = "";
            if (typeof id != 'undefined')
                extension += "/"+id;
            return $http.get('/entity' + extension).then(data => data.data);
        },
        create: (data) => {
            return $http.post('/entity', data).then(data => data.data);
        },
        delete: (id) =>{
            return $http.delete('/entity/' + id).then(data => data.data);
        },
        report: (data) => {
            return $http.post('/report', data,  {responseType: 'arraybuffer'}).then(data => data.data);
        },
        statement: (data) => {
            return $http.post('/statement', data).then(data => data.data);
        }
    }
})

angular.module('Conta').factory('Currency', ($http) => {
    return {
        get: function () {
            return $http.get('/currencies').then(data => data.data);
        },
        getOne: (id) => {
            var extension = "";
            if (typeof id != 'undefined')
                extension += "/"+id;
            return $http.get('/currency' + extension).then(data => data.data);
        }
    }
})

angular.module('Conta').factory('ExchangeRates', ($http) => {
    return {
        get: (currency_iso, date) => {
            if (typeof date == 'undefined')
                return $http.get('/exchange_rates/'+currency_iso).then(data => data.data);
            else
                return $http.get('/exchange_rates/'+currency_iso+'/'+date).then(data => data.data);
        }
    }
})

angular.module('Conta').service('EntityAttachmentUpload', ['$http', function ($http) {
    return {
        upload: (files, entity) => {
            var fd = new FormData();
            angular.forEach(files, (file, key) => {
               fd.append('file_' + key, file);
            });
            fd.append('entity', JSON.stringify(entity));
            return $http.put('/entity/upload', fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).then(data => data.data);
        },
        getAttachment: (name, entity) => {
            return $http.post('/entity/attachment/'+name, entity, {responseType: 'arraybuffer'}).then(data => data.data);
        },
        deleteAttachment: (name, entity) => {
            return $http.delete('/entity/attachment?name='+name + '&doc_id=' + entity._id + '&rev=' + entity._rev).then(data => data.data);
        }
    }
}]);
