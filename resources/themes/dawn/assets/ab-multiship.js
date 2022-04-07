(function ($) {
    const API_BASE = 'https://bf20-103-203-132-174.ngrok.io/api/storefront/';
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
            $checkoutBtn.on('click', function () {
                alert(AB.cart.items.length);
            });

            $('.abms-cart-address').show();
            $('.abms-cart-more-address').show();
            $cart.find('.cart-item__quantity-wrapper').hide();

            $.ajax({
                url: API_BASE + 'products',
                type: 'GET',
                success: function (res) {
                    console.log(res);
                }
            });

            if ($.isEmptyObject(AB.cart)) {
                AB.cart = $.extend(true, {}, AB.shopifyCart);
                AB.cart.deliveryFee = {};
                AB.cart.deliveryFeeItem = {
                    product_title: '通常配送',
                    price: 0,
                    quantity: 1
                };
            }
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
                    customAttributes: {
                        id: addrId,
                        address: addr.display,
                    },
                    shippingAddress: addr
                })

                // TODO: prepare shipping rates here
                // prepareShippingRates({
                //     zip: addr.zip,
                //     country: addr.country,
                //     province: addr.province
                // });

                if (typeof AB.cart.deliveryFee['addr' + addrId] === 'undefined') {
                    AB.cart.deliveryFee['addr' + addrId] = STD_DELIVERY_FEE;
                    AB.cart.deliveryFeeItem.price += STD_DELIVERY_FEE;
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

})(jQuery);
