// Create the input graph

var readNode = function (g, data, root) {
	var opt = {label: ""};
	data.firstName && (opt.label += data.firstName + " ");
	data.middleName && (opt.label += data.middleName + " ");
	data.lastName && (opt.label += data.lastName + " ");
	if (root) {
		opt.style = "fill: #afa";
	}
	g.setNode(data.id, opt);
	data.children.forEach(function (c) {
		if (typeof c === "object") {
			readNode(c);
			g.setEdge(data.id, c.id, {});
		}
	});
	if (data.parent1 && typeof data.parent1 === "object") {
		readNode(data.parent1);
		g.setEdge(data.parent1.id, data.id, {});
	}
	if (data.parent2 && typeof data.parent2 === "object") {
		readNode(data.parent2);
		g.setEdge(data.parent2.id, data.id, {});
	}
};

var loadGraph = function(id){
	$.get("/api/people/"+id, function (data) {
		var g = new dagreD3.graphlib.Graph().setGraph({});
		readNode(g, data, true);

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
	});
};

var peopleTemplate = $(".people-list .template");
var page = 0;
var nextPage = function(){
	loadPageData(++page);
};
$(document).on("click", '.people-list .people', function(){
	var peopleId = $(this).attr("data-id");
	if (peopleId)
		loadGraph(peopleId);
});
var loadPageData = function(page, filter){
	$.get("/api/people?limit=10&page="+page+"&filter="+(filter||""), function(data) {
		data.forEach(function(man){
			var newRow = peopleTemplate.clone();
			for (var k in man) {
				newRow.find("."+k).text(man[k]);
			}
			newRow.attr("data-id", man.id);
			newRow.insertBefore(peopleTemplate);
		});
		if (data.length < 10) {
			peopleTemplate.remove();
			$(".loadmore").remove();
		}
	});
};
// init
loadPageData(0);