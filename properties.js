define([], function () {
    "use strict";
    return {
        type: "items",
        component: "accordion",
        items: {
            dimensions: {
                uses: "dimensions",
                min: 2,
                items: {
                    type: {
                        type: "string",
                        component: "dropdown",
                        label: "Dimension Type",
                        ref: "qDef.type",
                        options: [
                            {
                                value: "row",
                                label: "Row"
                            },
                            {
                                value: "col",
                                label: "Column"
                            }
                        ],
                        defaultValue: "row"
                    }
                }
            },
            measures: {
                uses: "measures",
                min: 1
            },
            sorting: {
                uses: "sorting"
            },
            settings: {
                uses: "settings",
                //items: {
                //    initFetchCols: {
                //        ref: "qHyperCubeDef.qInitialDataFetch.0.qWidth",
                //        label: "Initial fetch cols",
                //        type: "number",
                //        defaultValue: 10
                //    },
                //    initFetchRows: {
                //        ref: "qHyperCubeDef.qInitialDataFetch.0.qHeight",
                //        label: "Initial fetch rows",
                //        type: "number",
                //        defaultValue: 1000
                //    }
                //}
            }
        }
    };
});