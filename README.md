# WebVR Holodeck

It's like Tim Berners-Lee meets Oculus meets Tea, Earl Grey, Hot.

![Star Trek](images/startrek.png?raw=true "Star Trek")


## Local development

To streamline local development, we use a simple [Node](https://nodejs.org/) server called [http-server](https://www.npmjs.com/package/http-server). Run this from the project's root directory to install the dependency:

    npm i

In order to allow permission choices to persist in Firefox, pages needs to be served from secure origins. Unfortunately, as of this writing, `http://localhost:*` is not considered a secure origin. In order to start the local dev server with SSL, you'll need to create a self-signed certificate. Run this from the project's root directory:

    npm run ssl:key

Run this to serve the project directory locally:

    npm start

Now open [https://localhost:8080](https://localhost:8080) in your browser of choice (please note that `http-server` may use a different port if `8080` is already used).


## Licence

[MIT](LICENCE)
