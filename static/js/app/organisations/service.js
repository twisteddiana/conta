/**
 * Created by Diana on 11/12/2016.
 */
angular.module('Conta').factory('Organisation', function($http) {
    return {
        post: function (data) {
            if (typeof data == 'undefined')
                data = {};

            if (typeof data['direction'] != 'undefined' && data['direction'] == 'desc')
                data['descending'] = true;
            else
                data['descending'] = false;

            return $http.post('/organisations', data).then(data => data.data);
        },
        get: function (view_name) {
            return $http.get('/organisations/'+view_name).then(data => data.data);
        },
        getOne: function(id) {
            var extension = "";
            if (typeof id != 'undefined')
                extension += "/"+id;
            return $http.get('/organisation' + extension).then(data => data.data);
        },
        create: function(data) {
            return $http.post('/organisation', data).then(data => data.data);
        },
        delete: function(id){
            return $http.delete('/organisation/' + id).then(data => data.data);
        },
    }
})