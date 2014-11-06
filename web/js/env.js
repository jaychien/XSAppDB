/**
 * Created by Derek on 2014/11/6.
 */

angular.module('envModule', [])

.directive('env', ['$http', function($http) {
return {
    restrict: 'E',
    replace: true,
    template: '<div>{{env}}</div>',
    link: function($scope, element, attributes) {
        element.css("position", "absolute");
        element.css("top", "2px");
        element.css("left", "2px");
        element.css("font-size", "10pt");
        element.css("background-color", "#ff0000");
        element.css("color", "#ffff00");
    },
    controller: function($scope) {
        $scope.env = '';

        var url_getenv = "/api/getenv";
        $http.get(url_getenv)
            .success(function(env) {
                $scope.env = env.env;
            });
    }
};
}]);
