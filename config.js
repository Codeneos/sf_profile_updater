"use strict";

/*
 * Main config file parsed by the profile updater during start up.
 */
 module.exports = {
    // Salesforce sources directory  can either be a relative or absolute directory
    srcDir: "../telfort_order_track/src",
    // directory in which the profiles are stored
    profileDir: "profiles",
    // directory in which the classes are stores
    classesDir: "classes",
    // directory in which the objects are stores
    objectDir: "objects",

    // below settings determine what the source scanner
    // will add to the profiles it finds
    scanner: {
        // classes config
        removeClasses: true,
        addClasses: true,
        // field config
        removeFields: false,
        addFields: true,
    },

    // default visibiliy setting for new classes and fields
    defaultClassVisibility: false,    
    defaultFieldPermision: {
        read: true,
        write: false
    },

    // per profile overrides of the config.defaultClassVisibility settings for newly found classes
    classVisibility: {
        'Admin': true
    },

    // sort classes in a particular order
    sortClasses : {
        enabled: true,
        // Comment out the below config line to 
        // specify a custom function usto use for class name comparing
        //compareFunction: null
    },

    // sort field permission in a particular order
    sortFields : {
        enabled: true,
        // Comment out the below config line to 
        // specify a custom function usto use for class name comparing
        //compareFunction: null
    },

    // prevent certain fields from being added to the profile
    ignoredFields: [
        'vlocity_cmt__',
        '^ServiLink__c',
        '^Case',
        '^Customers__c',
        '^Contacts__c',
        '^Partners__c',
        '__mdt'
    ],

    // per profile overrides for new fields only
    fieldPermision: {
        // based on profiles
        'Admin': {
            read: true,
            write: true,

            // use config in the profile to specfic specfics for 1 particular profiles
            // based on field names per prpfile
            'Order.ContractId': {
                read: true,
                write: true
            }
        },

        // based on field names as well
        'Product2.Name': {
            read: true,
            write: true
        }
    },

    // XML builder settings -- passed to teh XML build and define the way the XML is rendered
    xmlBuilder: {
        renderOpts: { 'pretty': true, 'indent': '    ', 'newline': '\n' },
        xmldec: { 'version': '1.0', 'encoding': 'UTF-8' }
    }
};
