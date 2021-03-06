var viz;
var contentUrl;
var navUrl = null;
var deviceType = "desktop";
var workbookId;
var viewId;
var isPortalHome;
var sessionInfo;
var xsrf_token;
var timezone_offset;
var showToolbar = false;
var showTabs = false;
var favoriteWorkbooks;
var workbookIsFavorite = false;
var exportToPdf = false;
var exportToPpt = false;
var exportToExcel = false;
var responsiveViz = false; // show device toggle icon on navbar
var enableComments = false; // show comments icon on navbar
var useComments = false; // enable comments icon for a specific workbook

// initialize customization variables and functions
var tableau_protocol = window.location.protocol;
var tableau_host = window.location.host;
var portal_home_url = "views/Portal/Home"; // partial URL for the Portal home page
var portal_custom_home = ""; // optional, specifies URL parameter which specifies alternative portal home location
var portal_remember_param = ""; // optional, defines Tableau parameter for remembering portal location
var pass_param_tzoffset = ""; // optional, parameter that captures time zone offset in minutes
var set_user_language = ""; // optional, if defined, specifies language code that is updated in user settings on each log in
var substr_export_to_excel = "#excel"; // optional, substring for matching to enable Export to Excel
var substr_export_to_pdf = ""; // optional, substring for matching to enable Export to PDF
var substr_export_to_ppt = ""; // optional, substring for matching to enable Export to PowerPoint
var substr_print_to_pdf = "#print"; // optional, substring for matching to enable Print to PDF

