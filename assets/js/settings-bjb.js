var tableau_protocol = window.location.protocol; // mandatory
//tableau_protocol = "https:"; // override for testing
var tableau_host = window.location.host; // mandatory
//tableau_host = "tableau-portal.westeurope.cloudapp.azure.com"; // override for testing
var portal_home_url = "t/JB-CH/views/Navigation/Home"; // mandatory, URL for the home page
//var portal_custom_home = "portal"; // optional, specifies URL parameter which specifies alternative portal home location
var portal_remember_param = "CurrentTopic"; // optional, defines Tableau parameter for remembering portal location
var pass_param_tzoffset = "TZOffset"; // optional, parameter that captures time zone offset in minutes
var set_user_language = "en"; // optional, if defined, specifies language code that is updated in user settings on each log in

var exportToExcelMatch = /excel/ig; // mandatory, regexp pattern match for Export to Excel
var printToPdfMatch = /#print/ig; // mandatory, regexp pattern match for Print to PDF
