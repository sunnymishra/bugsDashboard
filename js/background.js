
var _global = { 'test':'test' };
let _config = { 'test':'test' };
console.log('reached background.js..');

// TODO: Build mechanish to auto load latest version of this Chrome extension :)

const loadGlobalFile = (filePath) => {
	const url = chrome.runtime.getURL(filePath);
	fetch(url)
		.then((response) => response.json()) //assuming file contains json
		.then((json) => {
			_global = { ..._global, ...json };  // This feature of merging 2 objects is new in ES6
			console.log('__Merged _global object with local file json');
		});
};
const loadConfigFile = (filePath) => {
	const url = chrome.runtime.getURL(filePath);
	fetch(url)
		.then((response) => response.json()) //assuming file contains json
		.then((json) => {
			_config = { ..._config, ...json };  // This feature of merging 2 objects is new in ES6
			console.log('__Merged _config object with local file json');
		});
};
loadGlobalFile('config/data.json');  // Calling above function so files are loaded in _global variables
loadConfigFile('config/config.json');  // Calling above function so files are loaded in _global variables

chrome.extension.onMessage.addListener(
	function(request, sender, reply) {
		console.log('reached background.js switch case:%s',request.method);
		switch(request.method)
		{
			case 'setBugCountEvent':
				_global.bugCount=request.data.bugCount;
				updateBugCount(request.data.bugCount);
				// reply(_global.messageText);
				break;
			case 'refreshEvent':
				startRefresh("day");
				// reply(_global.selectedText);
				break;
			default:
				reply({data: 'failure', message:'Invalid arguments'});
		}
	}
);

const startRefresh = (period) => {
	console.log('startRefresh(). Period: %s', period);
	let url=_config.bugzillaUrl;
	_global.period=period;  // storing this so we don't invoke startRefresh() for the same 'period' twice
	url=replaceDatePlaceholder(url, period);
	// chrome.tabs.create({"url":url,"selected":false}, function(tab){
	// 	_global.tabId=tab.id;
	// });
	chrome.tabs.create({"url":url, active: false}, function(tab){
		// To create a popup tab instead of a normal tab
		chrome.windows.create({
			tabId: tab.id,
			type: 'popup',
			focused: true,
			top: 120, left: 300, width: 700, height: 550
			// incognito, ...
		});
		_global.tabId=tab.id;
		console.log('created new tab. tabId: %s', tab.id);

	});
};

const updateBugCount = (bugCount) => {
	console.log('updateBugCount(). bugCount: %s', bugCount);
	
	let keyValue={'__bug_count': bugCount};
	chrome.storage.local.set(keyValue, storageLogger(performance.now(), keyValue));
	
	chrome.tabs.remove(_global.tabId);

	if(_global.period=="day" && bugCount <= _config.minimumBugCount){
		console.log('updateBugCount() going to invoke startRefresh(). bugCount: %s', bugCount);
		startRefresh("week");
		return;
	}

	keyValue={'__period': _global.period};
	chrome.storage.local.set(keyValue, storageLogger(performance.now(), keyValue));

	chrome.extension.sendMessage({'method':'setProcessedBugCountEvent', 
		'data':{'period': _global.period, 'bugCount':bugCount}}, (response)=>{
	});
	// Below we are fetching story vs bugs time taken in last few sprints
	let userStoryCount = fetchUserStoryCount(bugCount);
	
	keyValue={'__user_story_count': userStoryCount};
	chrome.storage.local.set(keyValue, storageLogger(performance.now(), keyValue));

	chrome.extension.sendMessage({'method':'setProcessedStoryCountEvent', 
		'data':{'userStoryCount':userStoryCount}}, (response)=>{ 
	});

	let date=new Date();
	let refreshTimeStr=date.getDate()+ " " + timeSolver.getAbbrMonth(date) + " " + timeSolver.getString(date, "HH:MM:SS");

	keyValue={'__refresh_time': refreshTimeStr};
	chrome.storage.local.set(keyValue, storageLogger(performance.now(), keyValue));

	chrome.extension.sendMessage({'method':'setRefreshTimeEvent', 
		'data':{'refreshTime':refreshTimeStr}}, (response)=>{ 
	});
};

const fetchUserStoryCount = (bugCount) =>{
	let cumulativeBugs=102;
	let bugResolveHours=539;
	let cululativeStories=53;
	let storyResolveHours=2899;
	let bugAverageResolveHours=bugResolveHours / cumulativeBugs;
	console.log('bugAverageResolveHours = %s / %s = %s', bugResolveHours , cumulativeBugs, bugAverageResolveHours)
	let storyPortionPerHour=cululativeStories / storyResolveHours;
	console.log('storyPortionPerHour = %s / %s = %s', cululativeStories , storyResolveHours, storyPortionPerHour)

	let totalBugHours=bugAverageResolveHours * bugCount;
	console.log('totalBugHours = %s * %s = %s', bugAverageResolveHours , bugCount, totalBugHours)

	let totalUserStories=Math.ceil(totalBugHours * storyPortionPerHour);
	console.log('totalUserStories = %s * %s = %s', totalBugHours , storyPortionPerHour, totalUserStories)

	return totalUserStories;
	// Explanation below:
	// 2 bugs  =   20 hours
	// 1 bug   =   10 hour		 <- hour/bug

	// 2 story =   10 hours
	// 1 hour  =   0.2 story	   <- story/hour
}

const storageLogger = (startTime, keyValue) => {
	let key=Object.keys(keyValue)[0];
	let value=keyValue[key];

	if(key=='__sensitiveData'){
		value="...";	// We don't want to expose accessToken secret , etc while logging
	}
	if (chrome.runtime.lastError) {
		console.log("Error while storage.local of key |%s| value |%s|: |%s|", keyValue.key, value, JSON.stringify(chrome.runtime.lastError));
	}
	var endTime = performance.now();
	console.log("key |%s| value |%s| stored in %s ms.",key, value, (endTime - startTime));
};

const replaceDatePlaceholder = (url, period) => {
	let toDate, fromDate;
	if(period=="day"){
		toDate = fromDate = timeSolver.subtract(new Date(), 1, "day");
	}else if(period="week"){
		fromDate	= timeSolver.subtract(new Date(), 7, "day");
		toDate	  = timeSolver.subtract(new Date(), 1, "day");
	}
	let toDateStr = timeSolver.getString(toDate, "YYYY-MM-DD");
	let fromDateStr = timeSolver.getString(fromDate, "YYYY-MM-DD");

	url=url.replace('_toDate_', toDateStr);
	url=url.replace('_fromDate_', fromDateStr);
	console.log('url->%s', url);
	return url;
};

