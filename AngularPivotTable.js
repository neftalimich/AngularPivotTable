define([
    "./js/qsocks.bundle",
    "qlik",
    "jquery",
    "./initial-properties",
    "./properties",
    "text!./style.css",
    "text!./template.html",
    "text!./pivottable/pivot.css",
    "./js/jquery-ui.min",
    "./pivottable/pivot"
], function (qsocks,qlik, $, initProps, props, cssContent, template, cssPivot) {
    'use strict';
    $('<link rel="stylesheet" type="text/css" href="/extensions/KpiTable/css/font-awesome.css">').html("").appendTo("head");
    $("<style>").html(cssPivot).appendTo("head");
    $("<style>").html(cssContent).appendTo("head");
    return {
        template: template,
        initialProperties: initProps,
        definition: props,
        support: {
            snapshot: true,
            export: true,
            exportData: true
        },
        paint: function () {
            //setup scope.table
            if (!this.$scope.table) {
                this.$scope.table = qlik.table(this);
                console.log("table", this.$scope.table);
            }

            return qlik.Promise.resolve();
        },
        controller: ['$scope', '$filter', function ($scope, $filter) {
            console.log("layout", $scope.layout);

            $scope.$watchCollection("layout.qHyperCube.qDimensionInfo", function (newValue) {
                angular.element(document).ready(function () {
                    $scope.PatchDataFetch();
                    $scope.ConfigPivotDimensions();
                    $scope.FormatData();
                });
            });
            $scope.$watchCollection("layout.qHyperCube.qMeasureInfo", function (newValue) {
                angular.element(document).ready(function () {
                    $scope.PatchDataFetch();
                    $scope.ConfigPivotDimensions();
                    $scope.SetPivotMeasures();
                    $scope.FormatData();
                });
            });
            $scope.$watchCollection("layout.qHyperCube.qDataPages", function (newValue) {
                angular.element(document).ready(function () {
                    if (localStorage.getItem("lastname")) {
                        $scope.dimConfig = JSON.parse(localStorage.getItem("lastname"));
                        console.log($scope.dimConfig);
                    }
                    $scope.FormatData();
                    $scope.PivotTable();
                });
                //console.log("qDataPages-Change");
            });
            //$scope.$watchCollection("dimConfig", function (newValue) {
            //    console.log("dimConfig-Change", newValue);
            //});

            $scope.PatchDataFetch = function () {
                let dimLength = $scope.layout.qHyperCube.qDimensionInfo.length;
                let meaLength = $scope.layout.qHyperCube.qMeasureInfo.length;

                let cols = dimLength + meaLength;
                let rows = 10000 / cols;

                let qInitialDataFetch = [
                    {
                        qHeight: rows,
                        qWidth: cols
                    }
                ];

                $scope.backendApi.applyPatches([
                    {
                        "qPath": "/qHyperCubeDef/qInitialDataFetch",
                        "qOp": "replace",
                        "qValue": JSON.stringify(qInitialDataFetch)
                    }
                ], false);

                for (let i = 0; i < dimLength + meaLength; i++) {
                    $scope.qColumnOrder.push(i);
                }

                $scope.backendApi.applyPatches([
                    {
                        "qPath": "/qHyperCubeDef/qColumnOrder",
                        "qOp": "replace",
                        "qValue": JSON.stringify($scope.qColumnOrder)
                    }
                ], false);
            };

            $scope.qColumnOrder = [];
            $scope.Test2 = function () {
                $scope.qColumnOrder = [];
                let cols = 0;
                let rows = 0;

                let meaGroupAux = ""; // Sum(TOTAL<Market,Channel,Pack,MAT>Units)

                $scope.dimConfig = JSON.parse(JSON.stringify($filter('orderBy')($scope.dimConfig, 'pos', false)));
                for (let i = 0; i < $scope.dimConfig.length; i++) {
                    if ($scope.dimConfig[i].enabled) {
                        $scope.qColumnOrder.push($scope.dimConfig[i].idx);
                        cols += 1;
                        meaGroupAux += $scope.dimConfig[i].qFallbackTitle + ",";
                    }
                }
                meaGroupAux = meaGroupAux.substring(0, meaGroupAux.length - 1);

                console.log(meaGroupAux);

                for (let i = 0; i < $scope.meaConfig.length; i++) {
                    $scope.qColumnOrder.push($scope.meaConfig[i].idx + $scope.dimConfig.length);
                    cols += 1;
                }

                for (let i = 0; i < $scope.dimConfig.length; i++) {
                    if (!$scope.dimConfig[i].enabled) {
                        $scope.qColumnOrder.push($scope.dimConfig[i].idx);
                    }
                }

                rows = 10000 / cols;

                let qInitialDataFetch = [
                    {
                        qHeight: rows,
                        qWidth: cols
                    }
                ];

                //console.log("qColumnOrder", $scope.qColumnOrder);
                //console.log("qInitialDataFetch", qInitialDataFetch);

                $scope.backendApi.applyPatches([
                    {
                        "qPath": "/qHyperCubeDef/qInitialDataFetch",
                        "qOp": "replace",
                        "qValue": JSON.stringify(qInitialDataFetch)
                    }
                ], false);


                $scope.backendApi.applyPatches([
                    {
                        "qPath": "/qHyperCubeDef/qColumnOrder",
                        "qOp": "replace",
                        "qValue": JSON.stringify($scope.qColumnOrder)
                    }
                ], false);


                //let qMeasures = [];
                //angular.forEach($scope.layout.qHyperCube.qMeasureInfo, function (value, key) {
                //    let qMeasAux = JSON.parse(JSON.stringify(qMeasureTemplate));
                //    qMeasAux.qDef.qLabel = value.qFallbackTitle;
                //    qMeasAux.qDef.qDef = value.measure;
                //    qMeasAux.qDef.qNumFormat.qType = value.qType ? value.qType : "F";
                //    qMeasAux.qDef.qNumFormat.qFmt = value.qFmt ? value.qFmt : "#,##0.00";
                //    qMeasAux.qDef.qNumFormat.qnDec = value.qnDec ? value.qnDec : 2;
                //    qMeasures.push(qMeasAux);
                //});

                //$scope.backendApi.applyPatches([
                //    {
                //        "qPath": "/qHyperCubeDef/qMeasures",
                //        "qOp": "replace",
                //        "qValue": JSON.stringify(qMeasures)
                //    }
                //], false);

                console.log("qHyperCube", $scope.layout.qHyperCube);
            };

            $scope.UserConfig = function () {
                $scope.SetPivotDimensions();
                $scope.PivotTable();
            };

            $scope.DimEnable = function (dim) {
                dim.enabled = !dim.enabled;
                localStorage.setItem("dimConfig", JSON.stringify($scope.dimConfig));
                $scope.Test2();
                $scope.SetPivotDimensions();
                $scope.FormatData();
                $scope.PivotTable();
            };
            $scope.Meaenabled = function (mea) {
                mea.enabled = !mea.enabled;
                $scope.FormatData();
                $scope.PivotTable();
            };

            $scope.dimUp = function (dim,dimNext) {
                dim.pos += 1;
                dimNext.pos -= 1;
                $scope.UserConfig();
            };
            $scope.dimDown = function (dim, dimPrev) {
                dim.pos -= 1;
                dimPrev.pos += 1;
                $scope.UserConfig();
            };

            $scope.FormatData = function () {
                $scope.dataFormated = [];
                let headerRow = [];
                
                angular.forEach($scope.dimConfig, function (value, key) {
                    if (value.enabled) {
                        headerRow.push(value.qFallbackTitle);
                    }
                });
                headerRow.push("Measures");
                headerRow.push("Value");
                $scope.dataFormated.push(headerRow);

                let dimLength = $scope.layout.qHyperCube.qDimensionInfo.length;
                let meaLength = $scope.layout.qHyperCube.qMeasureInfo.length;

                dimLength = 0;
                angular.forEach($scope.dimConfig, function (value, key) {
                    if (value.enabled) {
                        dimLength += 1;
                    }
                });

                //console.log("qMatrix", $scope.layout.qHyperCube.qDataPages[0].qMatrix);
                if (dimLength + meaLength == $scope.layout.qHyperCube.qDataPages[0].qMatrix[0].length) {
                    angular.forEach($scope.layout.qHyperCube.qDataPages[0].qMatrix, function (row, key) {
                        for (let i = 0; i < meaLength; i++) {
                            if ($scope.meaConfig.length == 0 || $scope.meaConfig[i].enabled) {
                                let rowAux = [];
                                for (let j = 0; j < dimLength; j++) {
                                    rowAux.push(row[j].qText);
                                }
                                rowAux.push($scope.layout.qHyperCube.qMeasureInfo[i].qFallbackTitle);
                                rowAux.push(row[dimLength + i].qNum);
                                $scope.dataFormated.push(rowAux);
                            }
                        }
                    });
                }
                console.log("layout", $scope.layout);
                //console.log("dataFormated", $scope.dataFormated);
            };

            $scope.dimConfig = [];
            $scope.ConfigPivotDimensions = function () {
                $scope.dimConfig = [];
                $scope.rowsAux = [];
                $scope.colsAux = [];

                angular.forEach($scope.layout.qHyperCube.qDimensionInfo, function (value, key) {
                    $scope.dimConfig.push({
                        pos: key,
                        qFallbackTitle: value.qFallbackTitle,
                        type: value.type,
                        enabled: true,
                        idx: key
                    });
                    if (value.type == "row") {
                        $scope.rowsAux.push(value.qFallbackTitle);
                    } else if (value.type == "col") {
                        $scope.colsAux.push(value.qFallbackTitle);
                    }
                });
                $scope.colsAux.push("Measures");

                localStorage.setItem("dimConfig", JSON.stringify($scope.dimConfig));
            };

            $scope.SetPivotDimensions = function () {
                $scope.rowsAux = [];
                $scope.colsAux = [];
                $scope.dimConfig = JSON.parse(JSON.stringify($filter('orderBy')($scope.dimConfig, 'pos', false)));
                angular.forEach($scope.dimConfig, function (value, key) {
                    if (value.enabled) {
                        if (value.type == "row") {
                            $scope.rowsAux.push(value.qFallbackTitle);
                        } else if (value.type == "col") {
                            $scope.colsAux.push(value.qFallbackTitle);
                        }
                    }
                });
                $scope.colsAux.push("Measures");
            };

            $scope.meaConfig = [];
            $scope.SetPivotMeasures = function () {
                $scope.meaConfig = [];
                angular.forEach($scope.layout.qHyperCube.qMeasureInfo, function (value, key) {
                    $scope.meaConfig.push({
                        pos: key,
                        qFallbackTitle: value.qFallbackTitle,
                        enabled: true,
                        idx: key
                    });
                });
            };

            $scope.PivotTable = function () {
                var heatmap = $.pivotUtilities.renderers["Heatmap"];
                var sum = $.pivotUtilities.aggregators["Sum"];

                //var sumTemplate = $.pivotUtilities.aggregatorTemplates.sum;
                //var numberFormat = $.pivotUtilities.numberFormat;
                //var moneyFormat = numberFormat({ thousandsSep: ",", decimalSep: ".", suffix: "", prefix: "$" });
                //var decimalFormat = numberFormat({ thousandsSep: ",", decimalSep: ".", suffix: "", prefix: "" });
                //var percentageFormat = numberFormat({ thousandsSep: ",", scaler: 100, decimalSep: ".", suffix: "%", prefix: "" });

                //var sumMoneyFormat = function () { return sumTemplate(moneyFormat)(["Value"]); };
                //var sumDecimalFormat = function () { return sumTemplate(decimalFormat)(["Value"]); };
                //var sumPercentageFormat = function () { return sumTemplate(percentageFormat)(["Value"]); };


                //console.log($scope.rowsAux, $scope.colsAux);

                $("#output").pivot(
                    $scope.dataFormated, {
                        rows: $scope.rowsAux,
                        cols: $scope.colsAux,
                        aggregator: sum(["Value"]),
                        sorters: {
                            Month: $.pivotUtilities.sortAs([
                                "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                            ])
                        }
                    });

                //$("#output2").pivotUI(
                //    $scope.dataFormated, {
                //        rows: $scope.rowsAux,
                //        cols: $scope.colsAux,
                //        vals: ["Value"],
                //        aggregatorName: "Sum"
                //        //aggregators: { sumDecimalFormat, sumMoneyFormat, sumPercentageFormat }
                //    });
            };

            var qDimensionTemplate = {
                qDef: {
                    qGrouping: "N",
                    qFieldDefs: "CHANGE_ME",
                    qFieldLabels: [""],
                    autoSort: false,
                    qSortCriterias: [
                        {
                            qSortByAscii: 0
                        }
                    ]
                },
                qNullSuppression: false
            };
            var qMeasureTemplate = {
                qDef: {
                    qLabel: "",
                    qDescription: "",
                    qTags: [""],
                    qGrouping: "N",
                    qDef: "CHANGE_ME",
                    qNumFormat: {
                        qDec: ".",
                        qFmt: "#,##0.00",
                        qThou: ",",
                        qType: "F",
                        qUseThou: 0,
                        qnDec: 2
                    },
                    autoSort: false
                },
                qSortBy: {
                    qSortByState: 0,
                    qSortByFrequency: 0,
                    qSortByNumeric: 0,
                    qSortByAscii: 0,
                    qSortByLoadOrder: 0,
                    qSortByExpression: 0,
                    qExpression: {
                        qv: ""
                    }
                }
            };
        }]
    };
});