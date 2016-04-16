//import {
//    PaginationBase,
//    COLLECTION_PREFIX,
//    COUNTS_COLLECTION_PREFIX,
//    DEFAULT_PAGE_SIZE,
//    SUBS_CACHE_CONFIG
//} from '../base.js';

let dictData = function (ctx, name, val) {
    if (arguments.length < 3) {
        return ctx.settings.get(name);
    }
    if (ctx.settings.get(name) !== val) {
        ctx.settings.set(name, val);
    }
};

class _MonkeyPagination extends PaginationBase{
    constructor (name, settings) {
        super(name, settings);
        let self = this;

        self.settings = new ReactiveDict();
        settings = _.extend({
                page: 1,
                perPage: DEFAULT_PAGE_SIZE,
                filters: {},
                fields: {},
                sort: {_id: 1}
            },
            settings);

        _.extend(self, {
            fetch: false,
            autorun: true
        }, _.pick(settings, ['subscriptionOpts']));

        self.subsCache = new SubsCache(SUBS_CACHE_CONFIG);

        let defaultVal = function (method, val) {
            !self[method]() && self[method](val);
        };

        [
            'page',
            'perPage',
            'filters',
            'fields',
            'sort'
        ].forEach(function (method) {
            defaultVal(method, settings[method]);
        });

        if (!self.ready()) {
            self.ready(false);
        }
    }

    page (page) {
        if (arguments.length) {
            let totalPages = this.totalPages();
            if (page > totalPages) {
                page = totalPages;
            }
            if (!_.isNumber(page) || page < 1) {
                page = 1;
            }
        }
        return dictData(this, 'page', ...arguments) || '';
    }

    perPage (perPage) {
        return dictData(this, 'perPage', ...arguments);
    }

    filters (filters) {
        if (arguments.length === 1) {
            filters = !_.isEmpty(filters) ? filters : {};
            return dictData(this, 'filters', filters);
        }
        return dictData(this, 'filters');
    }

    fields (fields) {
        return dictData(this, 'fields', ...arguments);
    }

    sort (sort) {
        return dictData(this, 'sort', ...arguments);
    }

    totalItems (totalItems) {
        if (arguments.length === 1) {
            this.settings.set("totalItems", totalItems);

            if (this.page() > 1 && totalItems <= this.perPage() * this.page()) {
                // move to last page available
                this.page(this.totalPages());
            }
        } else {
            return this.settings.get("totalItems");
        }
    }

    totalPages () {
        var totalPages = this.totalItems() / this.perPage();

        return totalPages ? Math.ceil(totalPages) : 1;
    }

    hasNext () {
        return this.page() < this.totalPages();
    }

    hasPrev () {
        return this.page() > 1;
    }

    ready (page = this.page(), ready) {
        let self = this, args;
        if (_.isBoolean(page)) {
            [ready, page] = [page, self.page()];
        }

        args = [this, 'ready-' + page];
        !_.isUndefined(ready) && args.push(ready);
        return dictData(...args);
    }

    start () {
        let self = this;

        if (!self.autorun) {
            throw new Error('param-error', 'please change pagination instance configuration autorun as true.');
        }
        self.trackerHandle = self.trackerHandle || Tracker.autorun(function () {
            self.subscribe();
        });
        if (!self.started()) {
            self.trackerHandle.invalidate();
        }
    }

    started () {
        return this.trackerHandle && !this.trackerHandle.stopped;
    }

    stop () { // TODO 测试
        let self = this;

        self.started() && self.trackerHandle.stop();
    }

    subscribe (page = this.page()) {
        let self = this,
            options = {
                fields: self.fields(),
                sort: self.sort(),
                skip: (page - 1) * self.perPage(),
                limit: self.perPage()
            },
            handle = (function () {
                let args = [
                    self._publicationName(),
                    self.filters(),
                    options
                ];
                self.subscriptionOpts && args.push(self.subscriptionOpts);

                return self.subsCache.subscribe(...args);
            }());

        let ready = handle.ready();
        self.ready(ready);
        if (ready) {
            self.totalItems(Counts.get(COUNTS_COLLECTION_PREFIX + handle.sub.subscriptionId));
        }

        return handle;
    }

    getPage (page = this.page()) {
        let self = this;
        if (self.autorun && !self.started()) {
            throw new Error('pagination-did-not-started', 'please call start method on MonkeyPagination instance.');
        }
        let query = {},
            handle = self.subscribe(page);

        query[PaginationBase._pageQueryKey((handle || {sub: {}}).sub.subscriptionId)] = 1;
        let cursor = self._resultCollection().find(query, {
            fields: self.fields(),
            sort: self.sort()
        });

        return self.fetch ? cursor.fetch() : cursor;
    }

    pickSettings (settings) {
        let self = this;
        let pickList = _.compact(_.map(settings, function (v, k) {
            return _.isFunction(self[k]) ? null : k;
        }));
        _.extend(self, _.pick(settings, pickList));
    }
}

MonkeyPagination = _MonkeyPagination;