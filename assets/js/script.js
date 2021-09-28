var viz;
var vizDiv;
var contentUrl;
var workbookId;
var isHome;
var showToolbar = false;
var showTabs = false;
var workbookId;
var workbookIsFavorite = false;
var sessionInfo;
var xsrf_token;

function startViz(url)
{
	contentUrl = url;
	console.log("contentUrl: " + contentUrl);

	if (url === '') {
		contentUrl =  "site/JB-CH/views/Navigation/Home?:render=false"; // "views/Navigation/Home?:render=false";
		isHome = true;
		showTabs = false;
		showToolbar = false;
		workbookId = null;
		workbookIsFavorite = false;
	} else {
		isHome = false;
	}

	var concatUrl = window.location.protocol + "//" + window.location.host + "/#/" + contentUrl;
//	console.log("concatUrl: " + concatUrl);
//	console.log(viz);

	var vizOptions = {
		hideTabs: true,
		hideToolbar: true,
		onFirstInteractive: function() {
			$('#vizContainer').css("background-image", "none");
			// $('#vizContainer iframe').css("margin-left", "100px");
			viz.addEventListener(tableau.TableauEventName.TAB_SWITCH, onTabSwitch);
			if (getWorksheetForExcelExport()) {
				$("#exportToExcelItem").show();
			} else {
				$("#exportToExcelItem").hide();
			}
			if (url === '') {
				// console.log(document.cookie);
				var xsrf_token_regex = /XSRF-TOKEN=(.[^;]*)/ig;
				var xsrf_token_match = xsrf_token_regex.exec(document.cookie);
				var userLanguage = "en";
				var serverUserId;
				xsrf_token = xsrf_token_match[1];
				// console.log(xsrf_token);
				if (xsrf_token) {
					$.ajax({
						url: window.location.protocol + "//" + window.location.host + "/vizportal/api/web/v1/getSessionInfo",
						type: "post",
						data: JSON.stringify({
							"method": "getSessionInfo",
							"params": {}
						}),
						headers: {
							"Content-Type": "application/json;charset=UTF-8",
							"Accept": "application/json, text/plain, */*",
							"Cache-Control": "no-cache",
				 			"X-XSRF-TOKEN": xsrf_token
						},
						dataType: "json",
						success: function (data) {
							// console.log(data.result);
							sessionInfo = data.result;
							$("#textUsername").text(sessionInfo.user.displayName);
							if (sessionInfo.user.userImageUrl) {
								$("#iconUsername").hide();
								$("#imgUsername").attr("src", sessionInfo.user.userImageUrl).show();
							}
							$.ajax({
								url: window.location.protocol + "//" + window.location.host + "/vizportal/api/web/v1/getServerUsers",
								type: "post",
								data: JSON.stringify({
									"method": "getServerUsers",
									"params": {
										"filter": {
											"operator": "and",
											"clauses": [
												{ "field": "username",   "operator": "eq", "value": sessionInfo.user.username },
												{ "field": "domainName", "operator": "eq", "value": sessionInfo.user.domainName }
											]
										},
										"page": { "startIndex": 0, "maxItems": 1 }
									}
								}),
								headers: {
									"Content-Type": "application/json;charset=UTF-8",
									"Accept": "application/json, text/plain, */*",
									"Cache-Control": "no-cache",
						 			"X-XSRF-TOKEN": xsrf_token
								},
								dataType: "json",
								success: function (data) {
									// console.log(data.result);
									serverUserId = data.result.users[0].id;
									$.ajax({
										url: window.location.protocol + "//" + window.location.host + "/vizportal/api/web/v1/getUserSettings",
										type: "post",
										data: JSON.stringify({
											"method": "getUserSettings",
											"params": { "username": sessionInfo.user.username, "domainName": sessionInfo.user.domainName }
										}),
										headers: {
											"Content-Type": "application/json;charset=UTF-8",
											"Accept": "application/json, text/plain, */*",
											"Cache-Control": "no-cache",
								 			"X-XSRF-TOKEN": xsrf_token
										},
										dataType: "json",
										success: function (data) {
											if (data.result.language) {
												console.log("User language setting: " + data.result.language);
												// return; // comment out to enforce language=en
											}
											$.ajax({
												url: window.location.protocol + "//" + window.location.host + "/vizportal/api/web/v1/updateUserLanguage",
												type: "post",
												data: JSON.stringify({
													"method": "updateUserLanguage",
													"params": { "userId": serverUserId, "language": userLanguage }
												}),
												headers: {
													"Content-Type": "application/json;charset=UTF-8",
													"Accept": "application/json, text/plain, */*",
													"Cache-Control": "no-cache",
										 			"X-XSRF-TOKEN": xsrf_token
												},
												dataType: "json",
												success: function (data) {
													console.log("Updated user language setting: " + userLanguage);
													// console.log(data.result);
												}
											});
										}
									});
								}
							});
						}
					});
				}
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
//		console.log("Calling viz.dispose()");
		viz.dispose();
	}
//	setTimeout(function() { // DEBUG: emulate a delay
	vizDiv.innerHTML = "";
	viz = new tableau.Viz(vizDiv, concatUrl, vizOptions);
	if (url === '') {
		$("#restartVizItem").hide();
		$("#toggleFavoriteItem").hide();
		$("#exportPdfItem").hide();
		$("#toggleToolbarItem").hide();
		viz.addEventListener(tableau.TableauEventName.MARKS_SELECTION, navigationSelectListener); // navigation listener on-select
	} else {
		// $("#usernameItem").show();
		$("#iconAddRemoveFavorite").html("&#x2606;");
		$("#restartVizItem").show();
		$("#toggleFavoriteItem").show();
		$("#exportPdfItem").show();
		// $("#toggleToolbarItem").show();
		if (xsrf_token) { // query if this workbook is in favorites
			$.ajax({
				url: window.location.protocol + "//" + window.location.host + "/vizportal/api/web/v1/getFavorites",
				type: "post",
				data: JSON.stringify({
					"method": "getFavorites",
					"params": { "page": { "startIndex": 0, "maxItems": 1000 } }
				}),
				headers: {
					"Content-Type": "application/json;charset=UTF-8",
					"Accept": "application/json, text/plain, */*",
					"Cache-Control": "no-cache",
		 			"X-XSRF-TOKEN": xsrf_token
				},
				dataType: "json",
				// contentType: "application/json",
				success: function (data) {
					// console.info(data.result);
					if (data.result.workbooks && Array.isArray(data.result.workbooks)) {
						data.result.workbooks.forEach(function(v) {
							if (v.id == workbookId) {
								console.log("opened favorite workbook");
								workbookIsFavorite = true;
								$("#iconAddRemoveFavorite").html("&#x2605;");
							}
						});
					}
				}
			});
		}
	}
//	}, 5000);
	if (showToolbar) {
		$("#textShowHideToolbar").text("Hide");
	} else {
		$("#textShowHideToolbar").text("Show");
	}
	// document.cookie = "tableau_locale=en; workgroup_session_id=H7-o4bJXRlahgADd0kmohw|kcJbzJPuEzBJzBpK5QDTnWpzRUtrK9eC; XSRF-TOKEN=kHT1GwDHWbvaxM5rdMjy85Bkc5cpL8XR";
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
		$("#exportToExcelItem").show();
	} else {
		$("#exportToExcelItem").hide();
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
//		console.log("Stripping out hashes");
		var view = window.location.hash.substr(2);
		while (view.substr(0,2) === "#/") {
//			console.log("trim view: " + view);
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
				} else if (pairs[pairIndex].fieldName == "workbook_id") {
					workbookId = pairs[pairIndex].value;
					console.log("workbook id: " + workbookId);
				}
			}
		}
		if (selectedViz) {
			// console.log(selectedViz);
			startViz(selectedViz);
		}
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

function toggleFavorite()
{
 	if (viz && !isHome && xsrf_token && workbookId) {
 		if (workbookIsFavorite) {
			$.ajax({
				url: window.location.protocol + "//" + window.location.host + "/vizportal/api/web/v1/removeFavorite",
				type: "post",
				data: JSON.stringify({
					"method": "removeFavorite",
					"params": { "objectId": workbookId, "objectType": "workbook" }
				}),
				headers: {
					"Content-Type": "application/json;charset=UTF-8",
					"Accept": "application/json, text/plain, */*",
					"Cache-Control": "no-cache",
		 			"X-XSRF-TOKEN": xsrf_token
				},
				dataType: "json",
				success: function (data) {
					workbookIsFavorite = false;
					$("#iconAddRemoveFavorite").html("&#x2606;");
				}
			});
 		} else {
			$.ajax({
				url: window.location.protocol + "//" + window.location.host + "/vizportal/api/web/v1/addFavorite",
				type: "post",
				data: JSON.stringify({
					"method": "addFavorite",
					"params": { "objectId": workbookId, "objectType": "workbook" }
				}),
				headers: {
					"Content-Type": "application/json;charset=UTF-8",
					"Accept": "application/json, text/plain, */*",
					"Cache-Control": "no-cache",
		 			"X-XSRF-TOKEN": xsrf_token
				},
				dataType: "json",
				success: function (data) {
					workbookIsFavorite = true;
					$("#iconAddRemoveFavorite").html("&#x2605;");
					alert("The dashboard has been added to Favorites.\nThe list of favorites on Portal Home will be updated soon.");
				}
			});
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