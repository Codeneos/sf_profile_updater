#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var xml2js = require('xml2js');
var parseString = require('xml2js').parseString;

// load custom modules
var logger = require('./logger');
var config = require('./config');

var stringCompare = function (a, b) {
    if (a == b) {
        return  a > b ? 1 : a < b ? -1 : 0;
    }
    return a > b ? 1 : -1;
};

var readProfile = function(name) {
    var profileFile = path.join(config.srcDir, config.profileDir, name + '.profile');
    return new Promise((resolve, reject) => {
        fs.access(profileFile, (err) => {
            if(err) return reject(err);
            resolve(profileFile);            
        });
    }).then(readProfileFile);
};

var readProfileFile = function(fileName) {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, 'utf8', (err, data) => {
            if(err) return reject(err);
            parseString(data,  (err, result) => {
                if(err) return reject(err);
                resolve(result);
            });
        });
    });
};

var saveProfile = function(name, profile) {
    return saveProfileFile(path.join(config.srcDir, config.profileDir, name + '.profile'), profile);
};

var saveProfileFile = function(fileName, profile) {
    return new Promise((resolve, reject) => {
        var builder = new xml2js.Builder(config.xmlBuilder);
        var xml = builder.buildObject(profile);        
        fs.writeFile(fileName, xml, { encoding: 'utf8' }, (err) => {
            if(err) return reject(err);
            resolve();
        });
    });
};

var loadLocalClassData = function() {
    return new Promise((resolve, reject) => {
        fs.readdir(path.join(config.srcDir, config.classesDir), (err, files) => {
            if(err) return reject(err);
            var readMdProm = [];
            files.forEach(file => {
                if(!file.endsWith('.cls-meta.xml')) return;
                var className = file.replace('.cls-meta.xml','');
                readMdProm.push(
                    getClassMetaData(className).then(result => {
                        return {
                            file: path.join(config.srcDir, config.classesDir, className + '.cls'),
                            name: className, 
                            metaData: result.ApexClass
                        };
                    })
                );                
            }, this);
            Promise.all(readMdProm).then(
                result => {
                    resolve(result);
                }
            );
        })
    });
};

var getClassMetaData = function(className) {
    var classFile = path.join(config.srcDir, config.classesDir, className + '.cls-meta.xml');
    return new Promise((resolve, reject) => {
        fs.access(classFile, (err) => {
            if(err) return reject(err);
            fs.readFile(classFile, 'utf8', (err, data) => {
                if(err) {
                    logger.error('Failed to read class ('+className+')  meta data file.')
                    return reject(err);
                }
                parseString(data,  (err, result) => {
                    if(err) {
                        logger.error('Failed to parse class ('+className+') meta data.');
                        return reject(err);
                    }
                    resolve(result);
                }); 
            });    
        });
    });
};

var setClassAccesses = function (profile, className, enabled) {
    for (var i = 0; i < profile.classAccesses.length; i++) {
        var entry = profile.classAccesses[i];
        if (entry.apexClass[0] == className) {
            entry.enabled[0] = JSON.stringify(enabled);
            return;
        }
    };    
    profile.classAccesses.push({
        apexClass: [className],
        enabled: [JSON.stringify(enabled)]
    });
};

var dropFieldPermission = function (profile, field, canRead, canWrite) {
    for (var i = 0; i < profile.fieldPermissions.length; i++) {
        var entry = profile.fieldPermissions[i];
        if (entry && entry.field[0] == field) {
            delete profile.fieldPermissions[i];
            return;
        }
    };
};

var setFieldPermission = function (profile, field, canRead, canWrite) {
    for (var i = 0; i < profile.fieldPermissions.length; i++) {
        var entry = profile.fieldPermissions[i];
        if (entry.field[0] == field) {
            entry.editable[0] = JSON.stringify(canWrite);
            entry.readable[0] = JSON.stringify(canRead);
            return;
        }
    };    
    profile.fieldPermissions.push({
        editable: [JSON.stringify(canWrite)],
        field: [field],
        readable: [JSON.stringify(canRead)]
    });
};

