sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    '../model/oDataModel',
], function (BaseController, JSONModel, formatter, Filter, FilterOperator,oDataModel) {
    "use strict";

    return BaseController.extend("zetpmhoursworked.controller.Worklist", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {
            var oViewModel;

            // keeps the search state
            this._aTableSearchState = [];

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataText : this.getResourceBundle().getText("tableNoDataText")
            });

            this.setModel(oViewModel, "worklistView");
            this.reportModel = new JSONModel(
                {
                    'WorkPerformedSet': [],
                    'WorkcenterSet': []                    
                });

            this.setModel(this.reportModel, "ReportModel");                
            oDataModel.init(this);

        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished : function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("worklistTableTitle");
            }
            this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
        },

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress : function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack : function() {
            // eslint-disable-next-line fiori-custom/sap-no-history-manipulation, fiori-custom/sap-browser-api-warning
            history.go(-1);
        },


        onSearch : function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {
                // Search field's 'refresh' button has been pressed.
                // This is visible if you select any main list item.
                // In this case no new search is triggered, we only
                // refresh the list binding.
                this.onRefresh();
            } else {
                var aTableSearchState = [];
                var sQuery = oEvent.getParameter("query");

                if (sQuery && sQuery.length > 0) {
                    aTableSearchState = [new Filter("Aufnr", FilterOperator.Contains, sQuery)];
                }
                this._applySearch(aTableSearchState);
            }

        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh : function () {
            var oTable = this.byId("table");
            oTable.getBinding("items").refresh();
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject : function (oItem) {
            this.getRouter().navTo("object", {
                objectId: oItem.getBindingContext().getPath().substring("/WorkPerformedSet".length)
            });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function(aTableSearchState) {
            var oTable = this.byId("table"),
                oViewModel = this.getModel("worklistView");
            oTable.getBinding("items").filter(aTableSearchState, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aTableSearchState.length !== 0) {
                oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
            }
        },

        onDisplay: function(evt) {
            const tableOrder = this.byId("OrdenView--tableOrder");   
            
            tableOrder.setBusy(true);
            oDataModel.getListOrden('1')
                .then(oData => {                    
                    this.reportModel.setProperty('/WorkPerformedSet', oData.results);   
                    tableOrder.getBinding("items").getModel().setProperty("/WorkPerformedSet", oData.results);
                    this.setWorkcenterSet(oData.results);
                    tableOrder.setBusy(false);
                })
                .catch(e => {
                    tableOrder.setBusy(false); 
                })
        } ,
        
        setWorkcenterSet: function(tabla){
            const WorkcenterTable = this.byId("PuestoView--tablePuesto");
            let result = [];

            tabla.forEach(e=> {
                let rec = result.find(d => d.Workcenter === e.Workcenter);

                if ( rec === undefined ){  

                    const oNew = {
                        Workcenter: e.Workcenter,
                        Workcenterdescr: e.Workcenterdescr,
                        Timeagreeded: 0,
                        Timeworked: Number.parseFloat(e.Timeworked),
                        Cant : 1,
                        Timeaverage: 0
                    }; 

                    if (e.Timeagreeded > 0){
                        oNew.Timeagreeded = Number.parseFloat(e.Timeagreeded);
                    }

                    result.push(oNew);
                    rec = oNew;
                  }
                 else {
                    rec.Cant += 1;
                    rec.Timeworked += Number.parseFloat(e.Timeworked);
                    if (e.Timeagreeded > 0){
                      rec.Timeagreeded = Number.parseFloat(e.Timeagreeded);
                    }
                 }               
            });

            result.forEach(e=> {
                e.Timeaverage = e.Timeworked / e.Cant;
                e.Timeaverage = e.Timeaverage.toFixed(1);
            });    

            this.reportModel.setProperty("/WorkcenterSet", result);   
            WorkcenterTable.getBinding("items").getModel().setProperty("/WorkcenterSet", result);
        }     
    });
});