function startViz(url, refresh)
{
	contentUrl = url;

	var tableau_url = tableau_protocol + "//" + tableau_host + "/";

	if (url === '') {
		tableau_url = tableau_url + portal_home_url + "?:refresh=yes";
		if (navUrl) {
			tableau_url = navUrl + (navUrl.indexOf('?') > 0 ? "&" : "?") + ":refresh=yes";
			navUrl = null;
		}
		isPortalHome = true;
		showTabs = false;
		showToolbar = false;
		responsiveViz = false;
		workbookId = null;
		workbookIsFavorite = false;
	} else {
		var regexContentUrl = new RegExp( "^" + tableau_url.replace(/[\/\\^$*+?.()|[\]{}]/g , "\\$&") );
		tableau_url = (contentUrl.match(regexContentUrl) ? "" : tableau_url) + contentUrl.replace(/^site/, "t");
		isPortalHome = false;
		if (refresh) {
			tableau_url = tableau_url + (tableau_url.indexOf('?') > 0 ? "&" : "?") + ":refresh=yes";
		}
		workbookIsFavorite = false;
		if (Array.isArray(favoriteWorkbooks)) {
			favoriteWorkbooks.forEach(function(v) {
				if (v.id == workbookId) {
					workbookIsFavorite = true;
					console.log("This workbook is marked as favorite");
				}
			});
		}
	}

	console.log("url: " + tableau_url);
	updateFavoriteIcon();
	updateNavbar();

	var vizOptions = {
		hideTabs: true,
		hideToolbar: true,
		disableUrlActionsPopups: true,
		device: deviceType,
		onFirstInteractive: function() {
			console.log("onFirstInteractive");
			$('#vizContainer').css("background-image", "none");
			if (refresh) {
				viz.revertAllAsync();
			}
			updateExportButtons();
			updateNavbar();
			if (isPortalHome) {
				viz.addEventListener(tableau.TableauEventName.MARKS_SELECTION, onPortalHomeSelect);
			} else {
				viz.addEventListener(tableau.TableauEventName.TAB_SWITCH, onTabSwitch);
				viz.addEventListener(tableau.TableauEventName.URL_ACTION, onUrlAction);
				// useComments = true;
				if (pass_param_tzoffset.length > 0) {
					var wb = viz.getWorkbook();
					wb.getParametersAsync().then(function(params) {
						for (var i = 0; i < params.length; i++) {
							if (params[i].getName() == pass_param_tzoffset) {			
								if (params[i].getAllowableValuesType() === tableau.ParameterAllowableValuesType.LIST) {
									var param_values = params[i].getAllowableValues();
									for (var j = 0; j < param_values.length; j++) {
										if (param_values[j].value == timezone_offset) {
											console.log("setting "+pass_param_tzoffset+" = "+param_values[j].formattedValue);
											wb.changeParameterValueAsync(pass_param_tzoffset, param_values[j].formattedValue);
										}
									}
								} else {
									console.log("setting "+pass_param_tzoffset+" = "+timezone_offset);
									wb.changeParameterValueAsync(pass_param_tzoffset, timezone_offset);
								}
							} 
						}
					});
				}
			}
			var xsrf_token_regex = /XSRF-TOKEN=(.[^;]*)/ig;
			var xsrf_token_match = xsrf_token_regex.exec(document.cookie);
			var serverUserId;
			if (xsrf_token_match) {
				xsrf_token = xsrf_token_match[1];
				// console.log("xsrf_token = " + xsrf_token);
			}
			if (xsrf_token) {
				if (isPortalHome) {
					$.ajax({
						url: tableau_protocol + "//" + tableau_host + "/vizportal/api/web/v1/getSessionInfo",
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
								url: tableau_protocol + "//" + tableau_host + "/vizportal/api/web/v1/getServerUsers",
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
									serverUserId = data.result.users[0].id;
									if (set_user_language.length > 0) {
										$.ajax({
											url: tableau_protocol + "//" + tableau_host + "/vizportal/api/web/v1/getUserSettings",
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
													console.log("Current user language setting: " + data.result.language);
												}
												$.ajax({
													url: tableau_protocol + "//" + tableau_host + "/vizportal/api/web/v1/updateUserLanguage",
													type: "post",
													data: JSON.stringify({
														"method": "updateUserLanguage",
														"params": { "userId": serverUserId, "language": set_user_language }
													}),
													headers: {
														"Content-Type": "application/json;charset=UTF-8",
														"Accept": "application/json, text/plain, */*",
														"Cache-Control": "no-cache",
														"X-XSRF-TOKEN": xsrf_token
													},
													dataType: "json",
													success: function (data) {
														console.log("Updated user language setting: " + set_user_language);
													}
												});
											}
										});
									}
								}
							});
						}
					}); // getSessionInfo
					$.ajax({
						url: tableau_protocol + "//" + tableau_host + "/vizportal/api/web/v1/getFavorites",
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
						success: function (data) {
							if (data.result.workbooks && Array.isArray(data.result.workbooks)) {
								favoriteWorkbooks = data.result.workbooks;
								updateFavoritesMenu();
							}
						}
					}); // getFavorites
				} // if isPortalHome
			} // if xsrf_token
		} // onFirstInteractive function
	}; // var vizOptions

	if (showTabs) {
		vizOptions.hideTabs = false;
	}
	if (showToolbar) {
		vizOptions.hideToolbar = false;
		vizOptions.toolbarPosition = 'top';
	}
	if (viz) {
		viz.removeEventListener(tableau.TableauEventName.TAB_SWITCH, onTabSwitch);
		viz.removeEventListener(tableau.TableauEventName.URL_ACTION, onUrlAction);
		viz.removeEventListener(tableau.TableauEventName.MARKS_SELECTION, onPortalHomeSelect);
		viz.dispose();
	}

	var vizDiv = document.getElementById("vizContainer");
	vizDiv.innerHTML = "";
	viz = new tableau.Viz(vizDiv, tableau_url, vizOptions);
}

function getWorksheetForExportExcel() {
	var vizsheet = viz.getWorkbook().getActiveSheet();
	var ws = null;
	if (substr_export_to_excel.length > 0) {
		var exportToExcelRegexp = new RegExp( substr_export_to_excel.replace(/[\/\\^$*+?.()|[\]{}]/g , "\\$&") );
		if (vizsheet.getSheetType()==tableau.SheetType.DASHBOARD) {
			vizsheet.getWorksheets().forEach(function(v) {
				if (v.getName().match(exportToExcelRegexp)) {
					ws = v;
				}
			});
		} else if (vizsheet.getSheetType()==tableau.SheetType.WORKSHEET && vizsheet.getName().match(exportToExcelRegexp)) {
			ws = vizsheet;
		}
	}
	return ws;
}

