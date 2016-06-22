# Run on local computer
This file can't be open on
```
file:///Users/YOUR_NAME/path/to/decode-and-play-sound/decode.html
```

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
http://localhost:8000/path/to/decode.html
```
