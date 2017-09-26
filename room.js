function Room(name, id, owner) {
  this.name = name;
  this.id = id;
  this.owner = owner; // client.id
  this.peoples = []; // list of client.id
  this.status = "available";
};


Room.prototype.addPerson = function(personID) {
  if (this.status === "available") {
    this.peoples.push(personID);
  }
};

module.exports = Room;
