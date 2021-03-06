!(function($){
/**
 * Load graph data and show it
 */
var loadGraph = function(data){
	var g = new dagreD3.graphlib.Graph().setGraph({}),
		readNode = function (g, data, root) {
			var opt = {label: " "};
			data.firstName && (opt.label += data.firstName + " ");
			data.middleName && (opt.label += data.middleName + " ");
			data.lastName && (opt.label += data.lastName + " ");
			if (data.id === root) {
				opt.style = "fill: #afa";
			}
			g.setNode(data.id, opt);
			data.children.forEach(function (c) {
				if (typeof c === "object") {
					readNode(g, c, root);
					g.setEdge(data.id, c.id, {});
				}
			});
			if (data.parent1 && typeof data.parent1 === "object") {
				readNode(g, data.parent1, root);
				g.setEdge(data.parent1.id, data.id, {});
			}
			if (data.parent2 && typeof data.parent2 === "object") {
				readNode(g, data.parent2, root);
				g.setEdge(data.parent2.id, data.id, {});
			}
		};

	readNode(g, data, data.id);

	// Set up an SVG group so that we can translate the final graph.
	var svg = d3.select("svg");
	svg.selectAll("*").remove();    // clean up
	var inner = svg.append("g");

	// Create the renderer
	var render = new dagreD3.render();

	// Run the renderer. This is what draws the final graph.
	render(inner, g);

	// Center the graph
	var xCenterOffset = ($(svg[0]).width() - g.graph().width) / 2;
	inner.attr("transform", "translate(" + xCenterOffset + ", 20)");
	svg.attr("height", g.graph().height + 40);
};

/**
 * Load man into form,
 * bind children/parent remove event
 */
var loadMan = function(peopleId){
	// load man
	$.get("/api/people/"+peopleId, function(data){
		firstName.value = data.firstName;
		lastName.value = data.lastName;
		middleName.value = data.middleName;
		manId.value = data.id;

		var blocks = {
			parent: $('form.man').find('.parents ul').empty(),
			children: $('form.man').find('.children ol').empty()
		};
		var addParent = function(name){
			var p1 = $("<li>").text(data[name].firstName);
			p1.click(function(){
				// remove this relation
				$.ajax({
					url: "/api/relation/"+data[name].id+"/"+manId.value,
					method:"DELETE"
				}).then(function(){
					p1.remove();
				}, function(e){
					alert("Что-то пошло не так");
				});
			});
			blocks.parent.append(p1);
		};
		data.parent1 && addParent("parent1");
		data.parent2 && addParent("parent2");

		data.children.forEach(function(child){
			var c = $("<li>").text(child.firstName);
			c.click(function(){
				// remove this relation
				$.ajax({
					url: "/api/relation/"+manId.value+"/"+child.id,
					method:"DELETE"
				}).then(function(){
					c.remove();
				}, function(e){
					alert("Что-то пошло не так");
				});
			});
			blocks.children.append( c );
		});

		$('form.man').find('.parents,.children,.remove').show();
		$('.visualize').show().click(function(){
			loadGraph(data);
		});
	});
};

/**
 * reset form,
 * submit form
 */
$('form.man').bind('reset', function(){
	$('.visualize').unbind('click').hide();
	$('form.man').find('.parents,.children,.remove').hide();
	manId.value = "";
}).submit(function(e){
	e.preventDefault();
	var form = $(this);
	if (manId.value) {
		// change person
		$.ajax({
			method: "PUT",
			url: "/api/people/"+manId.value,
			contentType : "application/json",
			dataType: "json",
			data: JSON.stringify({
				firstName: firstName.value,
				lastName: lastName.value,
				middleName: middleName.value
			})
		}).then(function(){
			form[0].reset();
			alert("Изменён!");
			$('.people-list .people').remove();
			loadPageData(0, $('.table-filter').val());
		}, function(e){
			alert(e.responseText);
		});
	} else {
		// create person
		$.ajax({
			method: "POST",
			url: "/api/people/",
			contentType : "application/json",
			dataType: "json",
			data: JSON.stringify({
				firstName: form.find("#firstName").val(),
				lastName: form.find("#lastName").val(),
				middleName: form.find("#middleName").val()
			})
		}).then(function(){
			form[0].reset();
			alert("Добавлен!");
			$('.people-list .people').remove();
			loadPageData(0, $('.table-filter').val());
		}, function(e){
			alert(e.responseText);
		});
	}

	return false;
});

/**
 * remove this man
 */
$('form.man .remove').bind('click', function(){
	$.ajax({
		method: "DELETE",
		url: "/api/people/"+manId.value
	}).then(function(){
		$('form.man')[0].reset();
		alert("Удалён!");
		$('.people-list .people').remove();
		loadPageData(0, $('.table-filter').val());
	}, function(e){
		alert(e.responseText);
	});
});

/**
 * add new child button
 */
$('.addchild').click(function(){
	if ($(this).hasClass('active')){
		$(this).removeClass('active');
	} else {
		$(this).addClass('active');
		alert('А теперь найдите его ребёнка и ткните на него (в таблице)\r\nИли ещё раз на эту кнопку, чтоб отменить');
	}
});


var peopleTemplate = $(".people-list .template").hide();
var page = 0;
var nextPage = function(){
	loadPageData(++page, $('.table-filter').val());
};
/**
 * Load data in table view
 */
$(".loadmore").click(function(){
	nextPage()
});
var loadPageData = function(page, filter){
	$.get("/api/people?limit=10&page="+page+"&filter="+(filter||""), function(data) {
		data.forEach(function(man){
			var newRow = peopleTemplate.clone();
			newRow.addClass('people').show();
			for (var k in man) {
				newRow.find("."+k).text(man[k]);
			}
			newRow.attr("data-id", man.id);
			newRow.insertBefore(peopleTemplate);
		});
		if (data.length < 10) {
			$(".loadmore").hide();
		} else {
			$(".loadmore").show();
		}
	});
};
/**
 * Filter data in table view
 */
var filterDelay;
$('.table-filter').bind("keyup", function(){
	var text = $(this).val();
	clearTimeout(filterDelay);
	filterDelay = setTimeout(function(){
		$('.people-list .people').remove();
		loadPageData(0, text);
	}, 100);
});

/**
 * click on table -> load man
 */
$(document).on("click", '.people-list .people', function(){
	var peopleId = $(this).attr("data-id");
	if ($('.addchild').hasClass('active')){
		// add this as children
		$.post("/api/relation/"+manId.value+"/"+peopleId).then(function(){
			$('.addchild').removeClass('active');
			loadMan(manId.value);
		}, function(e){
			alert("Что-то пошло не так");
		});
	} else {
		loadMan(peopleId)
	}
});

// init
loadPageData(0);

}(jQuery));