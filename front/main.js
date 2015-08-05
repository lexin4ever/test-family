// Create the input graph

var g = new dagreD3.graphlib.Graph().setGraph({});

var readNode = function (data, root) {
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

$.get("/api/people/2", function (data) {
	readNode(data, true);

	// Create the renderer
	var render = new dagreD3.render();
	// Set up an SVG group so that we can translate the final graph.
	var svg = d3.select("svg"),
		inner = svg.append("g");

	// Run the renderer. This is what draws the final graph.
	render(inner, g);

	// Center the graph
	var xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
	inner.attr("transform", "translate(" + xCenterOffset + ", 20)");
	svg.attr("height", g.graph().height + 40);
});
