"use strict";

/*
 * Main config file parsed by the profile updater during start up.
 */
 module.exports = {
    // Salesforce sources directory  can either be a relative or absolute directory
    srcDir: "..\\telfort_dev17\\src",
    // directory in which the profiles are stored
    profileDir: "profiles",
    // directory in which the classes are stores
    classesDir: "classes",
    // directory in which the objects are stores
    objectDir: "objects",
    // default visibiliy setting for new classes
    defaultClassVisibility: false,

    // per profile overrides of the config.defaultClassVisibility settings for newly found classes
    classVisibility: {
        'Admin': true
    },

    // XML builder settings -- passed to teh XML build and define the way the XML is rendered
    xmlBuilder: {
        renderOpts: { 'pretty': true, 'indent': '    ', 'newline': '\n' },
        xmldec: { 'version': '1.0', 'encoding': 'UTF-8' }
    }
};
