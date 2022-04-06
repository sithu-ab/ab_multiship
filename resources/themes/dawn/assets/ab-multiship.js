(function ($) {
    const HOST = 'https://d4d1-103-203-132-173.ngrok.io/';
    const API_BASE = HOST + 'api/storefront/';
    const $cart = $('#cart');

    console.log('cart by ab-multiship');
    console.log($cart);

    $cart.prepend('<input type="checkbox" id="abms-cart-ship2multi" /> ' +
        '<label for="abms-cart-ship2multi">Ship to Multiple Addresses?</label>');

    $cart.on('change', '#abms-cart-ship2multi', function () {
        if ($(this).prop('checked')) {
            $('.abms-cart-address').show();
            $('.abms-cart-more-address').show();
            $cart.find('.cart-item__quantity-wrapper').hide();

            $.ajax({
                url: API_BASE + 'products',
                type: 'GET',
                crossDomain: true,
                success: function(res) {
                }
            });

//             axios.get(API_BASE + 'products')
//                 .then(res => {
//                     // console.log(res.data)
//                 })
        } else {
            $('.abms-cart-address').hide();
            $('.abms-cart-more-address').hide();
            $cart.find('.cart-item__quantity-wrapper').show();
        }

        return false;
    });

    $cart.on('click', '.abms-cart-more-address', function (e) {
        e.preventDefault();

        let $div = $('.abms-cart-address').last().clone();
        $div.insertBefore($(this));
    });

    $cart.on('click', '.abms-cart-address-remove', function (e) {
        e.preventDefault();

        $(this).parent().remove();
    });
})(jQuery);
