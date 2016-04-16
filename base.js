/**
 * Created on 2016/4/12.
 * @fileoverview 请填写简要的文件说明.
 * @author joc (Firstname Lastname)
 */

COLLECTION_PREFIX = 'monkey_pagination_';
COUNTS_COLLECTION_PREFIX = 'monkey_pagination_counts_';
DEFAULT_PAGE_SIZE = 20;
SUBS_CACHE_CONFIG = {
    expireAfter: 5, // minutes
    cacheLimit: 5 // number of subscriptions
};
class _PaginationBase {
    constructor (name, settings) {
        let self = this;
        if (!(self instanceof PaginationBase)) {
            throw new Meteor.Error(4000, "The Pagination instance has to be initiated with `new`");
        }

        self.collection = settings.collection;
        self.connection = settings.connection;
        if (name) {
            self.publication = name;
            self.virtualDB = true;
            self.collectionMap = {};
        } else {
            self.publication = self.collection._name;
        }
    }

    _publicationName () {
        return COLLECTION_PREFIX + this.publication;
    }

    _resultCollectionName (page) {
        let self = this;
        if (!self.virtualDB) {
            return self.collection._name;
        }
        if (Meteor.isServer && !page) {
            throw new TypeError('param-error', 'page must be an integer giant than 0.');
        }
        return [self._publicationName(), page].join('-');
    }

    _resultCollection (page) {
        let self = this;
        if (!self.virtualDB) {
            return self.collection;
        }
        if (Meteor.isClient) {
            page = self.page();
        }
        let collection = self._resultCollectionName(page);
        return self.collectionMap[page] = self.collectionMap[page] || new Mongo.Collection(collection);
    }

    static _pageQueryKey (subscriptionId) {
        return COLLECTION_PREFIX + subscriptionId;
    }
}

PaginationBase = _PaginationBase;