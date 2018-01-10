# Run on local computer

To load our sound samples from ```sounds``` folder via ```XMLHttpRequest```,
we can't use _file protocol_ ```file://``` such as
```
file:///Users/YOUR_NAME/path/to/decode-and-play-sound/decode.html
```
to open our demo page.

Cross origin requests are only supported for protocol schemes:
http, data, chrome, chrome-extension, https, chrome-extension-resource.
(```file``` is not included!)

A workaround for this issue is to build a simple HTTP server on local computer.
Run
```
$ python -m SimpleHTTPServer
```
and then open the following URL on your browser.
```
http://localhost:8000/path/to/your/deme_page.html
```
