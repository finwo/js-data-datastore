/**
 * Tests to check odm schemas
 * 
 * @author Marco
 */

// Defining vars
var path            = require('path'),
    co              = require('co'),
    Promise         = require('bluebird'),
    jsdata          = require('js-data'),
    Container       = jsdata.Container,
    Schema          = jsdata.Schema,
    jsDataDatastore = require('../index.js'),
    assert          = require('assert'),
    config          = {
                        projectId   : 'trackthis-179709',
                        namespace   : 'test',
                        keyFilename : path.join('./', 'client-secret.json'),
                        apiEndpoint : 'http://localhost:8081'
                      },
    db              = require('./resources/database.js'),
    schemas         = require('./resources/schemas.js'),
    odm;

require('co-mocha');

var clearDB = function * () { 
  yield odm.destroyAll('table', {});
  yield odm.destroyAll('chair', {});
  yield odm.destroyAll('guest', {});
};

var createDB = function * (entities) { 
  yield clearDB();
  var localdb = Object.assign({}, db);
  if (entities.indexOf('tables') >= 0) {
    yield odm.createMany('table', localdb.tables);
    localdb.chairs.forEach(chair => {
      chair.table_code = localdb.tables.find(table => (chair.code.substring(1, 3) == table.code.substring(1, 3))).id;
    });
  }
  if (entities.indexOf('chairs') >= 0) {
    yield odm.createMany('chair', localdb.chairs);
    localdb.guests.forEach(guest => {
      guest.chair_code = localdb.chairs.find(chair => (guest.code.substring(1, 5) == chair.code.substring(1, 5))).id;
    });
  }
  if (entities.indexOf('guests') >= 0) {
    yield odm.createMany('guest', localdb.guests);
  }
  return localdb;
};

describe.only('ODM configuration', function() {
  
  it('initialize odm', function * () {
    
    odm = new Container();
    var adapter = new jsDataDatastore.DataStoreAdapter({config : config});
    odm.registerAdapter('datastore', adapter, {'default' : true});
        
    // Register all schemas
    Object.keys(schemas).forEach(schemaName => {
      var configuration = {
        schema    : new Schema(schemas[schemaName].schema),
        relations : schemas[schemaName].relations
      };
      odm.defineMapper(schemaName, configuration);
    });
    
    yield clearDB();
  });
    
}); 

