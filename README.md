# SSFPU: Simple SalesForce Profile Updater
A simple NodeJS based profile updater for SalesForce profiles.

## Functionality
At this moment the profile updater only updates APEX class visbility based on the files you have locally. It removes classes that do not exist any more and adds new classes it finds while scanning your SalesForce source directory. It will update all your profiles and by dfeault it will set the class visibility for new classes to false for all profiles except for the Admin profile. You can change the default behavior using in `config.js` file.

## Install
1. Install NodeJS for your operating system
   - NodeJS can be downloaded from: https://nodejs.org/en/download/
2. Pull the git reponsitory to your local environment.
   - `git clone git@github.com:Codeneos/sf_profile_updater.git`
3. Install the NodeJS dependencies using NPM install
   - `npm install`
4. Configure the tool to run for your environment by editing the `config.js` file. 
Normally you should only have to change the `srcDir` setting to point to the directory in which your SalesForce source are located.

## Usage
Simply call `npm run updateProfiles` to start the updater.
   