function updateExportButtons() {
	if (getWorksheetForExportExcel()) {
		exportToExcel = true;
	} else {
		exportToExcel = false;
	}
	if (!isPortalHome) { // ASL TODO: make dependent on substring in worksheet names
		exportToPdf = true;
	} else {
		exportToPdf = false;
	}
	if (!isPortalHome) { // ASL TODO: make dependent on substring in worksheet names
		exportToPpt = true;
	} else {
		exportToPpt = false;
	}
}

function updateNavbar(only_go_back) {
	if (only_go_back) {
		$("#undoVizItem").hide();
		$("#redoVizItem").hide();
		$("#goBackItem").show();
		$("#restartVizItem").hide();
		$("#toggleFavoriteItem").hide();
		$("#navbarExportDropdownLink").hide();
	} else {
		$("#undoVizItem").show();
		$("#redoVizItem").show();
		$("#goBackItem").hide();
		$("#restartVizItem").show();
		$("#toggleFavoriteItem").show();
		$("#navbarExportDropdownLink").show();
	}
	if (isPortalHome) { // disable buttons for Portal Home
		$("#undoVizButton").addClass("disabled");
		$("#redoVizButton").addClass("disabled");
		$("#restartVizButton").addClass("disabled");
		$("#toggleFavoriteButton").addClass("disabled").hide();
		$("#favoritesMenuItem").show();
	} else { // enable buttons for other workbooks
		$("#undoVizButton").removeClass("disabled");
		$("#redoVizButton").removeClass("disabled");
		$("#restartVizButton").removeClass("disabled");
		$("#toggleFavoriteButton").removeClass("disabled").show();
		$("#favoritesMenuItem").hide();
	}
	if (exportToPdf) { 
		$("#exportPdfButton").removeClass("disabled");
	} else {
		$("#exportPdfButton").addClass("disabled");
	}
	if (exportToPpt) { 
		$("#exportPptButton").removeClass("disabled");
	} else {
		$("#exportPptButton").addClass("disabled");
	}
	if (exportToExcel) { 
		$("#exportExcelButton").removeClass("disabled");
	} else {
		$("#exportExcelButton").addClass("disabled");
	}
	if (!exportToPdf && !exportToPpt && !exportToExcel) {
		$("#navbarExportDropdownLink").addClass("disabled");
	} else {
		$("#navbarExportDropdownLink").removeClass("disabled");
	}
	if (deviceType === "tablet") {
		$("#deviceType").text("Laptop");
		$("#toggleDeviceIcon").removeClass("bi-display").addClass("bi-laptop");
	} else {
		$("#deviceType").text("Desktop");
		$("#toggleDeviceIcon").addClass("bi-display").removeClass("bi-laptop");
	}
	if (responsiveViz) {
		// $("#toggleDeviceButton").removeClass("disabled");
		$("#toggleDeviceItem").show();
	} else {
		// $("#toggleDeviceButton").addClass("disabled");
		$("#toggleDeviceItem").hide();
	}
	if (enableComments) {
		$("#toggleCommentsItem").show();
	} else {
		$("#toggleCommentsItem").hide();
	}
	if (useComments) {
		$("#toggleCommentsButton").removeClass("disabled");
	} else {
		$("#toggleCommentsButton").addClass("disabled");
	}
}

function updateFavoriteIcon() {
	if (workbookIsFavorite) {
		$("#toggleFavoriteIcon").removeClass("bi-star").addClass("bi-star-fill");
	} else {
		$("#toggleFavoriteIcon").addClass("bi-star").removeClass("bi-star-fill");
	}
}

