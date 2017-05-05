# Mobile App Backend

## Overview
This Mobile App Backend for Frontend integrates Mobile Apps with the CORE Company Backend.
It serves as a sample app demonstrating how to use the above technologies in order to create a mobile backend, enable authentication and access Core Backend Services. 

### Table of content
* Overview
* Creating this application
* Deploying HelloTodo application to Bluemix
* Using a MobileFirst Services Boilerplate
* Manually deploying to Bluemix
	* Getting setup with Bluemix
	* Creating an instance of Mobile Client Access service

## Deploying Mobile App Backend application to Bluemix
There are two ways of running this application - using a MobileFirst Services Boilerplate on Bluemix or cloning the repository and deploying to Bluemix manually. 

## Using a MobileFirst Services Boilerplate
Start by creating a mobile backend on Bluemix by using the MobileFirst Services Boilerplate

> The links in below steps lead to the US_SOUTH Bluemix region. You might want to pick a region closer to you, e.g. UK or SYDNEY. 

1. [Log in](https://console.ng.bluemix.net/home/auth/bluemix) into your IBM Bluemix account
2. Open Bluemix Catalog [https://console.ng.bluemix.net/catalog/](https://console.ng.bluemix.net/catalog/)
3. Find and select the [MobileFirst Services Starter](https://console.ng.bluemix.net/catalog/starters/mobilefirst-services-starter/) under the Boilerplates section
4. Select the space you want to add your mobile backend to
5. Enter the name and a host for your mobile backend. 
6. Optionally you can change service plans
7. Click CREATE button

## Manually deploying to Bluemix
To manually deploy this application to Bluemix perform the following steps

### Getting setup with Bluemix

1. Make sure you have [IBM Bluemix](https://console.ng.bluemix.net/) account
2. Make sure you have [Cloud Foundry CLI](https://www.ng.bluemix.net/docs/cli/downloads.html) tool installed
3. Open terminal and 	verify that cf tool is available by running `cf --version`
1. Setup `cf` tool to work with a Bluemix API server of your choice, for instance `cf api https://api.ng.bluemix.net`

	> Use following URLs for other Bluemix regions:
	
	> US-SOUTH `https://api.ng.bluemix.net`
	
	> UNITED KINGDOM `https://api.en-gb.bluemix.net`
	
	> SYDNEY `https://api.au-syd.bluemix.net`

1. Login with your Bluemix credentials and pick your organization and space by running `cf login`

1. Make sure you're in a right region, organization and space by running `cf target`	
### Creating an instance of Mobile Client Access service

1. HelloTodo app requires an instance of a Mobile Client Access service to be bound. Mobile Client Access is a service that provides authentication and monitoring capabilities for your Bluemix apps. 

1. Run the following command to create a new instance of Mobile Client Access service if your space. 

	```Shell
	cf create-service AdvancedMobileAccess Bronze my-MCA-service-instance
	```
	
	> You can pick any other name instead of my-MCA-service-instane
	
1. Run `cf services` command and validate a new service instance was added
