(function ($) {
    const API_BASE = 'https://2f3d-103-203-132-173.ngrok.io/api/storefront/';
    const $cart = $('#cart');
    const $checkoutBtn = $('#checkout[form="cart"]');

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

    function collectShippingAddress(index)
    {
        AB.cart.items[index].shipping = [];

        $('#abms-item-' + index + ' .abms-cart-address').each(function (i, elem) {
            const variantId = parseInt($(elem).find('.abms-variant-id').val());
            const qty       = parseInt($(elem).find('.abms-qty').val());
            const addrId    = parseInt($(elem).find('.abms-address').val());
            const addrLine  = $(elem).find('.abms-address option[value="' + addrId + '"]').text();

            if (addrId) {
                AB.cart.items[index].shipping.push({
                    quantity: qty,
                    variantId: variantId,
                    customAttributes: {
                        id: addrId,
                        address: addrLine,
                    },
                    shippingAddress: {
                        address1: addrLine,
                        address2: '',
                        city: '',
                        company: '',
                        country: '',
                        firstName: '',
                        lastName: '',
                        phone: '',
                        province: '',
                        zip: ''
                    }
                })
            }
        })

        getShippingRates();
        updateShopifyCart();
    }

    // https://shopify.dev/api/ajax/reference/cart#post-locale-cart-update-js
    function updateShopifyCart()
    {
        // POST /{locale}/cart/update.js
        // $.post(window.Shopify.routes.root + 'cart/update.js', {
        //     updates: {
        //         794864053: 2,
        //         794864233: 3
        //     }
        // })
    }

    // https://shopify.dev/api/ajax/reference/cart#generate-shipping-rates
    function getShippingRates()
    {
        let address = {
            zip: "445-0004",
            country: "Japan",
            province: "Kagoshima"
        };

        // POST /{locale}/cart/prepare_shipping_rates.json
        $.post(window.Shopify.routes.root + 'cart/prepare_shipping_rates.json', {
            shipping_address: address
        }, function (res) {
            console.log('prepare_shipping_rates');
            console.log(res);

            // POST /{locale}/cart/async_shipping_rates.json
            $.get(window.Shopify.routes.root + 'cart/async_shipping_rates.json', {
                shipping_address: address
            }, function (res) {
                console.log('async_shipping_rates');
                console.log(res);
            });
        });
    }


})(jQuery);