function updateFavoritesMenu() {
	if (Array.isArray(favoriteWorkbooks)) {
		$("#navbarFavoritesDropdownButton").removeClass("disabled");
		var favoritesHtmlUl = $("#favoritesMenuItem > ul");
		// console.log(favoriteWorkbooks);
		favoritesHtmlUl.empty();
		favoriteWorkbooks.forEach(function(v) {
			$("<li>").append($('<a class="dropdown-item user-select-none" href="#">')
				.text(v.name)
				.bind('click', function() {
					workbookId = v.id;
					viewId = null; // TODO
					showTabs = v.tags.indexOf('showtabs') >= 0;
					showToolbar = v.tags.indexOf('showtoolbar') >= 0;
					responsiveViz = v.tags.indexOf('responsive') >= 0;
					useComments = v.tags.indexOf('comments') >= 0;
					startViz('views/'+v.defaultViewUrl);
				})
			).appendTo(favoritesHtmlUl);
		});
	} else {
		$("#navbarFavoritesDropdownButton").addClass("disabled");
	}
}

function onTabSwitch(tabSwitchEvent) {
	console.log("tab switch event");
	var newsheet = tabSwitchEvent.getNewSheetName();
	// ASL TODO: get new view id for comments feature
	// console.log(newsheet);
	// var sheets = viz.getWorkbook().getPublishedSheetsInfo();
	// console.log(sheets);
	
	if (substr_print_to_pdf.length > 0) {
		var goToPrintPdfRegexp = new RegExp( substr_print_to_pdf.replace(/[\/\\^$*+?.()|[\]{}]/g , "\\$&") );
		if (newsheet.match(goToPrintPdfRegexp)) {
			exportToPdf = false;
			exportToPdf = false;
			exportToExcel = false;
			updateNavbar(true);
			exportPdfDlg();
		} else {
			updateExportButtons();
			updateNavbar();
		}
	}
}

function onUrlAction(urlActionEvent) {
	console.log("url action event");
	var url = urlActionEvent.getUrl();
	var tableau_url = tableau_protocol + "//" + tableau_host + "/";
	var portal_url = tableau_url + "start.html";
	var regexContentUrl = new RegExp( "^" + tableau_url.replace(/[\/\\^$*+?.()|[\]{}]/g , "\\$&") );
	var regexContentUrlPortal = new RegExp( "^" + portal_url.replace(/[\/\\^$*+?.()|[\]{}]/g , "\\$&") );
	console.log(regexContentUrl);
	if (url.match(regexContentUrlPortal) || !url.match(regexContentUrl)) {
		window.open(url, "_blank");
	} else {
		startViz(url); // open within the existing tab
	}
}

function setVizSize() {
	var newHeight = window.screen.height;
	var newWidth  = window.screen.width;
	if (deviceType === "tablet") {
		newWidth = 1169;
		newHeight = 827;
		// $("#vizContainer").css("margin-left", "375px");
	} else { // deviceType = desktop
		newHeight -= newHeight - $("#portalHeader").height()-200; // 200 is sufficient buffer space to reserve for menubar, statusbar, favorites, etc.
		// $("#vizContainer").css("margin-left", "0px");
	}
	$("#vizContainer").width(newWidth);
	$("#vizContainer").height(newHeight);
}

