var people = {},
	generator= 0,
	Q = require("q"),
	HashMap = require('HashMap'),
	peopleIndex = new HashMap(32);  // highload ready, lol

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
		out.childrenCount = self.children.length;
		return out;
	} else {
		if (!skip) skip = [];
		skip.push(self.id);
	}

	if (self.parent1) {
		if (skip.indexOf(self.parent1.id) !== -1) {
			out.parent1 = self.parent1.serialize(true);
		} else {
			out.parent1 = self.parent1.serialize(skip);
		}
	}
	if (self.parent2) {
		if (skip.indexOf(self.parent2.id) !== -1) {
			out.parent2 = self.parent2.serialize(true);
		} else {
			out.parent2 = self.parent2.serialize(skip);
		}
	}
	self.children.forEach(function(child){
		if (skip.indexOf(child.id) === -1) {
			out.children.push(child.serialize(skip));
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
		outIds = [],    // store id to prevent dubs
		iterator = -1,
		man,
		index = 0,
		totalPeople = Object.keys(people).length;
	// search equal names in index
	if (filter&&filter.length) {
		var firstNames = peopleIndex.get(filter);
		if (firstNames && firstNames.length) {
			while (outIds.length < limit && ++iterator<firstNames.length) {
				if (index++ >= offset) {
					outIds.push(firstNames[iterator]);
				}
			}
		}
		// reset
		iterator = -1;
		index = 0;
		var lastNames = peopleIndex.get(filter);
		if (lastNames && lastNames.length) {
			while (outIds.length < limit && ++iterator<firstNames.length) {
				if (index++ >= offset && outIds.indexOf(firstNames[iterator]) === -1) {
					outIds.push(firstNames[iterator]);
				}
			}
		}
		// reset
		iterator = -1;
		index = 0;
	}
	// other
	if (outIds.length < limit) {
		for(var manId in people) {
			man = people[manId];
			if (!filter || filter.length===0 || man.firstName.toLowerCase().indexOf(filter)!==-1 || man.lastName.toLowerCase().indexOf(filter)!==-1) {
				if (index++ >= offset && outIds.indexOf(man.id) === -1) {
					outIds.push(man.id);
				}
			}
			if (outIds.length === limit) break
		}
	}
	outIds.forEach(function(id){
		out.push(people[id].serialize(true));
	});

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
	return this;
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
	self.parent1 && self.parent1.removeChildren(self);
	self.parent2 && self.parent2.removeChildren(self);

	var child;
	while (child = self.children[0]) {
		self.removeChildren(child);
	}
	delete people[self.id];
};


exports = module.exports = People;