describe('Mapper functions', function() {

  this.timeout(5000);

  /**
   * create
   */
  describe('create', function () {

    it('create table', function * () {
      var tmp_table = Object.assign({}, db.tables[0]);
      var table = yield odm.create('table', tmp_table);
      assert.notEqual(table.id, undefined);
    });

    it('create table with hasMany[chair]', function * () {
      var tmp_table = Object.assign({}, db.tables[0]);
      tmp_table.chairs = db.chairs.filter(chair => chair.code.substring(1, 3) == tmp_table.code.substring(1, 3));
      var table = yield odm.create('table', tmp_table, {with : ['chairs']});
      assert.notEqual(table.id, undefined);
      assert.notEqual(table.chairs, undefined);
      table.chairs.forEach(chair => assert.equal(chair.table_code, table.id));
    });
    
    it('create chair with hasOne[guest] relation', function * () {
      var tmp_chair = Object.assign({}, db.chairs[0]);
      tmp_chair.guest = db.guests.find(guest => guest.code.substring(1, 5) == tmp_chair.code.substring(1, 5));
      var chair = yield odm.create('chair', tmp_chair, {with : ['guest']});
      assert.notEqual(chair.id, undefined);
      assert.notEqual(chair.guest.id, undefined);
      assert.equal(chair.guest.chair_code, chair.id);
    });
    
    it('create chair with hasOne[guest] relation empty', function * () {
      var tmp_chair = Object.assign({}, db.chairs[5]);
      tmp_chair.guest = db.guests.find(guest => guest.code.substring(1, 5) == tmp_chair.code.substring(1, 5));
      var chair = yield odm.create('chair', tmp_chair, {with : ['guest']});
      assert.notEqual(chair.id, undefined);
      assert.equal(chair.guest, undefined);
    });

  });
  
  /**
   * createMany
   */
  describe('createMany', function () {

    it('createMany tables [' + db.tables.length + ']', function * () {
      var tmp_tables = db.tables.slice(0, db.tables.length);
      var tables = yield odm.createMany('table', tmp_tables);
      tables.forEach(table => assert.notEqual(table.id, undefined));
      assert.equal(tables.length, db.tables.length);
    });

    xit('createMany tables [' + db.tables.length + '] with hasMany[chair]', function * () {
      var tmp_tables = db.tables.slice(0, db.tables.length);
      tmp_tables.forEach(table => {
        table.chairs = db.chairs.filter(chair => chair.code.substring(1, 3) == table.code.substring(1, 3));
      });
      var tables = yield odm.createMany('table', tmp_tables, {with : ['chairs']});
      tables.forEach(table => {
        assert.notEqual(table.id, undefined);
        assert.notEqual(table.chairs, undefined);
        table.chairs.forEach(chair => assert.equal(chair.table_code, table.id));
      });
      assert.equal(tables.length, db.tables.length);
    });

    it('createMany chairs [' + db.chairs.length + '] with hasOne[guest] relation', function * () {
      var tmp_chairs = db.chairs.slice(0, db.chairs.length);
      tmp_chairs.forEach(chair => {
        chair.guest = db.guests.find(guest => guest.code.substring(1, 5) == chair.code.substring(1, 5));
      });
      var chairs = yield odm.createMany('chair', tmp_chairs);
      var guests_count = 0;
      chairs.forEach(chair => {
        assert.notEqual(chair.id, undefined);
        if (chair.guest) guests_count++;
      });
      assert.equal(guests_count, db.guests.length)
      assert.equal(chairs.length, db.chairs.length);
    });

  });

  /**
   * find
   */
  describe('find', function () {
    
    var localdb;
    
    before('create all entities', function * ()  {
      localdb = yield createDB(['tables', 'chairs', 'guests']);
    });

    it('find table', function * ()  {
      var table = yield odm.find('table', localdb.tables[0].id);
      assert.notEqual(table.id, undefined);
      assert.equal(table.id, localdb.tables[0].id);
    });

    it('find table loading hasMany[chair] relation', function * ()  {
      var table = yield odm.find('table', localdb.tables[0].id, {with : ['chairs']});
      assert.notEqual(table.id, undefined);
      assert.equal(table.id, localdb.tables[0].id);
      assert.notEqual(table.chairs, undefined);
      assert.equal(table.chairs.length, localdb.chairs.filter(chair => chair.table_code == table.id).length);
      table.chairs.forEach(chair => {
        assert.notEqual(chair.id, undefined);
        assert.equal(chair.table_code, table.id);
      });
    });
    
    xit('find chair loading hasOne[guest] relation', function * () {
      var chair = yield odm.find('chair', localdb.chairs[0].id, {with : ['guest']});
      assert.notEqual(chair.id, undefined);
      assert.equal(chair.id, localdb.chairs[0].id);
      assert.notEqual(chair.guest, undefined);
      assert.notEqual(chair.guest.id, undefined);
      assert.equal(chair.guest.chair_code, chair.id);
    });
    
    xit('find chair loading hasOne[guest] relation empty', function * () {
      var chair = yield odm.find('chair', localdb.chairs[5].id, {with : ['guest']});
      assert.notEqual(chair.id, undefined);
      assert.equal(chair.id, localdb.chairs[5].id);
      assert.equal(chair.guest, undefined);
    });
    
    it('find guest loading belongsTo[chair] relation', function * () {
      var guest = yield odm.find('guest', localdb.guests[0].id, {with : ['chair']});
      assert.notEqual(guest.id, undefined);
      assert.equal(guest.chair_code, localdb.chairs.find(chair => chair.code.substring(1,5) == guest.code.substring(1,5)).id);
      assert.notEqual(guest.chair, undefined);
      assert.equal(guest.chair.id, guest.chair_code);
    });

    xit('find table deep loading hasMany[chair] relation and [chair].hasOne[guest] relation', function * ()  {
      var table = yield odm.find('table', localdb.tables[2].id, {with : ['chairs', 'chairs.guest']});
      assert.notEqual(table.id, undefined);
      assert.equal(table.id, localdb.tables[2].id);
      assert.notEqual(table.chairs, undefined);
      table.chairs.forEach(chair => {
        assert.equal(chair.table_code, table.id);
        assert.notEqual(chair.guest, undefined);
        assert.equal(chair.id, chair.guest.chair_code);
      });
    });
    
    xit('find chair loading hasOne[guest] relation and [guest].belongsTo[chair] relation', function * () {
      var chair = yield odm.find('chair', localdb.chairs[0].id, {with : ['guest', 'guest.chair']});
      assert.notEqual(chair.id, undefined);
      assert.equal(chair.id, localdb.chairs[0].id);
      assert.notEqual(chair.guest, undefined);
      assert.equal(chair.guest.chair_code, chair.id);
      assert.notEqual(chair.guest.chair, undefined);
      assert.equal(chair.guest.chair.id, localdb.chairs[0].id);
    });
    
    it('find guest deep loading belongsTo[chair] relation and [chair].hasOne[table] relation', function * () {
      var guest = yield odm.find('guest', localdb.guests[0].id, {with : ['chair', 'chair.table']});
      assert.notEqual(guest.id, undefined);
      assert.equal(guest.id, localdb.guests[0].id);
      assert.notEqual(guest.chair, undefined);
      assert.notEqual(guest.chair.id, undefined);
      assert.equal(guest.chair_code, guest.chair.id);
      assert.notEqual(guest.chair.table, undefined);
      assert.notEqual(guest.chair.table.id, undefined);
      assert.equal(guest.chair.table.id, guest.chair.table_code);
    });

  });

  /**
   * findAll
   */
  describe('findAll', function () {
    
    var localdb;
    
    before('create all entities', function * ()  {
      localdb = yield createDB(['tables', 'chairs', 'guests']);
    });

    it('findAll tables', function * ()  {
      var tables = yield odm.findAll('table', {});
      assert.equal(tables.length, localdb.tables.length);
      tables.forEach(table => assert.notEqual(table.id, undefined));
    });
    
    it('findAll tables with max_chairs > 5', function * ()  {
      var tables = yield odm.findAll('table', {"max_chairs" : {">" : 5}});
      assert.equal(tables.length, localdb.tables.filter(table => table.max_chairs > 5).length);
      tables.forEach(table => assert.notEqual(table.id, undefined));
    });
    
    it('findAll tables with max_chairs >= 5', function * ()  {
      var tables = yield odm.findAll('table', {"max_chairs" : {">=" : 5}});
      assert.equal(tables.length, localdb.tables.filter(table => table.max_chairs >= 5).length);
      tables.forEach(table => assert.notEqual(table.id, undefined));
    });
    
    it('findAll tables with max_chairs < 5', function * ()  {
      var tables = yield odm.findAll('table', {"max_chairs" : {"<" : 5}});
      assert.equal(tables.length, localdb.tables.filter(table => table.max_chairs < 5).length);
      tables.forEach(table => assert.notEqual(table.id, undefined));
    });
    
    it('findAll tables with max_chairs <= 5', function * ()  {
      var tables = yield odm.findAll('table', {"max_chairs" : {"<=" : 5}});
      assert.equal(tables.length, localdb.tables.filter(table => table.max_chairs <= 5).length);
      tables.forEach(table => assert.notEqual(table.id, undefined));
    });
    
    it('findAll tables with max_chairs == 5', function * ()  {
      var tables = yield odm.findAll('table', {"max_chairs" : {"==" : 5}});
      assert.equal(tables.length, localdb.tables.filter(table => table.max_chairs == 5).length);
      tables.forEach(table => assert.notEqual(table.id, undefined));
    });
    
    it('findAll tables with max_chairs === 6', function * ()  {
      var tables = yield odm.findAll('table', {"max_chairs" : {"===" : 6}});
      assert.equal(tables.length, localdb.tables.filter(table => table.max_chairs === 6).length);
      tables.forEach(table => assert.notEqual(table.id, undefined));
    });

    xit('findAll tables loading hasMany[chair] relation', function * ()  {
      var tables = yield odm.findAll('table', {}, {with : ['chairs']});
      assert.equal(tables.length, localdb.tables.length);
      tables.forEach(table => {
        assert.notEqual(table.chairs, undefined);
        assert.equal(table.chairs.length, localdb.chairs.filter(chair => chair.table_code == table.id).length);
        table.chairs.forEach(chair => {
          assert.notEqual(chair.id, undefined);
          assert.equal(chair.table_code, table.id);
        });
      });
    });
    
    xit('findAll chairs loading hasOne[guest] relation', function * () {
      var chairs = yield odm.findAll('chair', {}, {with : ['guest']});
      assert.equal(chairs.length, localdb.chairs.length);
      chairs.forEach(chair => {
        assert.notEqual(chair.id, undefined);
        assert.notEqual(chair.guest == undefined, localdb.guests.find(guest => guest.chair_code == chair.id) == undefined);
        assert.equal(chair.guest.chair_code, chair.id);
      });
    });
    
    xit('findAll guests loading belongsTo[chair] relation', function * () {
      var guests = yield odm.findAll('guest', {}, {with : ['chair']});
      assert.notEqual(guests.length, localdb.guests.length);
      guests.forEach(guest => {
        assert.equal(guest.chair_code, localdb.chairs.find(chair => chair.code.substring(1,5) == guest.code.substring(1,5)).id);
        assert.notEqual(guest.chair, undefined);
        assert.equal(guest.chair.id, guest.chair_code);
      });
    });

    xit('findAll tables deep loading hasMany[chair] relation and [chair].hasOne[guest] relation', function * ()  {
      var tables = yield odm.findAll('table', {}, {with : ['chairs', 'chairs.guest']});
      tables.forEach(table => {
        assert.notEqual(table.id, undefined);
        assert.notEqual(table.chairs, undefined);
        table.chairs.forEach(chair => {
          assert.equal(chair.table_code, table.id);
          assert.notEqual(chair.guest, undefined);
          assert.equal(chair.id, chair.guest.chair_code);
        });
      });
    });
    
    xit('findAll chairs loading hasOne[guest] relation and [guest].belongsTo[chair] relation', function * () {
      var chairs = yield odm.findAll('chair', {}, {with : ['guest', 'guest.chair']});
      assert.equal(chairs.length, localdb.chairs.length);
      chairs.forEach(chair => {
        assert.notEqual(chair.id, undefined);
        assert.notEqual(chair.guest, undefined);
        assert.equal(chair.guest.chair_code, chair.id);
        assert.notEqual(chair.guest.chair, undefined);
        assert.equal(chair.guest.chair.id, chair.id);
      });
    });
    
    xit('findAll guests deep loading belongsTo[chair] relation and [chair].hasOne[table] relation', function * () {
      var guests = yield odm.findAll('guest', {}, {with : ['chair', 'chair.table']});
      assert.equal(guests.length, localdb.guests.length);
      guests.forEach(guest => {
        assert.notEqual(guest.id, undefined);
        assert.notEqual(guest.chair, undefined);
        assert.notEqual(guest.chair.id, undefined);
        assert.equal(guest.chair_code, guest.chair.id);
        assert.notEqual(guest.chair.table, undefined);
        assert.notEqual(guest.chair.table.id, undefined);
        assert.equal(guest.chair.table.id, guest.chair.table_code);
      });
    });
  });
  
  /**
   * destroy
   */
  describe('destroy', function () {
    
    var localdb;
    
    before('create all entities', function * ()  {
      localdb = yield createDB(['tables']);
    });

    it('destroy table', function * () {
      var result = yield odm.destroy('table', localdb.tables[0].id);
      assert.equal(result, undefined);
    });

    it('destroy unexisting table', function * () {
      var result = yield odm.destroy('table', 123123);
       assert.equal(result, undefined);
    });

  });
    
  /**
   * destroyAll
   */
  describe('destroyAll', function () {
    
    var localdb;
    
    before('create all entities', function * ()  {
      localdb = yield createDB(['tables', 'chairs', 'guests']);
    });

    it('destroyAll guests', function * () {
      yield odm.destroyAll('guest');
      var check = yield odm.findAll('guest');
      assert(check.length, 0);
    });
    
    it('destroyAll all chairs related to not existing table', function * () {
      yield odm.destroyAll('chair', {"table_code" : { "===" : 123123 }});
      var check = yield odm.findAll('chair');
      assert(check.length, localdb.chairs.length);
    });
    
    it('destroyAll chairs related to existing table', function * () {
      yield odm.destroyAll('chair', {"table_code" : { "===" : localdb.tables[0].id }});
      var check = yield odm.findAll('chair');
      assert(check.length, localdb.chairs.filter(chair => chair.table_code != localdb.tables[0].id).length);
    });
    
    it('destroyAll tables limit 1', function * () {
      yield odm.destroyAll('chair', {limit : 1});
      var check = yield odm.findAll('chair');
      assert(check.length,(localdb.tables.length-1));
    });

  });
  
  /**
   * update
   */
  describe('update', function () {

    var localdb;
    
    before('create all entities', function * ()  {
      localdb = yield createDB(['chairs']);
    });

    xit('update chair code', function * () {
      var chair = yield odm.udpate('chair', localdb.chairs[0].id, {'code' : 'c0205'});
      assert.equal(chair.id, localdb.chairs[0].id);
      assert.notEqual(chair.code, localdb.chairs[0].code);
    });

    xit('update unexisting chair code', function * () {
      var chair = yield odm.udpate('chair', 123123, {'code' : 'c0205'});
      //TODO: check error
    });

  });
  
  /**
   * updateMany
   */
  describe('updateMany', function () {

    var localdb;
    
    before('create all entities', function * ()  {
      localdb = yield createDB(['tables', 'chairs', 'guests']);
    });

    it('updateMany chairs changing table_code', function * () {
      var chairs = yield odm.udpateMany('chair', localdb.chairs.filter(chair => chair.table_code == localdb.tables[0].id), {'table_code' : '123123123'});
      //TODO: check results
    });

    //TODO: add tests
    
  });
  
  /**
   * updateAll
   */
  describe('updateAll', function () {

    var localdb;
    
    before('create all entities', function * ()  {
      localdb = yield createDB(['tables', 'chairs', 'guests']);
    });

    //TODO: add tests
    
  });

});

