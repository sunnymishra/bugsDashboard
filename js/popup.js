_global={};

// Using Object destructuring in order to use Named parameter here
const refreshUI = ({period, bugCount, userStoryCount, leisureTask, refreshTime, externalUrl, codingTips}) => {
	if(period){
		let durationTag = document.querySelector("span#duration");
		if(period=="day"){
			durationTag.innerHTML = _global.bg._global.dailyContent.duration;
		}else if(period=="week"){
			durationTag.innerHTML = _global.bg._global.weeklyContent.duration;
		}
	}
	if(bugCount || bugCount==0){
		let bugCountTag = document.querySelector("span#bugCount");
		bugCountTag.innerHTML=bugCount;
	}
	if(userStoryCount || userStoryCount==0){
		let userStoryCountTag = document.querySelector('span#userStoryCount');
		userStoryCountTag.innerHTML=userStoryCount;
	}
	if(refreshTime){
		let refreshTimeTag = document.querySelector('span#refreshTime');
		refreshTimeTag.innerHTML=refreshTime;
	}
	if(leisureTask){
		let leisureTaskTag = document.querySelector("span#leisureTask");
		leisureTaskTag.innerHTML=leisureTask;
	}
	if(externalUrl){
		let externalUrlTag = document.querySelector("a#externalUrl");
		externalUrlTag.innerHTML=externalUrl;
		externalUrlTag.href=externalUrl;
	}
	if(codingTips){
		let codingTipsTag = document.querySelector("span#codingTips");
		codingTipsTag.innerHTML=codingTips;
	}
};
const fetchRandomLeisureTask = () =>{
	let leisureTaskList=_global.bg._global.leisureTaskList; 
	let newLeisureTask = leisureTaskList[Math.floor(Math.random() * leisureTaskList.length)];
	return newLeisureTask;
};
const fetchRandomCodingTips = () =>{
	let codingTips=_global.bg._global.codingTips; 
	let newCodingTips = codingTips[Math.floor(Math.random() * codingTips.length)];
	return newCodingTips;
};


window.onload = () => {
	let refreshBtn = document.getElementById('refreshBtn');
	let dashboardDiv = document.getElementById('dashboardDiv');

	// let _bg = chrome.extension.getBackgroundPage();
	// _global._bg=_bg;
	chrome.runtime.getBackgroundPage((bg)=>{
		_global.bg=bg;	// Need to fetch background page before initializing popup page content
		init();	// When popup screen is open, need to display stored bugCount and userStoryCount
	});

	const updateDashboardText = () => {
		// console.log('____: %s', JSON.stringify(_global.bg._global));
		let str="";
		let genericContent=_global.bg._global.genericContent;
		genericContent.forEach((s)=> {
			str+=s+"<br>";
		});
		str=str.replace('_duration_', '<span id="duration">_</span>');
		str=str.replace('_bugCount_', '<span id="bugCount" style="color:blue;">_</span>');
		str=str.replace('_userStoryCount_', '<span id="userStoryCount" style="color:blue;">_</span>');
		str=str.replace('_leisureTask_', '<span id="leisureTask" style="color:blue;">_</span>');
		dashboardDiv.innerHTML=str;
	};

	const init = () => {
		updateDashboardText();
		// Below updating Bug count
		chrome.storage.local.get('__period', function(periodData) {
			refreshUI({period: periodData['__period']});
		});
		chrome.storage.local.get('__bug_count', function(bugCountData) {
			refreshUI({bugCount: bugCountData['__bug_count']});
		});
		// Below updating UserStory count
		chrome.storage.local.get('__user_story_count', function(userStoryCountData) {
			refreshUI({userStoryCount: userStoryCountData['__user_story_count']});
		});
		
		chrome.storage.local.get('__refresh_time', function(refreshTimeData) {
			refreshUI({refreshTime:refreshTimeData['__refresh_time']});
		});

		refreshUI({
			externalUrl:_global.bg._global.externalUrl, 
			codingTips:fetchRandomCodingTips(),
			leisureTask:fetchRandomLeisureTask()
		});

	};

	chrome.extension.onMessage.addListener(
		function(request, sender, reply) {
			console.log('reached popup.js switch case:%s',request.method);
			switch(request.method)
			{
				case 'setProcessedBugCountEvent':
					// Using Object destructuring in order to use Named parameter here
					refreshUI({period: request.data.period, bugCount: request.data.bugCount});
					// reply(_global.messageText);
					break;
				case 'setProcessedStoryCountEvent':
					refreshUI({userStoryCount: request.data.userStoryCount, leisureTask:fetchRandomLeisureTask()});
					break;
				case 'setRefreshTimeEvent':
					refreshUI({refreshTime: request.data.refreshTime});
					break;
					
				default:
					reply({data: 'failure', message:'Invalid arguments'});
			}
		}
	);
	// Adding click event for refresh button
	refreshBtn.addEventListener("click", () => {
		chrome.extension.sendMessage({'method':'refreshEvent'}, 
			(response)=>{console.log('got response->|%s|',response);
		});
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