var loadLocalObjectData = function() {
    return new Promise((resolve, reject) => {
        fs.readdir(path.join(config.srcDir, config.objectDir), (err, files) => {
            if(err) return reject(err);
            var readMdProm = [];
            files.forEach(file => {
                if(!file.endsWith('.object')) return;
                var objectName = file.replace('.object','');
                readMdProm.push(
                    getObjectMetaData(objectName).then(result => {
                        return {
                            file: path.join(config.srcDir, config.classesDir, objectName + '.object'),
                            name: objectName, 
                            metaData: result.CustomObject
                        };
                    })
                );                
            }, this);
            Promise.all(readMdProm).then(
                result => {
                    resolve(result);
                }
            );
        })
    });
};

var getObjectMetaData = function(objectName) {
    var objectFile = path.join(config.srcDir, config.objectDir, objectName + '.object');
    return new Promise((resolve, reject) => {
        fs.access(objectFile, (err) => {
            if(err) return reject(err);
            fs.readFile(objectFile, 'utf8', (err, data) => {
                if(err) {
                    logger.error('Failed to read object '+objectName+' meta data file.')
                    return reject(err);
                }
                parseString(data,  (err, result) => {
                    if(err) {
                        logger.error('Failed to parse object '+objectName+' meta data.');
                        return reject(err);
                    }
                    resolve(result);
                }); 
            });    
        });
    });
};

var getProfileList = function () {
    return new Promise((resolve, reject) => {
        fs.readdir(path.join(config.srcDir, config.profileDir), (err, files) => {
            if(err) return reject(err);
            var profiles = [];
            files.forEach(file => {
                if (!file.endsWith('.profile')) return;
                profiles.push(file.substr(0, file.indexOf('.profile')));
            });
            resolve(profiles);
        });
    });
};

var updateProfileClassAccesses = function (profileData, defaultVisibility) {
    return new Promise((resolve, reject) => {
        loadLocalClassData().then(classes => {
            // creat map to map class names to indexes
            var profileClassMap = {};
            profileData.Profile.classAccesses.map((c, i) => {
                profileClassMap[c.apexClass] = { name: c.apexClass, profileIndex: i };
            });

            // Add missing Classes
            classes.forEach(c => {
                if (!profileClassMap.hasOwnProperty(c.name)) {                    
                    if(!config.scanner.addClasses) return;
                    logger.info('Add missing class: ' + c.name + ' - visibility: ' + defaultVisibility);
                    setClassAccesses(profileData.Profile, c.name, defaultVisibility);
                } else {
                    delete profileClassMap[c.name];
                }
            });

            // drop not found classes
            if(Object.keys(profileClassMap).length > 0 && config.scanner.removeClasses) {
                logger.info('Found ' + Object.keys(profileClassMap).length + ' classes in profile that do not exist locally');
                Object.keys(profileClassMap).forEach(k => {
                    logger.info('Delete ' + profileClassMap[k].name + ' from profile');
                    delete profileData.Profile.classAccesses[profileClassMap[k].profileIndex];
                });
            }

            // sort classes
            if(config.sortClasses.enabled) {
                var compareFunc = config.sortClasses.compareFunction || stringCompare;
                profileData.Profile.classAccesses.sort((a, b) => {
                    return compareFunc(a.apexClass[0], b.apexClass[0]);
                });
            }

            if(config.sortFields.enabled) {
                var compareFunc = config.sortFields.compareFunction || stringCompare;
                logger.info('Sorting field based on name');
                profileData.Profile.fieldPermissions.sort((a, b) => {
                    return compareFunc(a.field[0], b.field[0]);
                });
            }

            resolve(profileData);
        })
        .catch(err => {
            logger.error('Failed to update class visbility in profile data');
            reject(err);
        });
    });
}