function initPage()
{
	setVizSize();
	timezone_offset = new Date().getTimezoneOffset();

	const urlParams = new URLSearchParams(window.location.search);
	if (portal_custom_home.length > 0 && urlParams.has(portal_custom_home)) {
		portal_home_url = urlParams.get(portal_custom_home);
	}
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

$(document).ready(initPage);

function onPortalHomeSelect(marksEvent)
{
	viz.getCurrentUrlAsync().then(function(url) {
		navUrl = url.substring(0, url.indexOf('?'));
		viz.getWorkbook().getParametersAsync().then(function(params) {
			if (portal_remember_param.length > 0) {
				var param_value = "";
				for (var i = 0; i < params.length; i++) {
					if (params[i].getName() == portal_remember_param) {
						param_value = params[i].getCurrentValue().value;
					} 
				}
				if (param_value) {
					navUrl += "?"+portal_remember_param+"=" + param_value;
				}
			}
			marksEvent.getMarksAsync().then(function(marks) {
				var selectedViz;
				if (marks.length == 1) {
					console.log("workbook selected");
					var pairs = marks[0].getPairs();
					for (var pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
						if (pairs[pairIndex].fieldName == "full_url" || pairs[pairIndex].fieldName == "ATTR(full_url)") {
							selectedViz = pairs[pairIndex].value;
							console.log("full_url: " + selectedViz);
						} else if (pairs[pairIndex].fieldName == "workbook_id" || pairs[pairIndex].fieldName == "ATTR(workbook_id)") {
							workbookId = pairs[pairIndex].value;
							console.log("workbook id: " + workbookId);
						} else if (pairs[pairIndex].fieldName == "view_id" || pairs[pairIndex].fieldName == "ATTR(view_id)") {
							viewId = pairs[pairIndex].value;
							console.log("view id: " + viewId);
						} else if (pairs[pairIndex].fieldName == "showtabs" || pairs[pairIndex].fieldName == "ATTR(showtabs)") {
							showTabs = pairs[pairIndex].value == 1;
							console.log("show tabs: " + showTabs);
						} else if (pairs[pairIndex].fieldName == "showtoolbar" || pairs[pairIndex].fieldName == "ATTR(showtoolbar)") {
							showToolbar = pairs[pairIndex].value == 1;
							console.log("show toolbar: " + showToolbar);
						} else if (pairs[pairIndex].fieldName == "responsive" || pairs[pairIndex].fieldName == "ATTR(responsive)") {
							responsiveViz = pairs[pairIndex].value == 1;
							console.log("responsive: " + responsiveViz);
						} else if (pairs[pairIndex].fieldName == "comments" || pairs[pairIndex].fieldName == "ATTR(comments)") {
							useComments = pairs[pairIndex].value == 1;
							console.log("comments: " + useComments);
						}
					}
				}
				if (selectedViz) {
					startViz(selectedViz);
				}
			}); // getMarksAsync
		}); // getParametersAsync
	}); // getCurrentUrlAsync
}

function resetViz()
{
	if (viz) {
		viz.revertAllAsync();
	}
}

function restartViz()
{
	if (viz) {
		startViz(contentUrl, true);
	}
}

function undoViz()
{
	if (viz) {
		viz.undoAsync();
	}
}

function redoViz()
{
	if (viz) {
		viz.redoAsync();
	}
}

function goBackViz()
{
	if (viz) {
		viz.undoAsync().then(setTimeout(function() { // check the status with a delay (immediately doesn't work)
			// in some cases, two steps back are necessary after printing to PDF
			// however we need to be careful not to go back too far
			if ($("#goBackItem").is(":visible")) {
				console.log("go back one more step");
				viz.undoAsync();
			}
		}, 500)); // delay of 0.5 second
	}
}

function exportPdfDlg()
{
	if (viz && !isPortalHome) {
		console.log("viz.showExportPDFDialog");
		viz.showExportPDFDialog();
	}
}

function exportPptDlg()
{
	if (viz && !isPortalHome) {
		console.log("viz.showExportPowerPointDialog");
		viz.showExportPowerPointDialog();
	}
}

function exportCrosstabDlg()
{
	if (viz && !isPortalHome) {
		console.log("viz.showExportCrossTabDialog");
		var ws = getWorksheetForExportExcel();
		if (ws) {
			viz.showExportCrossTabDialog(ws);
		} else {
			alert('Export to Excel not permitted');
		}
	}
}

function toggleDevice()
{
	var newWidth, newHeight;
	if (viz && !isPortalHome) {
		if (deviceType === "desktop") {
			deviceType = "tablet";
			setVizSize();
		} else {
			deviceType = "desktop";
			setVizSize();
		}
		updateNavbar();
		startViz(contentUrl);
	}
}

function toggleComments()
{
	console.log("comments button");
	if (viz && !isPortalHome) {
		$("#vizComments").toggle();
		if ($("#vizComments").is(":visible")) {
			updateComments();
		}
	}
}

function updateComments() {
	// console.log("update comments");
	if (xsrf_token && viewId) {
		$.ajax({
			url: tableau_protocol + "//" + tableau_host + "/vizportal/api/web/v1/getCommentsWithMentions",
			type: "post",
			data: JSON.stringify({
				"method": "getCommentsWithMentions",
				"params": {
					"commentableId": viewId,
					"commentableType": "VIEW",
					"page": { "startIndex": 0, "maxItems": 1000 }
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
				console.log(data.result);
				$("#commentsBox").html("<h5>COMMENTS</h5>");
				if (data.result.comments && Array.isArray(data.result.comments)) {
					data.result.comments.forEach(function(v) {
						$("#commentsBox").append("<div>");
						var commentDate = v.createdAt.split("T")[0];
						// commentDate.getFullYear()+"."+(commentDate.getMonth()+1)+"."+commentDate.getDay()
						var commentTime = v.createdAt.split("T")[1].substring(0, 8);
						var commentAuthor = "unknown";
						if (data.result.users && Array.isArray(data.result.users)) {
							data.result.users.forEach(function(u) {
								if (u.id == v.authorId) {
									commentAuthor = u.displayName;
								}
							});
						}
						$("#commentsBox")
							.append("<span>"+commentDate+" | "+commentTime+" by "+commentAuthor+"</span>&nbsp;")
							.append('<small><a href="#" class="bjb-link-arrow" onclick="deleteComment('+v.id+');">Del</a></small>')
							.append("<p>"+v.text+"</p>")
							.append("</div>");
					});
				}
			}
		});			
	} else {
		console.log("fetching comments not possible");
	}
}

function deleteComment(id) {
	if (xsrf_token) {
		$.ajax({
			url: tableau_protocol + "//" + tableau_host + "/vizportal/api/web/v1/newDeleteComment",
			type: "post",
			data: JSON.stringify({
				"method": "newDeleteComment",
				"params": { "commentId": id }
			}),
			headers: {
				"Content-Type": "application/json;charset=UTF-8",
				"Accept": "application/json, text/plain, */*",
				"Cache-Control": "no-cache",
				"X-XSRF-TOKEN": xsrf_token
			},
			dataType: "json",
			success: function (data) {
				// console.log(data);
				updateComments();
			}
		});
	} else {
		console.log("deleting comment not possible");
	}
}

function addComment() {
	if (xsrf_token) {
		$.ajax({
			url: tableau_protocol + "//" + tableau_host + "/vizportal/api/web/v1/newCreateComment",
			type: "post",
			data: JSON.stringify({
				"method": "newCreateComment",
				"params": {
					"commentableId": viewId,
					"commentableType": "VIEW",
					"text": $("#newCommentInput").val()
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
				// console.log(data);
				$("#newCommentInput").val('');
				updateComments();
			}
		});
	} else {
		console.log("adding comment not possible");
	}
}

function toggleFavorite()
{
	console.log("favorites button clicked");
	if (viz && !isPortalHome && xsrf_token && workbookId) {
		if (workbookIsFavorite) {
			console.log("remove from favorites");
			$.ajax({
				url: tableau_protocol + "//" + tableau_host + "/vizportal/api/web/v1/removeFavorite",
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
					updateFavoriteIcon();
				}
			});
		} else {
			console.log("add to favorites");
			$.ajax({
				url: tableau_protocol + "//" + tableau_host + "/vizportal/api/web/v1/addFavorite",
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
					updateFavoriteIcon();
				}
			});
		}
	}
}

function openTableauServer()
{
	if (viz && !isPortalHome) {
		viz.getCurrentUrlAsync().then(function(url){
			window.open(url.substring(0, url.indexOf('?')), "_blank");
		});
	}
}