
var _global = { 'test':'test'};
let config = {
	'bugzillaUrl':"https://blrbugzilla.yodlee.com/buglist.cgi?list_id=3756164&chfield=%5BBug%20creation%5D&chfieldfrom=__date__&chfieldto=__date__&product=Demo%20Site&product=PFM%203.0&query_format=advanced",
};
console.log('reached background.js..');

// TODO: Build mechanish to auto load latest version of this Chrome extension :)

const loadConfigFiles = () => {
    const url = chrome.runtime.getURL('config/data.json');
    fetch(url)
        .then((response) => response.json()) //assuming file contains json
        .then((json) => {
            _global = { ..._global, ...json };  // This feature of merging 2 objects is new in ES6
            console.log('__Merged _global object with data.json');
        });
};
loadConfigFiles();  // Calling above function so files are loaded in _global variables

chrome.extension.onMessage.addListener(
	function(request, sender, reply) {
		console.log('reached background.js switch case:%s',request.method);
		switch(request.method)
		{
			case 'setBugCountEvent':
				_global.bugCount=request.data.bugCount;
				updateBugCount();
				// reply(_global.messageText);
				break;
			case 'refreshEvent':
				startRefresh();
				// reply(_global.selectedText);
				break;
			default:
				reply({data: 'failure', message:'Invalid arguments'});
		}
	}
);

const startRefresh = () => {
	console.log('reached background.js startRefresh()');
	let url=config.bugzillaUrl;
	url=replaceDatePlaceholder(url);
	// chrome.tabs.create({"url":url,"selected":false}, function(tab){
	// 	_global.tabId=tab.id;
	// });
    chrome.tabs.create({"url":url, active: false}, function(tab){
        chrome.windows.create({
            tabId: tab.id,
            type: 'popup',
            focused: true,
            top: 120, left: 300, width: 700, height: 550
            // incognito, top, left, ...
        });
        _global.tabId=tab.id;
    });
};

const updateBugCount = () => {
    let keyValue={'__bug_count': _global.bugCount};
    chrome.storage.local.set(keyValue, storageLogger(performance.now(), keyValue));
	chrome.tabs.remove(_global.tabId);

    let userStoryCount = updateUserStoryCount();
    keyValue={'__user_story_count': userStoryCount};
    chrome.storage.local.set(keyValue, storageLogger(performance.now(), keyValue));

	chrome.extension.sendMessage({'method':'setProcessedBugCountEvent', 
        'data':{'bugCount':_global.bugCount, 'userStoryCount':userStoryCount}}, (response)=>{ 
    });

};

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

const replaceDatePlaceholder = (url) => {
    let date = timeSolver.subtract(new Date(),1,"day");
    let dateStr = timeSolver.getString(date, "YYYY-MM-DD");
    // console.log('dateString:%s, dateString1:%s',dateString, dateString1);
	// let date = new Date().toISOString().slice(0, 10);
	return url.replace(new RegExp('__date__', 'g'), dateStr); // Replace all occurence of match : __date__
};

const updateUserStoryCount = () => {
    let userStoryCount= 5;  // TODO: Update this will VersionOne API call
    return userStoryCount;
};
