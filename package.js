Package.describe({
    name: 'leaf4monkey:pagination',
    version: '0.0.2',
    // Brief, one-line summary of the package.
    summary: 'a light weight pagination package for meteor.',
    // URL to the Git repository containing the source code for this package.
    git: 'https://github.com/leaf4monkey/pagination.git',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('1.2.1');
    api.use([
        "meteor-base",
        'ecmascript',
        "underscore",
        "mongo",
        "tmeasday:publish-counts@0.7.2"
    ]);
    api.use([
        "reactive-var",
        "reactive-dict",
        "ccorcos:subs-cache@0.1.0"
    ], "client");
    api.addFiles('base.js');
    api.addFiles('client/pagination.js', 'client');
    api.addFiles('server/pagination.js', 'server');

    api.export('MonkeyPagination');
});