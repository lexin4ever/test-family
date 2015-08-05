var people = {},
	generator= 0,
	Q = require("q");

/* constructor */
var People = function(data){
	// generate unique id
	this.id = ++generator;
	people[this.id] = this;

	this.firstName = data.firstName;
	this.lastName = data.lastName;
	this.middleName = data.middleName;

	// relations
	this.parent1 = null;
	this.parent2 = null;
	this.children = [];
};

People.prototype.serialize = function(skip){
	var self = this,
		out = {
			id: self.id,
			firstName : self.firstName,
			lastName : self.lastName,
			middleName : self.middleName,

			// relations
			parent1 : null,
			parent2 : null,
			children : []
		};
	if (self.parent1) {
		if (self.parent1 === skip) {
			out.parent1 = self.parent1.id;
		} else {
			out.parent1 = self.parent1.serialize(self);
		}
	}
	if (self.parent2) {
		if (self.parent2 === skip) {
			out.parent2 = self.parent2.id;
		} else {
			out.parent2 = self.parent2.serialize(self);
		}
	}
	self.children.forEach(function(child){
		if (child !== skip) {
			out.children.push(child.serialize(self));
		}
	});
	return out;
};

People.findById = function(id){
	var deferred = Q.defer();
	var man = people[id];
	process.nextTick(function(){
		if (!man) {
			deferred.reject("Not found");
		} else {
			deferred.resolve(man);
		}
	});
	return deferred.promise;
};
People.all = function(){
	return people;
};

People.prototype.update = function(data){
	this.firstName = data.firstName;
	this.lastName = data.lastName;
	this.middleName = data.middleName;
};

People.prototype.addChildren = function(child){
	if (!child.parent1) {
		child.parent1 = this;
	} else if (!child.parent2) {
		child.parent2 = this;
	} else {
		throw new Error("To many children")
	}
	// todo check if already exist
	this.children.push( child );
};
People.prototype.removeChildren = function(child){
	if (child.parent1 && child.parent1 === this) {
		child.parent1 = null;
	} else if (!child.parent2 && child.parent2 === this) {
		child.parent2 = null;
	}
	var index = this.children.indexOf(child);
	if (index !== -1) {
		this.children.splice(index, 1);
	}
};


People.prototype.remove = function(){
	var self = this;
	delete people[self.id];
	// remove from parents
	self.parent1.removeChildren(self);
	self.parent2.removeChildren(self);

	var child;
	while (child = self.children[0]) {
		self.removeChildren(child);
	}
};


exports = module.exports = People;