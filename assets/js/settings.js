var tableau_protocol = window.location.protocol; // default location
//tableau_protocol = "https:"; // override for testing
var tableau_host = window.location.host; // default location
//tableau_host = "tableau-portal.westeurope.cloudapp.azure.com"; // override for testing
var portal_home_url = "views/Portal/Home"; // mandatory, URL for the home page
//var portal_custom_home = "portal"; // optional, specifies URL parameter which specifies alternative portal home location
//var portal_remember_param = "CurrentTopic"; // optional, defines Tableau parameter for remembering portal location
var pass_param_tzoffset = "TZOffset";

var exportToExcelMatch = /excel/ig;
var printToPdfMatch = /#print/ig;
