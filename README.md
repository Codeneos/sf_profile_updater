# SSFPU: Simple SalesForce Profile Updater
A simple NodeJS based profile updater for SalesForce profiles.

## Functionality
At this moment, the profile updater only updates APEX class visibility based on the files you have locally. It removes classes that do not exist anymore and adds new classes it finds while scanning your SalesForce source directory. It will update all your profiles and by default it will set the class visibility for new classes to false for all profiles except for the Admin profile. You can change the default behavior using in `config.js` file.

## Install
1. Install NodeJS for your operating system
   - NodeJS can be downloaded from: https://nodejs.org/en/download/
2. Pull the git repository to your local environment.
   - `git clone git@github.com:Codeneos/sf_profile_updater.git`
3. Install the NodeJS dependencies using NPM install
   - `npm install`
4. Configure the tool to run for your environment by editing the `config.js` file. 
Normally you should only have to change the `srcDir` setting to point to the directory in which your SalesForce source are located.

## Usage
Simply call `npm run updateProfiles` to start the updater.

## Config file
The config file tries to be simple and straight forward and allows you to setup the tool to your liking/requirements. See below for the default config file that ships with it:
```javascript
{
    // Salesforce sources directory  can either be a relative or absolute directory
    srcDir: "..\\src",
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
        addFields: false,
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
```
