(function ($) {
    const APP_API_URL = 'https://a2e4-103-203-132-170.ngrok.io/api/app/';
    const $cart = $('#cart');
    const $checkoutBtn = $('#checkout[form="cart"]');
    const STD_DELIVERY_FEE = 1000;
    let cartUpdateQueryData = {};

    const address = { // temporary
        zip: "445-0004",
        country: "Japan",
        province: "Kagoshima"
    };

    console.log('cart by ab-multiship');
    console.log($cart);

    $cart.prepend('<input type="checkbox" id="abms-cart-ship2multi" /> ' +
        '<label for="abms-cart-ship2multi">Ship to Multiple Addresses?</label>');

    loadShippingAddresses();

    // when "Ship to Multiple Addresses?" checkbox is checked
    $cart.on('change', '#abms-cart-ship2multi', function () {
        if ($(this).prop('checked')) {
            AB.multishipping = true;
            $checkoutBtn.attr('type', 'button');
            // when submit button is clicked
            $checkoutBtn.on('click', checkout);

            $('.abms-cart-address').show();
            $('.abms-cart-more-address').show();
            $cart.find('.cart-item__quantity-wrapper').hide();

            if ($.isEmptyObject(AB.cart)) {
                AB.cart = $.extend(true, {}, AB.shopifyCart);
                AB.cart.deliveryFee = {};
                AB.cart.deliveryInfo = {
                    name: '通常配送',
                    price: 0
                };
            }

            getShippingZones();
            getShopifyCartToSync();
        } else {
            AB.multishipping = false;
            $checkoutBtn.attr('type', 'submit');
            // when submit button is clicked
            $checkoutBtn.unbind('click');

            $('.abms-cart-address').hide();
            $('.abms-cart-more-address').hide();
            $cart.find('.cart-item__quantity-wrapper').show();
        }

        return false;
    });

    // when quantity is changed
    $cart.on('change', '.abms-qty', function (e) {
        collectShippingAddress($(this).parent().data('index'));
        return false;
    });

    // when an address is selected
    $cart.on('change', '.abms-cart-select-address', function () {
        collectShippingAddress($(this).parent().data('index'));
        return false;
    });

    // when "Add another address to ship" is clicked
    $cart.on('click', '.abms-cart-more-address a', function (e) {
        e.preventDefault();

        let $container = $(this).parent();
        let $div = $container.prev().clone();
        $div.insertBefore($container);
        $div.find('.abms-qty').val(1);

        collectShippingAddress($container.data('index'));
    });

    // when address remove icon is clicked
    $cart.on('click', '.abms-cart-address-remove', function (e) {
        e.preventDefault();

        const index = $(this).parent().data('index');
        $(this).parent().remove();

        collectShippingAddress(index);
    });

    function loadShippingAddresses()
    {
        $.each(AB.addresses, function (i, addr) {
            $cart.find('.abms-cart-select-address').each(function (j, select) {
                if (!$(select).find('option[value="' + addr.id + '"]').length) {
                    $(select).append('<option value="' + addr.id + '">' + addr.display + '</option>');
                }
            });
        });
    }

    function getAddressById(id)
    {
        return AB.addresses.find(x => x.id === id);
    }

    function collectShippingAddress(index)
    {
        AB.cart.items[index].shipping = [];
        const $container    = $('#abms-item-' + index);
        const variantId     = parseInt($container.find('.abms-variant-id').val());
        let totalQty        = 0;

        $container.find('.abms-cart-address').each(function (i, elem) {
            const qty = parseInt($(elem).find('.abms-qty').val());
            const addrId = parseInt($(elem).find('.abms-address').val());

            if (addrId) {
                let addr = getAddressById(addrId);
                if (!addr) {
                    return;
                }

                AB.cart.items[index].shipping.push({
                    quantity: qty,
                    variantId: variantId,
                    attributes: {
                        id: addrId,
                        address: addr.display,
                    },
                    shippingAddress: addr
                })

                if (typeof AB.cart.deliveryFee['addr' + addrId] === 'undefined') {
                    // prepareShippingRates({
                    //     zip: addr.zip,
                    //     country: addr.country,
                    //     province: addr.province
                    // });

                    let fee = getShippingRate(addr.country_code);
                    console.log(addr.display, fee);

                    AB.cart.deliveryFee['addr' + addrId] = {
                        title: addr.display,
                        price: fee
                    };
                    AB.cart.deliveryInfo.price += fee;
                }
            }
        });

        $container.find('.abms-cart-address .abms-qty').each(function (i, elem) {
            totalQty += parseInt($(elem).val());
        });

        AB.cart.items[index].quantity = totalQty;
        cartUpdateQueryData[variantId] = totalQty;

        updateShopifyCart(cartUpdateQueryData);
    }

    function getShippingRate(country, weight = 0)
    {
        for (let i = 0; i < AB.shippingZones.length; i++) {
            let zone = AB.shippingZones[i];
            let ctr = zone.countries.find(x => x.code === country);
            if (ctr) {
                if (zone.price_based_shipping_rates.length) {
                    return zone.price_based_shipping_rates[0].price * 1;
                } else if (weight_based_shipping_rates.length) {
                    // TODO: check with weight
                    return zone.weight_based_shipping_rates[0].price * 1;
                }
                break;
            }
        }

        return 0;
    }

    function getShippingZones()
    {
        if (AB.shippingZones.length === 0) {
            $.get(APP_API_URL + 'shipping-zones', function (data) {
                AB.shippingZones = data;
            });
        }
    }

    /**
     * https://shopify.dev/api/ajax/reference/cart#post-locale-cart-update-js
     * POST /{locale}/cart/update.js
     * @param data
     */
    function updateShopifyCart(data)
    {
        console.log('updateShopifyCart', data);

        $.post(window.Shopify.routes.root + 'cart/update.js', {
            updates: data
        }, function () {
            getShopifyCartToSync();
        });
    }

    /**
     * https://shopify.dev/api/ajax/reference/cart#get-locale-cart-js
     * GET /{locale}/cart.js
     */
    async function getShopifyCartToSync()
    {
        console.log('getShopifyCart');
        // $.get(window.Shopify.routes.root + 'cart.js', function (data) {
        //     // Uncaught SyntaxError: Unexpected token ':' at b (jquery.min.js:2:866)
        //     console.log(data);
        // });

        let data = await fetch(window.Shopify.routes.root + 'cart.js', {
            method: 'GET',
        })
        .then(response => {
            return response.json();
        })
        .catch((error) => {
            console.error('Error:', error);
        });

        console.log(data);
        AB.shopifyCart = data;
        // Update custom cart price data
        AB.cart.id = data.token;
        AB.cart.item_count = data.item_count;
        AB.cart.item_subtotal_price = data.item_subtotal_price;
        AB.cart.original_total_price = data.original_total_price;
        AB.cart.total_price = data.total_price;
    }

    /**
     * https://shopify.dev/api/ajax/reference/cart#generate-shipping-rates
     * POST /{locale}/cart/prepare_shipping_rates.json
     * @param address
     */
    function prepareShippingRates(address)
    {
        console.log('prepare_shipping_rates');

        $.post(window.Shopify.routes.root + 'cart/prepare_shipping_rates.json', {
            shipping_address: address
        }, function (res) {
            console.log(res);
            asyncShippingRates(address);
        });
    }

    /**
     * https://shopify.dev/api/ajax/reference/cart#example-async_shipping_rates-call
     * POST /{locale}/cart/async_shipping_rates.json
     * @param address
     */
    function asyncShippingRates(address)
    {
        console.log('async_shipping_rates');

        $.get(window.Shopify.routes.root + 'cart/async_shipping_rates.json', {
            shipping_address: address
        }, function (res) {
            console.log(res);
            getShippingRates(address);
        });
    }

    /**
     * https://shopify.dev/api/ajax/reference/cart#get-locale-cart-shipping_rates-json
     * GET /{locale}/cart/shipping_rates.json
     * @param address
     */
    function getShippingRates(address)
    {
        console.log('shipping_rates');

        $.get(window.Shopify.routes.root + 'cart/shipping_rates.json', {
            shipping_address: address
        }, function (res) {
            console.log(res);
        });
    }

    function checkout()
    {
        // prepare data json
        let data = {};
        data.email = 'dev.alutobenli@gmail.com';
        data.line_items = [];

        // line items
        for (let i = 0; i < AB.cart.items.length; i++) {
            const item = AB.cart.items[i];
            let row = {
                variant_id: item.variant_id,
                quantity: item.quantity,
                properties: {}
            };

            if ((typeof item.shipping !== 'undefined' && item.shipping.length === 0) || typeof item.shipping === 'undefined') {
                alert('One of the shipping addresses is empty!');
                return;
            }

            for (let j = 0; j < item.shipping.length; j++) {
                row.properties['_ab_shipping_address_' + (j + 1)] = item.shipping[j].shippingAddress.display;
                if (j === 0) {
                    data.shipping_address = item.shipping[j].shippingAddress;
                    delete data.shipping_address.id;
                }
            }

            row.properties._ab_shipping_details = JSON.stringify(item.shipping);
            data.line_items.push(row);
        }

        data.note_attributes = {
            '_ab_multiship': 1
        };

        // note
        let i = 1;
        let delivery = AB.cart.deliveryFee;
        for (const key in delivery) {
            data.note_attributes['_ab_shipping_fee_' + i + ': ' + delivery[key].title] = delivery[key].price;
            i++;
        }

        const addrCount = Object.keys(delivery).length;
        if (addrCount) {
            data.shipping_address.address2 = ' (+' + (addrCount - 1) + ' more addresses)';
        }

        console.log(data);

        $.post(APP_API_URL + 'checkout', data, function (res) {
            if (typeof res.web_url !== 'undefined') {
                window.location.href = res.web_url;
            }
        });
    }

})(jQuery);