describe('Record functions', function() {
  
  /**
   * loadRelations
   */
  describe.only('loadRelations', function () {
    
    var localdb;
    
    before('create all entities', function * ()  {
      localdb = yield createDB(['tables', 'chairs', 'guests']);
    });

    it('load table hasMany[chair] relation', function * () {
      var table = yield odm.find('table', localdb.tables[0].id);
      assert.notEqual(table.id, undefined);
      assert.equal(table.id, localdb.tables[0].id);
      yield table.loadRelations(['chairs']);
      assert.notEqual(table.chairs, undefined);
      assert.equal(table.chairs.length, localdb.chairs.filter(chair => chair.table_code == table.id).length);
      table.chairs.forEach(chair => {
        assert.notEqual(chair.id, undefined);
        assert.equal(chair.table_code, table.id);
      });
    });
    
    it('load chair hasOne[guest] relation', function * () {
      var chair = yield odm.find('chair', localdb.chairs[0].id);
      assert.notEqual(chair.id, undefined);
      assert.equal(chair.id, localdb.chairs[0].id);
      yield chair.loadRelations(['guest']);
      assert.notEqual(chair.guest, undefined);
      assert.notEqual(chair.guest.id, undefined);
      assert.equal(chair.guest.chair_code, chair.id);
    });
    
    it('load chair hasOne[guest] relation empty', function * () {
      var chair = yield odm.find('chair', localdb.chairs[5].id);
      assert.notEqual(chair.id, undefined);
      assert.equal(chair.id, localdb.chairs[5].id);
      yield chair.loadRelations(['guest']);
      assert.equal(chair.guest, undefined);
    });

    it('load guest belongsTo[chair] relation', function * () {
      var guest = yield odm.find('guest', localdb.guests[0].id);
      assert.notEqual(guest.id, undefined);
      assert.equal(guest.chair_code, localdb.chairs.find(chair => chair.code.substring(1,5) == guest.code.substring(1,5)).id);
      yield guest.loadRelations(['chair']);
      assert.notEqual(guest.chair, undefined);
      assert.equal(guest.chair.id, guest.chair_code);
    });

    xit('deep load table hasMany[chair] relation and [chair].hasOne[guest] relation', function * () {
      var table = yield odm.find('table', localdb.tables[2].id);
      assert.notEqual(table.id, undefined);
      assert.equal(table.id, localdb.tables[2].id);
      yield table.loadRelations(['chairs', 'chairs.guest']);
      assert.notEqual(table.chairs, undefined);
      table.chairs.forEach(chair => {
        assert.equal(chair.table_code, table.id);
        assert.notEqual(chair.guest, undefined);
        assert.equal(chair.id, chair.guest.chair_code);
      });
    });
        
    xit('deep load chair hasOne[guest] relation and [guest].belongsTo[chair] relation', function * () {
      var chair = yield odm.find('chair', localdb.chairs[0].id);
      assert.notEqual(chair.id, undefined);
      assert.equal(chair.id, localdb.chairs[0].id);
      yield chair.loadRelations(['guest', 'guest.chair']);
      assert.notEqual(chair.guest, undefined);
      assert.equal(chair.guest.chair_code, chair.id);
      assert.notEqual(chair.guest.chair, undefined);
      assert.equal(chair.guest.chair.id, localdb.chairs[0].id);
    });
    
    it('deep load guest belongsTo[chair] relation and [chair].hasOne[table] relation', function * () {
      var guest = yield odm.find('guest', localdb.guests[0].id);
      assert.notEqual(guest.id, undefined);
      assert.equal(guest.id, localdb.guests[0].id);
      yield guest.loadRelations(['chair', 'chair.table']);
      assert.notEqual(guest.chair, undefined);
      assert.notEqual(guest.chair.id, undefined);
      assert.equal(guest.chair_code, guest.chair.id);
      assert.notEqual(guest.chair.table, undefined);
      assert.notEqual(guest.chair.table.id, undefined);
      assert.equal(guest.chair.table.id, guest.chair.table_code);
    });
    
  });

});