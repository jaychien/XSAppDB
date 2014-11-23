/**
 * Created by Derek on 2014/9/22.
 */

angular.module('AppList').controller('AppListCtrl', ['$scope', '$http', '$modal', 'usSpinnerService', function($scope, $http, $modal, spinnerService) {
    var url_applist = "api/applist";
    var url_setappexecid = "api/setappexecid";
    var url_setappmarketstatus = "api/setappmarketstatus";
    var url_setappschedule = "api/setappschedule";

    $scope.appList = [];
    $scope.error = null;
    $scope.nameFilter = '';
    $scope.propNameFilter = '';
    $scope.propValueFilter = '';
    $scope.orderByField = '';
    $scope.maxExecId = 2;           // 目前這是寫在client端的, 以後可以挪到server side

    $scope.execIdOptions = generateExecIdOptions($scope.maxExecId);
    $scope.execIdList = generateExecIdList($scope.maxExecId);

    $http.get(url_applist)
        .success(function(appList) {
            _.each(appList, function(app) {
                app.startTime = $scope.hhmm2moment(app.startTime);
                app.endTime = $scope.hhmm2moment(app.endTime);
            });

            $scope.appList = appList;
            $scope.error = null;
        })
        .error(function(error) {
            $scope.error = error;
        });

    $scope.getTotalCount = function() {
        return $scope.appList.length;
    };

    $scope.getMarketStatusCount = function(status) {
        return _.reduce($scope.appList, function(count, app) {
            if (app.marketStatus == status)
                return count+1;
            else
                return count;
        }, 0);
    };

    $scope.getExecCount = function(execId) {
        return _.reduce($scope.appList, function(count, app) {
            if (app.execId == execId)
                return count+1;
            else
                return count;
        }, 0);
    };

    $scope.getMarketStatusClassName = function(app) {
        if (app.marketStatus == 0) {
            return "text-center danger";
        }
        else if (app.marketStatus == 1) {
            return "text-center info";
        }
        else {
            return "text-center warning";
        }
    };

    $scope.getTypeString = function(app) {
        if (app.type == 1) {
            return "警示";
        }
        else if (app.type == 2) {
            return "選股";
        }
        else {
            return "(" + app.type + ")";
        }
    };

    $scope.hhmm2moment = function(hhmm) {
        return moment({hour:hhmm/100, minute:hhmm%100});
    };

    $scope.moment2hhmm = function(mn) {
        return mn.hour() * 100 + mn.minute();
    };

    $scope.getStartTimeString = function(app) {
        return app.startTime.format('HH:mm');
    };

    $scope.getEndTimeString = function(app) {
        return app.endTime.format('HH:mm');
    };

    $scope.showSchedule = function(app) {
        var modalInstance = $modal.open({
            templateUrl: 'setSchedule.html',
            controller: 'SetScheduleController',
            size: 'sm',
            resolve: {
                times: function() {
                    return [app.startTime.toDate(), app.endTime.toDate()];
                }
            }
        });

        modalInstance.result.then(function(times) {
            console.log('schedue DB return:' + times[0] + ',' + times[1]);

            app.startTime = moment(times[0]);
            app.endTime = moment(times[1]);

            $scope.updateAppSchedule(app);

        }, function () {

        });
    };

    $scope.updateAppExecId = function(app) {
        $scope.startSpinner();
        var url = url_setappexecid + '?guid=' + app.guid + '&execId=' + app.execId;
        console.log('calling url=' + url);
        $http.get(url)
            .success(function() {
                $scope.error = null;
                $scope.stopSpinner();
            })
            .error(function(error) {
                $scope.error = error;
                $scope.stopSpinner();
            });
    };

    $scope.updateAppMarketStatus = function(app) {
        $scope.startSpinner();
        var url = url_setappmarketstatus + '?guid=' + app.guid + '&marketid=' + app.marketId + '&status=' + app.marketStatus;
        console.log('calling url=' + url);
        $http.get(url)
            .success(function() {
                $scope.error = null;
                $scope.stopSpinner();
            })
            .error(function(error) {
                $scope.error = error;
                $scope.stopSpinner();
            });
    };

    $scope.updateAppSchedule = function(app) {
        $scope.startSpinner();
        var url = url_setappschedule + '?guid=' + app.guid + '&starttime=' + $scope.moment2hhmm(app.startTime) + '&endtime=' + $scope.moment2hhmm(app.endTime);
        console.log('calling url=' + url);
        $http.get(url)
            .success(function() {
                $scope.error = null;
                $scope.stopSpinner();
            })
            .error(function(error) {
                $scope.error = error;
                $scope.stopSpinner();
            });
    };

    $scope.setPropFilter = function(propName, propValue) {
        $scope.propNameFilter = propName;
        $scope.propValueFilter = propValue;
    };

    $scope.startSpinner = function() {
        spinnerService.spin('spinner');
    };

    $scope.stopSpinner = function() {
        spinnerService.stop('spinner');
    };

    // 未上架的item可以看到全部選項
    //
    var marketStatusOptions_All = [
        {value:0, name:'- 未上架 -'},
        {value:1, name:'上架'},
        {value:2, name:'下架'}
    ];

    // 已經上架的item只能選擇上架/下架
    //
    var marketStatusOptions = [
        {value:1, name:'上架'},
        {value:2, name:'下架'}
    ];

    $scope.getMarketStatusOptions = function(app) {
        if (app.marketStatus == 0)
            return marketStatusOptions_All;
        else
            return marketStatusOptions;
    };


    // Return [{value:0, name:'未指定'},{value:1, name:'1'}, ..]
    function generateExecIdOptions(max) {
        var list = [{value:0, name:'未指定'}];
        for (var i = 1; i <= max; i++) {
            list.push({value:i, name:i.toString()});
        }
        return list;
    }

    // Return [1, 2, 3..]
    //
    function generateExecIdList(max) {
        var list = [];
        for (var i = 1; i <= max; i++) {
            list.push(i);
        }
        return list;
    }
}])
.filter('filterByName', function() {
    return function(appList, nameFilter) {
        return _.filter(appList, function(app) {
            return app.name.indexOf(nameFilter) >= 0;
        });
    };
})
.filter('filterByPropValue', function() {
    return function(appList, propName, propValue) {
        // console.log('filterByPropValue: propName=' + propName + ' propValue=' + propValue);
        propName = propName || '';
        return _.filter(appList, function(app) {
            if (propName == '')
                return app;
            else if (app[propName] == propValue)
                return app;
        });
    };
});
