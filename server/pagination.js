//import {PaginationBase, COLLECTION_PREFIX, COUNTS_COLLECTION_PREFIX, DEFAULT_PAGE_SIZE} from '../base.js';

class _MonkeyPagination extends PaginationBase{
    constructor (name, settings) {
        super(name, settings);
        let self = this;
        self.settings = settings;
        if (settings && !settings.lazyPublish) {
            self.publish();
        }
    }

    countPublish (publicationContext, countCursor) {
        let countKey = COUNTS_COLLECTION_PREFIX + publicationContext._subscriptionId;
        Counts.publish(publicationContext, countKey, countCursor, {noReady: true});
    }

    publish (settings) {
        settings = _.extend(settings || {}, this.settings);

        let pagination = this,
            {collection} = settings,
            name = pagination.publication;

        check(settings, Object);

        Meteor.publish(pagination._publicationName(), function (query = {}, options = {}) {
            let self = this,
                skip = options.skip || 0,
                limit = options.limit || DEFAULT_PAGE_SIZE,
                page = skip / limit + 1,
                collectionName = pagination._resultCollectionName(page),
                {_subscriptionId} = self,
                pageQueryKey = PaginationBase._pageQueryKey(_subscriptionId),
                pageTag = {[pageQueryKey]: 1},
                {queryPreHandle, optionsPreHandle} = settings;

            if (!settings.getCursors) {
                check(query, Object);
                check(options, Object);
            }

            if (queryPreHandle) {
                query = queryPreHandle.call(self, ...arguments);
                if (!query) {
                    this.ready();
                    return;
                }
            }
            if (optionsPreHandle) {
                options = optionsPreHandle.call(self, ...arguments);
            }

            if (settings.customize) {
                return settings.customize.call(self, collectionName, pageTag, ...arguments);
            }
            let {pageCursor, countCursor} = settings.getCursors ?
                                            settings.getCursors.call(self, collection, ...arguments) :
                                            {
                                                pageCursor: collection.find(query, options),
                                                countCursor: collection.find(query)
                                            };
            countCursor &&
            pagination.countPublish(self, countCursor);

            let onObserveChanges = function (method, ...args) {
                if (settings[method]) {
                    settings[method].apply(self, args);
                    return true;
                }
            };
            let omitObserve = _.compact(['added', 'changed', 'removed'].map(function (method) {
                return settings[method] === null ? method : null;
            }));

            if (!_.isFunction(settings.onStop) && ['added', 'changed', 'removed'].some(function (method) {
                    return settings[method];
                })) {
                console.warn('method settings.onStop is not found.',
                    'please ensure all observe handles can be released when publication "' + name + '" finished.');
            }

            let handle = pageCursor.observeChanges(_.omit({
                    added: function (id, fields) {
                        fields = _.extend(fields || {}, pageTag);

                        onObserveChanges('added', collectionName, id, fields, pageTag) ||
                        self.added(collectionName, id, fields);
                    },
                    changed: function (id, fields) {
                        onObserveChanges('changed', collectionName, id, fields) ||
                        self.changed(collectionName, id, fields);
                    },
                    removed: function (id) {
                        onObserveChanges('removed', collectionName, id) ||
                        self.removed(collectionName, id);
                    }
                }, omitObserve));

            self.ready();

            self.onStop(function () {
                settings.onStop && settings.onStop.call(self);
                handle.stop();
            });
        });
    }
}

MonkeyPagination = _MonkeyPagination;