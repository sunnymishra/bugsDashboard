let _config={
	'replaceableText':'bugs found.'
};

$(document).ready(function() {
	console.log('______Reached Sunny contentScript.js______');

	let bugCountString='Unknown';
	
	let loginBtn=document.getElementById("log_in");	// Check if user is logged in or not
	// Below IF condition checks if Login button is not there, then it means User is logged in
    if(!loginBtn && isUrlCorrect(document.URL)){	// Check if Url has unique substring, only then proceed
		console.log('______Found matching Bugzilla Url');

		let result=document.querySelector("span.bz_result_count");
		if(result){
			bugCountString=result.innerHTML;
			if(bugCountString){
				bugCountString=bugCountString.replace(_config.replaceableText, '');
				bugCountString=bugCountString.trim();
			}
		}
		console.log('______bugCountString:'+ bugCountString);
		chrome.extension.sendMessage({'method':'setBugCountEvent', 'data':{'bugCount':bugCountString}}, (response)=>{ });
	}
});

const isUrlCorrect = (currentUrl) => {
	var urlParams = new URLSearchParams(currentUrl);
	let date = timeSolver.subtract(new Date(),1,"day");
    let dateStr = timeSolver.getString(date, "YYYY-MM-DD");
    // let date = new Date().toISOString().slice(0, 10);

	return (urlParams.get('chfieldfrom')==dateStr && urlParams.getAll('product').includes('PFM 3.0') && 
		urlParams.getAll('product').includes('Demo Site'));
};