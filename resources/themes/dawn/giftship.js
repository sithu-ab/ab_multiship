var $jscomp = {
    scope: {}
};
$jscomp.defineProperty = "function" == typeof Object.defineProperties ? Object.defineProperty : function(g, a, b) {
    if (b.get || b.set)
        throw new TypeError("ES3 does not support getters and setters.");
    g != Array.prototype && g != Object.prototype && (g[a] = b.value)
}
;
$jscomp.getGlobal = function(g) {
    return "undefined" != typeof window && window === g ? g : "undefined" != typeof global && null != global ? global : g
}
;
$jscomp.global = $jscomp.getGlobal(this);
$jscomp.SYMBOL_PREFIX = "jscomp_symbol_";
$jscomp.initSymbol = function() {
    $jscomp.initSymbol = function() {}
    ;
    $jscomp.global.Symbol || ($jscomp.global.Symbol = $jscomp.Symbol)
}
;
$jscomp.symbolCounter_ = 0;
$jscomp.Symbol = function(g) {
    return $jscomp.SYMBOL_PREFIX + (g || "") + $jscomp.symbolCounter_++
}
;
$jscomp.initSymbolIterator = function() {
    $jscomp.initSymbol();
    var g = $jscomp.global.Symbol.iterator;
    g || (g = $jscomp.global.Symbol.iterator = $jscomp.global.Symbol("iterator"));
    "function" != typeof Array.prototype[g] && $jscomp.defineProperty(Array.prototype, g, {
        configurable: !0,
        writable: !0,
        value: function() {
            return $jscomp.arrayIterator(this)
        }
    });
    $jscomp.initSymbolIterator = function() {}
}
;
$jscomp.arrayIterator = function(g) {
    var a = 0;
    return $jscomp.iteratorPrototype(function() {
        return a < g.length ? {
            done: !1,
            value: g[a++]
        } : {
            done: !0
        }
    })
}
;
$jscomp.iteratorPrototype = function(g) {
    $jscomp.initSymbolIterator();
    g = {
        next: g
    };
    g[$jscomp.global.Symbol.iterator] = function() {
        return this
    }
    ;
    return g
}
;
$jscomp.makeIterator = function(g) {
    $jscomp.initSymbolIterator();
    var a = g[Symbol.iterator];
    return a ? a.call(g) : $jscomp.arrayIterator(g)
}
;
$jscomp.polyfill = function(g, a, b, c) {
    if (a) {
        b = $jscomp.global;
        g = g.split(".");
        for (c = 0; c < g.length - 1; c++) {
            var d = g[c];
            d in b || (b[d] = {});
            b = b[d]
        }
        g = g[g.length - 1];
        c = b[g];
        a = a(c);
        a != c && null != a && $jscomp.defineProperty(b, g, {
            configurable: !0,
            writable: !0,
            value: a
        })
    }
}
;
$jscomp.EXPOSE_ASYNC_EXECUTOR = !0;
$jscomp.FORCE_POLYFILL_PROMISE = !1;
$jscomp.polyfill("Promise", function(g) {
    function a() {
        this.batch_ = null
    }
    if (g && !$jscomp.FORCE_POLYFILL_PROMISE)
        return g;
    a.prototype.asyncExecute = function(a) {
        null == this.batch_ && (this.batch_ = [],
            this.asyncExecuteBatch_());
        this.batch_.push(a);
        return this
    }
    ;
    a.prototype.asyncExecuteBatch_ = function() {
        var a = this;
        this.asyncExecuteFunction(function() {
            a.executeBatch_()
        })
    }
    ;
    var b = $jscomp.global.setTimeout;
    a.prototype.asyncExecuteFunction = function(a) {
        b(a, 0)
    }
    ;
    a.prototype.executeBatch_ = function() {
        for (; this.batch_ && this.batch_.length; ) {
            var a = this.batch_;
            this.batch_ = [];
            for (var b = 0; b < a.length; ++b) {
                var c = a[b];
                delete a[b];
                try {
                    c()
                } catch (k) {
                    this.asyncThrow_(k)
                }
            }
        }
        this.batch_ = null
    }
    ;
    a.prototype.asyncThrow_ = function(a) {
        this.asyncExecuteFunction(function() {
            throw a;
        })
    }
    ;
    var c = function(a) {
        this.state_ = 0;
        this.result_ = void 0;
        this.onSettledCallbacks_ = [];
        var b = this.createResolveAndReject_();
        try {
            a(b.resolve, b.reject)
        } catch (h) {
            b.reject(h)
        }
    };
    c.prototype.createResolveAndReject_ = function() {
        function a(a) {
            return function(d) {
                c || (c = !0,
                    a.call(b, d))
            }
        }
        var b = this
            , c = !1;
        return {
            resolve: a(this.resolveTo_),
            reject: a(this.reject_)
        }
    }
    ;
    c.prototype.resolveTo_ = function(a) {
        if (a === this)
            this.reject_(new TypeError("A Promise cannot resolve to itself"));
        else if (a instanceof c)
            this.settleSameAsPromise_(a);
        else {
            var b;
            a: switch (typeof a) {
                case "object":
                    b = null != a;
                    break a;
                case "function":
                    b = !0;
                    break a;
                default:
                    b = !1
            }
            b ? this.resolveToNonPromiseObj_(a) : this.fulfill_(a)
        }
    }
    ;
    c.prototype.resolveToNonPromiseObj_ = function(a) {
        var b = void 0;
        try {
            b = a.then
        } catch (h) {
            this.reject_(h);
            return
        }
        "function" == typeof b ? this.settleSameAsThenable_(b, a) : this.fulfill_(a)
    }
    ;
    c.prototype.reject_ = function(a) {
        this.settle_(2, a)
    }
    ;
    c.prototype.fulfill_ = function(a) {
        this.settle_(1, a)
    }
    ;
    c.prototype.settle_ = function(a, b) {
        if (0 != this.state_)
            throw Error("Cannot settle(" + a + ", " + b | "): Promise already settled in state" + this.state_);
        this.state_ = a;
        this.result_ = b;
        this.executeOnSettledCallbacks_()
    }
    ;
    c.prototype.executeOnSettledCallbacks_ = function() {
        if (null != this.onSettledCallbacks_) {
            for (var a = this.onSettledCallbacks_, b = 0; b < a.length; ++b)
                a[b].call(),
                    a[b] = null;
            this.onSettledCallbacks_ = null
        }
    }
    ;
    var d = new a;
    c.prototype.settleSameAsPromise_ = function(a) {
        var b = this.createResolveAndReject_();
        a.callWhenSettled_(b.resolve, b.reject)
    }
    ;
    c.prototype.settleSameAsThenable_ = function(a, b) {
        var c = this.createResolveAndReject_();
        try {
            a.call(b, c.resolve, c.reject)
        } catch (k) {
            c.reject(k)
        }
    }
    ;
    c.prototype.then = function(a, b) {
        function d(a, b) {
            return "function" == typeof a ? function(b) {
                    try {
                        e(a(b))
                    } catch (m) {
                        f(m)
                    }
                }
                : b
        }
        var e, f, g = new c(function(a, b) {
                e = a;
                f = b
            }
        );
        this.callWhenSettled_(d(a, e), d(b, f));
        return g
    }
    ;
    c.prototype["catch"] = function(a) {
        return this.then(void 0, a)
    }
    ;
    c.prototype.callWhenSettled_ = function(a, b) {
        function c() {
            switch (e.state_) {
                case 1:
                    a(e.result_);
                    break;
                case 2:
                    b(e.result_);
                    break;
                default:
                    throw Error("Unexpected state: " + e.state_);
            }
        }
        var e = this;
        null == this.onSettledCallbacks_ ? d.asyncExecute(c) : this.onSettledCallbacks_.push(function() {
            d.asyncExecute(c)
        })
    }
    ;
    c.resolve = function(a) {
        return a instanceof c ? a : new c(function(b, c) {
                b(a)
            }
        )
    }
    ;
    c.reject = function(a) {
        return new c(function(b, c) {
                c(a)
            }
        )
    }
    ;
    c.race = function(a) {
        return new c(function(b, d) {
                for (var e = $jscomp.makeIterator(a), f = e.next(); !f.done; f = e.next())
                    c.resolve(f.value).callWhenSettled_(b, d)
            }
        )
    }
    ;
    c.all = function(a) {
        var b = $jscomp.makeIterator(a)
            , d = b.next();
        return d.done ? c.resolve([]) : new c(function(a, e) {
                function f(b) {
                    return function(c) {
                        h[b] = c;
                        k--;
                        0 == k && a(h)
                    }
                }
                var h = []
                    , k = 0;
                do
                    h.push(void 0),
                        k++,
                        c.resolve(d.value).callWhenSettled_(f(h.length - 1), e),
                        d = b.next();
                while (!d.done)
            }
        )
    }
    ;
    $jscomp.EXPOSE_ASYNC_EXECUTOR && (c.$jscomp$new$AsyncExecutor = function() {
            return new a
        }
    );
    return c
}, "es6-impl", "es3");
$jscomp.checkStringArgs = function(g, a, b) {
    if (null == g)
        throw new TypeError("The 'this' value for String.prototype." + b + " must not be null or undefined");
    if (a instanceof RegExp)
        throw new TypeError("First argument to String.prototype." + b + " must not be a regular expression");
    return g + ""
}
;
$jscomp.polyfill("String.prototype.includes", function(g) {
    return g ? g : function(a, b) {
        return -1 !== $jscomp.checkStringArgs(this, a, "includes").indexOf(a, b || 0)
    }
}, "es6-impl", "es3");
$jscomp.findInternal = function(g, a, b) {
    g instanceof String && (g = String(g));
    for (var c = g.length, d = 0; d < c; d++) {
        var e = g[d];
        if (a.call(b, e, d, g))
            return {
                i: d,
                v: e
            }
    }
    return {
        i: -1,
        v: void 0
    }
}
;
$jscomp.polyfill("Array.prototype.find", function(g) {
    return g ? g : function(a, b) {
        return $jscomp.findInternal(this, a, b).v
    }
}, "es6-impl", "es3");
$jscomp.array = $jscomp.array || {};
$jscomp.iteratorFromArray = function(g, a) {
    $jscomp.initSymbolIterator();
    g instanceof String && (g += "");
    var b = 0
        , c = {
        next: function() {
            if (b < g.length) {
                var d = b++;
                return {
                    value: a(d, g[d]),
                    done: !1
                }
            }
            c.next = function() {
                return {
                    done: !0,
                    value: void 0
                }
            }
            ;
            return c.next()
        }
    };
    c[Symbol.iterator] = function() {
        return c
    }
    ;
    return c
}
;
$jscomp.polyfill("Array.prototype.entries", function(g) {
    return g ? g : function() {
        return $jscomp.iteratorFromArray(this, function(a, b) {
            return [a, b]
        })
    }
}, "es6-impl", "es3");
window.GIST = "undefined" == typeof window.GIST ? {} : window.GIST || {};
"object" != typeof GIST.f && (GIST.f = {});
window.GIST = "object" != typeof GIST ? {} : window.GIST || {};
if ("object" != typeof Gs && "undefined" == typeof Gs) {
    var _typeof = function(g) {
        $jscomp.initSymbol();
        $jscomp.initSymbol();
        $jscomp.initSymbolIterator();
        return (_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(a) {
                    return typeof a
                }
                : function(a) {
                    $jscomp.initSymbol();
                    $jscomp.initSymbol();
                    $jscomp.initSymbol();
                    return a && "function" == typeof Symbol && a.constructor === Symbol && a !== Symbol.prototype ? "symbol" : typeof a
                }
        )(g)
    };
    !function a(b, c, d) {
        function e(h, l) {
            if (!c[h]) {
                if (!b[h]) {
                    var k = "function" == typeof require && require;
                    if (!l && k)
                        return k(h, !0);
                    if (f)
                        return f(h, !0);
                    k = Error("Cannot find module '" + h + "'");
                    throw k.code = "MODULE_NOT_FOUND",
                        k;
                }
                k = c[h] = {
                    exports: {}
                };
                b[h][0].call(k.exports, function(a) {
                    return e(b[h][1][a] || a)
                }, k, k.exports, a, b, c, d)
            }
            return c[h].exports
        }
        for (var f = "function" == typeof require && require, h = 0; h < d.length; h++)
            e(d[h]);
        return e
    }({
        1: [function(a, b, c) {
            window;
            a("src/js/client")
        }
            , {
                "src/js/client": 2
            }],
        2: [function(a, b, c) {
            "object" != ("undefined" == typeof GIST ? "undefined" : _typeof(GIST)) ? window.GIST = {} : window.GIST = window.GIST || {};
            void 0 === GIST.analytics && (GIST.analytics = {});
            void 0 !== GIST.analytics.client && console.warn("Gist analytics is already loaded");
            GIST.analytics.client = {
                params: {
                    production_url: "//analytics.gist-apps.com",
                    sandbox_url: "//localhost:8000",
                    path: "/api/public/events.json",
                    api_key: null,
                    sandbox: !1
                },
                configure: function(a, b) {
                    GIST.analytics.client.params.api_key = a;
                    GIST.analytics.client.params.sandbox = b
                },
                url: function() {
                    return !0 === GIST.analytics.client.params.sandbox ? "".concat(GIST.analytics.client.params.sandbox_url).concat(GIST.analytics.client.params.path) : "".concat(GIST.analytics.client.params.production_url).concat(GIST.analytics.client.params.path)
                },
                send: function(a) {
                    var b = GIST.analytics.client.url();
                    a.api_key = GIST.analytics.client.params.api_key;
                    a = new Request(b,{
                        method: "POST",
                        headers: new Headers({
                            "Content-Type": "application/json"
                        }),
                        body: JSON.stringify(a)
                    });
                    fetch(a).then(function(a) {
                        return a.json()
                    }).then(function(a) {
                        return a
                    })["catch"](function(a) {
                        return console.log("error", a)
                    })
                }
            };
            b.exports = GIST.analytics.client
        }
            , {}]
    }, {}, [1]);
    Date.prototype.gs_stdTimezoneOffset = function() {
        var a = new Date(this.getFullYear(),0,1)
            , b = new Date(this.getFullYear(),6,1);
        return Math.max(a.getTimezoneOffset(), b.getTimezoneOffset())
    }
    ;
    Date.prototype.gs_dst = function() {
        return this.getTimezoneOffset() - this.gs_stdTimezoneOffset()
    }
    ;
    GIST.money_format = "${{amount}}";
    GIST.f.formatMoney = function(a, b) {
        function c(a, b) {
            return "undefined" == typeof a ? b : a
        }
        function d(a, b, d, e) {
            b = c(b, 2);
            d = c(d, ",");
            e = c(e, ".");
            if (isNaN(a) || null == a)
                return 0;
            a = (a / 100).toFixed(b);
            a = a.split(".");
            return a[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + d) + (a[1] ? e + a[1] : "")
        }
        "string" == typeof a && (a = a.replace(".", ""));
        var e = ""
            , f = /\{\{\s*(\w+)\s*\}\}/
            , h = b || this.money_format;
        switch (h.match(f)[1]) {
            case "amount":
                e = d(a, 2);
                break;
            case "amount_no_decimals":
                e = d(a, 0);
                break;
            case "amount_with_comma_separator":
                e = d(a, 2, ".", ",");
                break;
            case "amount_no_decimals_with_comma_separator":
                e = d(a, 0, ".", ",")
        }
        return h.replace(f, e)
    }
    ;
    GIST.f._loadScript = function(a, b) {
        var c = document.createElement("script");
        c.type = "text/javascript";
        c.readyState ? c.onreadystatechange = function() {
                if ("loaded" == c.readyState || "complete" == c.readyState)
                    c.onreadystatechange = null,
                        b()
            }
            : c.onload = function() {
                b()
            }
        ;
        c.src = a;
        document.getElementsByTagName("head")[0].appendChild(c)
    }
    ;
    GIST.f._loadJquery = function(a, b) {
        !0 === a && b(Gs.$);
        if (0 <= window.location.href.indexOf("checkout.shopify.com"))
            return !1;
        "undefined" === typeof jQuery || 1.9 > parseFloat(jQuery.fn.jquery) ? GIST.f._loadScript("//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js", function() {
            gsJquery = jQuery.noConflict(!0);
            b(gsJquery)
        }) : b(jQuery)
    }
    ;
    "undefined" !== typeof app_env && "dev" === app_env || "concierge-cloud.myshopify.com" === Shopify.shop ? GIST.analytics.client.configure("api_key_Sf1fhmRut5+a+LV+03m7YbH7zxPV") : GIST.analytics.client.configure("api_key_zwlzN6HeTLo6YCV/6wwmOVSSGmO/");
    GIST.cookie = {
        create: function(a, b, c) {
            var d = "";
            c && (d = new Date,
                d.setTime(d.getTime() + 864E5 * c),
                d = "; expires=" + d.toUTCString());
            document.cookie = a + "=" + b + d + "; path=/"
        },
        read: function(a) {
            a += "=";
            for (var b = document.cookie.split(";"), c = 0; c < b.length; c++)
                if (0 != b[c]) {
                    for (var d = b[c]; " " == d.charAt(0); )
                        d = d.substring(1, d.length);
                    if (0 == d.indexOf(a))
                        return d.substring(a.length, d.length)
                }
            return null
        },
        erase: function(a) {
            GIST.cookie.create(a, "", -1)
        }
    };
    var Gs = {
        version: 6,
        state: {
            buy_it_now_active: !1,
            intercept_click: !0,
            dynamic_cart_handled: !1,
            dynamic_cart_target: null,
            upsell_submitting: !1,
            product_added: !1,
            page_type: void 0,
            bundle_handled: !1,
            upsell_handled: !1,
            active_submit_btn: null
        },
        selectors: {
            addToCart: 'input[name="add"], button[name="add"], form[action*="/cart/add"] input[type="submit"], form[action*="/cart/add"] button[type="submit"], form[action*="/cart/add"] button:not([type="button"]), form[action*="/cart/add"] .gs__add-to-cart',
            checkoutBtn: 'button[name="checkout"], input[name="checkout"], form[action*="/cart"] a[href="/checkout"], a[href="/checkout"], form[action="/cart"] input[type="submit"][name="checkout"], form[action="/cart"] button[type="submit"][name="checkout"]',
            cartForm: 'form[action="/cart"], form[action="/cart/"], form[action="cart"]'
        },
        f: {
            consoleError: function(a) {
                console.error(a)
            },
            randProp: function() {
                for (var a = "", b = 0; 2 > b; b++)
                    a += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(62 * Math.random()));
                return a
            },
            stopEvent: function(a) {
                a.preventDefault ? a.preventDefault() : a.stop();
                a.returnValue = !1;
                a.stopPropagation();
                a.stopImmediatePropagation()
            },
            isNumeric: function(a) {
                return !isNaN(parseFloat(a)) && isFinite(a)
            },
            formatDate: function(a) {
                var b = (10 > a.getDate() ? "0" : "") + a.getDate()
                    , c = (10 > a.getMonth() + 1 ? "0" : "") + (a.getMonth() + 1);
                return a.getFullYear() + "-" + c + "-" + b
            },
            stringToMonth: function(a) {
                if (void 0 == a)
                    return !1;
                a = a.toLowerCase();
                var b = "january february march april may june july august september october november december".split(" ");
                return -1 < b.indexOf(a) ? b.indexOf(a) + 1 : a
            },
            toISODate: function(a) {
                if ("" === a || "undefined" == typeof a)
                    return !1;
                if (-1 === a.indexOf("-")) {
                    var b = a.split(", ");
                    a = b[1];
                    var c = b[0].split(" ")[0]
                        , c = Gs.f.stringToMonth(c)
                        , b = b[0].split(" ")[1];
                    "0" === b.charAt(0) && (b = b.substr(1));
                    return [a, c, b].join("-")
                }
                return a.split("-").map(function(a) {
                    return parseInt(a, 10)
                }).join("-")
            }
        },
        _: {
            bootstrap: function(a) {
                a = a[1];
                "object" != typeof a && (a = JSON.parse(a));
                Gs._.applySettings(a);
                if (!Gs.options.enabled)
                    return console.warn("Giftship is disabled. Please enable this in the application settings."),
                        !1;
                if ("thank_you" === Gs.state.page_type)
                    return Gs.thankYouPage.init(),
                        !1;
                "cart" === Gs.state.page_type && Gs.cartPage.init();
                "product" === Gs.state.page_type && Gs.productPage.init();
                Gs.global.init()
            },
            loadCSS: function(a) {
                return new Promise(function(b, c) {
                        Gs.$('link[href*="assets/css/giftship.global"]').length && b(a);
                        var d = document.createElement("link")
                            , e = document.getElementsByTagName("head")[0];
                        d.rel = "stylesheet";
                        d.type = "text/css";
                        d.href = "undefined" !== typeof app_env && "dev" === app_env || "concierge-cloud.myshopify.com" === Shopify.shop ? "https://giftship.ngrok.io/assets/css/giftship.global.css" : "https://99418-1398787-raikfcquaxqncofqfm.stackpathdns.com/assets/css/giftship.global.css";
                        e.appendChild(d);
                        b(a)
                    }
                )
            },
            loadSettings: function() {
                return new Promise(function(a, b) {
                        var c = Gs._.getSettingsUrl()
                            , d = Gs._.getCurrentLocale()
                            , e = {
                            myshopify_url: Shopify.shop,
                            page_type: Gs.state.page_type
                        };
                        !1 !== d && (e.locale = d);
                        "undefined" != typeof meta && "object" == typeof meta && meta.product && meta.product.id && "cart" !== Gs.state.page_type && (e.product_id = meta.product.id);
                        Gs.$.ajax({
                            url: c,
                            dataType: "json",
                            type: "GET",
                            cache: !1,
                            data: e,
                            success: function(b) {
                                a(b)
                            },
                            error: function(a, c, d) {
                                console.log(a);
                                console.log(c);
                                console.log(d);
                                b(Error("Giftships settings did not load correctly"))
                            }
                        })
                    }
                )
            },
            applySettings: function(a) {
                Gs.trans = a.translations;
                Gs.options = a.options;
                Gs.shop = a.shop;
                Gs.settings = a;
                Gs.shop.money_format && (GIST.money_format = Gs.shop.money_format);
                return a
            },
            getSettingsUrl: function() {
                var a = "https://giftship.app/app/settings/";
                if ("undefined" !== typeof window.app_env && "dev" === window.app_env || "concierge-cloud.myshopify.com" === Shopify.shop)
                    a = "https://giftship.ngrok.io/app/settings/";
                return a
            },
            getCurrentLocale: function() {
                var a = GIST.cookie.read("gs_locale");
                return "undefined" != typeof Shopify.locale ? Shopify.locale : null !== a && "" !== a ? a : !1
            },
            getPageType: function() {
                var a;
                "undefined" != typeof Gs.drawerCart && !0 === Gs.drawerCart ? a = "cart" : "/cart" === window.location.pathname || "/cart/" === window.location.pathname || window.location.pathname.includes("/cart") ? a = "cart" : "undefined" != typeof meta && "object" == typeof meta && meta.product && meta.product.id ? a = "product" : "/a/gs/cart" === window.location.pathname || "/a/gs/cart/" === window.location.pathname ? a = "gs_cart" : "undefined" != typeof Shopify && "undefined" != typeof Shopify.Checkout && (a = "thank_you");
                "undefined" == typeof a && window.location !== window.parent.location && Gs.$('form[action*="/cart/add"]').length && (a = "product");
                return a
            },
            getElements: function() {
                return {
                    appContainer: Gs.$('<div style="position: relative;" id="gsAppContainer" class="gs__app-container" ><div style="width: 400px; max-width: 100%;position: relative;float:right;min-height:50px;"><div class="gs__loader"></div></div></div>'),
                    addToCartBtn: Gs.$(document).find(Gs.selectors.addToCart),
                    checkoutBtn: Gs.$(document).find(Gs.selectors.checkoutBtn),
                    cartForm: Gs.$(document).find(Gs.selectors.cartForm)
                }
            }
        },
        initialize: function(a, b) {
            Gs.$.ajaxSetup({
                cache: !1
            });
            Gs.state.page_type = Gs._.getPageType();
            Gs.elements = Gs._.getElements();
            if (void 0 === Gs.state.page_type)
                return !1;
            if (!0 === b)
                return Gs._.bootstrap([null, Gs.settings]),
                    !1;
            Promise.all([Gs._.loadCSS(), Gs._.loadSettings()]).then(Gs._.bootstrap)["catch"](Gs.f.consoleError)
        },
        global: {
            init: function() {
                Gs.translations.init();
                Gs.token.init();
                Gs.global.events();
                Gs.global.actions.styleButtons();
                Gs.global.actions.formatMoneyText();
                "function" == typeof GsLoaded && GsLoaded(Gs);
                Gs.global.actions.runAnalyticsEvents()
            },
            events: function() {
                if ("undefined" == typeof Gs.eventsRegistered || !0 !== Gs.eventsRegistered) {
                    Gs.eventsRegistered = !0;
                    Gs.$(document).on("click", ".gs__submit-cart", function(a) {
                        Gs.elements.checkoutBtn.unbind().unbind("click").off().off("click");
                        Gs.submitCart(a, Gs.$(this))
                    });
                    Gs.$(document).on("change", '.gs__product-element[data-checkbox-type="radio"]', function() {
                        Gs.productOptions.handleRadioChange(Gs.$(this));
                        Gs.productOptions._convertIdInput()
                    });
                    Gs.$(document).on("change", ".gs__product-element", function(a) {
                        Gs.productOptions.checkConditions(a);
                        Gs.productOptions.calculateTotal()
                    });
                    Gs.$(document).on("change", ".gs__oneclick-variant", Gs.productOptions._convertIdInput);
                    Gs.$(document).on("change", '[name="id[]"]', Gs.productOptions._convertIdInput);
                    Gs.$(document).on("change", "[data-bundle-cents]", Gs.productOptions._bundleInputs);
                    Gs.$(document).on("click", ".gs__save-attributes", function(a) {
                        a.preventDefault();
                        var b = Gs.$(this).closest(".gs__toggle-feature-item")
                            , c = b.find(".gs__toggle-feature-checkbox");
                        Gs.$(".gs__line-error").remove();
                        Gs.cartPage.actions.updateAttributes(function() {
                            var a = Gs.$('<p class="gs__line-success">' + Gs.trans.message.save_success_text + "</p>");
                            b.addClass("gs__collapsed");
                            c.append(a);
                            Gs.$(".gs__open-toggle").closest(".gs__field").show();
                            setTimeout(function() {
                                a.fadeOut()
                            }, 1500)
                        }, function() {
                            var a = Gs.$('<p class="gs__line-error">' + Gs.trans.message.save_error_text + "</p>");
                            Gs.$(this).prepend(a)
                        })
                    });
                    Gs.$(document).on("click", ".gs__open-toggle", function(a) {
                        a.preventDefault();
                        a = Gs.$(this).closest(".gs__toggle-feature-item");
                        Gs.$(this).closest(".gs__field").hide();
                        Gs.$(".gs__line-success, .gs__line-error").remove();
                        a.removeClass("gs__collapsed")
                    });
                    Gs.$(document).on("change", '.gs__toggle-feature-item input[type="checkbox"]:not(.gs__oneclick-add-variant)', function() {
                        var a = Gs.$(this).closest(".gs__toggle-feature-item");
                        Gs.$(this).is(":checked") ? (a.removeClass("gs__collapsed"),
                        "2" === Gs.options.message.required && Gs.$("#gsMessageContainer").find("input, textarea").addClass("required").attr("required", "required")) : (a.addClass("gs__collapsed"),
                        "2" === Gs.options.message.required && Gs.$("#gsMessageContainer").find("input, textarea").removeClass("required").removeAttr("required"))
                    });
                    Gs.$(document).on("click", ".gs__remove-variant", function() {
                        var a = Gs.$(this).data("id")
                            , b = Gs.$(this);
                        Gs._removeVariant(a, !1);
                        b.hide();
                        b.closest("form").find("button").show().text("Add +")
                    });
                    if ("undefined" != typeof Gs.elements.checkoutBtn)
                        Gs.elements.checkoutBtn.on("click", function(a) {
                            Gs.submitCart(a, Gs.$(this))
                        });
                    else
                        Gs.$(document).on("click", Gs.selectors.checkoutBtn, function(a) {
                            Gs.submitCart(a, Gs.$(this))
                        });
                    Gs.$(document).on("keyup", ".gs__msg", function() {
                        Gs._maxChars(Gs.$(this))
                    });
                    Gs.$(document).on("change", ".gs__msg", function() {
                        GIST.analytics.client.send({
                            name: "feature_used",
                            value: "message",
                            meta: {
                                shop: Gs.shop.id
                            }
                        })
                    });
                    Gs.$(document).on("keyup change", ".gs__app-container .error, .gs__input-error", function() {
                        Gs.$(this).removeClass("error gs__input-error")
                    });
                    Gs.$(document).on("click", ".gs__m-bg", function(a) {
                        a.target !== this || Gs.$(".gs__shipping-modal").hasClass("gs__m-open") || (Gs.$(".gs__m, .gs__m-bg").removeClass("gs__m-open"),
                            Gs.$("body").removeClass("gs__modal-open"))
                    });
                    Gs.$(document).on("click", ".gs__close-modal", function(a) {
                        a.preventDefault();
                        Gs.$(".gs__m, .gs__m-bg").removeClass("gs__m-open");
                        Gs.$("body").removeClass("gs__modal-open")
                    });
                    Gs.$(document).on("click", "#storePickupApp .checkoutMethod", function() {
                        "Store Pickup" === Gs.$(this).find(".checkoutMethodName").html() && Gs.hideMulti()
                    });
                    Gs.$(document).on("change", ".gs__oneclick-add-variant", function() {
                        var a = Gs.$(this).val()
                            , b = Gs.$(this).next("[data-gsmoney]").attr("data-gsmoney")
                            , c = Gs.token.get();
                        Gs.$(this).is(":checked") ? (Gs._addVariant(a, 1, {
                            _gs_variant: a
                        }, !0, null),
                            GIST.analytics.client.send({
                                name: "feature_used",
                                value: "one_click_upsell",
                                meta: {
                                    shop: Gs.shop.id,
                                    variant: a,
                                    gistToken: c,
                                    potential_value: b
                                }
                            })) : Gs._removeVariant(a, !0)
                    });
                    Gs.$(document).on("click", function(a) {
                        Gs._documentClick(a)
                    });
                    Gs.$(window).bind("mousewheel", function() {
                        Gs.$("html, body").stop(!0, !0)
                    });
                    "function" == typeof _gsShowPage && _gsShowPage()
                }
            },
            actions: {
                clearAttributes: function(a, b, c) {
                    var d = "";
                    Gs.$.each(a.attributes || {}, function(a, b) {
                        var c = "attributes[" + a + "]";
                        d = -1 < a.indexOf("shipping_rate - ") || -1 < a.indexOf("gs_note - ") || -1 < a.indexOf(Gs.options.message.additional_name + " - ") || -1 < a.indexOf(Gs.trans.message.to_label + " - ") || -1 < a.indexOf(Gs.trans.message.from_label + " - ") || -1 < a.indexOf(Gs.trans.message.message_label + " - ") || -1 < a.indexOf(Gs.trans.datepicker.button_text + " - ") ? d + (escape(c) + "=" + b + "&") : d + (escape(c) + "=&")
                    });
                    Gs.$.ajax({
                        type: "POST",
                        url: "/cart/update.js",
                        data: d,
                        dataType: "json",
                        success: function(a) {
                            "function" == typeof b && b(a)
                        },
                        error: function(a, b, d) {
                            console.log(a);
                            "function" == typeof c && c(a)
                        },
                        cache: !1
                    })
                },
                resizeOptions: function() {
                    setTimeout(function() {
                        Gs.$('[data-child-type="upsell"] li').each(function() {
                            var a = Gs.$(this).find('.gs__option-upsell-label [data-child-attribute="label"]').outerHeight();
                            Gs.$(this).css({
                                "margin-bottom": a + "px"
                            })
                        })
                    }, 100)
                },
                addNoValidate: function() {
                    var a = Gs.$('input[type="checkbox"][required="required"]');
                    a.length && (a = a.closest("form"),
                    a.length && a.attr("novalidate", "novalidate"))
                },
                runAnalyticsEvents: function() {
                    "undefined" != typeof Gs.settings && "undefined" != typeof Gs.shop && "undefined" != typeof Gs.shop.id && (Gs.$(".gs__toggle-feature-item").length && GIST.analytics.client.send({
                        name: "feature_shown",
                        value: "is_this_a_gift",
                        meta: {
                            shop: Gs.shop.id
                        }
                    }),
                    Gs.$("#gsMessageContainer").length && GIST.analytics.client.send({
                        name: "feature_shown",
                        value: "message",
                        meta: {
                            shop: Gs.shop.id
                        }
                    }),
                    Gs.$('[id^="gsOneClickProduct"]').length && GIST.analytics.client.send({
                        name: "feature_shown",
                        value: "one_click_upsell",
                        meta: {
                            shop: Gs.shop.id
                        }
                    }),
                        Gs.$(document).on("change", '[id^="gsOneClickProduct"]', function() {
                            if (Gs.$(this).is(":checked")) {
                                var a = Gs.$(this).val()
                                    , b = Gs.$(this).next("[data-gsmoney]").attr("data-gsmoney")
                                    , c = Gs.token.get();
                                GIST.analytics.client.send({
                                    name: "feature_used",
                                    value: "one_click_upsell",
                                    meta: {
                                        shop: Gs.shop.id,
                                        variant: a,
                                        potential_value: b,
                                        gistToken: c
                                    }
                                })
                            }
                        }))
                },
                styleButtons: function() {
                    Gs.options.global && "" !== Gs.options.global.button_class && Gs.$(".btn").addClass(Gs.options.global.button_class)
                },
                formatMoneyText: function() {
                    Gs.$("[data-gsmoney]").each(function() {
                        var a = Gs.$(this).attr("data-gsmoney")
                            , a = GIST.f.formatMoney(a, GIST.money_format);
                        Gs.$(this).html(a)
                    })
                }
            }
        },
        thankYouPage: {
            getPageType: function() {
                Gs.thankYouPage.pageType = "standard";
                "undefined" != typeof Shopify.checkout && Gs.$.each(Shopify.checkout.line_items, function(a, b) {
                    if (b.properties._gs_variant_id)
                        return Gs.thankYouPage.pageType = "parent",
                            !1
                })
            },
            handleProductImages: function() {
                if ("parent" !== Gs.thankYouPage.pageType)
                    return !1;
                Gs.$.each(Shopify.checkout.line_items, function(a, b) {
                    var c = Gs.$("[data-product-id]:nth-of-type(" + (a + 1) + ")")
                        , d = c.find(".product-thumbnail__image").attr("src")
                        , e = c.find(".product-thumbnail__wrapper")
                        , c = c.find(".product-thumbnail");
                    -1 < d.indexOf("product-blank") && (e.remove(),
                        c.addClass("gs__hidden-image"))
                });
                Gs.$(".logo").changeElementType("a");
                Gs.$(".logo").attr("href", "https://" + Shopify.shop)
            },
            handleTitle: function() {
                if ("parent" !== Gs.thankYouPage.pageType)
                    return !1;
                var a = Gs.$(".os-order-number")
                    , b = Gs.$(".os-header__title");
                a.hide();
                b.text(a.text())
            },
            handleShippingLine: function() {
                if ("parent" !== Gs.thankYouPage.pageType)
                    return !1;
                var a = Gs.$(".total-line--subtotal");
                Gs.$.each(Shopify.checkout.line_items, function(b, c) {
                    var d = Gs.$("[data-product-id]:nth-of-type(" + (b + 1) + ")")
                        , e = d.find(".product__description__name").text()
                        , f = d.find(".product__price").text()
                        , f = Gs.$('<tr class="total-line total-line--subtotal"><th class="total-line__name" scope="row">' + Gs.trans.global.shipping_text + '</th><td class="total-line__price"><span class="order-summary__emphasis skeleton-while-loading">' + f + "</span></td></tr>");
                    if ("Shipping" === e || e === Gs.trans.global.shipping_text)
                        return d.remove(),
                            a.after(f),
                            !1
                })
            },
            handleTaxLine: function() {
                if ("parent" !== Gs.thankYouPage.pageType)
                    return !1;
                var a = Gs.$(".total-line--subtotal");
                Gs.$.each(Shopify.checkout.line_items, function(b, c) {
                    var d = Gs.$("[data-product-id]:nth-of-type(" + (b + 1) + ")")
                        , e = d.find(".product__description__name").text()
                        , f = d.find(".product__price").text()
                        , f = Gs.$('<tr class="total-line total-line--tax"><th class="total-line__name" scope="row">Tax</th><td class="total-line__price"><span class="order-summary__emphasis skeleton-while-loading">' + f + "</span></td></tr>");
                    if ("Tax" === e)
                        return d.remove(),
                            a.after(f),
                            !1
                })
            },
            handleIcon: function() {
                if ("parent" !== Gs.thankYouPage.pageType)
                    return !1;
                var a = Gs.$('<svg id="checkmark"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" fill="none" stroke-width="2" class="checkmark"><path class="checkmark__circle" d="M25 49c13.255 0 24-10.745 24-24S38.255 1 25 1 1 11.745 1 25s10.745 24 24 24z"></path><path class="checkmark__check" d="M15 24.51l7.307 7.308L35.125 19"></path></svg></svg>');
                Gs.$(".os-header__hanging-icon").html(a)
            },
            insertCss: function(a) {
                if (Gs.$('link[href*="' + a + '"]').length)
                    return !1;
                var b = document.createElement("link")
                    , c = document.getElementsByTagName("body")[0];
                b.rel = "stylesheet";
                b.type = "text/css";
                b.href = a;
                c.appendChild(b)
            },
            init: function() {
                Gs.thankYouPage.getPageType();
                Gs.thankYouPage.handleProductImages();
                Gs.thankYouPage.handleTitle();
                Gs.thankYouPage.handleIcon();
                Gs.thankYouPage.handleTaxLine();
                Gs.thankYouPage.handleShippingLine();
                Gs.thankYouPage.insertCss(Gs.settings.base_cdn_url + "/assets/css/giftship.thank-you.css");
                "parent" === Gs.thankYouPage.pageType && Gs.thankYouPage.insertCss(Gs.settings.base_cdn_url + "/assets/css/giftship.thanks.parent.css")
            }
        },
        cartPage: {
            init: function() {
                if ("cart" !== Gs.state.page_type)
                    return !1;
                "undefined" != typeof Gs.settings._appHtml && (Gs.cartPage.actions.insertAppContainer(),
                    Gs.cartPage.actions.widenAppContainer(),
                    Gs.cartPage.actions.initAppBox(),
                    Gs.datepicker.init(),
                    Gs.oneClickUpsell.init(),
                    Gs.cartPage.actions.insertToggle(),
                    Gs.cartPage.actions.addBodyClass(),
                    Gs.cartPage.actions.removeProductElements(),
                    Gs.cartPage.actions.addCartDiscount(),
                    Gs.cartPage.actions.removeMultiAddressProps(),
                    Gs.cartPage.actions.populateAttributes(),
                    Gs.cartPage.events())
            },
            events: function() {
                Gs.$(document).on("click", "#gs__toggle-shipping", Gs.cartPage.actions.toggleMulti);
                document.addEventListener("click", Gs.cartPage.actions.handleDynamicCartButtons, !0);
                document.documentElement.addEventListener("cart:refresh", function() {
                    setTimeout(Gs.initialize, 500)
                })
            },
            actions: {
                handleDynamicCartButtons: function(a) {
                    var b = Gs.$(a.target);
                    "button" !== b.attr("role") && (b = b.closest('[role="button"]'));
                    if (!b.closest("#dynamic-checkout-cart").length)
                        return Gs.state.dynamic_cart_target = null,
                            !0;
                    if (!0 === Gs.state.dynamic_cart_handled)
                        return !0;
                    Gs.f.stopEvent(a);
                    Gs.state.dynamic_cart_target = b;
                    Gs.state.dynamic_cart_handled = !0;
                    Gs.cartPage.actions.updateAttributes(function() {
                        Gs.submitCart(a, b)
                    }, function() {
                        Gs.submitCart(a, b)
                    })
                },
                updateAttributes: function(a, b) {
                    var c = Gs.$("input[name*='attributes['], textarea[name='note'], textarea[name*='attributes[']").serialize();
                    Gs.$.ajax({
                        type: "POST",
                        url: "/cart/update.js",
                        data: c,
                        dataType: "json",
                        success: function(b) {
                            "function" == typeof a && a(b)
                        },
                        error: function(a, c, f) {
                            "function" == typeof b && b(a)
                        },
                        cache: !1
                    })
                },
                widenAppContainer: function() {
                    Gs.$("#gsAppContainer").parent("div").css({
                        "max-width": "100%"
                    })
                },
                lastVisibleCartFormAndBtn: function() {
                    var a = !1;
                    Gs.$(Gs.selectors.cartForm).each(function() {
                        var b = Gs.$(this)
                            , c = b.find(Gs.selectors.checkoutBtn);
                        if (!b.is(":visible") || !c.length || !c.last().is(":visible") || c.last().parent("header").length || c.last().closest(".cart-notification-wrapper").length)
                            return !0;
                        a = {
                            cartForm: b,
                            checkoutBtn: b.find(Gs.selectors.checkoutBtn).last()
                        }
                    });
                    return a
                },
                lastVisibleCartForm: function() {
                    var a = !1;
                    Gs.$(Gs.selectors.cartForm).each(function() {
                        var b = Gs.$(this);
                        b.is(":visible") && (a = {
                            cartForm: b
                        })
                    });
                    return a
                },
                lastVisibleCheckoutBtn: function() {
                    var a = !1;
                    Gs.$(Gs.selectors.checkoutBtn).each(function() {
                        var b = Gs.$(this);
                        b.is(":visible") && (a = {
                            checkoutBtn: b
                        })
                    });
                    return a
                },
                insertAppContainer: function() {
                    var a;
                    if ('<divclass="gs__wrapper"></div>' === Gs.settings._appHtml.replace(/\s/g, "") || Gs.$(".gs__app-container:not(.gs__product-app-container)").length)
                        return !1;
                    a = Gs.cartPage.actions.lastVisibleCartFormAndBtn();
                    if (!1 !== a && a.checkoutBtn.length)
                        return console.log("1", a),
                            a.checkoutBtn.before(Gs.elements.appContainer),
                            !1;
                    a = Gs.cartPage.actions.lastVisibleCartForm();
                    if (!1 !== a && a.cartForm.length)
                        return a.cartForm.append(Gs.elements.appContainer),
                            !1;
                    a = Gs.cartPage.actions.lastVisibleCheckoutBtn();
                    if (!1 !== a && a.checkoutBtn)
                        return a.checkoutBtn.before(Gs.elements.appContainer),
                            !1;
                    Gs.elements.checkoutBtn.last().is(":visible") ? Gs.elements.checkoutBtn.last().before(Gs.elements.appContainer) : Gs.elements.checkoutBtn.first().is(":visible") ? Gs.elements.checkoutBtn.first().before(Gs.elements.appContainer) : Gs.elements.checkoutBtn.length ? Gs.elements.checkoutBtn.last().before(Gs.elements.appContainer) : a.cartForm.length ? a.cartForm.append(Gs.elements.appContainer) : console.warn("Could not find a location to embed Giftship's cart feature container")
                },
                initAppBox: function() {
                    Gs.elements.appHtml = Gs.$(Gs.settings._appHtml);
                    var a = !1;
                    Gs.$(document).find(".gs__app-container").each(function() {
                        if (Gs.$(this).closest('form[action*="cart"]').length)
                            return !0;
                        Gs.$(this).addClass("gs__cart-app-container").html(Gs.elements.appHtml);
                        a = !0;
                        return !1
                    });
                    !1 === a && Gs.$(".gs__app-container").addClass("gs__cart-app-container").html(Gs.elements.appHtml)
                },
                toggleMulti: function(a) {
                    var b = Gs.$(this);
                    a.returnValue = !1;
                    a.stopPropagation();
                    a.stopImmediatePropagation();
                    b.is(":checked") ? Gs.cartPage.actions.showMulti() : Gs.cartPage.actions.hideMulti()
                },
                showMulti: function() {
                    GIST.cookie.create("current_ms_state", "ms_cart", 1);
                    var a = "https://" + document.location.hostname + "/a/gs/cart/";
                    "undefined" != typeof Gs.shop.primary_locale && Gs.shop.primary_locale != Shopify.locale && (a = "https://" + document.location.hostname + "/" + Shopify.locale + "/a/gs/cart/");
                    var b = GIST.cookie.read("gs_locale");
                    null !== b && "" !== b && (a = a + "?locale=" + b);
                    window.location = a;
                    Gs.$("#gs__toggle-shipping").prop("checked", !0)
                },
                hideMulti: function() {
                    GIST.cookie.create("current_ms_state", "normal_cart", 1);
                    Gs.getCart(function(a) {
                        Gs.removeShipProps(a)
                    })
                },
                addBodyClass: function() {
                    Gs.$("body").addClass("gs__cart-page")
                },
                removeProductElements: function() {
                    Gs.elements.appHtml.find(".gs__product-element").remove();
                    "per_product" === Gs.datepicker.date_location && Gs.elements.appHtml.find(".gs__delivery-date").remove();
                    "per_product" === Gs.options.message.message_location && Gs.elements.appHtml.find("#gsMessageContainer").remove()
                },
                addCartDiscount: function() {
                    var a = GIST.cookie.read("box_builder_code");
                    "undefined" != typeof a && "%20" !== a && null != a && a.length && (Gs.$(Gs.selectors.cartForm).each(function() {
                        Gs.$(this).find(Gs.selectors.checkoutBtn).length || Gs.cartPage.actions.addDiscountToFormAction(Gs.$(this), a)
                    }),
                        Gs.$(Gs.selectors.checkoutBtn).each(function() {
                            Gs.$(this).closest("form");
                            Gs.cartPage.actions.addDiscountToFormAction(Gs.$(this), a)
                        }))
                },
                addDiscountToFormAction: function(a, b) {
                    if ("undefined" != typeof a && a) {
                        var c = a.attr("action")
                            , d = c + "?discount=" + b;
                        "undefined" != typeof c && (c.includes("discount=") && console.warn("action already includes discount"),
                        c.includes("?") && (d = c + "&discount=" + b),
                            a.attr("action", d))
                    }
                },
                removeMultiAddressProps: function() {
                    Gs.getCart(function(a) {
                        Gs.removeShipProps(a)
                    })
                },
                populateAttributes: function() {
                    Gs.getCart(function(a) {
                        var b = a.attributes || {}
                            , c = Gs.$(".gs__gift-checkbox");
                        Gs.$.each(b, function(a, b) {
                            Gs.$('input[name="attributes[' + a + ']"]').val(b);
                            Gs.$('textarea[name="attributes[' + a + ']"]').html(b);
                            Gs.$('input[type="checkbox"][name="attributes[' + a + ']"]').attr("checked", "checked");
                            "gift" === a && c.is(":checked") && (Gs.$(".gs__toggle-feature-item").removeClass("gs__collapsed"),
                            "2" === Gs.options.message.required && Gs.$("#gsMessageContainer").find("input, textarea").addClass("required").attr("required", "required"))
                        });
                        Gs.bundles.actions.buildBundles(a);
                        GIST.bundles.length && (GIST._bundleCart = !0,
                            Gs._cloneCheckoutBtn())
                    })
                },
                insertToggle: function() {
                    if ("cart" !== Gs.state.page_type || !Gs.options.multishipping.enable)
                        return !1;
                    var a = Gs.$('form[action*="/cart"]:not([action*="add"]), form[action*=" /cart"]:not([action*="add"]), form[action^="https://' + document.location.hostname + '/cart"]:not([action*="add"]), form[action^="//' + document.location.hostname + '/cart"]:not([action*="add"]), form[action="/a/sc/checkouts/"]')
                        , b = Gs.$('<div id="gs__toggle-box" style="background-color: ' + Gs.options.appearance.multishipping_toggle_color + '"><p><input type="checkbox" id="gs__toggle-shipping" value="Ship to Multiple"> <label for="gs__toggle-shipping" style="color: ' + Gs.options.appearance.multishipping_toggle_text_color + '">' + Gs.trans.multishipping.toggle_text + "</label></p></div>");
                    Gs.$("#gs__toggle-box").length ? Gs.$("#gs__toggle-box").html(b.html()) : a.before(b)
                }
            }
        },
        productPage: {
            init: function() {
                if ("product" !== Gs.state.page_type)
                    return !1;
                Gs.productPage.actions.insertContainer();
                Gs.productPage.actions.populateContainer();
                Gs.productPage.actions.handleInitialState();
                Gs.datepicker.init();
                Gs.oneClickUpsell.init();
                Gs.productOptions.init();
                Gs.productUpsell.init();
                Gs.productPage.events()
            },
            events: function() {
                Gs.$(document).on("click", Gs.selectors.addToCart, function(a) {
                    Gs.state.active_submit_btn = Gs.$(this);
                    Gs.state.buy_it_now_active = !1;
                    Gs.productPage.actions.handleSubmit(a)
                });
                document.addEventListener("click", function(a) {
                    var b = Gs.$(a.target);
                    if (b.hasClass("shopify-payment-button__button") || b.closest(".shopify-payment-button__button").length)
                        Gs.f.stopEvent(a);
                    else
                        return !0;
                    Gs.state.active_submit_btn = Gs.$(this);
                    Gs.state.buy_it_now_active = !0;
                    Gs.productPage.actions.handleSubmit(a)
                }, !0);
                Gs.$(document).ajaxComplete(function(a, b, c) {
                    Gs.productPage.actions.handleAjaxComplete(a, b, c)
                })
            },
            actions: {
                handleAjaxComplete: function(a, b, c) {
                    "undefined" != typeof b && "product" === Gs.state.page_type && (b.responseJSON && b.responseJSON.product_id ? "/cart/add.js" === c.url && b.responseJSON.product_id === meta.product.id && !1 === Gs.state.upsell_submitting && (Gs.state.product_added = !0) : b.responseText && !1 !== Gs._checkJson(b.responseText) && (b.responseJSON = JSON.parse(b.responseText),
                    b.responseJSON.product_id && "/cart/add.js" === c.url && b.responseJSON.product_id === meta.product.id && !1 === Gs.state.upsell_submitting && (Gs.state.product_added = !0)))
                },
                insertContainer: function() {
                    var a = !1;
                    if ('<divclass="gs__wrapper"></div>' === Gs.settings._appHtml.replace(/\s/g, ""))
                        return !1;
                    Gs.$("#gsAppContainer").length && "undefined" != typeof Gs.drawerCart && !0 !== Gs.drawerCart && (Gs.$("#gsAppContainer").parent("div").css({
                        "max-width": "100%"
                    }),
                        a = !0);
                    Gs.$("#gsAppContainer").length && "undefined" == typeof Gs.drawerCart && (a = !0);
                    Gs.$("body").addClass("gs__product-page");
                    if (!0 === a)
                        return !1;
                    "undefined" != typeof Gs.elements.addToCartBtn && Gs.elements.addToCartBtn.first().is(":visible") ? Gs.elements.addToCartBtn.first().before(Gs.elements.appContainer) : "undefined" != typeof Gs.elements.addToCartBtn && Gs.elements.addToCartBtn.last().is(":visible") ? Gs.elements.addToCartBtn.last().before(Gs.elements.appContainer) : "undefined" != typeof Gs.elements.addToCartBtn && Gs.elements.addToCartBtn.first().before(Gs.elements.appContainer);
                    Gs.$("#gsAppContainer").parent("div").css({
                        "max-width": "100%"
                    })
                },
                populateContainer: function() {
                    Gs.elements.appHtml = Gs.$(Gs.settings._appHtml);
                    var a = Gs.elements.addToCartBtn.closest("form");
                    a.length ? a.find(".gs__app-container").addClass("gs__product-app-container").html(Gs.elements.appHtml) : Gs.$(document).find(".gs__app-container").each(function() {
                        if (Gs.$(this).closest('form[action="/cart"]').length)
                            return !0;
                        Gs.$(this).addClass("gs__product-app-container").html(Gs.elements.appHtml)
                    });
                    Gs.global.actions.resizeOptions();
                    Gs.global.actions.addNoValidate()
                },
                triggerSubmit: function() {
                    if (!1 === Gs.state.intercept_click)
                        return !0;
                    Gs.state.intercept_click = !1;
                    if (!1 !== Gs.state.product_added)
                        return !0;
                    "undefined" != typeof Gs.productEventHandler && "submit" === Gs.productEventHandler ? Gs.$('form[action*="/cart/add"]').submit() : "undefined" == typeof Gs.state.active_submit_btn ? Gs.$('form[action*="/cart/add"]').submit() : Gs.state.active_submit_btn.click()
                },
                handleBuyItNow: function() {
                    var a = {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            "X-Requested-With": "XMLHttpRequest"
                        }
                    }
                        , b = "undefined" != typeof Gs.state.active_submit_btn ? Gs.state.active_submit_btn.closest("form") : Gs.$('form[action*="/cart/add"]');
                    b.length || (b = Gs.$('form[action*="/cart/add"]'));
                    console.log(b);
                    b = new FormData(b[b.length - 1]);
                    a.body = b;
                    for (var b = $jscomp.makeIterator(b.entries()), c = b.next(); !c.done; c = b.next())
                        c = c.value,
                            console.log(c[0] + ", " + c[1]);
                    fetch("/cart/add", a).then(function(a) {
                        return a.json()
                    }).then(function(a) {
                        console.log(a);
                        a.status && (Gs.state.intercept_click = !1,
                            Gs.productPage.actions.triggerSubmit());
                        !0 === Gs.productPage.actions.cartPageNeeded() ? window.location.href = "/cart" : window.location.href = "/checkout"
                    })["catch"](function(a) {
                        console.error(a);
                        Gs.productPage.actions.triggerSubmit()
                    })
                },
                cartPageNeeded: function() {
                    return 1 === Gs.settings.options.datepicker.enabled && 1 === Gs.settings.options.datepicker.required && "per_order" === Gs.settings.options.datepicker.date_location ? (console.warn("Datepicker is mandatory on the cart page - overriding buy it now"),
                        !0) : 1 === Gs.settings.options.message.enable && "1" === Gs.settings.options.message.required && "per_order" === Gs.settings.options.datepicker.message_location ? (console.warn("Message is mandatory on the cart page - overriding buy it now"),
                        !0) : GIST._bundleCart && !0 === GIST._bundleCart || Gs.$('[name="properties[_gs_bundle_contents][]"]').length ? (console.warn("Bundles need to occur on cart page - overriding buy it now"),
                        !0) : !1
                },
                validateForm: function() {
                    var a = !0
                        , b = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
                    Gs.$(document).find(".gs__product-option").each(function() {
                        var c = Gs.$(this).find("[required]");
                        if (!c.length)
                            return !0;
                        var d = c.attr("type")
                            , e = !0
                            , f = c.val();
                        c.is("select") ? d = "select" : c.is("textarea") && (d = "textarea");
                        if ("email" === d)
                            b.test(Gs.$.trim(f)) && "" !== Gs.$.trim(f) || (e = !1);
                        else if ("checkbox" === d)
                            c.is(":checked") || (e = !1);
                        else if ("radio" === d) {
                            var h = !1;
                            c.each(function() {
                                Gs.$(this).is(":checked") && (h = !0)
                            });
                            !1 === h && (e = !1)
                        } else
                            "" === Gs.$.trim(f) && (e = !1);
                        !1 === e && (a = !1,
                            c.addClass("gs__input-error"),
                            Gs.$(this).addClass("gs__input-error"))
                    });
                    Gs.$(document).find('form[action*="/cart/add"]').find("#gsDatepickerRow [required], #gsMessageContainer [required]").each(function() {
                        var b = Gs.$(this)
                            , d = b.val()
                            , e = !0;
                        "" === Gs.$.trim(d) && (e = !1);
                        !1 === e && (a = !1,
                            b.addClass("gs__input-error"),
                        Gs.$(this).is(":visible") || Gs.$(this).closest(".gs__toggle-feature-item").removeClass("gs__collapsed"))
                    });
                    Gs.$(document).find(".gs__app-container [required]").length || (a = !0);
                    return a
                },
                handleSubmit: function(a) {
                    Gs.productPage.actions.handleHiddenInputs();
                    if (!1 === Gs.productPage.actions.validateForm())
                        return Gs.f.stopEvent(a),
                            setTimeout(function() {
                                alert(Gs.trans.multishipping.please_complete_required)
                            }, 50),
                            !1;
                    if (!1 === Gs.state.upsell_handled)
                        return Gs.state.upsell_handled = !0,
                            Gs.f.stopEvent(a),
                            Gs.productUpsell.actions.showUpsell(),
                            !1;
                    if (!1 === Gs.state.bundle_handled)
                        return Gs.state.bundle_handled = !0,
                            Gs.f.stopEvent(a),
                            Gs.bundles.actions.generateBundleProduct(),
                            !1;
                    !0 === Gs.state.buy_it_now_active ? Gs.productPage.actions.handleBuyItNow() : Gs.productPage.actions.triggerSubmit()
                },
                handleInitialState: function() {
                    Gs.options.upsell && Gs.options.upsell.product_upsell_enable && meta && meta.product && meta.product.id && null !== Gs.settings._modalHtml && null !== Gs.settings._modalHtml || (Gs.state.upsell_handled = !0);
                    Gs.options.product_options && 1 === Gs.options.product_options.enable && Gs.options.product_options.bundle_type && "created_product" === Gs.options.product_options.bundle_type && Gs.$('[name*="properties[_gs_bundle_ids]').length || (Gs.state.bundle_handled = !0)
                },
                handleHiddenInputs: function() {
                    Gs.$(".gs__app-container").find("input, textarea, select").each(function() {
                        var a = Gs.$(this);
                        if (a.is(":visible"))
                            return !0;
                        a.removeAttr("required").removeClass("required");
                        a.is("select") ? a.find("option").removeAttr("selected") : a.is('[type="radio"]') || a.is('[type="checkbox"]') ? a.removeAttr("checked") : a.is("textarea") ? a.val("").html("") : a.is('input:not([type="hidden"])') && a.val("")
                    })
                }
            }
        },
        drawer: {
            init: function() {
                console.warn("Initializing Giftship in Drawer Cart");
                Gs.state.page_type = "cart";
                Gs.drawerCart = !0;
                Gs.elements.addToCartBtn = Gs.$(document).find('form[action*="/cart/add"] button[type="submit"], form[action*="/cart/add"] input[type="submit"], form[action*="/cart/add"] .gs__add-to-cart');
                Gs.elements.checkoutBtn = Gs.$(document).find(Gs.selectors.checkoutBtn);
                Promise.all([Gs._.loadCSS(), Gs._.loadSettings()]).then(function(a) {
                    a = a[1];
                    "object" != typeof a && (a = JSON.parse(a));
                    Gs._.applySettings(a);
                    if (!Gs.options.enabled)
                        return console.warn("Giftship is disabled. Please enable this in the application settings."),
                            !1;
                    Gs.shop.money_format && (GIST.money_format = Gs.shop.money_format);
                    Gs.cartPage.init();
                    Gs.global.init();
                    "function" == typeof GsLoaded && GsLoaded(Gs)
                })["catch"](function(a) {
                    console.error(a)
                })
            }
        },
        oneClickUpsell: {
            init: function() {
                Gs.oneClickUpsell.actions.adjustLightBox();
                if (!Gs.options.upsell.one_click_upsell_enable)
                    return !1;
                Gs.oneClickUpsell.actions.handleCart()
            },
            actions: {
                adjustLightBox: function() {
                    Gs.$("#gsAppContainer .gs__lightbox").each(function() {
                        var a = Gs.$(this).detach();
                        Gs.$("body").append(a)
                    })
                },
                handleCart: function() {
                    Gs.$(".gs__oneclick-add-variant").length && Gs.getCart(function(a) {
                        Gs.$(".gs__oneclick-add-variant").each(function() {
                            var b = Gs.$(this);
                            !0 === Gs.oneClickUpsell.actions.checkInCart(a, b) ? b.attr("checked", "checked").prop("checked", !0) : b.removeAttr("checked").prop("checked", !1)
                        })
                    })
                },
                checkInCart: function(a, b) {
                    var c = !1;
                    Gs.$.each(a.items, function(a, e) {
                        if (parseInt(b.val()) !== e.variant_id)
                            return !0;
                        Gs.$('.gs__oneclick-add-variant[value="' + e.variant_id + '"]').length && (c = !0)
                    });
                    return c
                }
            }
        },
        productUpsell: {
            init: function() {
                if ("product" !== Gs.state.page_type)
                    return !1;
                Gs.productUpsell.actions.insertUpsellModal();
                Gs.productUpsell.events()
            },
            events: function() {
                Gs.$(document).on("click", ".gs__add-products", function() {
                    Gs.$(".gs__m, .gs__m-bg").removeClass("gs__m-open");
                    Gs.$("body").removeClass("gs__modal-open");
                    Gs.productPage.actions.handleSubmit(null)
                });
                Gs.$(document).on("click", '.gs__product-add-form button[type="submit"]', function(a) {
                    a.preventDefault();
                    Gs.productUpsell.actions.submitAddOn(Gs.$(this))
                })
            },
            actions: {
                insertUpsellModal: function() {
                    Gs.$("body").append(Gs.settings._modalHtml)
                },
                submitAddOn: function(a) {
                    var b = Gs.$('<div class="gs__loader"></div>')
                        , c = a.closest(".gs__product-add-form").find("input").first().val()
                        , d = a.closest(".gs__product-select-box").find("[data-gsmoney]").attr("data-gsmoney")
                        , e = {
                        quantity: 1,
                        id: c
                    };
                    a.html("&nbsp;");
                    b.appendTo(a);
                    Gs.state.upsell_submitting = !0;
                    Gs.$.ajax({
                        url: "/cart/add.js",
                        data: e,
                        type: "POST",
                        dataType: "json",
                        cache: !1,
                        success: function(b) {
                            var e = a.attr("class");
                            b = Gs.token.get();
                            a.html("Added!");
                            setTimeout(function() {
                                a.hide();
                                a.after('<a class="gs__remove-variant ' + e + '" data-id="' + c + '">Remove</a>')
                            }, 600);
                            GIST.analytics.client.send({
                                name: "feature_used",
                                value: "popup_upsell",
                                meta: {
                                    shop: Gs.shop.id,
                                    variant: c,
                                    potential_value: d,
                                    gistToken: b
                                }
                            })
                        },
                        error: function(b, c, d) {
                            console.log(b);
                            a.html("Error adding")
                        },
                        complete: function() {
                            setTimeout(function() {
                                Gs.state.upsell_submitting = !1
                            }, 500)
                        }
                    })
                },
                showUpsell: function() {
                    Gs.$(document).find(".gs__u-modal").addClass("gs__m-open").show();
                    Gs.$(document).find(".gs__m-bg").addClass("gs__m-open").show();
                    Gs.$("body").addClass("gs__modal-open");
                    GIST.analytics.client.send({
                        name: "feature_shown",
                        value: "popup_upsell",
                        meta: {
                            shop: Gs.shop.id
                        }
                    })
                }
            }
        },
        datepicker: {
            init: function() {
                if (!Gs.$('[data-child-type="datepicker"]').length && (!Gs.options.datepicker || Gs.options.datepicker && !Gs.options.datepicker.enable))
                    return !1;
                Gs.datepicker.actions.loadFlatpicker().then(function() {
                    Gs.$(".gs__delivery-date").each(function(a, b) {
                        var c = Gs.$(this).closest(".gs__product-option")
                            , d = Gs.$.extend(!0, {}, Gs.options.datepicker);
                        c.length && (c = c.data("config"),
                            d = Gs.$.extend(!0, d, c));
                        d = Gs.datepicker.actions.getConfig(d);
                        Gs.$(".gs__delivery-date")[a].flatpickr(d)
                    })
                });
                Gs.$(".gs__delivery-date").length && GIST.analytics.client.send({
                    name: "feature_shown",
                    value: "datepicker",
                    meta: {
                        shop: Gs.shop.id
                    }
                })
            },
            actions: {
                loadFlatpicker: function() {
                    return new Promise(function(a, b) {
                            Gs.$("head").append('<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">');
                            GIST.f._loadScript("https://cdn.jsdelivr.net/npm/flatpickr", function() {
                                if (Shopify.locale && "en" !== Shopify.locale && "default" !== Shopify.locale) {
                                    var b = Shopify.locale;
                                    Shopify.locale.includes("-") && (b = Shopify.locale.split("-")[0]);
                                    GIST.f._loadScript("https://cdn.jsdelivr.net/npm/flatpickr@4.5.7/dist/l10n/" + b + ".js", function() {
                                        a()
                                    })
                                } else
                                    a()
                            })
                        }
                    )
                },
                getLeadTime: function(a) {
                    var b = new Date
                        , c = parseInt(Gs.shop.timezone.split(" ")[0].replace(/[^0-9:-]/g, ""))
                        , d = a.disabled_dates;
                    a.timezone && (c = parseInt(a.timezone));
                    var b = b.getTime() + 6E4 * b.getTimezoneOffset() + 36E5 * c
                        , c = new Date(b)
                        , e = 0;
                    0 > c.gs_dst() && (e = c.gs_dst() / 60 * -1);
                    var f = parseInt(a.lead_time)
                        , h = (a.cutoff_time || "24:00").split(":")
                        , k = parseInt(h[0])
                        , h = parseInt(h[1])
                        , k = 60 * k + h
                        , e = (new Date(c)).getHours() + e
                        , h = (new Date(c)).getMinutes()
                        , e = 60 * e + h
                        , c = (new Date(c)).getDay();
                    if ("" === a.lead_time || !a.lead_time || isNaN(f))
                        f = 0;
                    "customer_time" === a.cutoff_time_type && (e = (new Date).getHours(),
                        h = (new Date).getMinutes(),
                        e = 60 * e + h,
                        c = (new Date).getDay());
                    -1 < Gs.$.inArray(c + "", a.disallowed_days) && a.add_disallowed_to_lead ? f++ : e >= k && f++;
                    if (a.add_disallowed_to_lead) {
                        k = new Date(b);
                        k = new Date(k.setDate(k.getDate() + f));
                        e = new Date(b);
                        e.setDate(e.getDate() + (14 - e.getDay()) % 7);
                        h = new Date(b);
                        h.setDate(h.getDate() + (8 - h.getDay()) % 7);
                        var l = new Date(b);
                        l.setDate(l.getDate() + (9 - l.getDay()) % 7);
                        var n = new Date(b);
                        n.setDate(n.getDate() + (10 - n.getDay()) % 7);
                        var p = new Date(b);
                        p.setDate(p.getDate() + (11 - p.getDay()) % 7);
                        var q = new Date(b);
                        q.setDate(q.getDate() + (12 - q.getDay()) % 7);
                        var r = new Date(b);
                        r.setDate(r.getDate() + (13 - r.getDay()) % 7);
                        var m = [];
                        -1 < Gs.$.inArray("0", a.disallowed_days) && e.getTime() <= k.getTime() && c != e.getDay() && (m.push(e),
                            f++);
                        -1 < Gs.$.inArray("1", a.disallowed_days) && h.getTime() <= k.getTime() && c != h.getDay() && (m.push(h),
                            f++);
                        -1 < Gs.$.inArray("2", a.disallowed_days) && l.getTime() <= k.getTime() && c != l.getDay() && (m.push(l),
                            f++);
                        -1 < Gs.$.inArray("3", a.disallowed_days) && n.getTime() <= k.getTime() && c != n.getDay() && (m.push(n),
                            f++);
                        -1 < Gs.$.inArray("4", a.disallowed_days) && p.getTime() <= k.getTime() && c != p.getDay() && (m.push(p),
                            f++);
                        -1 < Gs.$.inArray("5", a.disallowed_days) && q.getTime() <= k.getTime() && c != q.getDay() && (m.push(q),
                            f++);
                        -1 < Gs.$.inArray("6", a.disallowed_days) && r.getTime() <= k.getTime() && c != r.getDay() && (m.push(r),
                            f++);
                        if (Gs.$.isArray(d)) {
                            var u = new Date(b)
                                , t = new Date(b)
                                , t = new Date(t.setDate(t.getDate() + f));
                            Gs.$.each(d, function(a, b) {
                                var c = new Date(b)
                                    , d = c.getDay()
                                    , e = c.getMonth()
                                    , h = c.getYear()
                                    , k = !1;
                                Gs.$.each(m, function(a, b) {
                                    var c = b.getDay()
                                        , f = b.getMonth()
                                        , l = b.getYear();
                                    if (c === d && f === e && l === h)
                                        return k = !0,
                                            !1
                                });
                                if (!0 === k)
                                    return !0;
                                c = c.getTime();
                                c > u.getTime() && c < t.getTime() && f++
                            })
                        }
                    }
                    a = new Date(b);
                    a = new Date(a.setDate(a.getDate() + f));
                    return Gs.f.formatDate(a)
                },
                getConfig: function(a) {
                    var b = a.disabled_dates
                        , c = [];
                    Gs.$.isArray(b) && (c = Gs.$.map(b, function(a, b) {
                        return Gs.f.toISODate(a)
                    }));
                    var b = {
                        minDate: "today"
                    }
                        , d = !1
                        , e = !1
                        , f = new Date;
                    a.max_date && (d = new Date(a.max_date));
                    a.max_days && (e = new Date(f),
                        e.setDate(e.getDate() + parseInt(a.max_days)));
                    d && e && d.getTime() < e.getTime() ? b.maxDate = Gs.f.formatDate(d) : d && e && e.getTime() < d.getTime() ? b.maxDate = Gs.f.formatDate(e) : !1 !== d ? b.maxDate = Gs.f.formatDate(d) : !1 !== e && (b.maxDate = Gs.f.formatDate(e));
                    b.minDate = Gs.datepicker.actions.getLeadTime(a);
                    a.date_format && (b.dateFormat = a.date_format);
                    b.enableTime = a.enable_time ? !0 : !1;
                    b.onReady = function() {}
                    ;
                    b.onChange = function(a, b, c) {
                        Gs.$(c.element).attr("name").includes("attributes") && Gs.cartPage.actions.updateAttributes();
                        GIST.analytics.client.send({
                            name: "feature_used",
                            value: "datepicker",
                            meta: {
                                shop: Gs.shop.id
                            }
                        })
                    }
                    ;
                    b.ariaDateFormat = "Y-n-j";
                    b.onDayCreate = function(b, d, e, f) {
                        b = Gs.$(f);
                        b.addClass("needsclick");
                        a.disabled_dates && (d = b.attr("aria-label"),
                        void 0 !== d && (-1 < Gs.$.inArray(d, a.disabled_dates) || -1 < Gs.$.inArray(d, c)) && b.addClass("disabled").addClass("flatpickr-disabled"))
                    }
                    ;
                    b.onMonthChange = function(a, b, c) {}
                    ;
                    b.disableMobile = !0;
                    a.disallowed_days && (b.disable = [function(b) {
                        value = !1;
                        -1 < Gs.$.inArray(b.getDay().toString(), a.disallowed_days) && (value = !0);
                        return value
                    }
                    ]);
                    Shopify.locale.includes("en") || "default" === Shopify.locale || (d = Shopify.locale,
                    Shopify.locale.includes("-") && (d = Shopify.locale.split("-")[0]),
                        b.locale = d);
                    return b
                }
            }
        },
        productOptions: {
            init: function() {
                Gs.productOptions.checkConditions()
            },
            calculateTotal: function() {
                var a = Gs.$("[data-giftship-bundle-total]")
                    , b = Gs.$("[data-child-option-price], [data-bundle-cents]")
                    , c = a.data("giftship-bundle-total");
                a.length && b.length && (Gs.$(b).each(function() {
                    var a = Gs.$(this);
                    a.is("option") && a.is(":selected") && (c += a.data("bundle-cents"));
                    (a.is('[type="checkbox"]') || a.is('[type="radio"]')) && a.is(":checked") && (c += a.data("bundle-cents"))
                }),
                    a.html(GIST.f.formatMoney(c, GIST.money_format)))
            },
            checkConditions: function() {
                var a = Gs.$(".gs__product-option");
                Gs.$(this).parents(".gs__product-option").find(".gs__input-error").removeClass("gs__input-error");
                a.each(function() {
                    var a = Gs.$(this).data("conditions")
                        , c = a.display_rule_type || "always"
                        , a = a.display_rules || []
                        , d = !1;
                    if ("always" === c || 0 === a.length)
                        return Gs.$(this).removeClass("gs__hidden-option"),
                            !0;
                    window.GIST.app_debug && !0 === window.GIST.app_debug && console.log("** Display rules ** ", a);
                    "any" === c ? Gs.$.each(a, function(a, b) {
                        if (!b || null == b)
                            return !0;
                        b.element = b.element || "";
                        var c = Gs.$('[data-child-name="' + b.element + '"]').find("input, select, textarea")
                            , e = !1;
                        c.is('[type="radio"]') && (c = Gs.$('[data-child-name="' + b.element + '"] input[type="radio"]:checked'));
                        if (!c.length)
                            return !0;
                        c.is('[type="checkbox"]:not([data-checkbox-type="radio"])') && !c.is(":checked") ? c = !1 : c.is('[type="radio"]') && !c.is(":checked") ? c = !1 : c.is('[type="checkbox"]') && Gs.$('[data-child-name="' + b.element + '"]').find("input:checked").length ? (c = Gs.$('[data-child-name="' + b.element + '"]').find("input:checked").val(),
                            e = Gs.$('[data-child-name="' + b.element + '"]').find("input:checked").closest("label").text().trim()) : c.is('[type="radio"]') ? (c = Gs.$('[data-child-name="' + b.element + '"]').find("input:checked").val(),
                            e = Gs.$('[data-child-name="' + b.element + '"]').find("input:checked").closest("label").text().trim()) : c = c.val();
                        switch (b.condition) {
                            case "IS_SET":
                                "undefined" != typeof c && "" !== c && !1 !== c && (d = !0);
                                break;
                            case "IS_NOT_SET":
                                if ("undefined" == typeof c || "" === c || null === c || 0 == c)
                                    d = !0;
                                break;
                            case "EQUALS":
                                if ("undefined" !== typeof c && c === b.value || !1 !== e && e === b.value)
                                    d = !0;
                                break;
                            case "NOT_EQUALS":
                                if (c !== b.value || e !== b.value)
                                    d = !0;
                                break;
                            case "CONTAINS":
                                if ("undefined" !== typeof c && !1 !== c && c.includes(b.value) || !1 !== e && e.includes(b.value))
                                    d = !0;
                                break;
                            case "NOT_CONTAINS":
                                if (!c.includes(b.value) || !1 !== e && !e.includes(b.value))
                                    d = !0;
                                break;
                            case "GREATER_THAN":
                                Gs.$.isNumeric(c) && c > b.value && (d = !0);
                                break;
                            case "LESS_THAN":
                                Gs.$.isNumeric(c) && c < b.value && (d = !0)
                        }
                        window.GIST.app_debug && !0 === window.GIST.app_debug && (console.log("** Rule Logic Start ** ", b.condition),
                            console.log("Value", c),
                            console.log("Text", e),
                            console.log("Display", d),
                            console.log("** Rule Logic End ** ", b.condition));
                        if (!0 === d)
                            return !1
                    }) : "all" === c && (d = !0,
                        Gs.$.each(a, function(a, b) {
                            if (!b || null == b)
                                return !0;
                            b.element = b.element || "";
                            var c = Gs.$('[data-child-name="' + b.element + '"]').find("input, select, textarea")
                                , e = !1;
                            if (!c.length)
                                return d = !1;
                            c.is('[type="checkbox"]') && !c.is(":checked") ? c = !1 : c.is('[type="radio"]') && !c.is(":checked") ? c = !1 : c.is('[type="checkbox"]') && Gs.$('[data-child-name="' + b.element + '"]').find("input:checked").length ? (c = Gs.$('[data-child-name="' + b.element + '"]').find("input:checked").val(),
                                e = Gs.$('[data-child-name="' + b.element + '"]').find("input:checked").closest("label").text().trim()) : c.is('[type="radio"]') ? (c = Gs.$('[data-child-name="' + b.element + '"]').find("input:checked").val(),
                                e = Gs.$('[data-child-name="' + b.element + '"]').find("input:checked").closest("label").text().trim()) : c = c.val();
                            switch (b.condition) {
                                case "IS_SET":
                                    if ("" === c || !1 === c)
                                        d = !1;
                                    break;
                                case "IS_NOT_SET":
                                    "" !== c && null !== c && !1 !== c && (d = !1);
                                    break;
                                case "EQUALS":
                                    c !== b.value && e !== b.value && (d = !1);
                                    break;
                                case "NOT_EQUALS":
                                    c !== b.value && e !== b.value && (d = !1);
                                    break;
                                case "CONTAINS":
                                    if ("undefined" == typeof c || !1 === c || !c.includes(b.value) && !e.includes(b.value))
                                        d = !1;
                                    break;
                                case "NOT_CONTAINS":
                                    !1 !== c && c.includes(b.value) && e.includes(b.value) && (d = !1);
                                    break;
                                case "GREATER_THAN":
                                    if (!Gs.$.isNumeric(c) || c <= b.value)
                                        d = !1;
                                    break;
                                case "LESS_THAN":
                                    if (!Gs.$.isNumeric(c) || c >= b.value)
                                        d = !1
                            }
                            window.GIST.app_debug && !0 === window.GIST.app_debug && (console.log("** Rule Logic Start ** ", b.condition),
                                console.log("Value", c),
                                console.log("Text", e),
                                console.log("Display", d),
                                console.log("** Rule Logic End ** ", b.condition))
                        }));
                    !0 === d ? (Gs.productOptions._repopulateValues(Gs.$(this)),
                        Gs.$(this).removeClass("gs__hidden-option")) : (Gs.productOptions._saveValues(Gs.$(this)),
                        Gs.$(this).addClass("gs__hidden-option"),
                        Gs.$(this).find('[type="checkbox"], [type="radio"]').removeAttr("checked").prop("checked", !1),
                        Gs.$(this).find("option:selected").removeAttr("selected").prop("selected", !1),
                        Gs.$(this).find('[type="email"], [type="number"], [type="text"], [type="tel"], textarea').val(""));
                    Gs.productOptions._bundleInputs()
                });
                Gs.global.actions.resizeOptions()
            },
            _inputType: function(a) {
                var b = a.attr("type");
                a.is("select") ? b = "select" : a.is("textarea") && (b = "textarea");
                return b
            },
            _repopulateValues: function(a) {
                a.find(".gs__product-element");
                var b = a.data("values");
                a.hasClass("gs__hidden-option") && "undefined" != typeof b && 0 != b.length && Gs.$.each(b, function(b, d) {
                    if ("undefined" != typeof d && !Gs.$.isEmptyObject(d) && d.value && "" != d.value) {
                        var c = d.type
                            , f = d.value
                            , h = d.name;
                        "email" !== c && "tel" !== c && "text" !== c && "number" !== c || a.find('input[name="' + h + '"]').val(f);
                        "textarea" === c && a.find('textarea[name="' + h + '"]').val(f);
                        "checkbox" !== c && "radio" !== c || a.find('input[name="' + h + '"][value="' + f + '"]').attr("checked", "checked").prop("checked", !0);
                        "select" === c && a.find('select[name="' + h + '"] option[value="' + f + '"]').attr("selected", "selected").prop("selected", !0)
                    }
                })
            },
            _saveValues: function(a) {
                var b = a.find(".gs__product-element")
                    , c = [];
                b.length && !a.hasClass("gs__hidden-option") && (b.each(function() {
                    var a = {}
                        , b = Gs.$(this)
                        , f = Gs.productOptions._inputType(b)
                        , h = b.val()
                        , k = b.attr("name");
                    if ("email" === f || "tel" === f || "text" === f || "number" === f || "textarea" === f)
                        a.name = k,
                            a.type = f,
                            a.value = h;
                    if ("checkbox" === f && b.is(":checked") || "radio" === f && b.is(":checked"))
                        a.name = k,
                            a.type = f,
                            a.value = h;
                    "select" === f && (a.name = k,
                        a.type = f,
                        a.value = b.find("option:selected").attr("value"));
                    Gs.$.isEmptyObject(a) || c.push(a)
                }),
                    a.data("values", c).attr("data-values", JSON.stringify(c)))
            },
            handleRadioChange: function(a) {
                a.closest("fieldset").find('.gs__product-element[type="checkbox"]').each(function() {
                    Gs.$(this).is(a) || Gs.$(this).removeAttr("checked").prop("checked", !1)
                })
            },
            _convertIdInput: function() {
                var a = Gs.$(this).attr("id")
                    , a = Gs.$("." + a);
                Gs.$('input[name="id"], select[name="id"]').length && Gs.$('input[name="id"], select[name="id"]').attr("name", "id[]");
                Gs.$(this).is(":checked") ? a.attr("disabled", "").prop("disabled", !1) : a.attr("disabled", "disabled").prop("disabled", !0)
            },
            _bundleInputs: function() {
                var a = Gs.$("#gsBundlePrices");
                a.empty();
                Gs.$("[data-bundle-cents]:checked, [data-bundle-cents]:selected").each(function() {
                    var b = Gs.$(this).data("bundle-cents")
                        , c = Gs.$(this).data("child-option-name")
                        , b = Gs.$('<input type="hidden" name="properties[_gs_bundle_prices][]" value="' + b + '" />')
                        , c = Gs.$('<input type="hidden" name="properties[_gs_bundle_contents][]" value="' + c + '" />');
                    a.append(b);
                    a.append(c)
                })
            }
        },
        bundles: {
            errors: [],
            handleErrors: function() {
                if (0 < Gs.bundles.errors.length) {
                    var a = Gs.$.map(Gs.bundles.errors, function(a, c) {
                        return a + "\n"
                    });
                    console.warn(a);
                    return a
                }
            },
            validateResponse: function(a) {
                "undefined" == typeof a || "undefined" == typeof a.responseJSON || "undefined" == typeof a.responseJSON.status ? console.warn("An issue occured when adding a bundle item to the cart") : 200 !== a.status && a.responseJSON && a.responseJSON.description && a.responseJSON.description.includes("is already sold out") && Gs.bundles.errors.push(a.responseJSON.description)
            },
            actions: {
                addBundles: function() {
                    Gs.getCart(function(a) {
                        Gs.bundles.actions.buildBundles(a);
                        Gs.bundles.actions.addItems(GIST.bundles).then(Gs.bundles.actions.submitCheckout)["catch"](function(a, c, d) {
                            console.warn("There was an error adding bundled items to the cart. Trying to add individually");
                            console.log(a);
                            Gs.bundles.actions.addItemsAsync(GIST.bundles)
                        })
                    }, function() {
                        Gs.bundles.actions.submitCheckout()
                    })
                },
                buildQuery: function() {
                    var a = [];
                    Gs.$.each(GIST.bundles, function(b, c) {
                        c.properties = {};
                        c.properties[Gs.trans.upsell.added_to_text] = c.product_name;
                        c.properties._gs_bundle_item = !0;
                        a.push({
                            quantity: c.quantity,
                            id: c.variant_id,
                            properties: c.properties
                        })
                    });
                    return {
                        items: a
                    }
                },
                addItems: function() {
                    return new Promise(function(a, b) {
                            var c = Gs.bundles.actions.buildQuery();
                            Gs.$.ajax({
                                url: "/cart/add.js",
                                data: c,
                                dataType: "json"
                            }).done(a).fail(b)
                        }
                    )
                },
                addItemsAsync: function(a) {
                    if (!a.length)
                        return Gs.bundles.actions.submitCheckout(),
                            !1;
                    var b = a.shift();
                    b.properties = {};
                    b.properties[Gs.trans.upsell.added_to_text] = b.product_name;
                    b.properties._gs_bundle_item = !0;
                    GIST.bundlesAdded = !1;
                    Gs._addVariant(b.variant_id, b.quantity, b.properties, !1, function(b) {
                        Gs.bundles.validateResponse(b);
                        Gs.bundles.actions.addItemsAsync(a)
                    })
                },
                submitCheckout: function() {
                    GIST.bundlesAdded = !0;
                    Gs.bundles.handleErrors();
                    console.info("Submitting checkout with dynamic submit target", Gs.state.dynamic_cart_target);
                    console.info("Submitting checkout with standard submit target", Gs.elements.checkoutBtn);
                    null !== Gs.state.dynamic_cart_target ? (Gs.state.dynamic_cart_handled = !0,
                        Gs.state.dynamic_cart_target.click()) : Gs.elements.checkoutBtn.click()
                },
                buildBundles: function(a) {
                    GIST.bundles = [];
                    Gs.settings && Gs.settings.app_plan && 10 < Gs.settings.app_plan && Gs.$.each(a.items, function(a, c) {
                        var b = c.properties || {};
                        if (!Gs.$.isArray(b._gs_bundle_ids))
                            return !0;
                        Gs.$.each(b._gs_bundle_ids, function(a, d) {
                            if (!c.product_title || !d || !c.quantity)
                                return !0;
                            var e = c.quantity;
                            b._gs_bundle_quantities && "undefined" != typeof b._gs_bundle_quantities[a] && (e = parseInt(b._gs_bundle_quantities[a]) * c.quantity);
                            GIST.bundles.push({
                                variant_id: d,
                                quantity: e,
                                product_name: c.product_title
                            })
                        })
                    })
                },
                getBundleIds: function() {
                    var a = [];
                    Gs.$('[name="properties[_gs_bundle_ids][]"]:checked, select[name="properties[_gs_bundle_ids][]"] option:selected').each(function() {
                        "" !== Gs.$.trim(this.value) && Gs.$.isNumeric(this.value) && a.push(this.value)
                    });
                    return a
                },
                buildRequest: function(a) {
                    var b = a.val()
                        , c = Gs.bundles.actions.getBundleIds();
                    a.is("select") && "undefined" == typeof id && (b = a.find("option:selected").val());
                    return {
                        parentVariantId: b,
                        bundleVariantIds: c,
                        myshopify_url: Shopify.shop
                    }
                },
                bundleProductCallback: function(a, b) {
                    if (a.error || a.status && "error" === a.status)
                        return console.warn("There was an error creating the bundled product"),
                            Gs.productPage.actions.handleSubmit(null),
                            !1;
                    a.variants && a.variants[0] && a.variants[0].id && (b.after('<input type="hidden" name="id" value="' + a.variants[0].id + '">'),
                        b.remove());
                    Gs.productPage.actions.handleSubmit(null)
                },
                generateBundleProduct: function() {
                    var a = Gs.$('[name="id[]"], [name="id"]').first()
                        , b = Gs.bundles.actions.buildRequest(a);
                    b.bundleVariantIds.length && Gs.$.isNumeric(b.parentVariantId) || Gs.productPage.actions.handleSubmit(null);
                    Gs.$.ajax({
                        url: "/a/gs/bundles/generate/",
                        data: b,
                        type: "POST",
                        dataType: "json",
                        cache: !1,
                        success: function(b) {
                            Gs.bundles.actions.handleCallback(b, a)
                        },
                        error: function(a) {
                            console.log(a);
                            Gs.productPage.actions.handleSubmit(null)
                        }
                    })
                }
            }
        },
        translations: {
            init: function() {
                Gs.$("[data-gs-trans]").each(Gs.translations.translate)
            },
            translate: function() {
                var a = Gs.$(this).data("gs-trans");
                if ("undefined" == typeof a || 0 > a.indexOf("."))
                    return !1;
                a = a.split(".");
                a = Gs.trans[a[0]][a[1]];
                Gs.$(this).text(a)
            }
        },
        token: {
            init: function() {
                Gs.token.check()
            },
            get: function() {
                var a = GIST.cookie.read("gistToken");
                null === a && (a = Gs.token.write());
                return a
            },
            write: function() {
                var a = GIST.cookie.read("cart");
                GIST.cookie.create("gistToken", a, 14);
                return GIST.cookie.read("gistToken")
            },
            check: function() {
                var a = Gs.token.get();
                Gs.getCart(function(b) {
                    0 === b.item_count && b.token !== a ? Gs.token.persist(b) : b.attributes.gistToken ? b.attributes.gistToken && "null" === b.attributes.gistToken && Gs.token.persist(b) : Gs.token.persist(b)
                })
            },
            persist: function(a) {
                a = a.attributes || {};
                var b = Gs.token.get();
                null !== b && a.gistToken === b || "null" === b || (a.gistToken = b,
                Gs.$.isEmptyObject(a) || "undefined" != typeof GIST && !0 === GIST.disable_token || Gs.$.ajax({
                    type: "POST",
                    url: "/cart/update.js",
                    data: {
                        attributes: a
                    },
                    dataType: "json",
                    success: function(a) {
                        Gs.token.write()
                    },
                    error: function(a, b, e) {
                        console.log(a)
                    },
                    cache: !1
                }))
            }
        },
        getCart: function(a, b) {
            Gs.$.ajax({
                url: "/cart.js",
                type: "GET",
                dataType: "json",
                success: function(b) {
                    a(b)
                },
                error: function(a, d, e) {
                    "function" == typeof b && b()
                },
                cache: !1
            })
        },
        changeLine: function(a, b, c) {
            var d = a.ln
                , e = a.lp;
            a = a.quantity;
            Gs.$(".gs__line-error").fadeOut(400);
            setTimeout(function() {
                Gs.$(".gs__line-error").remove()
            }, 400);
            a = parseInt(a);
            var f = Gs.f.randProp();
            data = {
                line: d,
                properties: e,
                quantity: a
            };
            if ("undefined" == e || !e || Gs.$.isEmptyObject(e))
                e = {
                    " ": ""
                },
                    data.properties = e;
            Gs.$.ajax({
                url: "/cart/change.js?_rand=" + f,
                data: data,
                dataType: "json",
                type: "POST",
                success: function(a) {
                    b(a)
                },
                error: function(a, b, d) {
                    console.log(a);
                    "function" == typeof c && c()
                },
                cache: !1
            })
        },
        removeShipProps: function(a) {
            for (var b, c, d = [], e = 0; e < a.items.length; e++) {
                b = a.items[e].properties || {};
                c = e + 1;
                var f = !1;
                if (b && !1 === Gs.$.isEmptyObject(b)) {
                    var h = a.items[e].quantity, k = Gs.$('.gs__line[data-line="' + (e + 1) + '"]'), l;
                    for (l in b)
                        if (" " !== l && b.hasOwnProperty(l))
                            if (0 <= l.indexOf("empty") || 0 <= l.indexOf("National Tax") || "Shipping" === l || l === Gs.trans.global.shipping_text || "Ships With" === l || 0 <= l.indexOf("Regional Tax") || "Address" === l || l === Gs.trans.multishipping.address_label_text || "_gs_master_reference" === l || "_gs_master_key" === l || "_gs_r" === l || "_gs_a" === l)
                                delete b[l],
                                    f = !0;
                            else if ("" === l || void 0 === l || null === l)
                                delete b[l],
                                    f = !0;
                    b = {
                        ln: c,
                        quantity: h,
                        lp: b,
                        item: a.items[e],
                        line_item: k
                    };
                    !0 === f && d.push(b)
                }
            }
            if (!d)
                return Gs.global.actions.clearAttributes(a),
                    !1;
            var n = function() {
                if (!d.length)
                    return Gs._reloadPage(),
                        Gs.global.actions.clearAttributes(a),
                        !1;
                var b = d.shift();
                Gs.changeLine(b, function(a) {
                    n()
                }, function() {
                    Gs.getCart(function(a) {
                        Gs.removeShipProps(a)
                    })
                })
            };
            d.length && n()
        },
        _addVariant: function(a, b, c, d, e) {
            Gs.$.ajax({
                url: "/cart/add.js",
                data: {
                    quantity: b,
                    id: a,
                    properties: c
                },
                type: "POST",
                dataType: "json",
                cache: !1,
                success: function(a) {
                    !0 === d && (Gs.options.upsell && Gs.options.upsell.ajax_reload ? Gs._reloadPage() : location.reload());
                    "function" == typeof e && e(a)
                },
                error: function(a, b, c) {
                    console.log(a);
                    "function" == typeof e && e(a)
                }
            })
        },
        _removeVariant: function(a, b) {
            Gs.getCart(function(c) {
                var d;
                Gs.$.each(c.items, function(b, c) {
                    var e = c.properties || {};
                    if (c.variant_id === a || e._gs_variant === a)
                        d = b + 1
                });
                Gs.$.ajax({
                    url: "/cart/change.js",
                    data: {
                        quantity: 0,
                        line: d
                    },
                    type: "POST",
                    dataType: "json",
                    cache: !1,
                    success: function(a) {
                        !0 === b && (Gs.options.upsell && Gs.options.upsell.ajax_reload ? Gs._reloadPage() : location.reload())
                    },
                    error: function(a) {},
                    complete: function() {}
                })
            })
        },
        _reloadPage: function() {
            Gs.$.ajax({
                type: "GET",
                url: "/cart",
                dataType: "html",
                cache: !1,
                success: function(a) {
                    a = Gs.$(a).find('form[action="/cart"], form[action="/cart/"]').html();
                    var b = Gs.$('form[action="/cart"], form[action="/cart/"], form[action="/checkout"], form[action="/checkout/"]').last()
                        , c = Gs.$(document).find("#gsAppContainer").html();
                    "function" == typeof GsReloadCart ? GsReloadCart(function() {
                        Gs.initialize(Gs.$, !0);
                        Gs.$("#gsAppContainer").html(c);
                        "function" == typeof GsReloaded && GsReloaded(Gs)
                    }) : b.length && a.length ? (b.html(a),
                        Gs.initialize(Gs.$, !0),
                        Gs.$("#gsAppContainer").html(c),
                    "function" == typeof GsReloaded && GsReloaded(Gs)) : location.reload()
                },
                error: function(a) {
                    console.log(a)
                },
                complete: function(a) {}
            })
        },
        _checkJson: function(a) {
            try {
                var b = JSON.parse(a);
                if (b && "object" === typeof b && null !== b)
                    return !0
            } catch (c) {}
            return !1
        },
        _validateCart: function(a) {
            var b = !0;
            if ("cart" !== Gs.state.page_type)
                return b;
            Gs.$(document).find(".gs__app-container [required]").each(function() {
                if ("" === Gs.$(this).val()) {
                    var a = Gs.$(this).closest(".gs__toggle-feature-item");
                    Gs.$(".gs__gift-checkbox");
                    b = !1;
                    Gs.$(this).addClass("gs__input-error");
                    a.hasClass("gs__collapsed") && a.removeClass("gs__collapsed")
                }
            });
            return b
        },
        _maxChars: function(a) {
            if (!Gs.options.message.limit_characters || "" === Gs.options.message.max_characters)
                return !1;
            var b = Gs.options.message.max_characters;
            a = a.val().length;
            var c = Gs.$('label[for="message"], label[for="gsMessage"]');
            a >= b ? c.text("You have reached the maximum amount of characters") : c.text("You have " + (b - a) + " characters remaining")
        },
        _documentClick: function(a) {
            Gs.$(a.target).hasClass("flatpickr-calendar") || Gs.$(a.target).hasClass("flatpickr-input") || Gs.$("flatpickr-calendar").removeClass("open")
        },
        submitCart: function(a, b) {
            if (!1 === Gs._validateCart(a))
                return Gs.f.stopEvent(a),
                    alert(Gs.trans.multishipping.please_complete_required),
                    !1;
            if (!GIST._bundleCart || !0 !== GIST._bundleCart)
                return console.info("No bundles needed, proceeding to checkout"),
                    !0;
            if (!0 === GIST.bundlesAdded)
                return console.info("Bundles already added, proceeding to checkout"),
                    !0;
            if (Gs.options && Gs.options.product_options && Gs.options.product_options.bundle_type && "created_product" === Gs.options.product_options.bundle_type)
                return null !== Gs.state.dynamic_cart_target && (console.info("Bundle type is created product, and dynamic checkout is being handled"),
                    Gs.state.dynamic_cart_handled = !0,
                    Gs.state.dynamic_cart_target.click()),
                b.hasClass("gs__clone") && (console.info("Bundle type is created product, and clone checkout button is being handled"),
                    GIST.bundlesAdded = !0,
                    GIST._bundleCart = !1,
                    Gs.elements.checkoutBtn.click()),
                    !0;
            Gs.f.stopEvent(a);
            console.info("Starting to add bundle products");
            Gs.bundles.actions.addBundles()
        },
        _cloneCheckoutBtn: function() {
            if (Gs.$(".gs__clone").length)
                return !1;
            Gs.checkout_button_clone = Gs.elements.checkoutBtn.clone();
            Gs.checkout_button_clone.is('[type="submit"], button') && Gs.checkout_button_clone.attr("type", "button");
            Gs.checkout_button_clone.addClass("gs__submit-cart gs__clone").unbind().unbind("click").off().off("click");
            Gs.elements.checkoutBtn.hide();
            Gs.elements.checkoutBtn.before(Gs.checkout_button_clone);
            Gs.checkout_button_clone.on("click", function() {
                Gs.elements.checkoutBtn.unbind().unbind("click").off().off("click");
                Gs.submitCart(event, Gs.$(this))
            })
        },
        _createCookie: function(a, b, c) {
            GIST.cookie.create(a, b, c)
        },
        _readCookie: function(a) {
            return GIST.cookie.read(a)
        },
        _eraseCookie: function(a) {
            GIST.cookie.erase(a)
        },
        _loadSettings: function() {
            Gs._.loadSettings()
        },
        _loadCSS: function(a) {
            Gs._.loadCSS()
        },
        initializeDrawer: function() {
            Gs.drawer.init()
        },
        _insertError: function(a, b, c) {
            var d, e;
            b = Gs.$('.gs__line[data-line="' + (b + 1) + '"]');
            "shipping" === a && (d = '<p class="gs__line-error">' + Gs.trans.global.error_select_shipping_rate + "</p>",
                d = Gs.$(d),
                e = b.find(".gs__line-item-props"));
            "datepicker" === a && (d = '<p class="gs__line-error">' + Gs.trans.global.error_select_date + "</p>",
                d = Gs.$(d),
                e = b.find(".gs__line-item-props"));
            "message" === a && (d = '<p class="gs__line-error">' + Gs.trans.global.error_add_message + "</p>",
                d = Gs.$(d),
                e = b.find(".gs__line-item-props"));
            "shipping_modal" === a && (d = Gs.$('<p class="gs__line-error">' + c + "</p>"),
                e = Gs.$(".gs__shipping-rates"));
            "address" === a && (d = '<p class="gs__line-error">' + Gs.trans.global.error_select_shipping + "</p>",
                d = Gs.$(d),
                e = b.find(".gs__line-item-props"));
            "custom" === a && (d = Gs.$('<p class="gs__line-error">' + c + "</p>"),
                e = b.find(".gs__line-item-props"));
            "discount" === a && (d = Gs.$('<p class="gs__line-error">' + c + "</p>"),
                e = Gs.$(".gs__discount-content"));
            e.length ? (e.after(d),
            Gs.$(".gs__line-error").length || "discount" !== a && Gs.$("html, body").animate({
                scrollTop: e.position().top
            }, 1E3)) : (d = '<p class="gs__line-error">' + Gs.trans.multishipping.error_shipping + "</p>",
                d = Gs.$(d),
            Gs.$(".gs__line-error").length || "discount" !== a && Gs.$("html, body").animate({
                scrollTop: e.position().top
            }, 1E3),
                e = b.find(".gs__add-shipping-address"),
                e.after(d));
            return !1
        },
        _initDatepicker: function() {
            Gs.datepicker.init()
        },
        showMulti: function() {
            Gs.cartPage.actions.showMulti()
        },
        hideMulti: function() {
            Gs.cartPage.actions.hideMulti()
        }
    };
    window.Gs = Gs;
    GIST.f._loadJquery(!1, function(a) {
        Gs.$ = a;
        Gs.$.fn.changeElementType = function(b) {
            var c = {};
            Gs.$.each(this[0].attributes, function(a, b) {
                c[b.nodeName] = b.nodeValue
            });
            this.replaceWith(function() {
                return a("<" + b + "/>", c).append(a(this).contents())
            })
        }
        ;
        Gs.$(document).ready(function() {
            Gs.initialize(Gs.$, !1)
        })
    })
}
;
