/*global logger*/
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/html",
    "dojo/dom-prop",
    "dojo/text!DateTimeInput/widget/template/DateTimeInput.html"
], function(declare, _WidgetBase, _TemplatedMixin, dojoStyle, dojoConstruct, dojoArray, dojoLang, dojoHtml, domProp, widgetTemplate) {
    "use strict";

    // Declare widget's prototype.
    return declare("DateTimeInput.widget.DateTimeInput", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        dateInputNode: null,
        infoTextNode: null,

        targetAttribute: "",

        _handles: null,
        _contextObj: null,
        _alertDiv: null,
        _datetimevalue: null,

        postCreate: function() {
            logger.debug(this.id + ".postCreate");
            
            this._initRendering();            
            this._updateRendering();
            this._setupEvents();
        },

        update: function(obj, callback) {
            logger.debug(this.id + ".update");
            this._contextObj = obj;

            if (this._contextObj) {
                this._resetSubscriptions();
                this._updateRendering(callback);
            } else {
                mendix.lang.nullExec(callback);
            }
        },

        _setupEvents: function() {
            if(this.dateInputNode) {
                this.connect(this.dateInputNode, "blur", function(e) {
                    
                    this._setTargetAttributeDate(this.dateInputNode.valueAsDate.getDate(),
                                                this.dateInputNode.valueAsDate.getMonth(),
                                                this.dateInputNode.valueAsDate.getFullYear())
                    
                    this._contextObj.set(this.targetAttribute, this._datetimevalue);
                });
            }
            if(this.timeInputNode) {
                this.connect(this.timeInputNode, "blur", function(e) {
                    
                    var hours = this.timeInputNode.valueAsDate.getUTCHours();
                    var minutes = this.timeInputNode.valueAsDate.getUTCMinutes();
                    
                    this._setTargetAttributeTime(hours, minutes)
                    
                    this._contextObj.set(this.targetAttribute, this._datetimevalue);
                });
            }
        },
        
        _setTargetAttributeDate: function(days,months,years)
        {
            if(this._datetimevalue === null) {
                this._datetimevalue = new Date(years, months, days);
            }
            this._datetimevalue.setDate(days);
            this._datetimevalue.setMonth(months);
            this._datetimevalue.setFullYear(years);
        },        
        
        _setTargetAttributeTime: function(hours,minutes)
        {
            this._datetimevalue.setHours(hours);
            this._datetimevalue.setMinutes(minutes);
        },  
        
        _initRendering: function(){
            if(this.inputformat === "date") {
                dojoConstruct.destroy(this.timeInputNode);
            }
            if(this.inputformat === "time") {
                dojoConstruct.destroy(this.dateInputNode);
            }
        },

        _updateRendering: function(callback) {
            logger.debug(this.id + "._updateRendering");
            if (this._contextObj !== null) {
                dojoStyle.set(this.domNode, "display", "block");
                
                if(this._contextObj.get(this.targetAttribute)!=="") {
                    // Gets date as timestamp(number)
                    this._datetimevalue = new Date(this._contextObj.get(this.targetAttribute));
                    
                    var dateToDisplay = this._datetimevalue;
                    dateToDisplay = new Date(dateToDisplay.setMinutes(dateToDisplay.getMinutes() + dateToDisplay.getTimezoneOffset() *-1 ));

                    if(this.dateInputNode) {
                        this.dateInputNode.valueAsDate = dateToDisplay;
                    }
                    if(this.timeInputNode) {
                        this.timeInputNode.valueAsDate = dateToDisplay;
                    }
                }

            } else {
                dojoStyle.set(this.domNode, "display", "none");
            }

            // Important to clear all validations!
            this._clearValidations();

            mendix.lang.nullExec(callback);
        },

        _handleValidation: function(validations) {
            logger.debug(this.id + "._handleValidation");
            this._clearValidations();

            var validation = validations[0],
                message = validation.getReasonByAttribute(this.targetAttribute);

            if (this.readOnly) {
                validation.removeAttribute(this.targetAttribute);
            } else if (message) {
                this._addValidation(message);
                validation.removeAttribute(this.targetAttribute);
            }
        },

        _clearValidations: function() {
            logger.debug(this.id + "._clearValidations");
            dojoConstruct.destroy(this._alertDiv);
            this._alertDiv = null;
        },

        _showError: function(message) {
            logger.debug(this.id + "._showError");
            if (this._alertDiv !== null) {
                dojoHtml.set(this._alertDiv, message);
                return true;
            }
            this._alertDiv = dojoConstruct.create("div", {
                "class": "alert alert-danger",
                "innerHTML": message
            });
            dojoConstruct.place(this.domNode, this._alertDiv);
        },

        _addValidation: function(message) {
            logger.debug(this.id + "._addValidation");
            this._showError(message);
        },

        _resetSubscriptions: function() {
            logger.debug(this.id + "._resetSubscriptions");
            // Release handles on previous object, if any.
            if (this._handles) {
                dojoArray.forEach(this._handles, function(handle) {
                    mx.data.unsubscribe(handle);
                });
                this._handles = [];
            }

            // When a mendix object exists create subscribtions.
            if (this._contextObj) {
                var objectHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: dojoLang.hitch(this, function(guid) {
                        this._updateRendering();
                    })
                });

                var attrHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.targetAttribute,
                    callback: dojoLang.hitch(this, function(guid, attr, attrValue) {
                        this._updateRendering();
                    })
                });

                var validationHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    val: true,
                    callback: dojoLang.hitch(this, this._handleValidation)
                });

                this._handles = [objectHandle, attrHandle, validationHandle];
            }
        }
    });
});

require(["DateTimeInput/widget/DateTimeInput"], function() {
    "use strict";
});
