
<img src="https://raw.githubusercontent.com/js-data/js-data/master/js-data.png" alt="js-data logo" title="js-data" align="right" width="96" height="96" />

# js-data-datastore

A DataStore adapter for the JSData Node.js ORM.
Updated version of js-data-cloud-datastore.
Credits to JDobry.

### Installation

    npm install --save js-data js-data-datastore 

### Usage

```js
var jsDataDataStore = require('js-data-datastore');

/*
 *  Create an instance of DataStoreAdapter
 */
var adapter = new jsDataDataStore.DataStoreAdapter({config: {
    projectId: 'projectId',
    namespace: 'namespace',
    keyFilename: 'path_to_keyFilename'
}});

/*
 *  Register the adapter instance
 */
store.registerAdapter('datastore', adapter, { default: true });
```

### JSData Tutorial

Start with the [JSData].

### License

[The MIT License (MIT)]

### Example

```js
var jsData          = require('js-data');
var jsDataDataStore = require('js-data-datastore');

/*
 *  Optional
 */
jsData.utils.Promise = require('bluebird');

var config = {
    projectId: 'projectId',
    namespace: 'namespace',
    keyFilename: path_to_keyFilename
};

var adapter = new jsDataDataStore.DataStoreAdapter({config: {
    projectId: 'projectId',
    namespace: 'namespace',
    keyFilename: path_to_keyFilename
}});

var container = new jsData.Container({ mapperDefaults: { } });

container.registerAdapter('datastore', adapter, { 'default': true });

container.defineMapper('users');

container
    .count('users')
    .then(function (data) {
        res.send(JSON.stringify(data));
    })
    .catch(function (error) {
        res.send('ERROR<br>' + JSON.stringify(error));
    });

container
    .create('users',{name: 'name', password: 'password'})
    .then(function (data) {
        res.send(JSON.stringify(data));
    })
    .catch(function (error) {
        res.send('ERROR<br>' + JSON.stringify(error));
    });


container
    .findAll('users',{where: { password: { '==': 'password'} } })
    .then(function (data) {
        res.send(JSON.stringify(data));
    })
    .catch(function (error) {
        res.send('ERROR<br>' + JSON.stringify(error));
    });
```