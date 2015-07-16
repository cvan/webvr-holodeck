## 360 VR panorama

###[Click here to view project on Mozvr.com](http://mozvr.com/projects/panorama-viewer)


### Local development

To streamline local development, we use a simple [Node](https://nodejs.org/) server called [http-server](https://www.npmjs.com/package/http-server). Run this from the project's root directory to install the dependency:

    npm i

In order to allow permission choices to persist in Firefox, pages needs to be served from secure origins. Unfortunately, as of this writing, `http://localhost:*` is not considered a secure origin. In order to start the local dev server with SSL, you'll need to create a self-signed certificate. Run this from the project's root directory:

    npm run ssl:key

To serve the project directory locally run:

    npm start

Now open [https://localhost:8080](https://localhost:8080) (or the host at whichever port it was served on) in your browser of choice.
