sap.ui.define([
    'sap/ui/model/FilterOperator',
    'sap/ui/model/Filter',
    'sap/ui/model/odata/v2/ODataModel'
], 
    /**
     * provide app-view type models (as in the first "V" in MVVC)
     * 
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     * @param {typeof sap.ui.Device} Device
     * 
     * @returns {Function} createDeviceModel() for providing runtime info for the device the UI5 app is running on
     */
    function (FilterOperator, Filter, ODataModel) {
        "use strict";
        const movEntity = '/MovimientosSet';
        const maestroEntity = '/MaestroSet';
        const orderEntity = '/OrderSet';
        const noticeEntity = '/NoticeSet';
        const WorkPerformedEntity = '/WorkPerformedSet';

        return {
            init:function(caller){
                this.caller = caller;
                this.odataModel = caller.getOwnerComponent().getModel();

                try{
                    this.UserId = sap.ushell.Container.getService("UserInfo").getId();
                }catch(e){
                    this.UserId = 'ET2966';
                }
                
            },

            getListOrden:function(Id=1){                                     
                let Filters = [                     
                    new Filter({
                        path: 'Idtaller',
                        operator: FilterOperator.EQ,
                        value1: IdTaller
                    }),                         
                ];                
                
                return new Promise(function (resolve, reject) {
                    this.odataModel.read(WorkPerformedEntity, {  
                        filters: Filters,  
                        success: oData => {
                            resolve(oData)
                        },
                        error: e => {
                            reject(e)
                        }
                    });
                }.bind(this))

            },            

            parseError: function (e) {
                let errorMessage = "";
                try {
                    errorMessage = JSON.parse(e.responseText).error.message.value;
                } catch (error) {
                    errorMessage = e.responseText;
                }
                return errorMessage;
            },           
            
    };
});