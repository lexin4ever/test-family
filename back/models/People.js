var people = {},
	generator= 0,
	Q = require("q"),
	HashMap = require('HashMap'),
	peopleIndex = new HashMap(32);

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

	this.index(this.firstName);
	this.index(this.lastName);
};

People.prototype.index = function(key, remove){
	var oldV = peopleIndex.get(key),
		v = oldV ? oldV.slice() : [];
	if (remove) {
		var inx = v.indexOf(this.id);
		v.splice(inx, 1);
	} else {
		v.push(this.id);
	}
	peopleIndex.put(key, v);
};

/**
 * Serialize model.
 * @param {Boolean|People} skip Pass true if you want only id and name, pass People to prevent circular dependencies.
 * @return {{id: (number|*), firstName: *, lastName: *, middleName: *, parent1: null, parent2: null, children: Array}}
 */
People.prototype.serialize = function(skip){
	var self = this,
		out = {
			id: self.id,
			firstName : self.firstName,
			lastName : self.lastName,
			middleName : self.middleName,

			// relations
			parent1 : false,
			parent2 : false,
			children : []
		};
	if (skip === true) {
		out.parent = 0;
		if (self.parent1) out.parent++;
		if (self.parent2) out.parent++;
		out.children = self.children.length;
		return out;
	}
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

People.find = function(offset, limit, filter){
	var out = [],
		iterator = -1,
		man,
		index = 0,
		totalPeople = Object.keys(people).length;
	// search equal names
	if (filter&&filter.length) {
		var firstNames = peopleIndex.get(filter);
		if (firstNames && firstNames.length) {
			while (out.length < limit && ++iterator<firstNames.length) {
				if (index++ >= offset) {
					out.push( firstNames[iterator].serialize(true) );
				}
			}
		}
		// reset
		iterator = -1;
		index = 0;
	}
	// other
	if (out.length < limit) {
		for(var manId in people) {
			man = people[manId];
			if (!filter || filter.length===0 || man.firstName.toLowerCase().indexOf(filter)!==-1 || man.lastName.toLowerCase().indexOf(filter)!==-1) {
				if (index++ >= offset) {
					out.push(man.serialize(true));
				}
			}
			if (out.length === limit) break
		}
	}

	return out;
};

People.prototype.update = function(data){
	this.index(this.firstName, true);
	this.index(this.lastName, true);
	this.firstName = data.firstName;
	this.lastName = data.lastName;
	this.middleName = data.middleName;
	this.index(this.firstName);
	this.index(this.lastName);
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
	// remove from parents
	self.parent1.removeChildren(self);
	self.parent2.removeChildren(self);

	var child;
	while (child = self.children[0]) {
		self.removeChildren(child);
	}
	delete people[self.id];
};


exports = module.exports = People;