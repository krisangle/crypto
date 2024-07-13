# crypto

A trick for hosting ciphered web content with client-side on-the-fly in-browser deciphering. Any public web service can be used to host the ciphered content, the owner of the server will have zero access to the ciphered content.

## how it works

It uses the browser modern crypto.subtle interface to achieve client-side deciphering.

Ciphered contents are prepared offline using a nodejs-based ciphering tool. This demo site uses AES-GCM-256 as a symmetric cipher suite. A static html+js+images... directory is crawled and every file found there (recursively) is ciphered and its path is encoded as a SHA-1 string. This is then pushed online on any public web hosting service (such as here GitHub-pages). The ciphered content is placed in a single flat directory named 'sec' at the same level as the landing page.

The landing page provides an MMI to allow drag&drop of the cipher private key that has been safely transmitted to any authorized user. As a secret private key, this small JSON file should be kept in a safe place (for example a USB key). The landing page also initiates a service worker who will be in charge of analyzing all HTTP requests emitted by the ciphered pages. When the key is dropped on the landing page, it is first messaged to the service worker, and then it simply triggers an update of the src attribute of the iframe ('sec/index.html') that will be used to display the result of the deciphered content.

The service worker intercepts the fetch request and performs a simple URL path analysis. If the path starts with 'sec/' then it is assumed the resource is ciphered. The service worker first rebuilds the SHA-1 path of the ciphered content, fetches the ciphered content, deciphers it, and finally sends it back to the requesting component. This is a very flexible scheme:
- the deciphered HTML content can then refer to any relative resources that will in turn generate ciphered content requests.
- the deciphered HTML content can also refer to none ciphered content using path URLs that point to external resources or even resources outside of the sec folder using '../' at the beginning of the relative URL
- the ciphered resources can be of any type: HTML, MarkDown, Javascript, images (SVG, JPG, PNG...), text, CSV,... (for this to work the service worker also changes the response header according to the initial resource request file extension, to expose the correct mime type since the ciphered resource will always come as an 'application/octet-stream' content-type in the HTTP response headers)

## contact

If you're interested to know more about the service worker deciphering technique, please contact me on c DOT angleraud DOT gmail DOT com
