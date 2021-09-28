var viz, vizDiv, contentUrl, isHome;

function startViz(url, showtabs)
{
	contentUrl = url;
//	console.log("contentUrl: " + contentUrl);

	if (url === '') {
		contentUrl = "site/JB-CH/views/Navigation/Home";
		isHome = true;
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
		}
	};

	if (showtabs) {
		vizOptions.hideTabs = false;
	}
	if (url === '') {
		vizOptions.hideTabs = false;
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
		viz.addEventListener(tableau.TableauEventName.MARKS_SELECTION, navigationSelectListener); // navigation listener on-select
	}
//	}, 5000);
}

function initPage()
{
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
		var showTabs;
		if (marks.length == 1) {
//			console.log("workbook selected");
			var pairs = marks[0].getPairs();
			for (var pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
				if (pairs[pairIndex].fieldName == "full_url") {
					selectedViz = pairs[pairIndex].value;
					console.log("full_url: " + selectedViz);
				} else if (pairs[pairIndex].fieldName == "showtabs") {
					showTabs = pairs[pairIndex].value;
					console.log("show tabs: " + showTabs);
				}
			}
		}
		if (selectedViz) {
			startViz(selectedViz, showTabs);
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
	if (viz) {
		startViz(isHome ? '' : contentUrl);
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
//		console.log("viz.showExportPDFDialog");
		viz.showExportPDFDialog();
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
