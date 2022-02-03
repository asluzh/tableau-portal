// tableau_protocol = "https:"; // override for testing
// tableau_host = "tableau-portal.westeurope.cloudapp.azure.com"; // override for testing
// portal_home_url = "views/Portal/Home"; // override if needed
// portal_custom_home = "portal"; // optional, specifies URL parameter which specifies alternative portal home location
// portal_remember_param = "CurrentTopic"; // optional, defines Tableau parameter for remembering portal location
// pass_param_tzoffset = "TZOffset"; // optional, parameter that captures time zone offset in minutes
// set_user_language = "en"; // optional, if defined, specifies language code that is updated in user settings on each log in
// substr_export_to_excel = "#excel"; // optional, substring for matching to enable Export to Excel
// substr_print_to_pdf = "#print"; // optional, substring for matching to enable Print to PDF

setFavoriteIcon   = function() { $("#iconFavorite").removeClass("bi-star").addClass("bi-star-fill"); }
clearFavoriteIcon = function() { $("#iconFavorite").addClass("bi-star").removeClass("bi-star-fill"); }

onFirstInteractiveCall = function(url) {
	if (url === '') {
		$("#undoVizItem").hide();
		$("#redoVizItem").hide();
		$("#goBackItem").hide();
		$("#restartVizItem").show();
		$("#toggleFavoriteItem").hide();
		$("#exportPdfItem").hide();
		$("#exportPptItem").hide();
		$("#exportToExcelItem").hide();
		$("#toggleDeviceItem").hide();
		$("#toggleCommentsItem").hide();
        $("#deviceType").text("Desktop");
	} else {
		// $("#usernameItem").show();
		$("#undoVizItem").show();
		$("#redoVizItem").show();
		$("#goBackItem").hide();
		$("#restartVizItem").show();
		$("#toggleFavoriteItem").show();
		$("#exportPdfItem").show();
		$("#exportPptItem").show();
	}
    // $('#vizContainer iframe').css("margin-left", "100px");
    if (getWorksheetForExportExcel()) {
        $("#exportToExcelItem").show();
    } else {
        $("#exportToExcelItem").hide();
    }
    if (responsiveViz) {
        $("#toggleDeviceItem").show();
    } else {
        $("#toggleDeviceItem").hide();
    }
    if (useComments) {
        $("#toggleCommentsItem").show();
    } else {
        $("#toggleCommentsItem").hide();
    }
}
