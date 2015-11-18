$(function(){

	$('form').on("submit", function() {
	  var file = this.elements.inffile.files[0];	  
	  if (file) {
	    upload(file);
	  }
	  return false;
	});

	function upload(file) {
	  
	  	var data = new FormData();
	  	data.append("inffile", file);

	  $.ajax({
		type: "POST",
        url: "uploads",
        data: data,
        processData: false, 
        contentType: false, 
        success: function (data) {        	
        	buildView(data);        	
        	},
        error: function (jqXHR, textStatus, errorThrown) {
        	$('#log').html("Ошибка "+textStatus);        	
        	}		        		        	
		});

	}

	function buildView(data){
		var DriverObj = JSON.parse(data);
		for (manufacturer in DriverObj){
			$('#log').append('<h3>'+manufacturer+"</h3>");
			for(model in DriverObj[manufacturer]){
					$('#log').append('<h4>'+model+"</h3>");
				for (os in DriverObj[manufacturer][model]){				
					$('#log').append('<p><strong>'+DriverObj[manufacturer][model][os]+"</strong></p>");
				}
			}
		}		
	}

});

