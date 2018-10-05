_global={};

// Using Object destructuring in order to use Named parameter here
const refreshUI = ({period, bugCount, userStoryCount, leisureTask, refreshTime}) => {
	if(period){
		let dashboardDiv = document.getElementById('dashboardDiv');
		let genericContent=dashboardDiv.innerHTML;

		if(period=="day"){
			genericContent=genericContent.replace("_duration_", _global._bg._global.dailyContent.duration);
		}else if(period=="week"){
			genericContent=genericContent.replace("_duration_", _global._bg._global.weeklyContent.duration);
		}
		dashboardDiv.innerHTML=genericContent;
	}
	if(bugCount || bugCount==0){
		let bugCountTag = document.querySelector("div#dashboardDiv span.bugCount");
		bugCountTag.innerHTML=bugCount;
	}
	if(userStoryCount || userStoryCount==0){
		let userStoryCountTag = document.querySelector('div#dashboardDiv span.userStoryCount');
		userStoryCountTag.innerHTML=userStoryCount;
	}
	if(refreshTime){
		let refreshTimeTag = document.querySelector('span#refreshTime');
		refreshTimeTag.innerHTML=refreshTime;
	}
	if(leisureTask){
		let leisureTaskTag = document.querySelector("div#dashboardDiv span.leisureTask");
		leisureTaskTag.innerHTML=leisureTask;
	}
};
const fetchRandomLeisureTask = () =>{
	let leisureTaskList=_global._bg._global.leisureTaskList; 
	let newLeisureTask = leisureTaskList[Math.floor(Math.random() * leisureTaskList.length)];
	return newLeisureTask;
};


window.onload = () => {
	let refreshBtn = document.getElementById('refreshBtn');
	let dashboardDiv = document.getElementById('dashboardDiv');
	
	let _bg = chrome.extension.getBackgroundPage();
	_global._bg=_bg;

	const updateDashboardText = () => {
		let str="";
		let genericContent=_bg._global.genericContent;
		genericContent.forEach((s)=> {
			str+=s+"<br>";
		});
		str=str.replace('_bugCount_', '<span class="bugCount" style="color:blue;">_</span>');
		str=str.replace('_userStoryCount_', '<span class="userStoryCount" style="color:blue;">_</span>');
		str=str.replace('_leisureTask_', '<span class="leisureTask" style="color:blue;">_</span>');
		dashboardDiv.innerHTML=str;
	};

	const updateDashboardContent = () => {
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
		
		refreshUI({leisureTask:fetchRandomLeisureTask()});

		chrome.storage.local.get('__refresh_time', function(refreshTimeData) {
			refreshUI({refreshTime:refreshTimeData['__refresh_time']});
		});
	};

	updateDashboardContent();	// When popup screen is open, need to display stored bugCount and userStoryCount

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