var updateProfileFieldPermissions = function (profileData, defaultReadable, defaultEditable) {
    return new Promise((resolve, reject) => {
        loadLocalObjectData().then(objects => {
            // creat map to map field names to indexes
            var profileFieldMap = {};
            profileData.Profile.fieldPermissions.forEach((c, i) => {
                profileFieldMap[c.field] = { name: c.field, profileIndex: i };
            });

            // get fields from objects
            var localFields = [];
            objects.forEach(o => {
                // ski objects without fields
                if (!o.metaData.fields) return;
                o.metaData.fields.forEach(f => {
                    // Skip required fields
                    if (!f.required || f.required == 'true') {
                        return;
                    }
                    var localFieldName = o.name + '.' + f.fullName;
                    // check if we have the field
                    if (!profileFieldMap.hasOwnProperty(localFieldName)) {
                        if (!config.scanner.addFields) return;                        
                        logger.info('Profile data is missing field ' + localFieldName + '; adding to profile');
                        setFieldPermission(profileData.Profile, localFieldName, defaultReadable, defaultEditable);
                    } else {
                        delete profileFieldMap[localFieldName];
                    }
                });
            });

            // drop not found fields
            if (Object.keys(profileFieldMap).length > 0 && config.scanner.removeFields) {
                logger.info('Found ' + Object.keys(profileFieldMap).length + ' fields in the profile that do not exist in the object definitions');
                Object.keys(profileFieldMap).forEach(k => {
                    logger.info('Delete ' + profileFieldMap[k].name + ' from profile');
                    // TODO: Delete fields
                    //delete profileData.Profile.fieldPermissions[profileFieldMap[k].profileIndex];
                });
            }

            resolve(profileData);
        })
        .catch(err => {
            logger.error('Failed to update field permissions in profile data; see error');
            reject(err);
        });
    });
}

/*
 * Main function starts here
 */

logger.info("SalesForce simple profile updater by Peter van Gulik");

getProfileList().then(profiles => {
    logger.info("Found " + profiles.length + " profile files in the profiles directory");
    var profileUpdates = [];
    profiles.forEach(profileName => {

        // get profiles settings
        var classVisibility = config.classVisibility.hasOwnProperty(profileName) 
            ? config.classVisibility[profileName] 
            : config.defaultClassVisibility;

        var fieldPermision = config.fieldPermision.hasOwnProperty(profileName) 
            ? config.fieldPermision[profileName] 
            : config.defaultFieldPermision;

        // push class access profile updates
        profileUpdates.push(
            readProfile(profileName)
            .then(profileData => { 
                if(!config.scanner.addClasses && !config.scanner.removeClasses) return profileData;
                logger.info("Updating class visbility for profile '" + profileName + "' - new class visibility: " + classVisibility);
                return updateProfileClassAccesses(profileData, classVisibility); })
            .then(profileData => { 
                if(!config.scanner.addFields && !config.scanner.removeFields) return profileData;
                logger.info("Updating field permissions for profile '" + profileName + "' - field permissions: " 
                    + (fieldPermision.read && fieldPermision.write ? 'rw' : fieldPermision.read ? 'r/nw' : fieldPermision.write ? 'nr/w' : 'nr/nw'));
                return updateProfileFieldPermissions(profileData, fieldPermision.read, fieldPermision.write); })
            .then(profileData => { 
                logger.info("Saving profile data '" + profileName + "' to the profile file");
                return saveProfile(profileName, profileData); })
            .then(() => {
                return { name: profileName, status: true };
            })
            .catch(err => {
                logger.error("Failed to update/save profile "+profileName+" - " + err);
                return { name: profileName, status: false, error: err };
            })
        );
    });

    return Promise.all(profileUpdates);
}).then(results => {
    logger.info("Loaded "+results.length+" SF profiles: ");
    results.forEach(profile => { 
        if (profile.status) {
            logger.info("  " + profile.name + " - Update OK!");
        } else {
            logger.error("  " + profile.name + " - Update ERROR: " + profile.error);
        }
    });
    logger.info("Done!");
}).catch(err => {
    logger.error("Error while loading profile list; see below for more details");
    logger.error(err);
});




