var viz;
var vizDiv;
var contentUrl;
var isHome;
var showToolbar = false;
var showTabs = false;

function startViz(url)
{
	contentUrl = url;
	console.log("contentUrl: " + contentUrl);

	if (contentUrl === '') {
		contentUrl = "site/JB-CH/views/Navigation/Home?:render=false";  // "views/Navigation/Home?:render=false"
		isHome = true;
		showTabs = false;
		showToolbar = false;
	} else {
		isHome = false;
	}

	var concatUrl = window.location.protocol + "//" + window.location.host + "/#/" + contentUrl;

	var vizOptions = {
		hideTabs: true,
		hideToolbar: true,
		onFirstInteractive: function() {
			$('#vizContainer').css("background-image", "none");
			viz.addEventListener(tableau.TableauEventName.TAB_SWITCH, onTabSwitch);
			if (getWorksheetForExcelExport()) {
				$("#exportToExcel").show();
			} else {
				$("#exportToExcel").hide();
			}
		}
	};

	if (showTabs) {
		vizOptions.hideTabs = false;
	}
	if (showToolbar) {
		vizOptions.hideToolbar = false;
		vizOptions.toolbarPosition = 'top';

	}
	if (url === '') {
	//	vizOptions.hideTabs = false;
		$('.homebutton').parent().addClass('active');
	} else {
		$('.homebutton').parent().removeClass('active');
	}
	if (viz) {
		viz.dispose();
	}
//	setTimeout(function() { // DEBUG: emulate a delay
	vizDiv.innerHTML = "";
	viz = new tableau.Viz(vizDiv, concatUrl, vizOptions);
	if (url === '') {
		viz.addEventListener(tableau.TableauEventName.MARKS_SELECTION, navigationSelectListener); // navigation listener on-select
	}
//	}, 5000);
	if (showToolbar) {
		$("#textShowHideToolbar").text("Hide");
	} else {
		$("#textShowHideToolbar").text("Show");
	}
}

function getWorksheetForExcelExport() {
	var vizsheet = viz.getWorkbook().getActiveSheet();
	var ws = null;
	var matchpattern = /excel/ig;
	if (vizsheet.getSheetType()==tableau.SheetType.DASHBOARD) {
		vizsheet.getWorksheets().forEach(function(v) {
			if (v.getName().match(matchpattern)) {
				ws = v;
			}
		});
	} else if (vizsheet.getSheetType()==tableau.SheetType.WORKSHEET && vizsheet.getName().match(matchpattern)) {
		ws = vizsheet;
	}
	return ws;
}

function onTabSwitch(tabSwitchEvent) {
//	console.log("tab switch");
	if (getWorksheetForExcelExport()) {
		$("#exportToExcel").show();
	} else {
		$("#exportToExcel").hide();
	}
}

function initPage()
{
	var newHeight = window.screen.height - $("#portalHeader").height()-200; // 200 is sufficient buffer space to reserve for menubar, statusbar, favorites, etc.
	var newWidth = window.screen.width;
	//OLD Version of screen size - changed by JST 11.12.2019
	//var newHeight = $(window).height() - $("#portalHeader").height()-1;
	//var newWidth = $(window).width();
	// console.log("New container height: " + newHeight);
	// console.log("Header height: " + $("#portalHeader").height());

	$("#vizContainer").height(newHeight);
	$("#vizContainer").width(newWidth);

	vizDiv = document.getElementById("vizContainer");
	if (window.location.hash.length > 2) {
		var view = window.location.hash.substr(2);
		while (view.substr(0,2) === "#/") {
			view = view.substr(2);
		}
		startViz(view);
	} else {
		startViz('');
	}
}

function navigationSelectListener(marksEvent)
{
	marksEvent.getMarksAsync().then(function(marks) {
		var selectedViz;
		if (marks.length == 1) {
			console.log("workbook selected");
			var pairs = marks[0].getPairs();
			for (var pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
				if (pairs[pairIndex].fieldName == "full_url") {
					selectedViz = pairs[pairIndex].value;
					console.log("full_url: " + selectedViz);
				} else if (pairs[pairIndex].fieldName == "showtabs") {
					showTabs = pairs[pairIndex].value == 1;
					console.log("show tabs: " + showTabs);
				} else if (pairs[pairIndex].fieldName == "showtoolbar") {
					showToolbar = pairs[pairIndex].value == 1;
					console.log("show toolbar: " + showToolbar);
				}
			}
		}
		if (selectedViz) {
			startViz(selectedViz);
		}
	}, function(error) {
		console.log("error when selecting workbook");
	});
}

function resetViz()
{
	if (viz) {
//		console.log("viz.revertAllAsync");
		viz.revertAllAsync();
	}
}

function restartViz()
{
 	if (viz && !isHome) {
		startViz(contentUrl);
	}
}

function undoViz()
{
	if (viz) {
//		console.log("viz.undoAsync");
		viz.undoAsync();
	}
}

function redoViz()
{
	if (viz) {
//		console.log("viz.redoAsync");
		viz.redoAsync();
	}
}

function exportPdf()
{
 	if (viz && !isHome) {
//		console.log("exportPdf");
		viz.getCurrentUrlAsync().then(function(url){
//			console.log("current URL: " + url);
			window.open(url.replace(/\?.*$/,".pdf"), "_blank");
		});
	}
}

function exportPdfDlg()
{
 	if (viz && !isHome) {
		console.log("viz.showExportPDFDialog");
		viz.showExportPDFDialog();
	}
}

function exportCrosstabDlg()
{
	if (viz && !isHome) {
		console.log("viz.showExportCrossTabDialog");
		var ws = getWorksheetForExcelExport();
		if (ws) {
			viz.showExportCrossTabDialog(ws);
		} else {
			alert('Export to Excel not permitted');
		}
	}
}

function toggleToolbar()
{
 	if (viz && !isHome) {
		if (!showToolbar) {
			showToolbar = true;
			startViz(contentUrl);
			$("#textShowHideToolbar").text("Hide");
		} else {
			showToolbar = false;
			startViz(contentUrl);
			$("#textShowHideToolbar").text("Show");
		}
	}
}

function openTableauServer()
{
 	if (viz && !isHome) {
		viz.getCurrentUrlAsync().then(function(url){
//			console.log("current URL: " + url);
			window.open(url.substring(0, url.indexOf('?')), "_blank");
		});
	}
}