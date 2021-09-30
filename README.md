# WIP NOT BUILT WONT WORK AS IS

# gotTLS 

A node websocket api version of https://github.com/Carcraftz/TLS-Fingerprint-API to spoof TLS fingerprint to prevent your requests from being fingerprinted. 
WIP - im fairly new to golang / websockets 

## Usage

Get

```js
  import { gotTLS } from 'gotTLS'

    let response = await gotTLS("GET", "https://ja3er.com/json",{
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36",
      },
    });

    console.log(response.statusCode)
    //=> 200

    console.log(response.data)
    //=> {"ja3_hash":"b32309a26951912be7dba376398abc3b", "ja3": "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0", "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36"}
```

Post

```js
  import { gotTLS } from 'gotTLS'

    let response = await gotTLS("POST", "https://ja3er.com/json",{
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36",
      },
      json: {
        "username": "evade"
      }
    });
```

## gotTLS(method, url, options)

method

``Type: string``

> The HTTP method used to make the request.

url

``Type: string``

> The URL to request.

options

``Type: object``

> Request Options

## Options

headers

``Type: object``

> Request headers.

json

``Type: object``

> JSON body.

CookieJar

``Type: tough.CookieJar instance``

> Cookie support.

Timeout

``Type: string``
``Default: 20``

> Request timeout.

Debug

``Type: boolean``
``Default: false``

> whether or not to print out messages on proxy server

Redirect

``Type: boolean``
``Default: true``

> whether or not to follow redirects

