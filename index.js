#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var xml2js = require('xml2js');
var parseString = require('xml2js').parseString;

// load custom modules
var logger = require('./logger');
var config = require('./config');

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

var updateProfileClassAccesses = function(profileName, defaultVisibility) {
    return new Promise((resolve, reject) => {
        readProfile(profileName).then((profileData) => {    
            loadLocalClassData().then(classes => {
                // creat map to map class names to indexes
                var profileClassMap = {};
                profileData.Profile.classAccesses.map((c, i) => {
                    profileClassMap[c.apexClass] = { name: c.apexClass, profileIndex: i };
                });        

                // Add missing Classes
                classes.forEach(c => {                        
                    if (!profileClassMap.hasOwnProperty(c.name)) {
                        logger.info('Add missing class: ' + c.name + ' - visibility: ' + defaultVisibility);
                        setClassAccesses(profileData.Profile, c.name, defaultVisibility);
                    } else {
                        delete profileClassMap[c.name];
                    }
                });

                // drop not found classes
                logger.info('Found ' + Object.keys(profileClassMap).length + ' classes in profile that do not exist locally');
                Object.keys(profileClassMap).forEach(k => {
                    logger.info('Delete ' + profileClassMap[k].name + ' from profile');
                    delete profileData.Profile.classAccesses[profileClassMap[k].profileIndex];
                });
            })
            .then(() => {
                logger.info('Saving profile ' + profileName);
                saveProfile(profileName, profileData)
                    .then(() => { resolve(); })
                    .catch(err => { reject(err); });
            }).catch(err => {
                logger.error('Failed to update profile ' + profileName);
                logger.error(err);
                reject(err);
            });
        });
    });
}

/*
 * Main function starts here
 */

logger.info("SalesForce simple profile updater by Peter van Gulik");

getProfileList().then(profiles => {
    logger.info("Found " + profiles.length + " profile files");
    var profileUpdates = [];
    profiles.forEach(profileName => {
        var visibility =  config.classVisibility.hasOwnProperty(profileName) 
            ? config.classVisibility[profileName] 
            : config.defaultClassVisibility;
        logger.info("Updating class visibility in profile '" + profileName + "' with new class visbility: " + visibility);
        profileUpdates.push(
            updateProfileClassAccesses(profileName, visibility)
        );
    });
    return Promise.all(profileUpdates);
}).then(result => {
    logger.info("Done - Updated all profiles!");
}).catch(err => {
    logger.error("Profile updates failed :( - see the error below for more details");
    logger.error(err);
});




