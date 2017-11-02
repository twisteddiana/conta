/**
 * Created by Diana on 11/22/2016.
 */
Conta.factory('Amortization', function($http) {
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

            return $http.post('/amortizations', data);
        },
        getOne: function(id) {
            var extension = "";
            if (typeof id != 'undefined')
                extension += "/"+id;
            return $http.get('/amortization' + extension);
        },
        create: function(data) {
            return $http.post('/amortization', data);
        },
        delete: function(id){
            return $http.delete('/amortization/' + id);
        },
        synchronize: function() {
            return $http.get('/amortizations');
        },
        downloadSheet: function(id) {
            return $http.get('/amortization/sheet/'+id, {responseType: 'arraybuffer'});
        }
    }
})