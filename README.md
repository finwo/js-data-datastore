
<img src="https://raw.githubusercontent.com/js-data/js-data/master/js-data.png" alt="js-data logo" title="js-data" align="right" width="96" height="96" />

# js-data-datastore

A DataStore adapter for the [JSData Node.js ORM].

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

### JSData + DataStore Tutorial

Start with the [JSData + DataStore tutorial]or checkout the [API Reference Documentation].

### Need help?

Please [post a question] on Stack Overflow. **This is the preferred method.**

You can also chat with folks on the [Slack Channel]. If you end up getting
your question answered, please still consider consider posting your question to
Stack Overflow (then possibly answering it yourself). Thanks!

### Want to contribute?

Awesome! You can get started over at the [Contributing guide].

Thank you!

### License

[The MIT License (MIT)]

### Example

```js
    var jsData          = require('js-data');
    var jsDataDataStore = require('js-data-datastore');

    jsData.utils.Promise = require('bluebird');

    // Create an instance of DataStoreAdapter
    var config = {
        projectId: 'projectId',
        namespace: 'namespace',
        keyFilename: path_to_keyFilename
    };
    var adapter = new jsDataDataStore.DataStoreAdapter({config: config});

    var container = new jsData.Container({ mapperDefaults: { } });

    container.registerAdapter('datastore', adapter, { 'default': true });

    container.defineMapper('payments');

    container.defineMapper('users');

    container.defineMapper('testing');

    /*
     *  http://localhost:3000/api/datastore/count
     */
    router.get('/api/datastore/count', function (req, res) {

        container
            .count('payments')
            .then(function (data) {
                res.send('DATA<br>' + JSON.stringify(data));
            })
            .catch(function (error) {
                res.send('ERROR<br>' + JSON.stringify(error));
            });

    });

    /*
     *  http://localhost:3000/api/datastore/create/:kind/:json
     */
    router.get('/api/datastore/create/:kind/:json', function (req, res) {

        var json = JSON.parse(req.params.json);
        json.timestamp = new Date().getTime();

        container
            .create(req.params.kind,json)
            .then(function (data) {
                res.send(JSON.stringify(data));
            })
            .catch(function (error) {
                res.send('ERROR<br>' + JSON.stringify(error));
            });
    });


    /* { 'id': { '>=': '5069036098420736' }}
     *  http://localhost:3000/api/datastore/find/:kind/:where
     */
    router.get('/api/datastore/find/:kind/:where', function (req, res) {

        var where = { where: JSON.parse(req.params.where) };
        console.log('[WHERE]', where);

        container
            .findAll(req.params.kind,where)
            .then(function (data) {
                res.send(JSON.stringify(data));
            })
            .catch(function (error) {
                res.send('ERROR<br>' + JSON.stringify(error));
            });
    });
```