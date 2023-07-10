# wAIter

`wAIter` is a multi-user collaborative script writing application featuring an integrated AI assistant. It is designed to assist both individual writers and teams in the creation of scripts, acting much like a waiter at your service. It uses a Golang backend, a Typescript + React frontend, and is based on the Wails framework. This application brings the power of AI into the world of script writing, much like Final Draft but with the added AI twist.

## Features

 * Multi-user collaboration for script writing.
 * Integrated AI assistant for script generation and editing.
 * Built with Wails for a seamless desktop experience.
 * Golang backend for performance and efficiency.
 * Typescript + React frontend for a modern, interactive user interface.

## Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on http://localhost:34115. Connect
to this in your browser, and you can call your Go code from devtools.

## Building

To build a redistributable, production mode package, use `wails build`.
