# got-tls

A node websocket api version of https://github.com/Carcraftz/TLS-Fingerprint-API to spoof TLS fingerprint to prevent your requests from being fingerprinted. 
> im fairly new to golang / websockets pull requests are welcome 

## Installation

```npm i https://github.com/evade99/got-tls```

## Usage

Server
``connect``

To Start The Proxy Server Simply Import Server From The Package And Call The connect() Function. This Should Be Done Once In Your Project.

> Server.isConnected - return boolean whether or not the server has started and our websocket has connected

```js
  const { Server } = require('got-tls')

  Server.connect()
```

Request
``GET`` ``POST`` ``PUT`` ``PATCH`` ``HEAD`` ``DELETE`` ``OPTIONS`` ``TRACE``

```js
  import { got } from 'got-tls'
  
  let response = await got.get('https://httpbin.org/anything', {
      headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36"
      }
  })
```

## got(url, options)

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

body

``Type: string``

> Request body.

form

``Type: object``

> Request form.

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

Proxy

``Type: string``
``Default: null``

> Proxy to use for request e.g http://user:pass@ip:port

