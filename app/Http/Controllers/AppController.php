<?php

namespace App\Http\Controllers;

use App\Models\Session;
use App\Models\Setting;
use Illuminate\Http\Request;
use Shopify\Clients\Rest;

class AppController extends Controller
{
    private const THEME_ID = 123985330233;

    /**
     * Enable/Disable app
     *
     * @route POST /api/app/(enable|disable)
     * @param string $mode enable|disable
     * @param Request $request
     * @return \Illuminate\Contracts\Foundation\Application|\Illuminate\Contracts\Routing\ResponseFactory|\Illuminate\Http\Response
     * @throws \Psr\Http\Client\ClientExceptionInterface
     * @throws \Shopify\Exception\UninitializedContextException
     */
    public function index(string $mode, Request $request)
    {
        $setting = Setting::firstOrNew(['id' => 1]);

        if ($mode == 'enable') {
            $error  = false;
            $shop   = $request->get('shop');
            $file   = resource_path() . '/liquid/ab-multiship.liquid';
            $client = $this->getClient($shop);

            // Insert/Update snippets/ab-multiship.liquid into the theme
            $response = $client->put(
                'themes/' . self::THEME_ID . '/assets',
                [
                    'asset' => [
                        'key' => 'snippets/ab-multiship.liquid',
                        'value' => file_get_contents($file),
                    ]
                ]
            );

            if ($response->getStatusCode() == 200) {
                // Get layout/theme.liquid content
                $response = $client->get('themes/' . self::THEME_ID . '/assets', [], [
                    'asset[key]' => 'layout/theme.liquid',
                ]);

                if ($response->getStatusCode() == 200) {
                    $body = $response->getDecodedBody();
                    $value = $body['asset']['value'];

                    // Update layout/theme.liquid content to render snippet
                    $snippet = "{% render 'ab-multiship' %}";
                    if (!str_contains($value, $snippet)) {
                        $html = explode('</head>', $value);
                        $html = $html[0] . PHP_EOL . '    ' . $snippet . PHP_EOL . '</head>' . $html[1];

                        $res = $client->put(
                            'themes/' . self::THEME_ID . '/assets',
                            [
                                'asset' => [
                                    'key' => 'layout/theme.liquid',
                                    'value' => $html,
                                ]
                            ]
                        );

                        if ($res->getStatusCode() !== 200) {
                            // TODO LOG: can't update layout/theme.liquid content to render snippet
                            $error = true;
                        }
                    }
                } else {
                    // TODO LOG: can't get layout/theme.liquid content
                    $error = true;
                }
            } else {
                // TODO LOG: can't insert/update snippets/ab-multiship.liquid
                $error = true;
            }

            if (!$error) {
                $setting->enabled = true;
            }
        } else {
            $setting->enabled = false;
        }

        $setting->save();

        return response(['enabled' => $setting->enabled]);
    }

    public function settings()
    {
        $setting = Setting::firstOrNew(['id' => 1]);

        return response($setting);
    }

    /**
     * Get Rest Client
     * @param string $shop
     * @return Rest
     * @throws \Shopify\Exception\MissingArgumentException
     */
    private function getClient(string $shop): Rest
    {
        $session = Session::where('shop', $shop)
            ->where('is_online', true)
            ->whereNotNull('user_id')
            ->orderBy('created_at', 'desc')
            ->first();

        return new Rest($session->shop, $session->access_token);
    }
}
