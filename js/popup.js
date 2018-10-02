
window.onload = () => {
	let refreshBtn = document.getElementById('refreshBtn');
	// let bugCountTag = document.getElementById('bugCount
	// let userStoryCount= document.getElementById('userStoryCount');
	// let bugCountTag = document.querySelector("div#dashboardDiv span.bugCount");
	let leisureTaskTag= document.querySelector('span.leisureTask');

	let dashboardDiv = document.getElementById('dashboardDiv');
	let _bg = chrome.extension.getBackgroundPage();

	const updateDashboardText = () => {
		let str="";
		let content=_bg._global.content;
		content.forEach((s)=> {
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
		chrome.storage.local.get('__bug_count', function(bugCountData) {
			if(bugCountData['__bug_count']){
				let bugCountTag = document.querySelector("div#dashboardDiv span.bugCount");
				// bugCountTag.textContent=bugCountData['__bug_count'];
			}
		});
		// Below updating UserStory count
		chrome.storage.local.get('__user_story_count', function(userStoryCountData) {
			if(userStoryCountData['__user_story_count']){
				let userStoryCountTag = document.querySelector('div#dashboardDiv span.userStoryCount');
				// userStoryCountTag.textContent=userStoryCountData['__user_story_count'];
			}
		});
		// Below updating Leisure task
		let leisureTaskList=_bg._global.leisureTaskList;
		// while(true){
		let newValue = leisureTaskList[Math.floor(Math.random() * leisureTaskList.length)];
		// 	if(newValue != )
		// 		break;
		// }
		let leisureTaskTag = document.querySelector("div#dashboardDiv span.leisureTask");
		leisureTaskTag.textContent=newValue;
	};

	updateDashboardContent();	// When popup screen is open, need to display stored bugCount and userStoryCount

	chrome.extension.onMessage.addListener(
		function(request, sender, reply) {
			console.log('reached background.js switch case:%s',request.method);
			switch(request.method)
			{
				case 'setProcessedBugCountEvent':
					refreshUI(request.data.bugCount, request.data.userStoryCount);
					// reply(_global.messageText);
					break;
				default:
					reply({data: 'failure', message:'Invalid arguments'});
			}
		}
	);

	const refreshUI = (bugCount, userStoryCount) => {
		let bugCountTag = document.querySelector("div#dashboardDiv span.bugCount");
		bugCountTag.innerHTML=bugCount;

		let userStoryCountTag = document.querySelector('div#dashboardDiv span.userStoryCount');
		userStoryCountTag.innerHTML=userStoryCount;
	};

};


refreshBtn.addEventListener("click", () => {
	chrome.extension.sendMessage({'method':'refreshEvent'}, 
		(response)=>{console.log('got response->|%s|',response);
	});
});

const isStorageKeyEmpty = (obj) => {
	if(obj && typeof obj === 'object'){
		for(let key in obj) {
			if(obj.hasOwnProperty(key))
				return false;
		}
	}
	return true;
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