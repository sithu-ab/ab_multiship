<?php

namespace App\Models\Shopify;

class Checkout extends \Shopify\Rest\Admin2022_04\Checkout
{
    /**
     * Insert a checkout
     * @param array $data
     * @return array|string|null
     * @throws \JsonException
     * @throws \Shopify\Exception\RestResourceRequestException
     */
    public function insert(array $data = [])
    {
        $method = 'post';
        $saveBody = [static::getJsonBodyName() => $data];
        $response = self::request($method, $method, $this->session, [], [], $saveBody, $this);

        return $response->getDecodedBody();
    }

    /**
     * Update a checkout
     * @param array $data
     * @return array|string|null
     * @throws \JsonException
     * @throws \Shopify\Exception\RestResourceRequestException
     */
    public function update(array $data = [])
    {
        $method = 'put';
        $saveBody = [static::getJsonBodyName() => $data];
        $response = self::request($method, $method, $this->session, [], [], $saveBody, $this);

        return $response->getDecodedBody();
    }
}
