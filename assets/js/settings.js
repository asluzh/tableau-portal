var tableau_protocol = window.location.protocol; // default location
//tableau_protocol = "https:"; // override for testing
var tableau_host = window.location.host; // default location
//tableau_host = "tableau-portal.westeurope.cloudapp.azure.com"; // override for testing
var portal_home_url = "views/Portal/Home"; // mandatory, URL for the home page
var portal_remember_home = "portal"; // optional, defines URL parameter for remembering portal location

var exportToExcelMatch = /excel/ig;
var printToPdfMatch = /#print/ig;
