//tableau_protocol = "https:"; // override for testing
//tableau_host = "tableau-portal.westeurope.cloudapp.azure.com"; // override for testing
portal_home_url = "t/JB-CH/views/Navigation/Home"; // mandatory, URL for the home page
// portal_custom_home = "portal"; // optional, specifies URL parameter which specifies alternative portal home location
portal_remember_param = "CurrentTopic"; // optional, defines Tableau parameter for remembering portal location
pass_param_tzoffset = "TZOffset"; // optional, parameter that captures time zone offset in minutes
set_user_language = "en"; // optional, if defined, specifies language code that is updated in user settings on each log in
substr_export_to_excel = "excel"; // optional, substring for matching to enable Export to Excel
substr_print_to_pdf = "#print"; // optional, substring for matching to enable Print to PDF

updateFavoriteIcon = function() { // override default feature
	if (workbookIsFavorite) {
		$("#iconAddRemoveFavorite").html("&#x2605;");
	} else {
		$("#iconAddRemoveFavorite").html("&#x2606;");
	}
}

updateNavbar = function() { // previous default behavior, hide buttons
	if (isPortalHome) {
		$("#undoVizItem").hide();
		$("#redoVizItem").hide();
		$("#goBackItem").hide();
		$("#restartVizItem").show();
		$("#toggleFavoriteItem").hide();
		$("#exportPdfItem").hide();
		$("#exportPptItem").hide();
		$("#exportExcelItem").hide();
		$("#toggleDeviceItem").hide();
		$("#toggleCommentsItem").hide();
	} else {
		$("#undoVizItem").show();
		$("#redoVizItem").show();
		$("#goBackItem").hide();
		$("#restartVizItem").show();
		$("#toggleFavoriteItem").show();
		$("#exportPdfItem").show();
		$("#exportPptItem").show();
	}
}
